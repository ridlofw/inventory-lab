"use client";

import { useState } from "react";
import { ajukanPeminjaman } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus, AlertCircle, CheckCircle2, ShoppingCart, ChevronDown, Search, CalendarDays } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Komoditas } from "@prisma/client";
import { useEffect, useRef } from "react";

function CustomSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: {value: string, label: string, disabled: boolean, stok: number, tipe: string, satuan: string, merk?: string, spesifikasi?: string}[] 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(o => o.value === value);
  const ref = useRef<HTMLDivElement>(null);

  // Close when click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when open/close
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm font-medium transition-all cursor-pointer shadow-sm select-none ${
          open 
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-100/50' 
            : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
        }`}
      >
        <span className={selected ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}>
          {selected ? selected.label : "Pilih komoditas..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180 text-emerald-500' : ''}`} />
      </div>
      
      {open && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full z-50 rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Cari alat atau bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent closing
              className="w-full px-1 py-1 text-xs rounded-lg border-0 focus:outline-none focus:ring-0 bg-transparent placeholder-slate-400 text-slate-700"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-400 italic text-center bg-slate-50/20">Tidak ditemukan hasil</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value} 
                  onClick={() => {
                    if(!opt.disabled) {
                      onChange(opt.value);
                      setOpen(false);
                    }
                  }}
                  className={`px-4 py-3 text-sm flex justify-between items-center transition-colors ${
                    opt.disabled 
                      ? 'opacity-50 cursor-not-allowed bg-slate-50/50 text-slate-400' 
                      : 'cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <span className={`truncate ${value === opt.value ? 'font-bold text-emerald-700' : 'font-semibold'}`}>
                      {opt.label}
                    </span>
                    {(opt.merk || opt.spesifikasi) && (
                      <span className="text-[10px] text-slate-500 truncate" title={`${opt.merk || ''} ${opt.merk && opt.spesifikasi ? '-' : ''} ${opt.spesifikasi || ''}`}>
                        {opt.merk} {opt.merk && opt.spesifikasi ? '-' : ''} {opt.spesifikasi}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {opt.tipe === "BARANG" ? "ALAT LAB" : "BAHAN KIMIA"} • {opt.satuan}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      opt.stok === 0 
                        ? 'bg-red-50 text-red-600 border-red-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                    }`}>
                      {opt.stok === 0 ? 'Habis' : `Sisa ${opt.stok}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CartForm({ katalog }: { katalog: Komoditas[] }) {
  const [items, setItems] = useState([{ komoditasId: "", jumlah: 1 }]);
  const [catatan, setCatatan] = useState("");
  const [estimasiTanggal, setEstimasiTanggal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const addItem = () => setItems([...items, { komoditasId: "", jumlah: 1 }]);
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const submitConfirmed = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setMessage(null);
    
    const res = await ajukanPeminjaman({
      catatanKegiatan: catatan,
      estimasiPengembalian: estimasiTanggal ? new Date(estimasiTanggal) : undefined,
      items: items.map(i => ({ komoditasId: i.komoditasId, jumlah: Number(i.jumlah) }))
    });
    
    setIsLoading(false);
    if (res?.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setShowSuccessToast(true);
      setItems([{ komoditasId: "", jumlah: 1 }]);
      setCatatan("");
      setEstimasiTanggal("");
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  // Check validities
  let hasStockError = false;
  let hasDuplicateError = false;
  const selectedIds = new Set();
  
  items.forEach((item) => {
    if (!item.komoditasId) return;
    
    // Check duplicates
    if (selectedIds.has(item.komoditasId)) {
      hasDuplicateError = true;
    }
    selectedIds.add(item.komoditasId);
    
    // Check stock
    const selected = katalog.find(k => k.id === item.komoditasId);
    if (selected && item.jumlah > selected.stokTersedia) {
      hasStockError = true;
    }
  });

  const hasBarang = items.some(item => {
    const k = katalog.find(x => x.id === item.komoditasId);
    return k?.tipe === "BARANG";
  });

  const isFormValid = items.length > 0 && 
                      items.every(i => i.komoditasId && i.jumlah > 0) && 
                      catatan.trim() !== "" && 
                      (!hasBarang || estimasiTanggal !== "") &&
                      !hasStockError && 
                      !hasDuplicateError;

  return (
    <Card className="rounded-2xl shadow-lg border-slate-100 flex flex-col border-t-4 border-t-emerald-500 overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Keranjang Pengajuan</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Susun daftar barang yang dibutuhkan</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handlePreSubmit} className="space-y-6">
          
          {message && (
            <Alert className={message.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}>
              {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertTitle>{message.type === "error" ? "Gagal" : "Sukses"}</AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedItem = katalog.find(k => k.id === item.komoditasId);
              const isOverStock = selectedItem && item.jumlah > selectedItem.stokTersedia;
              
              // Prepare options for custom select
              const dropdownOptions = katalog.map(k => ({
                value: k.id,
                label: k.nama,
                disabled: k.stokTersedia === 0,
                stok: k.stokTersedia,
                tipe: k.tipe,
                satuan: k.satuan,
                merk: (k as any).merk || "",
                spesifikasi: (k as any).spesifikasi || ""
              }));
              
              return (
                <div 
                  key={index} 
                  className={`p-4 bg-white border rounded-2xl relative space-y-4 transition-all duration-300 ${
                    isOverStock 
                      ? 'border-red-200 bg-red-50/10 shadow-sm shadow-red-50' 
                      : item.komoditasId 
                        ? 'border-emerald-100 bg-emerald-50/5 shadow-sm shadow-emerald-50' 
                        : 'border-slate-200 bg-slate-50/20 shadow-sm'
                  }`}
                >
                  {/* Header of Item Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${
                        isOverStock 
                          ? 'bg-red-100 text-red-700' 
                          : item.komoditasId 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        Barang #{index + 1}
                      </span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-xl transition-colors duration-200"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase select-none">Nama Alat / Bahan</label>
                    <CustomSelect 
                      value={item.komoditasId}
                      onChange={(val) => updateItem(index, "komoditasId", val)}
                      options={dropdownOptions}
                    />
                  </div>

                  {/* Quantity & Stock Info Row */}
                  <div className="flex items-end justify-between gap-4 pt-1">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase select-none">
                        Jumlah Pinjam {selectedItem ? `(${selectedItem.satuan})` : ""}
                      </label>
                      <div className={`flex items-center border rounded-xl bg-white overflow-hidden shadow-sm h-11 w-full max-w-[150px] transition-all focus-within:ring-2 ${
                        isOverStock 
                          ? 'border-red-350 focus-within:border-red-500 focus-within:ring-red-500/10' 
                          : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/10'
                      }`}>
                        <button
                          type="button"
                          disabled={!item.komoditasId}
                          onClick={() => updateItem(index, "jumlah", Math.max(1, item.jumlah - 1))}
                          className="w-10 h-full hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 hover:text-slate-800 transition-colors border-r border-slate-100 flex items-center justify-center font-semibold text-lg select-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          disabled={!item.komoditasId}
                          max={selectedItem?.stokTersedia || 999}
                          value={item.jumlah}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (isNaN(val) || val < 1) val = 1;
                            updateItem(index, "jumlah", val);
                          }}
                          className="flex-1 text-center bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-sm font-bold text-slate-800 w-full disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          disabled={!item.komoditasId}
                          onClick={() => {
                            const maxStok = selectedItem?.stokTersedia || 999;
                            updateItem(index, "jumlah", Math.min(maxStok, item.jumlah + 1));
                          }}
                          className="w-10 h-full hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 hover:text-slate-800 transition-colors border-l border-slate-100 flex items-center justify-center font-semibold text-lg select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {selectedItem && (
                      <div className="text-right pb-0.5 select-none">
                        <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase mb-1">Stok Tersedia</span>
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                          {selectedItem.stokTersedia} {selectedItem.satuan}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock Error Text */}
                  {isOverStock && (
                    <div className="flex items-center gap-2 text-xs text-red-600 font-semibold bg-red-50/80 p-3 rounded-xl border border-red-100/80 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Jumlah melebihi sisa stok ({selectedItem?.stokTersedia})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasDuplicateError && (
             <p className="text-xs text-red-500 font-bold bg-red-50/50 p-2.5 rounded-lg border border-red-100 text-center animate-pulse">
               Terdapat komoditas yang sama di keranjang.
             </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full h-11 border-dashed border-2 rounded-xl text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-250 font-bold flex items-center justify-center gap-2 group transition-all duration-300"
          >
            <Plus className="h-4.5 w-4.5 transition-transform group-hover:rotate-90 duration-350" />
            <span>Tambah Baris Lain</span>
          </Button>

          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            {hasBarang && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-slate-450 tracking-wider uppercase block">Estimasi Pengembalian <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={estimasiTanggal}
                    onChange={(e) => setEstimasiTanggal(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-slate-700 shadow-sm bg-white cursor-pointer relative hover:border-emerald-300 transition-colors [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-450 tracking-wider uppercase block">Catatan Kegiatan <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Tujuan peminjaman (misal: Praktikum Kimia)"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="resize-none h-[68px] rounded-xl border-slate-200 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 text-sm shadow-sm placeholder-slate-400"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!isFormValid || isLoading} 
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:shadow-none hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Memproses...</span>
              </span>
            ) : "Kirim Pengajuan"}
          </Button>
        </form>
      </CardContent>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-100">
              <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Konfirmasi Pengajuan
              </h2>
              <p className="text-xs text-emerald-700/80 mt-1">Pastikan daftar aset di bawah ini sudah benar.</p>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-50/30 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const selected = katalog.find(k => k.id === item.komoditasId);
                  if (!selected) return null;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{selected.nama}</span>
                        {((selected as any).merk || (selected as any).spesifikasi) && (
                          <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            {(selected as any).merk} {((selected as any).merk && (selected as any).spesifikasi) ? '-' : ''} {(selected as any).spesifikasi}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                          {selected.tipe === "BARANG" ? "ALAT LAB" : "BAHAN KIMIA"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600">{item.jumlah}</span>
                        <span className="text-xs font-semibold text-slate-500 ml-1">{selected.satuan}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {hasBarang && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider mb-1">Estimasi Kembali</p>
                      <p className="text-sm font-bold text-emerald-800">
                        {estimasiTanggal ? new Date(estimasiTanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                      </p>
                    </div>
                    <CalendarDays className="w-8 h-8 text-emerald-200" />
                  </div>
                )}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Catatan Kegiatan</p>
                  <p className="text-xs text-slate-700 italic">"{catatan}"</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-3 bg-white">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl h-11 border-slate-200 hover:bg-slate-50 font-bold"
              >
                Kembali Edit
              </Button>
              <Button 
                onClick={submitConfirmed}
                className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
              >
                Ya, Kirim
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <div className="bg-white/20 p-1.5 rounded-full shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="pr-2">
            <p className="font-bold text-sm">Berhasil Terkirim!</p>
            <p className="text-[11px] text-emerald-100 mt-0.5">Pengajuan aset lab sedang diproses.</p>
          </div>
        </div>
      )}
    </Card>
  );
}
