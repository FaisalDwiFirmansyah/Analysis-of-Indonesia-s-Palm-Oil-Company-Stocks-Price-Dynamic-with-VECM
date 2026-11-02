# Palm Oil Stock Analytics — Platform Ekonometrika VAR / VECM

Aplikasi web modern berbasis **Next.js (App Router)** dan **R Plumber REST API** untuk analisis interdependensi dan peramalan harga saham industri kelapa sawit di Indonesia:
- **SMAR** (PT Sinar Mas Agro Resources and Technology Tbk)
- **AALI** (PT Astra Agro Lestari Tbk)
- **SIMP** (PT Salim Ivomas Pratama Tbk)

Sistem ini mengimplementasikan metode ekonometrika deret waktu multivariat murni (**Vector Autoregression / VAR** dan **Vector Error Correction Model / VECM**) dengan proses perhitungan statistik nyata tanpa data dummy atau algoritma Machine Learning di luar lingkup penelitian.

---

## 1. Arsitektur Proyek

```text
PORTOFOLIO/
├── backend/                        # Backend Mesin Ekonometrika (R Plumber)
│   ├── analysis/
│   │   ├── eda.R                   # Statistik deskriptif & Uji Bartlett
│   │   ├── stationarity.R          # Uji ADF Level & First Difference
│   │   ├── cointegration.R         # Lag optimal (AIC/SC/HQ/FPE) & Johansen Trace
│   │   ├── model_decision.R        # Logika pohon keputusan otomatis VAR/VECM
│   │   ├── model_estimation.R      # Estimasi parameter VECM/VAR & ECT
│   │   ├── diagnostics.R           # Jarque-Bera, Ljung-Box, ARCH-LM, VIF, Roots
│   │   ├── relationships.R         # Granger Causality, IRF (12p), FEVD (12p)
│   │   └── forecasting.R           # Prediksi horizon dinamis, 95% CI & MAPE
│   ├── data/
│   │   ├── Sawit_Clean.csv         # Dataset bersih (144 observasi bulanan)
│   │   ├── Sawit_Clean.json        # Format JSON dataset
│   │   └── default_analysis.json   # Hasil analisis terverifikasi
│   ├── pipeline.R                  # Orkestrasi seluruh alur pengujian
│   ├── plumber.R                   # Endpoint REST API Plumber
│   └── run_server.R                # Skrip peluncuran API server (port 8000)
│
├── frontend/                       # Frontend Dashboard (Next.js 16 + Tailwind CSS)
│   ├── app/
│   │   ├── dashboard/              # Ringkasan eksekutif, KPI cards & plot saham
│   │   ├── data-management/        # Upload CSV/XLSX, validasi integritas data
│   │   ├── eda/                    # Statistik deskriptif & korelasi
│   │   ├── statistical-testing/    # Tab uji Bartlett, ADF, Lag, & Johansen
│   │   ├── model-selection/        # Diagram alur pohon keputusan (flowchart)
│   │   ├── model-estimation/       # Koefisien VECM, ECT & persamaan matematis
│   │   ├── diagnostics/            # Uji asumsi klasik & stabilitas akar AR
│   │   ├── relationship-analysis/  # Granger Causality, IRF & FEVD
│   │   ├── forecasting/            # Peramalan interaktif (3, 6, 10, 12 bulan)
│   │   └── reporting/              # Laporan evaluasi komprehensif & ekspor
│   ├── components/                 # Komponen UI Reusable, Charts, & Modals
│   ├── context/                    # State management (AnalyticsContext)
│   ├── services/                   # HTTP client terhubung ke R Plumber API
│   └── types/                      # Type definitions TypeScript
│
├── R/app/                          # Distribusi Portable R v4.6.2 & Packages
├── Sawit 2024.xlsx                 # Dataset mentah Excel dari penelitian
├── SINTAKS VAR VECM KITA.R         # Sintaks R acuan awal
└── Kelompok 11_ARWM_JTAM.docx      # Naskah akademik rujukan
```

---

## 2. Persyaratan Sistem & Instalasi

### Prasyarat
1. **Node.js**: Versi 18+ (Telah terpasang versi 24 di environment ini).
2. **R**: Versi 4.3+ (Engine portable R 4.6.2 tersedia langsung di folder `R/app/bin/Rscript.exe`).
3. **Package R yang Dibutuhkan**:
   - `readxl`, `vars`, `urca`, `tseries`, `forecast`, `car`, `FinTS`, `plumber`, `jsonlite`.

