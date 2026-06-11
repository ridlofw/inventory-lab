"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  History,
  LogOut,
} from "lucide-react";

import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", href: "/mahasiswa/dashboard", icon: LayoutDashboard },
  { title: "Katalog Alat", href: "/mahasiswa/katalog", icon: PackageSearch },
  { title: "Riwayat Peminjaman", href: "/mahasiswa/riwayat", icon: History },
];

export function MahasiswaSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="h-16 flex flex-row items-center border-b border-slate-100 p-0 group-data-[collapsible=icon]:justify-center">
        <Link href="/mahasiswa/dashboard" className="flex items-center gap-3 w-full px-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://febi.walisongo.ac.id/wp-content/uploads/2020/09/Logo-UIN-Walisongo-Warna-PNG-742x1024.png"
            alt="Logo UIN Walisongo"
            className="h-8 w-auto shrink-0 object-contain transition-all duration-300"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden whitespace-nowrap">
            <span className="text-sm font-bold text-slate-800 tracking-tight">SIPLAB</span>
            <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">UIN Walisongo</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3 gap-1 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <div className="px-3 pb-2 pt-4 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menu Utama</p>
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
                "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                isActive 
                  ? "bg-emerald-50 text-emerald-700 shadow-[inset_4px_0_0_0] shadow-emerald-500 group-data-[collapsible=icon]:shadow-[inset_2px_0_0_0]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap z-10">{item.title}</span>
            </Link>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-3">
        <form action="/api/auth/logout" method="POST" className="w-full">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-700 group/logout group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <div className="p-1 rounded-md bg-slate-100 group-hover/logout:bg-red-100 transition-colors group-data-[collapsible=icon]:bg-transparent">
              <LogOut className="h-5 w-5 shrink-0" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">Keluar Aplikasi</span>
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
