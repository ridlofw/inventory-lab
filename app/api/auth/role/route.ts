import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ role: null }, { status: 404 });
    }

    return NextResponse.json({ role: dbUser.role });
  } catch {
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
