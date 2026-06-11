import { PrismaClient, TipeKomoditas } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "node:path";

// Load env vars
config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============== USERS ==============
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lab-walisongo.ac.id";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Lab2026!";
  const mahasiswaEmail = process.env.MAHASISWA_EMAIL || "mahasiswa@student.walisongo.ac.id";
  const mahasiswaPassword = process.env.MAHASISWA_PASSWORD || "Mhs@Lab2026!";

  const hashedAdminPw = await bcrypt.hash(adminPassword, 12);
  const hashedMahasiswaPw = await bcrypt.hash(mahasiswaPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedAdminPw,
      nama: "Admin Laboratorium",
      role: "ADMIN",
    },
  });

  const mahasiswa = await prisma.user.upsert({
    where: { email: mahasiswaEmail },
    update: {},
    create: {
      email: mahasiswaEmail,
      password: hashedMahasiswaPw,
      nama: "Ahmad Fauzi",
      nim: "2101010001",
      role: "MAHASISWA",
    },
  });

  console.log("✅ Users seeded:");
  console.log(`   Admin     → ${admin.email}`);
  console.log(`   Mahasiswa → ${mahasiswa.email}\n`);

  // ============== KOMODITAS ==============
  const komoditasData = [
    // BARANG (Aset — satuan pcs)
    {
      nama: "Gelas Beaker 250ml",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 30,
      stokTotal: 30,
      stokTersedia: 30,
    },
    {
      nama: "Tabung Reaksi",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 50,
      stokTotal: 50,
      stokTersedia: 50,
    },
    {
      nama: "Mikroskop Binokuler",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 10,
      stokTotal: 10,
      stokTersedia: 10,
    },
    {
      nama: "Pipet Tetes",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 40,
      stokTotal: 40,
      stokTersedia: 40,
    },
    {
      nama: "Bunsen Burner",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 15,
      stokTotal: 15,
      stokTersedia: 15,
    },
    {
      nama: "Neraca Analitik",
      tipe: TipeKomoditas.BARANG,
      satuan: "pcs",
      stokAwal: 5,
      stokTotal: 5,
      stokTersedia: 5,
    },
    // BAHAN (Consumable — satuan liter/gram)
    {
      nama: "Aquades",
      tipe: TipeKomoditas.BAHAN,
      satuan: "liter",
      stokAwal: 20,
      stokTotal: 20,
      stokTersedia: 20,
    },
    {
      nama: "HCl (Asam Klorida)",
      tipe: TipeKomoditas.BAHAN,
      satuan: "liter",
      stokAwal: 5,
      stokTotal: 5,
      stokTersedia: 5,
    },
    {
      nama: "NaOH (Natrium Hidroksida)",
      tipe: TipeKomoditas.BAHAN,
      satuan: "gram",
      stokAwal: 500,
      stokTotal: 500,
      stokTersedia: 500,
    },
    {
      nama: "Indikator Fenolftalein",
      tipe: TipeKomoditas.BAHAN,
      satuan: "liter",
      stokAwal: 2,
      stokTotal: 2,
      stokTersedia: 2,
    },
  ];

  const existingCount = await prisma.komoditas.count();
  if (existingCount === 0) {
    await prisma.komoditas.createMany({
      data: komoditasData,
    });
  }

  const totalKomoditas = await prisma.komoditas.count();
  console.log(`✅ Komoditas seeded: ${totalKomoditas} items\n`);

  console.log("🎉 Seeding complete!");
  console.log("\n📋 Login Credentials:");
  console.log(`   Admin     → ${adminEmail} / ${adminPassword}`);
  console.log(`   Mahasiswa → ${mahasiswaEmail} / ${mahasiswaPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
