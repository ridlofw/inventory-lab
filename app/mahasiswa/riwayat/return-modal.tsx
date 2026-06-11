"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KondisiBarang } from "@prisma/client";
import { kembalikanItem } from "./actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReturnModal({ 
  isOpen, 
  onClose, 
  item 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  item: { id: string; komoditas: { nama: string }; jumlah: number } | null;
}) {
  const [kondisi, setKondisi] = useState<KondisiBarang>(KondisiBarang.AMAN);
  const [catatan, setCatatan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const res = await kembalikanItem({
      detailTransaksiId: item.id,
      kondisi,
      catatan
    });

    setIsLoading(false);
    if (res?.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Berhasil melaporkan pengembalian!" });
      setTimeout(() => {
        setMessage(null);
        setKondisi(KondisiBarang.AMAN);
        setCatatan("");
        onClose();
      }, 1500);
    }
  };

  const isCatatanRequired = kondisi === KondisiBarang.RUSAK || kondisi === KondisiBarang.HILANG;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pengembalian Alat</DialogTitle>
          <DialogDescription>
            Silakan laporkan kondisi fisik alat saat ini sebelum mengembalikannya secara fisik ke laboran.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {message && (
            <Alert className={message.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}>
              {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertTitle>{message.type === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aset</p>
              <p className="font-bold text-slate-800">{item.komoditas.nama}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jumlah</p>
              <p className="font-bold text-emerald-600">{item.jumlah}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Kondisi Fisik Terkini</label>
            <select
              value={kondisi}
              onChange={(e) => setKondisi(e.target.value as KondisiBarang)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="AMAN">✅ Aman (Baik & Lengkap)</option>
              <option value="RUSAK">⚠️ Rusak (Cacat Fisik/Fungsi)</option>
              <option value="HILANG">❌ Hilang (Tidak Dapat Ditemukan)</option>
            </select>
          </div>

          {(kondisi === "RUSAK" || kondisi === "HILANG") && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-slate-700">Catatan Kronologi <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Ceritakan bagaimana barang bisa rusak atau hilang secara detail..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="resize-none h-24 rounded-xl border-red-200 focus-visible:ring-red-500 bg-red-50/30"
                required={isCatatanRequired}
              />
              <p className="text-xs text-red-500 font-medium">Anda wajib menjelaskan kronologi kejadian secara jujur.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">Batal</Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              {isLoading ? "Memproses..." : "Laporkan & Kembalikan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
