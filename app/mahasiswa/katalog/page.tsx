import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CartForm } from "./cart-form";
import { Package, Box } from "lucide-react";

export default async function KatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || dbUser.role !== "MAHASISWA") {
    redirect("/login");
  }

  // Fetch all komoditas
  const katalog = await prisma.komoditas.findMany({
    orderBy: { nama: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-6 sm:px-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900/50 z-0" />
        <div className="relative z-10 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Katalog Peralatan & Bahan</h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Pilih dan ajukan komoditas laboratorium yang Anda perlukan. Pastikan mengisi catatan kegiatan dengan jelas.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Right Col: Cart Form (Sticky & First on Mobile) */}
        <div className="lg:col-span-4 order-first lg:order-last">
          <div className="sticky top-8 z-20">
            <CartForm katalog={katalog} />
          </div>
        </div>

        {/* Left Col: Grid of Items */}
        <div className="lg:col-span-8 space-y-6 order-last lg:order-first">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {katalog.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between h-full">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
