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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="card bg-gradient-to-r from-brand/20 via-brand2/20 to-brand3/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="wp-h1">SeCon-D</h1>
            <p className="wp-p text-slate-600 dark:text-slate-300">
              Search Contact and Directory, Temukan toko makanan, minuman, laundry, dan kebutuhan harian
              lainnya. Kontak langsung via telepon atau WhatsApp.
            </p>
          </div>
          <a href="/directory" className="btn btn-primary">
            Lihat Daftar Toko
          </a>
        </div>
      </div>

      <RecommendationForm />

      <div className="mt-8">
        <h2 className="wp-h2 mb-4">Rekomendasi Teratas</h2>
        
        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Cari nama toko..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border rounded-xl shadow-sm dark:bg-slate-800 focus:ring-2 focus:ring-brand-light"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCat("Semua")}
            className={`px-4 py-2 rounded-xl border ${
              activeCat === "Semua"
                ? "bg-gradient-to-r from-brand to-brand2 text-white"
                : "bg-slate-100 dark:bg-slate-700"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-2 rounded-xl border ${
                activeCat === c
                  ? "bg-gradient-to-r from-brand to-brand2 text-white"
                  : "bg-slate-100 dark:bg-slate-700"
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
