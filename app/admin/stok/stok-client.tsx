"use client";

import { useState, useEffect, useRef } from "react";
import { Komoditas, TipeKomoditas } from "@prisma/client";
import { addKomoditas, updateKomoditas, deleteKomoditas } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, AlertCircle, Save, X, Box, Package, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpDown, Filter, ChevronLeft, ChevronRight } from "lucide-react";

function CustomDropdown({ 
  value, 
  onChange, 
  options, 
  disabled = false 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: {value: string, label: string}[], 
  disabled?: boolean 
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between h-11 w-full rounded-xl border bg-white px-4 text-sm font-medium transition-all select-none ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer hover:border-emerald-400 hover:shadow-sm'
        } ${open ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? selected.label : "Pilih..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180 text-emerald-500' : ''}`} />
      </div>
      
      {open && !disabled && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full z-50 rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200">
          {options.map(opt => (
            <div 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
            >
              <span className={value === opt.value ? 'font-bold text-emerald-700' : 'font-medium'}>{opt.label}</span>
              {value === opt.value && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StokClient({ initialData }: { initialData: Komoditas[] }) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; nama: string }>({ isOpen: false, id: "", nama: "" });
  
  const [formData, setFormData] = useState({
    nama: "",
    tipe: "BARANG" as TipeKomoditas,
    satuan: "buah",
    stokAwal: 1,
    totalRusak: 0,
    totalHilang: 0,
    merk: "",
    spesifikasi: "",
    tahunPerolehan: "",
    lokasi: "",
    ruangPenyimpanan: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting & Filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [lokasiFilter, setLokasiFilter] = useState("SEMUA");

  // 1. Filter
  let processedData = initialData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase()) || 
                        item.tipe.toLowerCase().includes(search.toLowerCase()) ||
                        ((item as any).merk || "").toLowerCase().includes(search.toLowerCase());
    const matchLokasi = lokasiFilter === "SEMUA" || ((item as any).lokasi || "").includes(lokasiFilter);
    return matchSearch && matchLokasi;
  });

  // 2. Sort
  if (sortConfig !== null) {
    processedData.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Komoditas];
      let bValue: any = b[sortConfig.key as keyof Komoditas];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, lokasiFilter, itemsPerPage]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama: "", tipe: "BARANG", satuan: "buah", stokAwal: 1, totalRusak: 0, totalHilang: 0, merk: "", spesifikasi: "", tahunPerolehan: "", lokasi: "", ruangPenyimpanan: "" });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Komoditas) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      tipe: item.tipe,
      satuan: item.satuan,
      stokAwal: item.stokAwal,
      totalRusak: item.totalRusak,
      totalHilang: item.totalHilang,
      merk: (item as any).merk || "",
      spesifikasi: (item as any).spesifikasi || "",
      tahunPerolehan: (item as any).tahunPerolehan || "",
      lokasi: (item as any).lokasi || "",
      ruangPenyimpanan: (item as any).ruangPenyimpanan || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let res;
    if (editingId) {
      res = await updateKomoditas(editingId, formData);
    } else {
      res = await addKomoditas({
        nama: formData.nama,
        tipe: formData.tipe,
        satuan: formData.satuan,
        stokAwal: formData.stokAwal,
        merk: formData.merk,
        spesifikasi: formData.spesifikasi,
        tahunPerolehan: formData.tahunPerolehan,
        lokasi: formData.lokasi,
        ruangPenyimpanan: formData.ruangPenyimpanan,
      });
    }

    setIsLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id: string, nama: string) => {
    setDeleteModal({ isOpen: true, id, nama });
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    const res = await deleteKomoditas(deleteModal.id);
    setIsLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      setDeleteModal({ isOpen: false, id: "", nama: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nama, merk, tipe..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <CustomDropdown 
              value={lokasiFilter}
              onChange={setLokasiFilter}
              options={[
                { value: "SEMUA", label: "Semua Lokasi" },
                { value: "Kampus 2", label: "Kampus 2" },
                { value: "Kampus 3", label: "Kampus 3" },
              ]}
            />
          </div>
        </div>
        <Button onClick={openAddModal} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-6 shrink-0 w-full lg:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Tambah Komoditas
        </Button>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 table-fixed min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-[24%] cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-2">Komoditas <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" /></div>
                </th>
                <th className="px-4 py-4 w-[20%]">Detail</th>
                <th className="px-4 py-4 w-[16%]">Lokasi</th>
                <th className="px-2 py-4 w-[8%] text-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('stokAwal')}>
                  <div className="flex items-center justify-center gap-1">Awal <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" /></div>
                </th>
                <th className="px-2 py-4 w-[8%] text-center leading-tight">Rusak Hilang</th>
                <th className="px-2 py-4 w-[8%] text-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('stokTotal')}>
                  <div className="flex items-center justify-center gap-1">Layak <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" /></div>
                </th>
                <th className="px-2 py-4 w-[8%] text-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('stokTersedia')}>
                  <div className="flex items-center justify-center gap-1">Sisa <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" /></div>
                </th>
                <th className="px-4 py-4 w-[8%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    Tidak ada komoditas ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className={`transition-colors hover:bg-slate-50/50 ${item.stokTersedia === 0 ? 'bg-red-50/40' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${item.stokTersedia === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {item.tipe === "BARANG" ? <Box className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block max-w-[200px]">{item.nama}</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.tipe} · per {item.satuan}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        {(item as any).merk && <p className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{(item as any).merk}</p>}
                        {(item as any).spesifikasi && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{(item as any).spesifikasi}</p>}
                        {!(item as any).merk && !(item as any).spesifikasi && <span className="text-xs text-slate-300 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        {(item as any).ruangPenyimpanan && <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{(item as any).ruangPenyimpanan}</p>}
                        {(item as any).lokasi && <p className="text-[11px] text-slate-400">{(item as any).lokasi}</p>}
                        {!(item as any).ruangPenyimpanan && !(item as any).lokasi && <span className="text-xs text-slate-300 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{item.stokAwal}</td>
                    <td className="px-6 py-4 text-center text-red-600 font-semibold bg-red-50/30">
                      {item.totalRusak} / {item.totalHilang}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{item.stokTotal}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-lg font-black ${
                        item.stokTersedia === 0 
                          ? 'bg-red-100 text-red-700' 
                          : item.stokTersedia <= 2 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.stokTersedia}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(item.id, item.nama)} disabled={isLoading} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Tampilkan</span>
            <div className="w-20">
              <CustomDropdown 
                value={itemsPerPage.toString()} 
                onChange={(v) => setItemsPerPage(Number(v))} 
                options={[{value: "10", label: "10"}, {value: "20", label: "20"}, {value: "50", label: "50"}, {value: "100", label: "100"}]} 
              />
            </div>
            <span>dari {processedData.length} data</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 rounded-lg border-slate-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 min-w-[3rem] text-center shadow-sm">
              {currentPage} / {totalPages}
            </div>
            <Button 
              variant="outline" size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 rounded-lg border-slate-200"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Komoditas" : "Tambah Komoditas Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Komoditas</label>
                  <Input 
                    required 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    placeholder="Contoh: Mikroskop Binokuler"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipe</label>
                    <CustomDropdown 
                      value={formData.tipe}
                      onChange={(val) => setFormData({...formData, tipe: val as TipeKomoditas})}
                      options={[
                        { value: "BARANG", label: "Alat (Barang)" },
                        { value: "BAHAN", label: "Bahan Habis Pakai" }
                      ]}
                      disabled={!!editingId}
                    />
                    {editingId && <p className="text-[10px] text-slate-400 mt-1">Tipe tidak bisa diubah.</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Satuan</label>
                    <CustomDropdown 
                      value={formData.satuan} 
                      onChange={(val) => setFormData({...formData, satuan: val})}
                      options={[
                        { value: "buah", label: "buah" },
                        { value: "pcs", label: "pcs" },
                        { value: "set", label: "set" },
                        { value: "unit", label: "unit" },
                        { value: "gram", label: "gram" },
                        { value: "liter", label: "liter" }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stok Awal</label>
                    <Input 
                      type="number" min="1" required 
                      value={formData.stokAwal} 
                      onChange={(e) => setFormData({...formData, stokAwal: Number(e.target.value)})}
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  {editingId && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block text-red-600">Total Rusak</label>
                        <Input 
                          type="number" min="0" required 
                          value={formData.totalRusak} 
                          onChange={(e) => setFormData({...formData, totalRusak: Number(e.target.value)})}
                          className="h-11 rounded-xl border-red-200 bg-red-50/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block text-red-600">Total Hilang</label>
                        <Input 
                          type="number" min="0" required 
                          value={formData.totalHilang} 
                          onChange={(e) => setFormData({...formData, totalHilang: Number(e.target.value)})}
                          className="h-11 rounded-xl border-red-200 bg-red-50/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Detail Spesifikasi */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Detail Spesifikasi (Opsional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Merk / Pabrikan</label>
                    <Input 
                      value={formData.merk} 
                      onChange={(e) => setFormData({...formData, merk: e.target.value})}
                      placeholder="Contoh: Olympus"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tahun Perolehan</label>
                    <Input 
                      value={formData.tahunPerolehan} 
                      onChange={(e) => setFormData({...formData, tahunPerolehan: e.target.value})}
                      placeholder="Contoh: 2020"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Spesifikasi / Tipe / Ukuran</label>
                  <Input 
                    value={formData.spesifikasi} 
                    onChange={(e) => setFormData({...formData, spesifikasi: e.target.value})}
                    placeholder="Contoh: CX23, Binokuler"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Lokasi</label>
                    <Input 
                      value={formData.lokasi} 
                      onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                      placeholder="Contoh: Kampus 3"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Ruang Penyimpanan</label>
                    <Input 
                      value={formData.ruangPenyimpanan} 
                      onChange={(e) => setFormData({...formData, ruangPenyimpanan: e.target.value})}
                      placeholder="Contoh: Lab. Ekologi"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50">
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                  {isLoading ? "Menyimpan..." : (editingId ? "Simpan" : "Tambahkan")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Hapus Komoditas?</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <strong>"{deleteModal.nama}"</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeleteModal({ isOpen: false, id: "", nama: "" })} 
                className="flex-1 h-11 rounded-xl border-slate-200 hover:bg-slate-50"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button 
                type="button" 
                onClick={confirmDelete} 
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                disabled={isLoading}
              >
                {isLoading ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
