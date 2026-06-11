"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusTransaksi } from "@prisma/client";

export async function ajukanPeminjaman(data: {
  catatanKegiatan: string;
  estimasiPengembalian?: Date;
  items: { komoditasId: string; jumlah: number }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Unauthenticated" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  if (!dbUser) return { error: "User not found" };
  if (dbUser.role !== "MAHASISWA") {
    return { error: "Akses ditolak: Hanya Mahasiswa yang diizinkan untuk mengajukan peminjaman." };
  }

  try {
    // Transaction wrapper for ACID compliance
    await prisma.$transaction(async (tx) => {
      // 1. Double check stocks
      for (const item of data.items) {
        const komoditas = await tx.komoditas.findUnique({
          where: { id: item.komoditasId },
        });

        if (!komoditas)
          throw new Error(`Komoditas dengan ID ${item.komoditasId} tidak ditemukan.`);
        if (komoditas.stokTersedia < item.jumlah) {
          throw new Error(
            `Stok ${komoditas.nama} tidak mencukupi. Sisa: ${komoditas.stokTersedia}, Diminta: ${item.jumlah}`
          );
        }
      }

      // 2. Create Transaksi Record
      const transaksi = await tx.transaksi.create({
        data: {
          userId: dbUser.id,
          catatanKegiatan: data.catatanKegiatan,
          estimasiPengembalian: data.estimasiPengembalian,
        },
      });

      // 3. Create DetailTransaksi records (Nested)
      const detailsPromises: Promise<any>[] = [];
      
      for (const item of data.items) {
        const komoditas = await tx.komoditas.findUniqueOrThrow({
          where: { id: item.komoditasId },
        });

        if (komoditas.tipe === "BARANG") {
          // Pisahkan menjadi baris satuan agar saat pengembalian bisa dicek satu per satu
          for (let i = 0; i < item.jumlah; i++) {
            detailsPromises.push(
              tx.detailTransaksi.create({
                data: {
                  transaksiId: transaksi.id,
                  komoditasId: item.komoditasId,
                  jumlah: 1,
                  status: StatusTransaksi.MENUNGGU_PINJAM,
                },
              })
            );
          }
        } else {
          // Bahan tetap digabungkan karena tidak dikembalikan
          detailsPromises.push(
            tx.detailTransaksi.create({
              data: {
                transaksiId: transaksi.id,
                komoditasId: item.komoditasId,
                jumlah: item.jumlah,
                status: StatusTransaksi.MENUNGGU_MINTA,
              },
            })
          );
        }
      }

      await Promise.all(detailsPromises);
    });

    revalidatePath("/mahasiswa/dashboard");
    revalidatePath("/mahasiswa/riwayat");
    revalidatePath("/admin/verifikasi");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem saat memproses transaksi." };
  }
}
