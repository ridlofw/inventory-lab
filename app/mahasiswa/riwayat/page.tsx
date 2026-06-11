import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RiwayatClient } from "./riwayat-client";

export default async function RiwayatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "MAHASISWA") {
    redirect("/login");
  }

  // Fetch all DetailTransaksi for this user, ordered by newest Transaksi
  const detailTransaksi = await prisma.detailTransaksi.findMany({
    where: {
      transaksi: {
        userId: dbUser.id
      }
    },
    include: {
      komoditas: true,
      transaksi: true
    },
    orderBy: {
      transaksi: {
        tanggalPengajuan: 'desc'
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-6 sm:px-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900/50 z-0" />
        <div className="relative z-10 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pusat Peminjaman</h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Pantau status persetujuan, barang yang sedang Anda pinjam, dan segera laporkan pengembalian saat sudah selesai.
          </p>
        </div>
      </div>

      <RiwayatClient items={detailTransaksi} />
    </div>
  );
}