Seluruh package R di atas telah diunduh dan dipasang secara mandiri ke pustaka lokal (`R/app/library`).

---

## 3. Cara Menjalankan Aplikasi

### A. Menjalankan Backend R (Plumber API)
Buka terminal / PowerShell baru:
```powershell
d:\PORTOFOLIO\R\app\bin\Rscript.exe d:\PORTOFOLIO\backend\run_server.R
```
Backend API akan aktif dan berjalan di:
- **API URL:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/__docs__/`
- **Health Check:** `http://localhost:8000/api/health`

### B. Menjalankan Frontend Next.js
Buka terminal / PowerShell lainnya:
```powershell
cd d:\PORTOFOLIO\frontend
npm run dev -- -p 3000
```
Buka browser dan akses:
- **Website URL:** `http://localhost:3000`

---

## 4. Perbaikan Teknis & Penyempurnaan pada Sintaks R

Selama proses analisis dan refaktorisasi modular, ditemukan beberapa kelemahan pada kode R asli yang telah diperbaiki tanpa mengubah tujuan dan metode penelitian:

| Masalah pada Sintaks Asli | Analisis Masalah | Perbaikan yang Dilakukan |
| :--- | :--- | :--- |
| **Urutan Uji Kointegrasi Johansen (`ca.jo`)** | Menggunakan `sum(test_stat > crit_val)` secara naif. Pada `ca.jo`, indeks baris disusun dari $r \le 2$, $r \le 1$, ke $r = 0$. Pengujian kointegrasi menurut kaidah ekonometrika harus dilakukan secara berurutan (sekuensial). | Diimplementasikan pengujian sekuensial baku: pertama uji $H_0: r=0$ (tolak karena $43.99 > 34.91$), lalu uji $H_0: r \le 1$ (gagal tolak karena $17.86 < 19.96$), sehingga $r = 1$ terbukti secara tepat. |
| **Naming Colnames pada VIF Lag** | Penggabungan berulang `cbind(tsdata, lagged)` menghasilkan nama kolom duplikat dengan prefix `lagged_data.lagged_data...`, menyebabkan fungsi `lm(SMAR ~ ...)` error `object not found`. | Diberikan penamaan eksplisit standar untuk seluruh matriks regresi: `c(SMAR, AALI, SIMP, SMAR.l1, AALI.l1, ...)` sehingga VIF dan Condition Number terhitung sempurna. |
| **Evaluasi Out-of-Sample vs Residual In-Sample** | Sintaks asli menghitung MAPE hanya menggunakan residual regresi data latih, bukan galat peramalan di luar sampel (out-of-sample test data 2024). | Memisahkan dataset secara tepat: 132 data latih (2013-2023) dan 12 data uji (2024). Perhitungan APE dan MAPE membandingkan hasil proyeksi `predict.vec2var` terhadap data aktual 2024, menghasilkan overall MAPE aktual sebesar **7.775%**. |
| **Fungsi Kausalitas Granger pada VECM** | Fungsi `vars::causality()` menuntut objek berkelas `varest`. Objek hasil `cajorls` berkelas `mlm`, sedangkan `vec2var` berkelas `vec2var`. | Menghubungkan representasi VAR dasar dengan ordo lag optimal (5) untuk pengujian kausalitas Granger simultan dan tabel uji berpasangan (pairwise F-test). |

---

## 5. Ringkasan Hasil Temuan Ekonometrika

1. **Uji Sferisitas Bartlett:**
   - Chi-square = **260.7326**, $df = 3$, $p = 0.0000$ ($p < 0.05$). Variabel saling berkorelasi erat dan layak dianalisis secara multivariat.
2. **Kestasioneran (ADF Test):**
   - **Level:** SMAR ($p=0.3559$), AALI ($p=0.1480$), SIMP ($p=0.2858$) $\to$ **TIDAK STASIONER**.
   - **First Difference:** SMAR ($p < 0.01$), AALI ($p < 0.01$), SIMP ($p < 0.01$) $\to$ **SEMUA STASIONER I(1)**.
3. **Lag Optimal:**
   - Kriteria AIC memilih **Lag 5** pada model VAR (setara dengan VECM 4 lag diferensiasi).
4. **Kointegrasi Johansen:**
   - Nilai Trace Statistic untuk $r = 0$ adalah **43.99** melampaui nilai kritis $5\%$ (**34.91**), membuktikan terdapat **$r = 1$ hubungan keseimbangan jangka panjang**.
5. **Model Terpilih Otomatis:**
   - Karena data I(1) dan memiliki kointegrasi, sistem secara otomatis memilih **Vector Error Correction Model (VECM)**.
