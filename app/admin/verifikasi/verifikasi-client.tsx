"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { approveTransaksi, rejectTransaksi, confirmPengembalian, approveSemuaTransaksi, confirmSemuaPengembalian } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Box, Package, User, ChevronRight, Search } from "lucide-react";
import { KondisiBarang } from "@prisma/client";

export function VerifikasiClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  // Array untuk multiple loading states
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  // Modal State untuk Pengajuan
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; trx: any | null }>({
    isOpen: false,
    trx: null,
  });

  // Modal State untuk Pengembalian
  const [returnModal, setReturnModal] = useState<{ isOpen: boolean; trx: any | null }>({
    isOpen: false,
    trx: null,
  });
  
  const [returnItems, setReturnItems] = useState<Record<string, { kondisi: KondisiBarang, catatan: string }>>({});

  const handleApprove = async (detailId: string) => {
    setLoadingIds(prev => [...prev, detailId]);
    const res = await approveTransaksi(detailId);
    setLoadingIds(prev => prev.filter(id => id !== detailId));
    if (res.error) alert(res.error);
    else refreshDataLocal(detailId);
  };

  const handleReject = async (detailId: string) => {
    if (!window.confirm("Tolak pengajuan item ini?")) return;
    setLoadingIds(prev => [...prev, detailId]);
    const res = await rejectTransaksi(detailId);
    setLoadingIds(prev => prev.filter(id => id !== detailId));
    if (res.error) alert(res.error);
    else refreshDataLocal(detailId);
  };

  const handleReturnItem = async (detailId: string) => {
    const itemState = returnItems[detailId] || { kondisi: "AMAN", catatan: "" };
    setLoadingIds(prev => [...prev, detailId]);
    const res = await confirmPengembalian(detailId, itemState.kondisi, itemState.catatan);
    setLoadingIds(prev => prev.filter(id => id !== detailId));
    
    if (res.error) alert(res.error);
    else refreshDataLocal(detailId);
  };

  const refreshDataLocal = (detailId: string) => {
    setData(prevData => prevData.map(trx => ({
      ...trx,
      detail: trx.detail.filter((d: any) => d.id !== detailId)
    })).filter(trx => trx.detail.length > 0));

    if (detailModal.isOpen && detailModal.trx) {
      setDetailModal(prev => {
        if (!prev.isOpen || !prev.trx) return prev;
        const remaining = prev.trx.detail.filter((d: any) => d.id !== detailId);
        if (remaining.length === 0) return { isOpen: false, trx: null };
        return { ...prev, trx: { ...prev.trx, detail: remaining } };
      });
    }
    if (returnModal.isOpen && returnModal.trx) {
      setReturnModal(prev => {
        if (!prev.isOpen || !prev.trx) return prev;
        const remaining = prev.trx.detail.filter((d: any) => d.id !== detailId);
        if (remaining.length === 0) return { isOpen: false, trx: null };
        return { ...prev, trx: { ...prev.trx, detail: remaining } };
      });
    }
  };

  // Search logic
  const filteredData = data.filter(trx => {
    const q = searchQuery.toLowerCase();
    return trx.user.nama.toLowerCase().includes(q) || 
           trx.user.nim.toLowerCase().includes(q) || 
           trx.catatanKegiatan.toLowerCase().includes(q) ||
           trx.detail.some((d: any) => d.komoditas.nama.toLowerCase().includes(q));
  });

  const pengajuanTrx = filteredData.filter(t => t.detail.some((d: any) => d.status === "MENUNGGU_PINJAM" || d.status === "MENUNGGU_MINTA"))
                           .map(t => ({ ...t, detail: t.detail.filter((d: any) => d.status === "MENUNGGU_PINJAM" || d.status === "MENUNGGU_MINTA") }));
  
  const pengembalianTrx = filteredData.filter(t => t.detail.some((d: any) => d.status === "MENUNGGU_KEMBALI"))
                              .map(t => ({ ...t, detail: t.detail.filter((d: any) => d.status === "MENUNGGU_KEMBALI") }));

  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleApproveAll = async () => {
    if (!detailModal.trx) return;
    setIsBulkLoading(true);
    const detailIds = detailModal.trx.detail.map((d: any) => d.id);
    const res = await approveSemuaTransaksi(detailIds);
    setIsBulkLoading(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setData(prevData => prevData.filter(trx => trx.id !== detailModal.trx.id));
      setDetailModal({ isOpen: false, trx: null });
    }
  };

  const handleConfirmAll = async () => {
    if (!returnModal.trx) return;
    setIsBulkLoading(true);
    
    const payload = returnModal.trx.detail.map((item: any) => {
      const state = returnItems[item.id] || { 
        kondisi: item.kondisiKembali || "AMAN", 
        catatan: item.catatanPengembalian || "" 
      };
      return { detailId: item.id, kondisi: state.kondisi, catatanAdmin: state.catatan };
    });

    const res = await confirmSemuaPengembalian(payload);
    setIsBulkLoading(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setData(prevData => prevData.filter(trx => trx.id !== returnModal.trx.id));
      setReturnModal({ isOpen: false, trx: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Cari berdasarkan nama, NIM, atau nama barang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 h-12 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-sm focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm text-sm"
        />
      </div>

      <div className="space-y-10">
        {/* SEKSI PENGAJUAN BARU */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-800">Antrean Keluar (Pengajuan)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
              {pengajuanTrx.length} Pengajuan
            </span>
          </div>

          {pengajuanTrx.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{searchQuery ? "Tidak ditemukan kecocokan data." : "Semua pengajuan telah diselesaikan."}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pengajuanTrx.map((trx: any) => (
                <Card key={trx.id} className="p-5 rounded-2xl border-slate-200 flex flex-col md:flex-row gap-6 shadow-sm overflow-hidden relative group items-center justify-between bg-white">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                  <div className="flex flex-col md:flex-row gap-6 items-center pl-2">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-bold text-slate-800 text-lg leading-tight">{trx.user.nama}</p>
                      <p className="text-sm text-slate-500 font-medium">{trx.user.nim}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                        <Clock className="w-3 h-3" /> 
                        {format(new Date(trx.tanggalPengajuan), "dd MMM yyyy • HH:mm", { locale: idLocale })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-6 w-full md:w-auto">
                    <div className="bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-center border border-slate-100">
                      <p className="text-xl font-black">{trx.detail.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Item Diminta</p>
                    </div>
                    <Button 
                      onClick={() => setDetailModal({ isOpen: true, trx })}
                      className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20"
                    >
                      Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* SEKSI PENGEMBALIAN */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-800">Antrean Masuk (Pengembalian)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
              {pengembalianTrx.length} Pengembalian
            </span>
          </div>

          {pengembalianTrx.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
              <CheckCircle2 className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{searchQuery ? "Tidak ditemukan kecocokan data." : "Tidak ada aset yang sedang dikembalikan."}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pengembalianTrx.map((trx: any) => (
                <Card key={trx.id} className="p-5 rounded-2xl border-slate-200 flex flex-col md:flex-row gap-6 shadow-sm overflow-hidden relative group items-center justify-between bg-white">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                  <div className="flex flex-col md:flex-row gap-6 items-center pl-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-bold text-slate-800 text-lg leading-tight">{trx.user.nama}</p>
                      <p className="text-sm text-slate-500 font-medium">{trx.user.nim}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                        <Clock className="w-3 h-3" /> 
                        {format(new Date(trx.tanggalPengajuan), "dd MMM yyyy • HH:mm", { locale: idLocale })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-6 w-full md:w-auto">
                    <div className="bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-center border border-slate-100">
                      <p className="text-xl font-black">{trx.detail.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Item Kembali</p>
                    </div>
                    <Button 
                      onClick={() => setReturnModal({ isOpen: true, trx })}
                      className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20"
                    >
                      Verifikasi Fisik <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Pengajuan */}
      {detailModal.isOpen && detailModal.trx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Detail Pengajuan: {detailModal.trx.user.nama}</h2>
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-slate-500">Estimasi Kembali: <span className="font-bold text-emerald-600">{detailModal.trx.estimasiPengembalian ? format(new Date(detailModal.trx.estimasiPengembalian), "dd MMM yyyy", { locale: idLocale }) : "-"}</span></p>
                  <p className="text-xs text-slate-500">Catatan Mahasiswa: <span className="italic text-slate-700">"{detailModal.trx.catatanKegiatan}"</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button 
                  onClick={handleApproveAll}
                  disabled={isBulkLoading || detailModal.trx.detail.some((d: any) => d.komoditas.stokTersedia < d.jumlah)}
                  className="flex-1 md:flex-none h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
                >
                  {isBulkLoading ? "Memproses..." : "Setujui Semua"}
                </Button>
                <Button variant="ghost" onClick={() => setDetailModal({ isOpen: false, trx: null })} className="h-9 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-600 shrink-0">Tutup</Button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {detailModal.trx.detail.map((item: any) => {
                const isShortage = item.komoditas.stokTersedia < item.jumlah;
                const isItemLoading = loadingIds.includes(item.id);

                return (
                  <Card key={item.id} className={`p-4 rounded-2xl border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 transition-opacity ${isItemLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`p-3 rounded-xl ${item.komoditas.tipe === "BARANG" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-600"}`}>
                        {item.komoditas.tipe === "BARANG" ? <Box className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{item.komoditas.nama}</h3>
                        <p className="text-sm font-bold text-emerald-600">{item.jumlah} <span className="text-xs text-slate-500 font-medium">{item.komoditas.satuan}</span></p>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isShortage ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${isShortage ? 'text-red-500' : 'text-slate-400'}`} />
                      <div className="text-xs">
                        <span className="font-medium">Stok Saat Ini: </span>
                        <span className="font-bold">{item.komoditas.stokTersedia}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <Button 
                        onClick={() => handleApprove(item.id)} 
                        disabled={isShortage || isItemLoading}
                        className="flex-1 md:w-28 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:bg-slate-200 disabled:text-slate-400 font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> {isItemLoading ? "Wait" : "Setuju"}
                      </Button>
                      <Button 
                        onClick={() => handleReject(item.id)}
                        disabled={isItemLoading}
                        variant="outline" 
                        className="flex-1 md:w-24 rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-bold"
                      >
                        Tolak
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Pengembalian */}
      {returnModal.isOpen && returnModal.trx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-blue-50 border-b border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Verifikasi Pengembalian: {returnModal.trx.user.nama}</h2>
                <p className="text-xs text-blue-600 mt-0.5">Lakukan pengecekan fisik untuk tiap aset di bawah ini.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button 
                  onClick={handleConfirmAll}
                  disabled={isBulkLoading || returnModal.trx.detail.some((item:any) => {
                    const state = returnItems[item.id] || { kondisi: item.kondisiKembali || "AMAN", catatan: item.catatanPengembalian || "" };
                    return state.kondisi !== 'AMAN' && state.catatan.trim() === '';
                  })}
                  className="flex-1 md:flex-none h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                >
                  {isBulkLoading ? "Memproses..." : "Konfirmasi Semua"}
                </Button>
                <Button variant="ghost" onClick={() => setReturnModal({ isOpen: false, trx: null })} className="h-9 px-4 rounded-xl bg-blue-100 text-blue-800 font-bold hover:bg-blue-200 shrink-0">Tutup</Button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {returnModal.trx.detail.map((item: any) => {
                const currentItemState = returnItems[item.id] || { 
                  kondisi: item.kondisiKembali || "AMAN", 
                  catatan: item.catatanPengembalian || "" 
                };
                const isItemLoading = loadingIds.includes(item.id);

                return (
                  <Card key={item.id} className={`p-5 rounded-2xl border-slate-200 flex flex-col lg:flex-row gap-6 transition-opacity ${isItemLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{item.komoditas.nama}</h3>
                          <p className="text-sm font-bold text-blue-600">{item.jumlah} <span className="text-xs text-slate-500 font-medium">{item.komoditas.satuan}</span></p>
                        </div>
                      </div>
                      
                      {item.catatanPengembalian && (
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-700">
                          <span className="font-bold uppercase tracking-wider block mb-1">Catatan Mahasiswa:</span>
                          "{item.catatanPengembalian}"
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Validasi Kondisi Fisik</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["AMAN", "RUSAK", "HILANG"] as KondisiBarang[]).map(k => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setReturnItems(prev => ({ ...prev, [item.id]: { ...currentItemState, kondisi: k } }))}
                              className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                                currentItemState.kondisi === k 
                                  ? k === 'AMAN' 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' 
                                    : 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {currentItemState.kondisi !== "AMAN" && (
                        <Textarea 
                          required 
                          value={currentItemState.catatan}
                          onChange={(e) => setReturnItems(prev => ({ ...prev, [item.id]: { ...currentItemState, catatan: e.target.value } }))}
                          placeholder="Deskripsikan letak kerusakan..."
                          className="rounded-xl border-slate-200 h-20 text-sm resize-none focus:border-red-500 focus:ring-red-500/20"
                        />
                      )}
                    </div>
                    
                    <div className="w-full lg:w-40 shrink-0 flex flex-col justify-end lg:border-l border-slate-100 lg:pl-6">
                      <Button 
                        onClick={() => handleReturnItem(item.id)}
                        disabled={isItemLoading || (currentItemState.kondisi !== 'AMAN' && currentItemState.catatan.trim() === '')}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {isItemLoading ? "Memproses..." : "Konfirmasi"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
