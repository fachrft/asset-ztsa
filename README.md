# SeismicDesk

Dashboard gempa global berbasis Next.js App Router untuk lab Trend Vision One Zero Trust Secure Access (ZTSA) Private Access. Feed GeoJSON publik USGS menyediakan kejadian gempa M2.5+ tanpa API key. Server Next.js mengambil feed, lalu browser meminta data ke server aplikasi. Peta dasar dibundel dari Natural Earth, sehingga browser tidak perlu menghubungi penyedia peta.

## Preview lokal

Perlu Node.js 20.9 atau lebih baru. Jalankan dari direktori proyek.

```powershell
npm install
npm run dev -- --hostname 127.0.0.1
```

Buka [dashboard](http://localhost:3000) atau [Access Lab](http://localhost:3000/lab). Dashboard punya peta episentrum, detail gempa, periode 24 jam atau 7 hari, pencarian lokasi, filter magnitudo, dan ekspor CSV. File CSV mencakup seluruh periode yang dipilih.

## Jalankan di host lab privat

1. Di VM atau host lab yang bisa dijangkau dari Private Access Connector, ambil kode dari GitHub. Host aplikasi perlu akses DNS dan HTTPS keluar ke `earthquake.usgs.gov`.

   ```bash
   git clone https://github.com/fachrft/asset-ztsa.git
   cd asset-ztsa
   ```

2. Jika host memakai Docker, build dan jalankan container. Ganti `10.10.20.15` dengan IP privat host. Buka port 3000 hanya untuk jaringan atau host connector yang diperlukan.

   ```bash
   docker build -t seismic-desk .
   docker run -d --name seismic-desk --restart unless-stopped -p 10.10.20.15:3000:3000 seismic-desk
   ```

   Jika host memakai Node.js langsung, jalankan `npm install`, `npm run build`, lalu `npm run start -- --hostname 10.10.20.15 --port 3000` dengan IP privat host.

3. Siapkan nama DNS internal yang dapat di-resolve dari connector, misalnya `seismic.lab.example.com`. Verifikasi bahwa connector dapat menjangkau origin, misalnya `http://seismic.lab.example.com:3000/api/health`.
4. Di Vision One, daftarkan origin aplikasi sebagai **Internal Application**, pilih connector group, lalu konfigurasikan **Client Access** lewat Secure Access Module atau **Browser Access** lewat User Portal. Pakai origin aplikasi pada root URL agar halaman, aset Next.js, dan API berada di jalur akses yang sama. Untuk Browser Access, ikuti pengaturan domain dan sertifikat sesuai tenant.
5. Buat aturan Private Access untuk identitas lab yang diizinkan. Jalankan pengujian berikut menggunakan URL akses ZTSA. Verifikasi keputusan di log Vision One. Aplikasi mengandalkan ZTSA untuk autentikasi dan aturan akses.

## Skenario pengujian

| Skenario | Langkah | Hasil yang dicari |
| --- | --- | --- |
| Allow | Buka dashboard sebagai akun yang diizinkan, ubah periode, lalu pilih satu kejadian. | Halaman, aset, dan data tampil. |
| Deny | Ulangi dari sesi terpisah memakai akun yang aturan aksesnya menolak aplikasi. | Aplikasi tidak tersedia untuk akun itu dan keputusan dapat diperiksa di log. |
| Device posture | Jika aturan posture sudah tersedia pada Client Access, ulangi dengan perangkat yang memenuhi dan yang tidak memenuhi syarat. | Hasil mengikuti aturan yang dikonfigurasi di tenant. |
| GET dan POST | Buka **Access Lab** lalu pilih **Run checks**. | App health, USGS feed, dan JSON round trip menampilkan status HTTP dan waktu respons. |
| Download | Dari **Access Lab**, unduh CSV melalui URL akses ZTSA. | Browser menerima file `usgs-earthquakes-day.csv`. |
| Pisahkan gangguan origin dan upstream | Bandingkan **App health** dengan **USGS feed**. | Jika health lolos dan feed gagal, cek DNS, HTTPS keluar, dan respons USGS dari host aplikasi. |

### Endpoint

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Cek bahwa server aplikasi merespons, independen dari USGS. |
| GET | `/api/earthquakes?period=day` | Data gempa M2.5+ dalam JSON. Gunakan `period=week` untuk 7 hari. |
| GET | `/api/earthquakes?period=day&format=csv` | Unduh feed untuk periode yang dipilih. |
| POST | `/api/probe` | Mengembalikan nonce uji dari JSON kecil. Format payload `{"nonce":"lab-test-1"}`. |

Sumber data [U.S. Geological Survey](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) dan peta [Natural Earth melalui World Atlas](https://github.com/topojson/world-atlas). Panduan konfigurasi [Internal Applications](https://docs.trendmicro.com/fr-fr/documentation/article/trend-vision-one-internal-application-configuration) dan [Client Access vs Browser Access](https://docs.trendmicro.com/fr-fr/documentation/article/trend-vision-one-pa-client-browser-access).
