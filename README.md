# Inventaris Manajemen Perangkat Jaringan

Sistem terpadu untuk mengelola inventaris perangkat jaringan, mencakup manajemen perangkat, pelaporan Preventive Maintenance (PMR), serta administrasi pengguna.

## 🛠️ Stack Teknologi

- **Frontend**: React, Vite, Tailwind CSS, Material UI (MUI)
- **Backend**: Express.js, PostgreSQL

## 📦 Daftar Dependensi Utama

Berikut adalah daftar library pihak ketiga yang digunakan dalam proyek:

### Frontend
- **Komunikasi Data**: `axios`
- **UI/Visualisasi**: `recharts` (Chart), `leaflet` & `react-leaflet` (Peta)
- **Utility**: `xlsx` (Excel), `@yudiel/react-qr-scanner` & `qrcode.react` (QR/Barcode)
- **Routing**: `react-router-dom`
- **Icons**: `@mui/icons-material`

### Backend
- **Framework API**: `express`, `compression`, `helmet` (Security), `cors`
- **Database**: `pg` (PostgreSQL client)
- **Utility**: `axios` (Telegram API), `dotenv` (Environment variables), `multer` (File upload), `nodemailer` (Email)


---

## 🏗️ Arsitektur Sistem

Sistem ini dirancang dengan arsitektur **Client-Server** untuk pemisahan logika yang rapi:

1.  **Backend (Express API)**: Menggunakan pola *Controller-Route* untuk memisahkan *endpoint* API dari logika bisnis.
    - **Config Layer**: Menangani koneksi database (`pg`), *caching* (in-memory `Map` dengan TTL), *file upload* (`multer`), dan pengiriman email (`nodemailer`).
2.  **Frontend (React SPA)**: Menggunakan arsitektur berbasis *service* untuk komunikasi data.
    - **Service Layer**: Mengabstraksi panggilan API untuk menjaga komponen tetap bersih.
    - **State Management**: Mengelola alur kerja pengguna (seperti otentikasi) dan sinkronisasi data *real-time*.
3.  **Alur Data**:
    - **PMR Reporting**: Mendukung verifikasi geolokasi (*geofencing*), *multi-file upload* untuk foto kegiatan/nota, dan sinkronisasi zona waktu (WIB/Asia-Jakarta).
    - **Export**: Pemrosesan data laporan yang diformat secara dinamis untuk PDF dan Excel.

---

## 🚀 Fitur Utama

- **Manajemen Inventaris**: Dashboard perangkat, filter data (Area, STO, Status), dan pencarian cepat.
- **Laporan Preventive Maintenance (PMR)**:
  - Form input PMR dengan verifikasi lokasi (Geofencing) dan scan QR code.
  - **Dokumentasi**: Unggah foto kegiatan maintenance dan nota BBM.
  - **Laporan PDF**: Cetak laporan teknis lengkap beserta dokumentasi visual.
  - **Ekspor Excel**: Ekspor data laporan dengan format Tanggal & Waktu yang sinkron (WIB).
- **Notifikasi Telegram**: Bot otomatis yang mengirim pemberitahuan ke Group Telegram jika ada perangkat jaringan yang terdeteksi DOWN (offline).
- **Manajemen Pengguna**: Autentikasi berbasis peran (`admin`, `super officer`, `officer`, `user`).
- **Sinkronisasi Waktu**: Sistem terstandarisasi ke zona waktu `Asia/Jakarta` (WIB) untuk seluruh timestamp.

---

## ⚙️ Persyaratan Sistem

Untuk menjalankan dan mengembangkan aplikasi ini, pastikan perangkat Anda memiliki:

### 1. Lingkungan Pengembangan
- **Node.js**: Versi 18 LTS atau 20 LTS (disarankan menggunakan [nvm](https://github.com/nvm-sh/nvm) untuk mengelola versi Node).
- **Package Manager**: `npm` (versi 9+) atau `yarn`.
- **Git**: Untuk manajemen *version control*.
- **Code Editor**: VS Code (disarankan) dengan *extension* pendukung (ESLint, Tailwind CSS IntelliSense).

### 2. Infrastruktur Database
- **PostgreSQL**: Server database lokal atau layanan *managed database* (contoh: Neon, Supabase, atau AWS RDS).
- **Tools**: `psql` CLI atau GUI seperti pgAdmin/DBeaver untuk memantau data.

### 3. Konfigurasi Sistem
- **Zona Waktu**: Sistem harus disinkronkan ke zona waktu yang benar (WIB/Asia-Jakarta) agar timestamp pencatatan PMR akurat.
- **Environment**: Akses ke layanan SMTP (seperti Gmail App Password atau Mailgun) jika fitur *reset password* ingin diaktifkan.

---

## 📥 Panduan Instalasi & Setup

### 1. Konfigurasi Backend

1. Masuk ke folder backend:
   ```bash
   cd backend
   npm install
   ```
2. Buat file `.env` dari contoh:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan `.env` dengan kredensial database Anda.
4. Untuk fitur notifikasi, isi `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di file `.env`.
5. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

### 2. Konfigurasi Frontend

1. Masuk ke folder frontend:
   ```bash
   cd ../frontend
   npm install
   ```
2. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

---

## 🗄️ Database & Optimasi

Pastikan menjalankan skrip berikut di database Anda untuk performa optimal:

```sql
-- Index untuk pencarian cepat
CREATE EXTENSION IF NOT EXISTS pg_trgm; 
CREATE INDEX IF NOT EXISTS idx_devices_search ON inventory_devices USING gin (device_id gin_trgm_ops, name gin_trgm_ops, serial_number gin_trgm_ops);

-- Index referensi
CREATE INDEX IF NOT EXISTS idx_devices_area ON inventory_devices(area);
CREATE INDEX IF NOT EXISTS idx_devices_sto ON inventory_devices(sto);
CREATE INDEX IF NOT EXISTS idx_devices_status ON inventory_devices(status);
```

---

## 🔐 Keamanan & Deployment

- **Ignore**: File `.env`, `node_modules/`, dan `dist/` sudah masuk dalam `.gitignore`.
- **Produksi**: Pastikan `NODE_ENV=production` dan SMTP disetting dengan benar untuk fitur reset password.

---

## 🛠️ Troubleshooting

- **Database**: Pastikan `DATABASE_URL` valid dan dapat diakses.
- **Data Tidak Muncul**: Periksa endpoint `/api/inventory/options` untuk referensi dropdown.
- **Waktu Tidak Sinkron**: Pastikan server menggunakan NTP yang benar, aplikasi sudah dikonfigurasi ke zona waktu `Asia/Jakarta`.
- **Port Bentrok**: Sesuaikan `PORT` di file `.env`.
