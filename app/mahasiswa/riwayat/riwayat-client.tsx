"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { KondisiBarang, StatusTransaksi } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  RotateCcw, 
  Package, 
  Clock, 
  ShieldCheck, 
  XCircle, 
  Box, 
  AlertTriangle, 
  History,
  ChevronRight
} from "lucide-react";
import { kembalikanTransaksi } from "./actions";

export function RiwayatClient({ items }: { items: any[] }) {
  const [returnModal, setReturnModal] = useState<{ isOpen: boolean; trxId: string; details: any[] } | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, { kondisi: KondisiBarang; catatan: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Helper untuk status global (hanya untuk log table)
  const getStatusBadge = (item: any) => {
    switch (item.status) {
      case StatusTransaksi.MENUNGGU_PINJAM:
      case StatusTransaksi.MENUNGGU_MINTA:
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 shadow-sm"><Clock className="w-3 h-3 mr-1" /> Menunggu Persetujuan</Badge>;
      case StatusTransaksi.DIPINJAM:
        return <Badge variant="default" className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"><Package className="w-3 h-3 mr-1" /> Sedang Dipinjam</Badge>;
      case StatusTransaksi.MENUNGGU_KEMBALI:
        return <Badge variant="destructive" className="bg-orange-500 text-white shadow-sm hover:bg-orange-600"><RotateCcw className="w-3 h-3 mr-1" /> Pengecekan Akhir</Badge>;
      case StatusTransaksi.SELESAI:
        if (item.kondisiKembali === "RUSAK") return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 shadow-sm"><XCircle className="w-3 h-3 mr-1" /> Selesai (Rusak)</Badge>;
        if (item.kondisiKembali === "HILANG") return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 shadow-sm"><AlertTriangle className="w-3 h-3 mr-1" /> Selesai (Hilang)</Badge>;
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 shadow-sm"><ShieldCheck className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case StatusTransaksi.DIAMBIL:
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 shadow-sm"><ShieldCheck className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case StatusTransaksi.DITOLAK:
        return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 shadow-sm"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge variant="secondary" className="shadow-sm">{item.status}</Badge>;
    }
  };

  // Group items by transaction ID
  const groupedByTrx = items.reduce((acc: any, item: any) => {
    const trxId = item.transaksi.id;
    if (!acc[trxId]) {
      acc[trxId] = {
        transaksi: item.transaksi,
        details: []
      };
    }
    acc[trxId].details.push(item);
    return acc;
  }, {});

  const transactions = Object.values(groupedByTrx);

  // Active Transactions: transctions that have AT LEAST ONE item in DIPINJAM or MENUNGGU_KEMBALI
  const activeTransactions = transactions.filter((t: any) => 
    t.details.some((d: any) => d.status === StatusTransaksi.DIPINJAM || d.status === StatusTransaksi.MENUNGGU_KEMBALI)
  );
  
  // History Items: we keep them flat per item just like before so the log table is detailed
  const historyItems = items.filter(i => 
    [StatusTransaksi.SELESAI, StatusTransaksi.DITOLAK, StatusTransaksi.DIAMBIL].includes(i.status)
  );

  const handleReturnTransaction = async () => {
    if (!returnModal) return;
    setIsLoading(true);
    
    // Only return items that are actually DIPINJAM (Alat). Bahan (DIAMBIL) is ignored.
    const payloadItems = returnModal.details
      .filter(d => d.status === StatusTransaksi.DIPINJAM)
      .map(d => ({
        detailTransaksiId: d.id,
        kondisi: returnItemsState[d.id]?.kondisi || "AMAN",
        catatan: returnItemsState[d.id]?.catatan || ""
      }));

    const res = await kembalikanTransaksi({
      transaksiId: returnModal.trxId,
      items: payloadItems
    });

    setIsLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload(); 
    }
  };

  const openReturnModal = (trx: any) => {
    setReturnItemsState({});
    setReturnModal({
      isOpen: true,
      trxId: trx.transaksi.id,
      details: trx.details
    });
  };

  return (
    <div className="space-y-10">
      
      {/* Peminjaman Aktif (Grup Keranjang) */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" /> Aset di Tangan Anda
        </h2>
        
        {activeTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">Tidak ada barang yang sedang Anda pinjam saat ini.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTransactions.map((trx: any) => {
              const borrowedAlatCount = trx.details.filter((d:any) => d.status === StatusTransaksi.DIPINJAM).length;
              const usedBahanCount = trx.details.filter((d:any) => d.status === StatusTransaksi.DIAMBIL).length;
              const waitingReturnCount = trx.details.filter((d:any) => d.status === StatusTransaksi.MENUNGGU_KEMBALI).length;
              
              return (
                <Card key={trx.transaksi.id} className="p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-emerald-200 transition-colors bg-white">
                  <div className="flex-1 flex flex-col md:flex-row gap-6 w-full">
                    {/* Date Info */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shrink-0 min-w-[160px] text-center md:text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tgl Pinjam</p>
                      <p className="font-bold text-slate-800">{format(new Date(trx.transaksi.tanggalPengajuan), "dd MMM yyyy", { locale: localeID })}</p>
                      
                      {trx.transaksi.estimasiPengembalian && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                          <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-0.5">Est. Kembali</p>
                          <p className="font-bold text-emerald-700">{format(new Date(trx.transaksi.estimasiPengembalian), "dd MMM yyyy", { locale: localeID })}</p>
                        </div>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 space-y-3 justify-center flex flex-col">
                      <p className="text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">"{trx.transaksi.catatanKegiatan}"</p>
                      <div className="flex flex-wrap gap-2">
                        {borrowedAlatCount > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold border-0">
                            {borrowedAlatCount} Alat (Harus Dikembalikan)
                          </Badge>
                        )}
                        {waitingReturnCount > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold border-0">
                            {waitingReturnCount} Alat (Menunggu Cek Admin)
                          </Badge>
                        )}
                        {usedBahanCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold border-0">
                            {usedBahanCount} Bahan (Habis Pakai)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full md:w-auto shrink-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0">
                    {borrowedAlatCount > 0 ? (
                      <Button 
                        onClick={() => openReturnModal(trx)}
                        className="w-full h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-bold"
                      >
                        Kembalikan Keranjang Ini <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : waitingReturnCount > 0 ? (
                      <div className="bg-orange-50 text-orange-700 text-xs font-bold px-4 py-3 rounded-xl border border-orange-200 text-center flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4 animate-spin-slow" /> Sedang Diperiksa<br/>Admin Lab
                      </div>
                    ) : (
                      <div className="bg-slate-50 text-slate-500 text-xs font-bold px-4 py-3 rounded-xl border border-slate-200 text-center">
                        Bahan Tidak Perlu<br/>Dikembalikan
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Histori Status */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" /> Histori Individu
        </h2>
        {historyItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500">Belum ada riwayat transaksi masa lalu.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Komoditas</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">
                        {format(new Date(item.transaksi.tanggalPengajuan), "dd MMM yyyy", { locale: localeID })}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.komoditas.nama}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {item.jumlah} <span className="text-xs text-slate-400">{item.komoditas.satuan}</span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Bulk Return Modal */}
      {returnModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-blue-50 border-b border-blue-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Form Laporan Pengembalian</h2>
                <p className="text-xs text-blue-600 mt-0.5">Harap jujur mengenai kondisi aset yang Anda kembalikan.</p>
              </div>
              <Button variant="ghost" onClick={() => setReturnModal(null)} className="h-8 px-4 rounded-xl bg-blue-100 text-blue-800 font-bold hover:bg-blue-200">Batal</Button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {returnModal.details.filter(d => d.status === StatusTransaksi.DIPINJAM).map((item: any) => {
                const currentItemState = returnItemsState[item.id] || { kondisi: "AMAN", catatan: "" };
                
                return (
                  <Card key={item.id} className="p-5 rounded-2xl border-slate-200 flex flex-col lg:flex-row gap-6">
                    <div className="flex items-center gap-4 w-full lg:w-1/3 shrink-0">
                      <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
                        <Box className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{item.komoditas.nama}</h3>
                        <p className="text-sm font-bold text-blue-600 mt-0.5">{item.jumlah} <span className="text-xs text-slate-500 font-medium">{item.komoditas.satuan}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kondisi Aset Ini</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["AMAN", "RUSAK", "HILANG"] as KondisiBarang[]).map(k => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setReturnItemsState(prev => ({ ...prev, [item.id]: { ...currentItemState, kondisi: k } }))}
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
                      
                      {currentItemState.kondisi !== "AMAN" && (
                        <Textarea 
                          required 
                          value={currentItemState.catatan}
                          onChange={(e) => setReturnItemsState(prev => ({ ...prev, [item.id]: { ...currentItemState, catatan: e.target.value } }))}
                          placeholder="Jelaskan secara singkat kronologi kerusakan / kehilangan..."
                          className="rounded-xl border-red-200 mt-3 h-20 text-sm resize-none focus:border-red-500 focus:ring-red-500/20 bg-red-50/50"
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <Button 
                onClick={handleReturnTransaction}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
              >
                {isLoading ? "Mengirim Laporan..." : "Kirim Laporan Pengembalian Massal"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
