# DenizMedia

Sosyal medya platformu - Paylaş, etkileş, popülerleş!

## Özellikler

- **Kayıt/Giriş Sistemi**: Email doğrulama kodu ile güvenli kayıt
- **Profil Sistemi**: Dosya yükleme ile profil fotoğrafı, kullanıcı adı, biyografi
- **Gönderi Paylaşımı**: Metin + fotoğraf paylaşımı (max 500 karakter)
- **Etkileşim**: Beğeni, yorum, takip sistemi
- **DM (Özel Mesajlaşma)**: Kullanıcılar arası özel sohbet
- **Admin Paneli**: Kullanıcı yönetimi, ban, mavi tik, timeout, erişim engeli
- **IP Kayıt**: Giriş yapan kullanıcıların IP adresleri veritabanına kaydedilir
- **Modern Arayüz**: Glassmorphism tasarım, animasyonlu arka plan

## Teknoloji

- **Framework**: Next.js 14 (App Router)
- **Veritabanı**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Credentials)
- **Dosya Depolama**: Vercel Blob (production) / Lokal (development)
- **Styling**: Tailwind CSS
- **Dil**: TypeScript

## Lokal Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# DATABASE_URL'yi kendi PostgreSQL bağlantı stringinle güncelle

# Veritabanı tablolarını oluştur
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Vercel'e Deploy

1. [neon.tech](https://neon.tech) adresinden ücretsiz PostgreSQL veritabanı oluştur
2. [vercel.com](https://vercel.com) adresinden GitHub ile giriş yap
3. Bu repoyu "Import Project" ile ekle
4. Environment Variables bölümüne şunları ekle:
   - `DATABASE_URL` — Neon'dan aldığın bağlantı stringi
   - `NEXTAUTH_SECRET` — Rastgele güçlü bir şifre (ör: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — Vercel'in vereceği URL (ör: `https://denizmedia.vercel.app`)
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob Storage token'ı (Vercel Dashboard → Storage → Create → Blob)
5. Deploy butonuna bas

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı stringi |
| `NEXTAUTH_SECRET` | NextAuth şifreleme anahtarı |
| `NEXTAUTH_URL` | Uygulama URL'si |
| `ADMIN_IP` | Admin girişine izin verilen IP (`*` = tümü) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob dosya depolama token'ı (opsiyonel, sadece production) |

## Admin Paneli

`/admin` adresinden admin paneline erişebilirsiniz.
- Kullanıcı adı: `admin`
- Şifre: `admin`

Admin ilk giriş yapıldığında otomatik olarak oluşturulur.
