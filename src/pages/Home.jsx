import { useMemo, useState, useCallback } from "react"
import { useData } from "../context/DataContext.jsx"
import { getJSON } from "../utils/storage"
import MerchantCard from "../components/MerchantCard.jsx"
import MerchantListSkeleton from "../components/MerchantListSkeleton.jsx"
import RecommendationForm from "../components/RecommendationForm.jsx"
import { debounce } from "../utils/debounce.js"

export default function Home() {
  const { merchants, isLoading } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [activeCat, setActiveCat] = useState("Semua")

  const debouncedSearch = useCallback(
    debounce((value) => setDebouncedSearchQuery(value), 300),
    []
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const filteredMerchants = useMemo(() => {
    if (!debouncedSearchQuery) {
      return merchants
    }
    return merchants.filter((m) =>
      m.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [debouncedSearchQuery, merchants])

  const categories = useMemo(
    () => Array.from(new Set(filteredMerchants.map((m) => m.category))),
    [filteredMerchants]
  )

  const tops = useMemo(() => {
    const same =
      activeCat === "Semua"
        ? filteredMerchants
        : filteredMerchants.filter((m) => m.category === activeCat)

    const withRatings = same.map((m) => {
      const reviews = getJSON("reviews_" + m.id, [])
      const avg = reviews.length
        ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
        : 0
      return { ...m, avg }
    })

    return withRatings.sort((a, b) => b.avg - a.avg).slice(0, 10)
  }, [filteredMerchants, activeCat])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <div className="hero-gradient rounded-[3rem] p-8 md:p-16 mb-12 animate-fade-in-up border border-white/30 dark:border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div className="inline-block">
              <span className="px-4 py-2 bg-gradient-to-r from-brand/20 to-brand2/20 border border-brand/30 rounded-full text-sm font-semibold text-brand dark:text-brand2">
                ✨ Search Contact & Directory
              </span>
            </div>
            <h1 className="wp-h1 leading-tight">
              Temukan Toko<br/>Favorit Anda
            </h1>
            <p className="wp-p max-w-xl">
              Platform pencarian direktori lokal untuk menemukan toko makanan, minuman, laundry, dan kebutuhan harian lainnya. Kontak langsung via telepon atau WhatsApp.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/directory" className="btn btn-primary">
                🔍 Jelajahi Sekarang
              </a>
              <a href="/about" className="btn btn-outline">
                Tentang Kami
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-brand/30 via-brand2/30 to-purple-600/30 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative text-8xl md:text-9xl animate-float">
                🏪
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecommendationForm />

      <div className="mt-12">
        <div className="text-center mb-10">
          <h2 className="wp-h2 mb-4">⭐ Rekomendasi Teratas</h2>
          <p className="wp-p max-w-2xl mx-auto">Pilihan terbaik berdasarkan rating pengguna</p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="🔍 Cari nama toko..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-6 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg dark:bg-slate-900/50 backdrop-blur-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveCat("Semua")}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
              activeCat === "Semua"
                ? "bg-gradient-to-r from-brand via-brand2 to-purple-600 text-white scale-105"
                : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:scale-105"
            }`}
          >
            ✨ Semua
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                activeCat === c
                  ? "bg-gradient-to-r from-brand via-brand2 to-purple-600 text-white scale-105"
                  : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:scale-105"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <MerchantListSkeleton count={4} />
        ) : tops.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tops.map((m) => (
              <MerchantCard key={m.id} merchant={m} showReviews={false} />
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-center py-8">
            Tidak ada toko yang cocok dengan pencarian Anda.
          </div>
        )}
      </div>
    </div>
  )
}
