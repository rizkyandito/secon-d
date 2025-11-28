import { useMemo, useState, useCallback } from "react"
import { useData } from "../context/DataContext.jsx"
import MerchantCard from "../components/MerchantCard.jsx"
import MerchantListSkeleton from "../components/MerchantListSkeleton.jsx"
import { debounce } from "../utils/debounce.js"

export default function Directory() {
  const { merchants, isLoading } = useData()
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [cat, setCat] = useState("Semua")

  const debouncedSearch = useCallback(
    debounce((value) => setDebouncedQ(value), 300),
    []
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setQ(value)
    debouncedSearch(value)
  }

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(merchants.map((m) => m.category)))],
    [merchants]
  )

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      const byCat = cat === "Semua" || m.category === cat
      const byText = (
        m.name +
        " " +
        m.category +
        " " +
        (m.menu || []).map((x) => x.name).join(" ")
      )
        .toLowerCase()
        .includes(debouncedQ.toLowerCase())
      return byCat && byText
    })
  }, [merchants, debouncedQ, cat])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10 animate-fade-in-up">
        <h1 className="wp-h1 mb-4">📋 Direktori Lengkap</h1>
        <p className="wp-p max-w-2xl mx-auto">Jelajahi semua toko yang tersedia di platform kami</p>
      </div>

      <div className="card mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              value={q}
              onChange={handleSearchChange}
              placeholder="🔍 Cari nama toko atau menu..."
              className="w-full px-5 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900/50 backdrop-blur-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-300"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="px-5 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900/50 backdrop-blur-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-300 font-semibold"
          >
            {categories.map((c, i) => (
              <option key={`${c}-${i}`} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-brand/10 to-brand2/10 rounded-xl border border-brand/20">
            <span className="text-sm font-bold text-brand dark:text-brand2">
              📊 Total: {filtered.length} toko
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <MerchantListSkeleton count={10} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {filtered.map((m) => (
            <div key={m.id}>
              <MerchantCard merchant={m} showReviews={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

