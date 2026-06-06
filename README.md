# DenizMedia

Sosyal medya platformu - Paylaş, etkileş, popülerleş!

## Özellikler

- **Kayıt/Giriş Sistemi**: Email ile kayıt, Instagram tarzı kullanıcı adı kuralları
- **Profil Sistemi**: Kullanıcı adı, görünen isim, biyografi, profil fotoğrafı
- **Gönderi Paylaşımı**: Twitter benzeri gönderi sistemi (max 500 karakter)
- **Etkileşim**: Beğeni, yorum, takip sistemi
- **DM (Özel Mesajlaşma)**: Kullanıcılar arası özel sohbet
- **Admin Paneli**: Kullanıcı yönetimi, ban, mavi tik, timeout, erişim engeli

## Teknoloji

- **Framework**: Next.js 14 (App Router)
- **Veritabanı**: SQLite + Prisma ORM
- **Auth**: NextAuth.js (Credentials)
- **Styling**: Tailwind CSS
- **Dil**: TypeScript

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# Veritabanını oluştur
npx prisma migrate dev

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite veritabanı yolu |
| `NEXTAUTH_SECRET` | NextAuth şifreleme anahtarı |
| `NEXTAUTH_URL` | Uygulama URL'si |
| `ADMIN_IP` | Admin girişine izin verilen IP (`*` = tümü) |

## Admin Paneli

`/admin` adresinden admin paneline erişebilirsiniz.
- Kullanıcı adı: `admin`
- Şifre: `admin`

Admin ilk giriş yapıldığında otomatik olarak oluşturulur.
