"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { KondisiBarang, StatusTransaksi } from "@prisma/client";

export async function kembalikanItem(data: {
  detailTransaksiId: string;
  kondisi: KondisiBarang;
  catatan: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return { error: "Unauthenticated" };

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  if (!dbUser) return { error: "User not found" };

  try {
    const detail = await prisma.detailTransaksi.findUnique({
      where: { id: data.detailTransaksiId },
      include: { transaksi: true, komoditas: true },
    });

    if (!detail) throw new Error("Data transaksi tidak ditemukan");
    if (detail.transaksi.userId !== dbUser.id) throw new Error("Akses ditolak");
    if (detail.status !== StatusTransaksi.DIPINJAM) throw new Error("Item ini tidak sedang dipinjam");
    if (detail.komoditas.tipe === "BAHAN") throw new Error("Bahan tidak dapat dikembalikan");

    // Validation for notes on broken/lost items
    if ((data.kondisi === KondisiBarang.RUSAK || data.kondisi === KondisiBarang.HILANG) && !data.catatan.trim()) {
      throw new Error("Catatan kronologi wajib diisi untuk barang rusak atau hilang.");
    }

    await prisma.detailTransaksi.update({
      where: { id: data.detailTransaksiId },
      data: {
        status: StatusTransaksi.MENUNGGU_KEMBALI,
        kondisiKembali: data.kondisi,
        catatanPengembalian: data.catatan,
        tanggalDikembalikan: new Date(),
      },
    });

    revalidatePath("/mahasiswa/riwayat");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/verifikasi");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem." };
  }
}

export async function kembalikanTransaksi(data: {
  transaksiId: string;
  items: { detailTransaksiId: string; kondisi: KondisiBarang; catatan: string }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return { error: "Unauthenticated" };

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  if (!dbUser) return { error: "User not found" };

  try {
    // Verifikasi bahwa transaksi ini milik mahasiswa yang login
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: data.transaksiId },
    });
    if (!transaksi) throw new Error("Transaksi tidak ditemukan");
    if (transaksi.userId !== dbUser.id) throw new Error("Akses ditolak");

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const detail = await tx.detailTransaksi.findUnique({
          where: { id: item.detailTransaksiId },
          include: { komoditas: true },
        });

        if (!detail) throw new Error(`Detail transaksi tidak ditemukan`);
        if (detail.status !== StatusTransaksi.DIPINJAM) continue; // Skip jika sudah bukan DIPINJAM
        if (detail.komoditas.tipe === "BAHAN") continue; // Bahan tidak dikembalikan

        if ((item.kondisi === KondisiBarang.RUSAK || item.kondisi === KondisiBarang.HILANG) && !item.catatan.trim()) {
          throw new Error(`Catatan kronologi wajib diisi untuk barang ${detail.komoditas.nama} yang dilaporkan rusak/hilang.`);
        }

        await tx.detailTransaksi.update({
          where: { id: item.detailTransaksiId },
          data: {
            status: StatusTransaksi.MENUNGGU_KEMBALI,
            kondisiKembali: item.kondisi,
            catatanPengembalian: item.catatan,
            tanggalDikembalikan: new Date(),
          },
        });
      }
    });

    revalidatePath("/mahasiswa/riwayat");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/verifikasi");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem saat memproses pengembalian." };
  }
}

