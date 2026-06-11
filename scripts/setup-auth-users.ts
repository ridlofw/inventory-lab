/**
 * Setup script to create Supabase Auth users
 * Run: npx tsx scripts/setup-auth-users.ts
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  {
    email: process.env.ADMIN_EMAIL || "admin@lab-walisongo.ac.id",
    password: process.env.ADMIN_PASSWORD || "Admin@Lab2026!",
    role: "ADMIN",
    nama: "Admin Laboratorium",
  },
  {
    email: process.env.MAHASISWA_EMAIL || "mahasiswa@student.walisongo.ac.id",
    password: process.env.MAHASISWA_PASSWORD || "Mhs@Lab2026!",
    role: "MAHASISWA",
    nama: "Ahmad Fauzi",
  },
];

async function main() {
  console.log("🔐 Creating Supabase Auth users...\n");

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: user.role,
        nama: user.nama,
      },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`⚠️  ${user.role}: ${user.email} already exists, skipping.`);
      } else {
        console.error(`❌ Failed to create ${user.role}: ${error.message}`);
      }
    } else {
      console.log(`✅ ${user.role}: ${user.email} created successfully (ID: ${data.user.id})`);
    }
  }

  console.log("\n🎉 Auth users setup complete!");
  console.log("\n📋 Login Credentials:");
  users.forEach((u) => {
    console.log(`   ${u.role}: ${u.email} / ${u.password}`);
  });
}

main().catch(console.error);
