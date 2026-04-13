# Inventaris Manajemen Perangkat Jaringan

Aplikasi manajemen inventaris perangkat jaringan berbasis:
- **Frontend**: React + Vite + Tailwind + Material UI
- **Backend**: Express + PostgreSQL

## 1) Prasyarat

Pastikan sudah terpasang:
- **Node.js** 18+ (disarankan 20+)
- **npm** 9+
- **PostgreSQL** (lokal atau cloud, misalnya Neon)
- (Opsional) **psql** CLI untuk menjalankan file SQL

## 2) Struktur Project

```text
inventaris-manajemen-perangkat-jaringan/
├─ frontend/   # React app
└─ backend/    # Express API + PostgreSQL
```

## 3) Setup Backend

### a. Masuk folder backend dan install dependency

```bash
cd backend
npm install
```

### b. Buat file environment

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi nilai `.env`:

```env
DATABASE_URL=postgres://user:password@hostname:port/dbname?sslmode=require
PORT=3000
NODE_ENV=development
```

> Gunakan connection string PostgreSQL Anda sendiri.

### c. Inisialisasi database

Jika Anda punya file SQL inisialisasi/migrasi, jalankan menggunakan `psql`:

```bash
psql -U <db_user> -d <db_name> -f "<path_ke_file_sql>"
```

Contoh migrasi yang sudah dibuat:

```bash
psql -U postgres -d inventaris_db -f "src/config/migrations/rename_region_to_area.sql"
```

### d. Jalankan backend

```bash
npm run dev
```

Backend akan berjalan di:
- `http://localhost:3000`

## 4) Setup Frontend

### a. Masuk folder frontend dan install dependency

```bash
cd ../frontend
npm install
```

### b. Jalankan frontend

```bash
npm run dev
```

Frontend akan berjalan di:
- `http://localhost:5173`

## 5) Menjalankan Aplikasi (Ringkas)

Jalankan **2 terminal**:

- Terminal 1:
  ```bash
  cd backend
  npm run dev
  ```
- Terminal 2:
  ```bash
  cd frontend
  npm run dev
  ```

Lalu buka `http://localhost:5173`.

## 6) Login Demo

Gunakan akun yang tersedia di database Anda (hasil seed/init).  
Jika menggunakan data contoh standar proyek, biasanya:

- `admin@example.com` / `admin123`
- `officer@example.com` / `officer123`
- `user@example.com` / `user123`

> Jika login gagal, cek isi tabel `users` pada database aktif Anda.

## 7) Fitur Utama

- Login dan role-based access (`admin`, `officer`, `user`)
- Dashboard overview
- Dashboard inventaris perangkat
- Filter inventaris (divisi, area, sto, status, search)
- Manajemen pengguna
- Mapping divisi/area/STO

## 8) Troubleshooting

### Backend error koneksi DB
- Pastikan `DATABASE_URL` benar.
- Pastikan database dapat diakses dari mesin Anda.
- Cek log backend saat startup.

### Perubahan backend tidak terbaca
- Restart backend (`Ctrl + C`, lalu `npm run dev`) setelah ubah file server/controller.

### Dropdown/opsi tidak muncul
- Pastikan endpoint backend aktif (`/api/inventory/options`).
- Pastikan data referensi di tabel database tidak kosong.

### Port bentrok
- Ubah `PORT` backend di `.env`.
- Jalankan ulang frontend/backend.

## 9) Keamanan Repo (Sebelum Push GitHub)

File sensitif dan dependency besar sudah di-ignore via `.gitignore`:
- `.env`, `.env.*`
- `node_modules/`
- build artifacts (`dist`, `build`, dll)
- logs/cache

Tetap cek sebelum push:

```bash
git status
```

Pastikan tidak ada secret yang ikut ter-stage.