import { MahasiswaSidebar } from "@/components/layout/mahasiswa-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/login");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser) redirect("/login");

  const initials = dbUser.nama.substring(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <MahasiswaSidebar />
      <SidebarInset className="bg-slate-50/50">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/70 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 hover:bg-emerald-50 hover:text-emerald-700" />
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-sm font-semibold text-slate-700">Dasbor Mahasiswa</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold leading-none">{dbUser.nama}</span>
              <span className="text-xs text-slate-500 mt-1">Mahasiswa Aktif</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
              {initials}
            </div>
          </div>
        </header>
        <main className="p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
