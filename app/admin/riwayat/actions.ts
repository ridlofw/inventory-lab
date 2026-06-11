"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("Akses ditolak: Anda belum login.");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Akses ditolak: Membutuhkan otoritas Administrator.");
}

export async function getKomoditasStats() {
  try {
    await verifyAdmin();
    const data = await prisma.komoditas.findMany({
      orderBy: [
        { tipe: 'asc' },
        { nama: 'asc' }
      ]
    });
    return { success: true, data };
  } catch (error: any) {
    return { error: "Gagal mengambil data rekap inventaris komoditas." };
  }
}
