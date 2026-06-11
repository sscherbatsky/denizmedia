export default function ShortsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Shorts — Kısa Videolar</h1>
      <p className="text-gray-600 mb-4">Burada kullanıcıların kısa videolarını keşfedebilir ve paylaşabilirsin. Bu bir placeholder sayfadır.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">Örnek kısa video 1</div>
        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">Örnek kısa video 2</div>
      </div>
    </div>
  );
}
