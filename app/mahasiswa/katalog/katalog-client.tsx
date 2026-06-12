"use client";

import { useState } from "react";
import { Package, Box, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function KatalogClient({ katalog }: { katalog: any[] }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 1. Filter
  const filteredData = katalog.filter((item) => {
    const term = search.toLowerCase();
    const matchNama = item.nama.toLowerCase().includes(term);
    const matchMerk = (item.merk || "").toLowerCase().includes(term);
    const matchSpesifikasi = (item.spesifikasi || "").toLowerCase().includes(term);
    return matchNama || matchMerk || matchSpesifikasi;
  });

  // 2. Paginate
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Cari nama alat, merk, atau spesifikasi..." 
          value={search}
          onChange={handleSearchChange}
          className="pl-12 h-14 rounded-2xl bg-white border-slate-200 text-base shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedData.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200 border-dashed">
            Tidak ada alat atau bahan yang sesuai dengan pencarian.
          </div>
        ) : (
          paginatedData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
              {/* Visual strip indicator based on stock */}
              <div className={`absolute top-0 left-0 w-full h-1 ${item.stokTersedia === 0 ? "bg-red-500" : item.stokTersedia <= 2 ? "bg-amber-500" : "bg-emerald-500"}`} />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {item.tipe === "BARANG" ? <Box className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                    {item.tipe}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2">{item.nama}</h3>
                {(item.merk || item.spesifikasi) && (
                  <div className="mt-1.5 space-y-0.5">
                    {item.merk && <p className="text-xs font-semibold text-slate-500">{item.merk}</p>}
                    {item.spesifikasi && <p className="text-[11px] text-slate-400 line-clamp-2">{item.spesifikasi}</p>}
                  </div>
                )}
                {(item.ruangPenyimpanan) && (
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    📍 {item.ruangPenyimpanan}{item.lokasi ? ` \u00b7 ${item.lokasi}` : ''}
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Stok Tersedia</p>
                  <p className={`text-2xl font-black ${item.stokTersedia === 0 ? "text-red-600" : item.stokTersedia <= 2 ? "text-amber-600" : "text-emerald-600"}`}>
                    {item.stokTersedia} <span className="text-sm font-semibold text-slate-500">{item.satuan}</span>
                  </p>
                </div>
                {item.stokTersedia === 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg animate-pulse">Habis</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
          <Button 
            variant="outline" size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-10 px-4 rounded-xl border-slate-200 font-semibold w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
          </Button>
          
          <div className="text-sm font-bold text-slate-600 order-first sm:order-none mb-2 sm:mb-0">
            Halaman {currentPage} dari {totalPages}
          </div>
          
          <Button 
            variant="outline" size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-10 px-4 rounded-xl border-slate-200 font-semibold w-full sm:w-auto"
          >
            Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
