<div align="center">
  <img src="https://febi.walisongo.ac.id/wp-content/uploads/2020/09/Logo-UIN-Walisongo-Warna-PNG-742x1024.png" alt="Logo" width="100" height="138" />
  <h1>🧪 Sistem Manajemen Inventaris Laboratorium</h1>
  <h3>Universitas Islam Negeri (UIN) Walisongo Semarang</h3>
  <p>
    Aplikasi web modern untuk digitalisasi pengelolaan peminjaman alat (barang) dan permintaan bahan praktikum di lingkungan laboratorium UIN Walisongo.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </div>
</div>

---

## ✨ Fitur Utama

Aplikasi ini memisahkan hak akses menjadi dua peran utama untuk menjaga keamanan dan alur kerja laboratorium yang efisien:

### 🎓 Mahasiswa (Pengguna)

- **🛍️ Katalog Komoditas:** Melihat daftar lengkap alat (barang) dan bahan praktikum yang tersedia beserta detail stoknya.
- **🛒 Sistem Keranjang (Cart):** Mengajukan peminjaman alat atau permintaan bahan praktikum dengan mudah melalui sistem keranjang.
- **📊 Dashboard Interaktif:** Memantau ringkasan aktivitas, jumlah peminjaman aktif, dan status pengajuan terkini.
- **🕒 Riwayat Transaksi:** Melacak status detail setiap pengajuan secara real-time (Menunggu, Disetujui, Dipinjam, Ditolak, atau Selesai).

### 👨‍💻 Admin (Laboran/Asisten)

- **📈 Dashboard Analitik:** Visualisasi data statistik ketersediaan stok, tren peminjaman, dan aktivitas lab menggunakan grafik interaktif (Recharts).
- **📦 Manajemen Stok:** Mengelola data komoditas (tambah, edit, hapus), memperbarui stok awal, serta mencatat barang rusak atau hilang secara otomatis.
- **✅ Verifikasi Cepat:** Menyetujui atau menolak pengajuan peminjaman/permintaan dari mahasiswa dengan validasi ketersediaan stok real-time.
- **📚 Riwayat & Laporan:** Memantau seluruh riwayat transaksi lab, termasuk status kondisi barang saat dikembalikan.

---

## 🏗️ Arsitektur & Teknologi

Proyek ini dibangun menggunakan _stack_ teknologi modern untuk performa tinggi dan pengalaman pengguna (UX) yang premium:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library UI:** [React 19](https://react.dev/)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (Mendukung Supabase Adapter)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🗄️ Skema Database Utama

Sistem didukung oleh database relasional yang kuat untuk menjaga integritas data laboratorium:

- **User:** Menyimpan kredensial mahasiswa dan admin.
- **Komoditas:** Menyimpan data induk alat dan bahan, perhitungan otomatis `stokTotal` dan `stokTersedia`.
- **Transaksi & Detail Transaksi:** Mencatat siklus peminjaman dari mulai pengajuan, verifikasi, hingga pengembalian beserta pencatatan kondisi (Aman/Rusak/Hilang).

---

## 🚀 Panduan Instalasi & Setup Lokal

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di mesin lokal Anda.

### 1. Prasyarat

- Node.js (v18 atau lebih baru)
- npm / pnpm / yarn
- PostgreSQL (Lokal atau Cloud seperti Supabase/Neon)

### 2. Clone Repositori

```bash
git clone <url-repo-anda>
cd inventory-lab
```

### 3. Install Dependensi

```bash
npm install
# atau
yarn install
```

### 4. Konfigurasi Environment Variables

Buat file `.env` di _root_ direktori proyek dan sesuaikan dengan URL database PostgreSQL Anda:

```env
# Contoh koneksi database PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_lab?schema=public"

# Jika menggunakan Supabase atau layanan spesifik, tambahkan variabel relevan
```

### 5. Setup Database & Seed Data

Jalankan perintah berikut untuk mensinkronisasi skema Prisma ke database dan memasukkan data awal (seeding admin/dummy data):

```bash
npx prisma db push
npm run dev # (Atau jalankan script seed secara manual: npx tsx prisma/seed.ts)
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda. Aplikasi siap digunakan!

---

## 📁 Struktur Direktori

```text
inventory-lab/
├── app/               # Next.js App Router (Halaman & Rute API)
│   ├── admin/         # Modul khusus Admin (Dashboard, Stok, Verifikasi, Riwayat)
│   ├── mahasiswa/     # Modul khusus Mahasiswa (Katalog, Dashboard, Riwayat)
│   ├── login/         # Halaman Autentikasi
│   ├── api/           # Endpoint Backend API
│   └── globals.css    # Style Global & Tailwind Variables
├── components/        # Komponen React Reusable (Shadcn UI, Layouts)
├── lib/               # Utility functions (Prisma Client, utils, dll)
├── prisma/            # Skema Database & Skrip Seeding
└── public/            # Aset Statis (Gambar, Icon)
```

---

<div align="center">
  <p>Dibuat untuk mempermudah manajemen laboratorium 🚀</p>
</div>
