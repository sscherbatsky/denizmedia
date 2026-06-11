export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Etkinlikler</h1>
      <p className="text-gray-600 mb-4">Etkinlikleri burada oluşturup yönetebilirsin. Bu bir placeholder sayfadır.</p>
      <div className="space-y-3">
        <div className="p-4 bg-white border border-gray-100 rounded-lg">Etkinlik: Canlı Yayın — 20 Haziran</div>
        <div className="p-4 bg-white border border-gray-100 rounded-lg">Etkinlik: Topluluk Buluşması — 25 Haziran</div>
      </div>
    </div>
  );
}
