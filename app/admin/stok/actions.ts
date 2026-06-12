"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipeKomoditas } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("Akses ditolak: Anda belum login.");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Akses ditolak: Membutuhkan otoritas Administrator.");
}

export async function addKomoditas(data: {
  nama: string;
  tipe: TipeKomoditas;
  satuan: string;
  stokAwal: number;
  merk?: string;
  spesifikasi?: string;
  tahunPerolehan?: string;
  lokasi?: string;
  ruangPenyimpanan?: string;
}) {
  try {
    await verifyAdmin();
    await prisma.komoditas.create({
      data: {
        nama: data.nama,
        tipe: data.tipe,
        satuan: data.satuan,
        stokAwal: data.stokAwal,
        stokTotal: data.stokAwal,
        stokTersedia: data.stokAwal,
        merk: data.merk || null,
        spesifikasi: data.spesifikasi || null,
        tahunPerolehan: data.tahunPerolehan || null,
        lokasi: data.lokasi || null,
        ruangPenyimpanan: data.ruangPenyimpanan || null,
      },
    });
    revalidatePath("/admin/stok");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan sistem saat menyimpan." };
  }
}

export async function updateKomoditas(
  id: string,
  data: {
    nama: string;
    tipe: TipeKomoditas;
    satuan: string;
    stokAwal: number;
    totalRusak: number;
    totalHilang: number;
    merk?: string;
    spesifikasi?: string;
    tahunPerolehan?: string;
    lokasi?: string;
    ruangPenyimpanan?: string;
  }
) {
  try {
    await verifyAdmin();
    const current = await prisma.komoditas.findUnique({ where: { id } });
    if (!current) return { error: "Data komoditas tidak ditemukan." };

    const stokTotal = data.stokAwal - data.totalRusak - data.totalHilang;
    const itemDipinjam = current.stokTotal - current.stokTersedia;
    const stokTersedia = stokTotal - itemDipinjam;

    if (stokTersedia < 0) {
      return { error: "Validasi gagal: Stok tersedia menjadi negatif akibat perubahan yang diajukan." };
    }

    await prisma.komoditas.update({
      where: { id },
      data: {
        nama: data.nama,
        tipe: data.tipe,
        satuan: data.satuan,
        stokAwal: data.stokAwal,
        totalRusak: data.totalRusak,
        totalHilang: data.totalHilang,
        stokTotal,
        stokTersedia,
        merk: data.merk || null,
        spesifikasi: data.spesifikasi || null,
        tahunPerolehan: data.tahunPerolehan || null,
        lokasi: data.lokasi || null,
        ruangPenyimpanan: data.ruangPenyimpanan || null,
      },
    });
    
    revalidatePath("/admin/stok");
    revalidatePath("/mahasiswa/katalog");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan sistem saat memperbarui." };
  }
}

export async function deleteKomoditas(id: string) {
  try {
    await verifyAdmin();
    await prisma.komoditas.delete({
      where: { id },
    });
    revalidatePath("/admin/stok");
    revalidatePath("/mahasiswa/katalog");
    return { success: true };
  } catch (error: any) {
    return { error: "Gagal menghapus komoditas. Pastikan tidak ada transaksi aktif yang mengikat aset ini." };
  }
}