6. **Error Correction Term (ECT):**
   - Koefisien ECT SMAR signifikan bernilai **-0.2863** ($p = 2.21 \times 10^{-6}$), menunjukkan kecepatan penyesuaian menuju ekuilibrium sebesar **28.63% per bulan**. ECT untuk AALI dan SIMP tidak signifikan, menunjukkan kedua emiten bergerak mandiri dalam jangka panjang.
7. **Kausalitas & Dominasi Pasar:**
   - SIMP berperan sebagai *price leader* yang memengaruhi SMAR ($F=9.47, p=0.0000$) dan AALI ($F=2.75, p=0.0217$).
   - AALI memiliki independensi tertinggi ($97.12\%$ varians dijelaskan oleh guncangan dirinya sendiri pada periode ke-12).
8. **Akurasi Peramalan (Tahun 2024):**
   - SMAR MAPE = **7.242%** (Sangat Akurat)
   - AALI MAPE = **10.189%** (Kategori Baik)
   - SIMP MAPE = **5.894%** (Sangat Akurat)
   - **Overall MAPE = 7.775%** (Kategori Sangat Akurat berdasarkan kriteria Lewis 1982).

---

## 6. Panduan Penggunaan Halaman Web

- **Dashboard (`/dashboard`)**: Ringkasan performa model, kartu metrik utama (KPI), grafik interaktif deret harga saham, dan ikhtisar evaluasi peramalan.
- **Data Management (`/data-management`)**: Fitur upload file CSV/Excel dengan validasi nama kolom, tipe numerik, missing values, duplikasi, pembagian data latih/uji, dan tombol eksekusi analisis.
- **Exploratory Data Analysis (`/eda`)**: Statistik deskriptif lengkap, plot area individual tiap saham, matriks korelasi Pearson, dan uji Bartlett.
- **Statistical Testing (`/statistical-testing`)**: Pemeriksaan detail hasil pengujian hipotesis, nilai statistik t, p-value, dan critical value untuk ADF Level, ADF First Difference, Optimal Lag, dan Johansen Cointegration.
- **Model Selection (`/model-selection`)**: Visualisasi pohon keputusan (decision flowchart) yang menunjukkan logika pemilihan model secara transparan.
- **Model Estimation (`/model-estimation`)**: Persamaan matematis VECM yang terbentuk, tabel koefisien penyesuaian ECT, dan koefisien dinamika jangka pendek.
- **Model Diagnostics (`/diagnostics`)**: Uji asumsi klasik residual (Jarque-Bera normalitas, Ljung-Box autokorelasi, ARCH-LM heteroskedastisitas, VIF & Condition Number multikolinearitas, dan kestabilan akar modulus VAR $< 1$).
- **Relationship Analysis (`/relationship-analysis`)**: Tabel kausalitas Granger, kurva Impulse Response Function (IRF) 12 periode dengan selang kepercayaan bootstrap 95%, dan grafik dekomposisi varians (FEVD).
- **Forecasting (`/forecasting`)**: Simulasi peramalan interaktif dengan opsi horizon 3, 6, 10, atau 12 bulan ke depan, batas atas dan batas bawah 95% CI, serta tabel perbandingan nilai aktual vs prediksi.
- **Reporting (`/reporting`)**: Laporan komprehensif siap unduh ke format dokumen PDF dan file Excel multi-sheet.

---

## 7. Penanganan Masalah Umum (Troubleshooting)

1. **Port 8000 atau Port 3000 sedang terpakai:**
   - Cek proses yang menduduki port:
     ```powershell
     netstat -ano | findstr :8000
     netstat -ano | findstr :3000
     ```
   - Hentikan proses melalui Task Manager atau `taskkill /PID <PID> /F`.
2. **Koneksi Frontend ke Backend Ditandai "Local Engine":**
   - Pastikan skrip `backend/run_server.R` sedang berjalan di terminal.
   - Periksa respon `http://localhost:8000/api/health` di browser.
   - Frontend memiliki fitur *graceful fallback* yang tetap dapat menampilkan seluruh hasil analisis aktual dari dataset terverifikasi meskipun backend sedang proses booting ulang.
3. **Pesan Kesalahan Format Kolom saat Upload:**
   - Pastikan file CSV atau Excel memiliki 3 kolom harga saham dengan header: `SMAR`, `AALI`, dan `SIMP`.
   - Kolom tanggal dapat berupa kolom `Date`, `Tanggal`, atau `Periode`.
