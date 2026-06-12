import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CartForm } from "./cart-form";
import { Package, Box } from "lucide-react";

import { KatalogClient } from "./katalog-client";

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
        {/* Right Col: Cart Form (Sticky on Desktop, Bottom on Mobile) */}
        <div className="lg:col-span-4 order-last">
          <div className="sticky top-8 z-20">
            <CartForm katalog={katalog} />
          </div>
        </div>

        {/* Left Col: Grid of Items (Client Component for Pagination/Search) */}
        <div className="lg:col-span-8 space-y-6 order-first">
          <KatalogClient katalog={katalog} />
        </div>
      </div>
    </div>
  );
}
