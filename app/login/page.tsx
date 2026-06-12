"use client";

import { useState, useActionState } from "react";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/login/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  error: "",
  success: false,
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Kiri: Ilustrasi & Branding (Disembunyikan di Mobile) */}
      <div className="hidden lg:flex flex-col justify-between relative p-12 bg-emerald-900 text-white overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-600/30 blur-3xl opacity-50 mix-blend-multiply animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-3xl opacity-40 mix-blend-multiply translate-x-1/4 -translate-y-1/2" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-800/50 blur-3xl opacity-60 mix-blend-multiply" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight">SIPLAB Walisongo</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Manajemen Inventaris <br />
            <span className="text-emerald-400">Lebih Cerdas & Akurat</span>
          </h1>
          <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed">
            Sistem Informasi Pengelolaan Laboratorium Terpadu. Pantau aset, kelola peminjaman, dan audit stok dalam satu platform cerdas.
          </p>
        </div>

        <div className="relative z-10 text-sm text-emerald-200/60 font-medium">
          &copy; {new Date().getFullYear()} UIN Walisongo Semarang
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Glow effect di mobile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md rounded-full bg-emerald-500/10 blur-3xl opacity-50 lg:hidden pointer-events-none" />

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://febi.walisongo.ac.id/wp-content/uploads/2020/09/Logo-UIN-Walisongo-Warna-PNG-742x1024.png"
                alt="Logo UIN Walisongo"
                className="h-20 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Silakan masuk menggunakan kredensial Anda untuk melanjutkan.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@student.walisongo.ac.id"
                  required
                  autoComplete="email"
                  className="h-12 bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Kata Sandi</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-12 bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="animate-in fade-in zoom-in-95 duration-300 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                disabled={pending}
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Memproses Autentikasi...
                  </span>
                ) : (
                  <>
                    <LogIn className="size-5" />
                    <span className="text-base font-semibold">Masuk ke Sistem</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen icon untuk alert error
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
