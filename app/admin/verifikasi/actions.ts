"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusTransaksi, KondisiBarang } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("Akses ditolak: Anda belum login.");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Akses ditolak: Membutuhkan otoritas Administrator.");
}

export async function approveTransaksi(detailId: string) {
  try {
    await verifyAdmin();
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil detail transaksi
      const detail = await tx.detailTransaksi.findUnique({
        where: { id: detailId },
        include: { komoditas: true },
      });

      if (!detail) throw new Error("Transaksi tidak ditemukan.");
      if (detail.status !== "MENUNGGU_PINJAM" && detail.status !== "MENUNGGU_MINTA") {
        throw new Error("Status transaksi tidak valid untuk disetujui.");
      }

      // 2. Race Condition Check: Pastikan stok di database masih cukup detik ini juga
      if (detail.komoditas.stokTersedia < detail.jumlah) {
        throw new Error(`Gagal: Stok komoditas "${detail.komoditas.nama}" tidak mencukupi (Tersisa: ${detail.komoditas.stokTersedia}).`);
      }

      // 3. Tentukan status baru (Barang -> DIPINJAM, Bahan -> DIAMBIL)
      const newStatus = detail.komoditas.tipe === "BARANG" ? StatusTransaksi.DIPINJAM : StatusTransaksi.DIAMBIL;

      // 4. Update Detail Transaksi
      const updatedDetail = await tx.detailTransaksi.update({
        where: { id: detailId },
        data: {
          status: newStatus,
          tanggalVerifikasi: new Date(),
        },
      });

      // 5. Kurangi Stok Tersedia secara aman
      await tx.komoditas.update({
        where: { id: detail.komoditasId },
        data: {
          stokTersedia: { decrement: detail.jumlah },
        },
      });

      return updatedDetail;
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stok");
    return { success: true, message: "Berhasil disetujui." };
  } catch (error: any) {
    return { error: error.message || "Gagal menyetujui transaksi." };
  }
}

export async function approveSemuaTransaksi(detailIds: string[]) {
  try {
    await verifyAdmin();
    await prisma.$transaction(async (tx) => {
      for (const detailId of detailIds) {
        const detail = await tx.detailTransaksi.findUnique({
          where: { id: detailId },
          include: { komoditas: true },
        });

        if (!detail) continue;
        if (detail.status !== "MENUNGGU_PINJAM" && detail.status !== "MENUNGGU_MINTA") continue;

        if (detail.komoditas.stokTersedia < detail.jumlah) {
          throw new Error(`Stok komoditas "${detail.komoditas.nama}" tidak mencukupi.`);
        }

        const newStatus = detail.komoditas.tipe === "BARANG" ? StatusTransaksi.DIPINJAM : StatusTransaksi.DIAMBIL;

        await tx.detailTransaksi.update({
          where: { id: detailId },
          data: {
            status: newStatus,
            tanggalVerifikasi: new Date(),
          },
        });

        await tx.komoditas.update({
          where: { id: detail.komoditasId },
          data: {
            stokTersedia: { decrement: detail.jumlah },
          },
        });
      }
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stok");
    return { success: true, message: "Semua item berhasil disetujui." };
  } catch (error: any) {
    return { error: error.message || "Gagal menyetujui seluruh transaksi." };
  }
}

export async function rejectTransaksi(detailId: string) {
  try {
    await verifyAdmin();
    await prisma.detailTransaksi.update({
      where: { id: detailId },
      data: {
        status: StatusTransaksi.DITOLAK,
        tanggalVerifikasi: new Date(),
      },
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Transaksi berhasil ditolak." };
  } catch (error: any) {
    return { error: "Terjadi kesalahan saat menolak transaksi." };
  }
}

export async function confirmPengembalian(
  detailId: string,
  kondisi: KondisiBarang,
  catatanAdmin?: string
) {
  try {
    await verifyAdmin();
    await prisma.$transaction(async (tx) => {
      const detail = await tx.detailTransaksi.findUnique({
        where: { id: detailId },
        include: { komoditas: true },
      });

      if (!detail) throw new Error("Transaksi tidak ditemukan.");
      if (detail.status !== "MENUNGGU_KEMBALI") {
        throw new Error("Status transaksi bukan MENUNGGU_KEMBALI.");
      }

      // 1. Update Transaksi ke Selesai
      await tx.detailTransaksi.update({
        where: { id: detailId },
        data: {
          status: StatusTransaksi.SELESAI,
          tanggalDikembalikan: new Date(),
          kondisiKembali: kondisi,
          catatanPengembalian: catatanAdmin || detail.catatanPengembalian,
        },
      });

      // 2. Update Kalkulasi Stok berdasarkan Kondisi
      if (kondisi === "AMAN") {
        // Barang kembali utuh, masuk ke etalase lagi
        await tx.komoditas.update({
          where: { id: detail.komoditasId },
          data: {
            stokTersedia: { increment: detail.jumlah },
          },
        });
      } else if (kondisi === "RUSAK") {
        // Barang rusak, masuk ke totalRusak, mengurangi stokTotal. stokTersedia tetap (karena memang sudah tidak ada di etalase)
        await tx.komoditas.update({
          where: { id: detail.komoditasId },
          data: {
            totalRusak: { increment: detail.jumlah },
            stokTotal: { decrement: detail.jumlah },
          },
        });
      } else if (kondisi === "HILANG") {
        // Barang hilang, masuk ke totalHilang, mengurangi stokTotal.
        await tx.komoditas.update({
          where: { id: detail.komoditasId },
          data: {
            totalHilang: { increment: detail.jumlah },
            stokTotal: { decrement: detail.jumlah },
          },
        });
      }
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath("/admin/stok");
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Pengembalian berhasil dikonfirmasi." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengonfirmasi pengembalian." };
  }
}

export async function confirmSemuaPengembalian(items: { detailId: string; kondisi: KondisiBarang; catatanAdmin?: string }[]) {
  try {
    await verifyAdmin();
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const detail = await tx.detailTransaksi.findUnique({
          where: { id: item.detailId },
          include: { komoditas: true },
        });

        if (!detail) continue;
        if (detail.status !== "MENUNGGU_KEMBALI") continue;

        // 1. Update Transaksi ke Selesai
        await tx.detailTransaksi.update({
          where: { id: item.detailId },
          data: {
            status: StatusTransaksi.SELESAI,
            tanggalDikembalikan: new Date(),
            kondisiKembali: item.kondisi,
            catatanPengembalian: item.catatanAdmin || detail.catatanPengembalian,
          },
        });

        // 2. Update Kalkulasi Stok berdasarkan Kondisi
        if (item.kondisi === "AMAN") {
          await tx.komoditas.update({
            where: { id: detail.komoditasId },
            data: { stokTersedia: { increment: detail.jumlah } },
          });
        } else if (item.kondisi === "RUSAK") {
          await tx.komoditas.update({
            where: { id: detail.komoditasId },
            data: {
              totalRusak: { increment: detail.jumlah },
              stokTotal: { decrement: detail.jumlah },
            },
          });
        } else if (item.kondisi === "HILANG") {
          await tx.komoditas.update({
            where: { id: detail.komoditasId },
            data: {
              totalHilang: { increment: detail.jumlah },
              stokTotal: { decrement: detail.jumlah },
            },
          });
        }
      }
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath("/admin/stok");
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Semua pengembalian berhasil dikonfirmasi." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengonfirmasi semua pengembalian." };
  }
}
