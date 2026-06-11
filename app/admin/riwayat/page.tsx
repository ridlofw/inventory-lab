import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RiwayatClient } from "./riwayat-client";
import { ScrollText } from "lucide-react";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/login");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/login");

  // Fetch log history. Batas 2000 data terbaru untuk performa awal.
  const riwayat = await prisma.detailTransaksi.findMany({
    where: {
      status: {
        not: "MENUNGGU_PINJAM" // Ambil semua yang bukan pending (DIPINJAM, DISETUJUI, MENUNGGU_KEMBALI, SELESAI, DITOLAK)
      },
      AND: {
        status: {
          not: "MENUNGGU_MINTA"
        }
      }
    },
    include: {
      komoditas: true,
      transaksi: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      transaksi: {
        tanggalPengajuan: "desc"
      }
    },
    take: 2000
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white px-6 py-6 sm:px-8 border border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ScrollText className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Logbook Analitik</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Riwayat Audit
            </h1>
            <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
              Jejak rekam historis sirkulasi aset laboratorium. Gunakan fitur penyaringan lanjutan untuk melihat tren spesifik dan unduh Laporan Resmi berformat Excel untuk kebutuhan administrasi kampus.
            </p>
          </div>
        </div>
      </div>

      <RiwayatClient initialData={riwayat} />
    </div>
  );
}
