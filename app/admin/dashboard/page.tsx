import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusTransaksi } from "@prisma/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, ClipboardCheck, AlertTriangle, ArrowRight, RotateCcw, Activity } from "lucide-react";
import Link from "next/link";
import { CirculationChart } from "@/components/dashboard/circulation-chart";
import { PopularItemsChart } from "@/components/dashboard/popular-items-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/login");
  }

  // Metrics fetching...
  const totalKomoditas = await prisma.komoditas.count();
  const activeTransactions = await prisma.detailTransaksi.count({
    where: {
      status: { in: [StatusTransaksi.DIPINJAM, StatusTransaksi.MENUNGGU_KEMBALI] },
    },
  });
  const pendingApprovals = await prisma.detailTransaksi.count({
    where: {
      status: { in: [StatusTransaksi.MENUNGGU_PINJAM, StatusTransaksi.MENUNGGU_MINTA, StatusTransaksi.MENUNGGU_KEMBALI] },
    },
  });
  const barangRusak = await prisma.komoditas.aggregate({
    _sum: { totalRusak: true, totalHilang: true },
  });
  const totalBermasalah = (barangRusak._sum.totalRusak || 0) + (barangRusak._sum.totalHilang || 0);

  // Chart Data
  const komoditasStats = await prisma.komoditas.aggregate({
    _sum: { stokTersedia: true, stokTotal: true },
  });
  const availableStock = komoditasStats._sum.stokTersedia || 0;
  const borrowedStock = (komoditasStats._sum.stokTotal || 0) - availableStock;

  const circulationData = [
    { name: "Tersedia", value: availableStock, color: "var(--color-primary)" },
    { name: "Dipinjam", value: borrowedStock, color: "var(--color-warning)" },
  ];

  const topBorrowed = await prisma.detailTransaksi.groupBy({
    by: ["komoditasId"],
    _count: { komoditasId: true },
    orderBy: { _count: { komoditasId: "desc" } },
    take: 5,
  });

  const popularData = await Promise.all(
    topBorrowed.map(async (item) => {
      const kom = await prisma.komoditas.findUnique({
        where: { id: item.komoditasId },
        select: { nama: true },
      });
      return {
        name: kom?.nama || "Unknown",
        totalPinjam: item._count.komoditasId,
      };
    })
  );

  const lowStockItems = await prisma.komoditas.findMany({
    where: { stokTersedia: { lte: 2 } },
    take: 3,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-6 sm:px-8 text-white shadow-lg shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-slate-900/90 z-0" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Activity className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">SIPLAB Admin Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Ringkasan Operasional
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Pantau aset secara real-time, validasi peminjaman, dan pastikan kondisi laboratorium tetap prima.
            </p>
          </div>
          <div className="shrink-0 hidden md:block">
            <Button className="rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50" render={<Link href="/admin/verifikasi" />}>
              <ClipboardCheck className="mr-2 size-4" />
              Validasi Pengajuan
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Action Cards */}
      {(pendingApprovals > 0 || lowStockItems.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingApprovals > 0 && (
            <Card className="rounded-3xl border-amber-200/60 bg-amber-50/40 shadow-sm overflow-hidden flex flex-col justify-center">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-amber-900 text-base">Tindakan Diperlukan</h3>
                    <p className="text-amber-700/80 text-sm font-medium leading-tight">
                      {pendingApprovals} pengajuan peminjaman menunggu validasi Anda.
                    </p>
                  </div>
                  <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 border-none shrink-0" render={<Link href="/admin/verifikasi" />}>
                    Validasi Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockItems.length > 0 && (
            <Card className="rounded-3xl border-red-200/60 bg-red-50/40 shadow-sm overflow-hidden flex flex-col justify-center">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600 shrink-0 self-start sm:self-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-red-900 text-base leading-none">Stok Kritis</h3>
                    <div className="flex flex-wrap gap-2">
                      {lowStockItems.map((item) => (
                        <span key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800">
                          {item.nama} <span className="opacity-60 ml-1">({item.stokTersedia})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button className="rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 border-none shrink-0 self-start sm:self-center" render={<Link href="/admin/stok" />}>
                    Kelola Stok
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Komoditas", value: totalKomoditas, desc: "Aset terdaftar", icon: Package, bgClass: "bg-emerald-50 group-hover:bg-emerald-100", textClass: "text-emerald-600" },
          { title: "Sedang Dipinjam", value: activeTransactions, desc: "Transaksi berjalan", icon: RotateCcw, bgClass: "bg-blue-50 group-hover:bg-blue-100", textClass: "text-blue-600" },
          { title: "Menunggu Validasi", value: pendingApprovals, desc: "Butuh tindakan", icon: ClipboardCheck, bgClass: "bg-amber-50 group-hover:bg-amber-100", textClass: "text-amber-600" },
          { title: "Bermasalah", value: totalBermasalah, desc: "Rusak atau hilang", icon: AlertTriangle, bgClass: "bg-red-50 group-hover:bg-red-100", textClass: "text-red-600" }
        ].map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-600">{kpi.title}</span>
                <div className={`p-2.5 rounded-xl transition-colors ${kpi.bgClass} ${kpi.textClass}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</div>
                <p className="text-sm text-slate-500 font-medium">{kpi.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-lg font-bold text-slate-800">Rasio Sirkulasi Aset</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Tingkat utilisasi inventaris keseluruhan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex items-center justify-center bg-white">
            <CirculationChart data={circulationData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-lg font-bold text-slate-800">5 Komoditas Terpopuler</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Barang yang paling sering dipinjam oleh mahasiswa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex items-center justify-center bg-white">
            <PopularItemsChart data={popularData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
