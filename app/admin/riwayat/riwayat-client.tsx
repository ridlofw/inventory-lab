"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import * as XLSX from "xlsx";
import { getKomoditasStats } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  XCircle,
  Package,
  Clock,
  History,
  RotateCcw,
  ChevronDown,
  Box
} from "lucide-react";

// Custom Dropdown Component to replace native <select>
function CustomDropdown({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between h-10 min-w-[140px] px-4 rounded-xl border cursor-pointer select-none transition-all ${
          open 
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white" 
            : "border-slate-200 bg-white hover:border-emerald-400"
        }`}
      >
        <span className="text-sm font-semibold text-slate-700 truncate mr-2">
          {value === "SEMUA" ? placeholder : value}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180 text-emerald-500" : ""}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full min-w-[160px] z-50 rounded-xl border border-slate-100 bg-white shadow-xl py-1 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto">
          <div 
            onClick={() => { onChange("SEMUA"); setOpen(false); }}
            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === "SEMUA" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {placeholder}
          </div>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RiwayatClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"AKTIF" | "HISTORIS">("AKTIF");
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Split Data
  const dataAktif = data.filter(d => ["DIPINJAM", "MENUNGGU_KEMBALI"].includes(d.status));
  const dataHistoris = data.filter(d => ["SELESAI", "DITOLAK", "DIAMBIL"].includes(d.status));
  
  const currentTabRawData = activeTab === "AKTIF" ? dataAktif : dataHistoris;

  // Build filter options based on current tab data
  const statuses = Array.from(new Set(currentTabRawData.map(d => d.status)));

  // Apply Filters
  let filteredData = currentTabRawData.filter(item => {
    const matchSearch = 
      item.komoditas.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.transaksi.user.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.transaksi.user.nim.toLowerCase().includes(search.toLowerCase());
      
    const matchStatus = statusFilter === "SEMUA" || item.status === statusFilter;
    
    let matchDate = true;
    const itemDate = new Date(item.transaksi.tanggalPengajuan);
    
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (itemDate < sDate) matchDate = false;
    }
    
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (itemDate > eDate) matchDate = false;
    }

    return matchSearch && matchStatus && matchDate;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (item: any) => {
    switch (item.status) {
      case "DIPINJAM":
        return <Badge className="bg-blue-600 text-white"><Package className="w-3 h-3 mr-1" /> Sedang Aktif</Badge>;
      case "MENUNGGU_KEMBALI":
        return <Badge className="bg-orange-500 text-white"><RotateCcw className="w-3 h-3 mr-1" /> Menunggu Pengecekan</Badge>;
      case "SELESAI":
        if (item.kondisiKembali === "RUSAK") return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Selesai (Rusak)</Badge>;
        if (item.kondisiKembali === "HILANG") return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> Selesai (Hilang)</Badge>;
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50"><ShieldCheck className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case "DIAMBIL":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50"><ShieldCheck className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{item.status}</Badge>;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Fetch Global Komoditas Stats for Sheet 1
    const res = await getKomoditasStats();
    if (res.error || !res.data) {
      alert(res.error || "Gagal mengambil rekap stok inventaris.");
      setIsExporting(false);
      return;
    }
    const komoditasData = res.data;

    // --- SHEET 1: REKAP STOK ASET ---
    const ws1Data: any[][] = [
      ["REKAP STOK INVENTARIS LABORATORIUM"],
      ["Data Diekstrak Pada:", format(new Date(), "dd MMMM yyyy HH:mm:ss", {locale: localeID})],
      [],
      ["NAMA BARANG/BAHAN", "TIPE", "SATUAN", "STOK TOTAL (AWAL)", "STOK TERSEDIA (DI LEMARI)", "SEDANG DIPINJAM", "TOTAL RUSAK", "TOTAL HILANG"]
    ];

    komoditasData.forEach((k: any) => {
      const dipinjam = k.stokTotal - k.stokTersedia;
      ws1Data.push([
        k.nama,
        k.tipe,
        k.satuan,
        k.stokTotal + k.totalRusak + k.totalHilang, // Stok Awal yang sebenarnya
        k.stokTersedia,
        dipinjam,
        k.totalRusak,
        k.totalHilang
      ]);
    });
    
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!cols'] = [{wch:35}, {wch:15}, {wch:10}, {wch:20}, {wch:25}, {wch:20}, {wch:15}, {wch:15}];

    // --- SHEET 2: DAFTAR ASET BERMASALAH ---
    const problematicData = filteredData.filter(d => d.kondisiKembali === "RUSAK" || d.kondisiKembali === "HILANG");
    
    const ws2Data: any[][] = [
      ["DAFTAR ASET BERMASALAH (RUSAK / HILANG)"],
      ["Catatan: Daftar ini memuat rincian aset yang dilaporkan dalam keadaan tidak utuh."],
      [],
      ["TANGGAL PENGAJUAN", "TANGGAL DIKEMBALIKAN", "NAMA PEMINJAM", "NIM", "BARANG", "JUMLAH", "KONDISI", "CATATAN / KRONOLOGI"]
    ];

    problematicData.forEach(d => {
      ws2Data.push([
        format(new Date(d.transaksi.tanggalPengajuan), "dd MMM yyyy HH:mm"),
        d.tanggalDikembalikan ? format(new Date(d.tanggalDikembalikan), "dd MMM yyyy HH:mm") : "-",
        d.transaksi.user.nama,
        d.transaksi.user.nim,
        d.komoditas.nama,
        `${d.jumlah} ${d.komoditas.satuan}`,
        d.kondisiKembali,
        d.catatanPengembalian || "-"
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [{wch:20}, {wch:20}, {wch:25}, {wch:15}, {wch:25}, {wch:10}, {wch:15}, {wch:40}];

    // --- SHEET 3: RIWAYAT TRANSAKSI (LOG) ---
    const periodStr = (startDate && endDate) 
      ? `${format(new Date(startDate), "dd MMM yyyy", {locale: localeID})} s.d. ${format(new Date(endDate), "dd MMM yyyy", {locale: localeID})}` 
      : "Keseluruhan Waktu";
    
    const totalTransaksi = filteredData.length;
    const totalRusak = filteredData.filter(d => d.kondisiKembali === "RUSAK").length;
    const totalHilang = filteredData.filter(d => d.kondisiKembali === "HILANG").length;
    const totalAktif = filteredData.filter(d => d.status === "DIPINJAM").length;

    const ws3Data: any[][] = [
      ["LOG RIWAYAT TRANSAKSI"],
      ["Rentang Data Filter:", periodStr],
      [],
      ["RINGKASAN STATISTIK (DARI FILTER)"],
      ["Total Baris Data:", totalTransaksi],
      ["Total Alat Rusak:", totalRusak],
      ["Total Alat Hilang:", totalHilang],
      ["Aset Sedang Dipinjam:", totalAktif],
      [],
      ["TANGGAL", "NAMA PEMINJAM", "NIM", "KOMODITAS", "JUMLAH", "KEGIATAN", "STATUS AKHIR", "KONDISI FISIK", "CATATAN PENGECEKAN"]
    ];

    const sortedData = [...filteredData].sort((a, b) => {
      if (a.kondisiKembali === "RUSAK" || a.kondisiKembali === "HILANG") return -1;
      if (b.kondisiKembali === "RUSAK" || b.kondisiKembali === "HILANG") return 1;
      return 0;
    });

    sortedData.forEach(d => {
      ws3Data.push([
        format(new Date(d.transaksi.tanggalPengajuan), "dd MMM yyyy HH:mm"),
        d.transaksi.user.nama,
        d.transaksi.user.nim,
        d.komoditas.nama,
        `${d.jumlah} ${d.komoditas.satuan}`,
        d.transaksi.catatanKegiatan,
        d.status,
        d.kondisiKembali || "-",
        d.catatanPengembalian || "-"
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!cols'] = [{wch:20}, {wch:25}, {wch:15}, {wch:25}, {wch:10}, {wch:30}, {wch:15}, {wch:15}, {wch:40}];

    // Assemble Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Rekap Stok Aset");
    XLSX.utils.book_append_sheet(wb, ws2, "Aset Bermasalah");
    XLSX.utils.book_append_sheet(wb, ws3, "Log Transaksi");
    XLSX.writeFile(wb, `Laporan_Audit_SIPLAB_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`);
    
    setIsExporting(false);
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => { setActiveTab("AKTIF"); setCurrentPage(1); setStatusFilter("SEMUA"); setStartDate(""); setEndDate(""); }}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === "AKTIF" 
              ? "border-emerald-600 text-emerald-700 bg-white" 
              : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> Aset Sedang Aktif
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("HISTORIS"); setCurrentPage(1); setStatusFilter("SEMUA"); setStartDate(""); setEndDate(""); }}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === "HISTORIS" 
              ? "border-emerald-600 text-emerald-700 bg-white" 
              : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <History className="w-4 h-4" /> Riwayat Historis
          </div>
        </button>
      </div>

      <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/30">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari alat, bahan, atau nama..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-sm font-medium placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <CustomDropdown 
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
              options={statuses}
              placeholder="Semua Status"
            />

            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 h-10 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none outline-none text-sm text-slate-600 sm:w-[115px] focus:ring-0"
              />
              <span className="text-slate-300 font-bold">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none outline-none text-sm text-slate-600 sm:w-[115px] focus:ring-0"
              />
            </div>

            <Button onClick={handleExport} disabled={isExporting} className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-900/10 shrink-0 disabled:bg-slate-300">
              {isExporting ? (
                <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Menyiapkan Laporan...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Unduh .XLSX</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl. Pengajuan / Estimasi</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Komoditas & Jumlah</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Filter className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-700">Data Tidak Ditemukan</p>
                    <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">
                    <div>
                      <p className="font-semibold text-slate-800">{format(new Date(item.transaksi.tanggalPengajuan), "dd MMM yyyy", { locale: localeID })}</p>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold mt-0.5">Jam: {format(new Date(item.transaksi.tanggalPengajuan), "HH:mm")}</p>
                      {item.transaksi.estimasiPengembalian && activeTab === "AKTIF" && (
                        <p className="text-[11px] text-emerald-700 font-bold mt-2 bg-emerald-50 border border-emerald-100/50 inline-block px-2.5 py-1 rounded-lg">
                          Est: {format(new Date(item.transaksi.estimasiPengembalian), "dd MMM yyyy", { locale: localeID })}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 text-sm">{item.transaksi.user.nama}</p>
                    <p className="text-xs text-slate-500 font-medium">{item.transaksi.user.nim}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.komoditas.tipe === "BARANG" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{item.komoditas.nama}</p>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">{item.jumlah} <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{item.komoditas.satuan}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 max-w-[200px] truncate italic">
                    "{item.transaksi.catatanKegiatan}"
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(item)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-bold px-2">
            Menampilkan <span className="text-slate-800">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)}</span> dari <span className="text-slate-800">{filteredData.length}</span> data
          </p>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-slate-700 min-w-[2rem] text-center">
              {currentPage}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
