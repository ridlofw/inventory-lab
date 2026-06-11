import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CalendarDays, ArrowRight, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { StatusTransaksi } from "@prisma/client";

export default async function MahasiswaDashboard() {
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

  if (!dbUser) {
    redirect("/login");
  }

  // Get metrics based on DetailTransaksi
  const activeTransactions = await prisma.detailTransaksi.count({
    where: {
      transaksi: { userId: dbUser.id },
      status: {
        in: [StatusTransaksi.DIPINJAM, StatusTransaksi.MENUNGGU_KEMBALI],
      },
    },
  });

  const pendingTransactions = await prisma.detailTransaksi.count({
    where: {
      transaksi: { userId: dbUser.id },
      status: {
        in: [
          StatusTransaksi.MENUNGGU_PINJAM,
          StatusTransaksi.MENUNGGU_MINTA,
          StatusTransaksi.MENUNGGU_KEMBALI,
        ],
      },
    },
  });

  const recentItems = await prisma.detailTransaksi.findMany({
    where: {
      transaksi: { userId: dbUser.id },
    },
    orderBy: {
      transaksi: { tanggalPengajuan: "desc" },
    },
    take: 5,
    include: {
      komoditas: true,
      transaksi: true,
    },
  });

  const getStatusBadge = (status: StatusTransaksi) => {
    switch (status) {
      case StatusTransaksi.MENUNGGU_PINJAM:
      case StatusTransaksi.MENUNGGU_MINTA:
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Menunggu</Badge>;
      case StatusTransaksi.DIPINJAM:
      case StatusTransaksi.DIAMBIL:
        return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">Dipinjam</Badge>;
      case StatusTransaksi.MENUNGGU_KEMBALI:
        return <Badge variant="destructive" className="bg-red-500 text-white">Menunggu Kembali</Badge>;
      case StatusTransaksi.SELESAI:
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Selesai</Badge>;
      case StatusTransaksi.DITOLAK:
        return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">Ditolak</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-emerald-900 p-8 sm:p-10 text-white shadow-xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-800/40 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Halo, {dbUser.nama.split(' ')[0]}! 👋
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
              Selamat datang di Dasbor SIPLAB. Anda dapat memantau status peminjaman, mengeksplorasi katalog alat, dan mengajukan peminjaman baru dari sini.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:flex items-center gap-3">
            <UserCircle2 className="size-10 text-emerald-200" />
            <div>
              <p className="text-sm font-semibold">{dbUser.nim || "Mahasiswa"}</p>
              <p className="text-xs text-emerald-200/80">Mahasiswa Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-600">Barang Dipinjam</span>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeTransactions}</div>
              <p className="text-sm text-slate-500 font-medium">
                Aset yang menjadi tanggung jawab Anda
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-600">Menunggu Persetujuan</span>
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{pendingTransactions}</div>
              <p className="text-sm text-slate-500 font-medium">
                Pengajuan dalam antrean validasi
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 sm:col-span-2 lg:col-span-1 flex flex-col justify-center overflow-hidden relative group border-transparent">
          <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 text-emerald-400/30 group-hover:scale-110 transition-transform duration-500">
            <CalendarDays className="w-48 h-48" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col items-start space-y-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">Katalog Baru</p>
                <p className="text-sm text-emerald-100">Jelajahi dan ajukan peminjaman alat lab.</p>
              </div>
              <Link
                href="/mahasiswa/katalog"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-emerald-700 bg-white rounded-xl shadow-sm hover:bg-emerald-50 transition-colors mt-2"
              >
                Mulai Pinjam <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
          <CardTitle className="text-lg font-bold text-slate-800">Aktivitas Transaksi Terbaru</CardTitle>
          <CardDescription className="text-slate-500">
            Pantau status barang yang Anda ajukan atau pinjam.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <Package className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-500">Belum ada riwayat transaksi.</p>
              <p className="text-sm">Ajukan peminjaman dari Katalog untuk memulai.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-semibold text-slate-600 pl-6 h-12">Kode ID</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Tgl Pengajuan</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Nama Barang</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Jumlah</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 h-12">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((dt) => (
                  <TableRow key={dt.id} className="border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="font-medium text-slate-600 text-xs pl-6">
                      <span className="px-2 py-1 bg-slate-100 rounded-md font-mono">
                        {dt.transaksiId.split("-")[0].toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {format(new Date(dt.transaksi.tanggalPengajuan), "dd MMM yyyy", { locale: localeID })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-semibold text-slate-800">
                      {dt.komoditas.nama}
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {dt.jumlah} <span className="text-slate-400 text-xs">{dt.komoditas.satuan}</span>
                    </TableCell>
                    <TableCell className="pr-6">{getStatusBadge(dt.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
