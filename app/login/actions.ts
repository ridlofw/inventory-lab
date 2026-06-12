"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !data.user) {
    return { error: "Email atau kata sandi salah. Silakan coba lagi." };
  }

  // Cek role untuk menentukan arah redirect
  let redirectUrl = "/login";
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: data.user.email! },
      select: { role: true },
    });

    if (dbUser) {
      if (data.user.user_metadata?.role !== dbUser.role) {
        await supabase.auth.updateUser({
          data: { role: dbUser.role },
        });
      }
      redirectUrl =
        dbUser.role === "ADMIN" ? "/admin/dashboard" : "/mahasiswa/dashboard";
    } else {
      // Fallback if not found in db, maybe it's only in auth
      const role = data.user.user_metadata?.role;
      if (role === "ADMIN") redirectUrl = "/admin/dashboard";
      else if (role === "MAHASISWA") redirectUrl = "/mahasiswa/dashboard";
    }
  } catch (error) {
    console.error("Failed to query user role", error);
    // fallback
    redirectUrl = "/mahasiswa/dashboard";
  }

  // Do not put redirect inside try/catch block if possible, as redirect throws an error in Next.js
  redirect(redirectUrl);
}
