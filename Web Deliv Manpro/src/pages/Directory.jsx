import { useMemo, useState, useEffect } from "react"
import { useData } from "../context/DataContext.jsx"
import MerchantCard from "../components/MerchantCard.jsx"
import MerchantListSkeleton from "../components/MerchantListSkeleton.jsx"
import { CATEGORIES } from "../data/constants.js"

export default function Directory() {
  const { merchants, isLoading, loadMoreMerchants, pagination, filters, setFilters } = useData()

  const categories = ["Semua", ...CATEGORIES]

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 200 &&
        !isLoading &&
        pagination.hasMore
      ) {
        loadMoreMerchants()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isLoading, pagination.hasMore, loadMoreMerchants])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Daftar Toko</h1>

      <div className="card mt-4 grid md:grid-cols-4 gap-3">
        <input
          value={filters.q}
          onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
          placeholder="Cari nama toko..."
          className="border rounded-xl px-3 py-2 md:col-span-2 dark:bg-slate-800"
        />
        <select
          value={filters.cat}
          onChange={(e) => setFilters(prev => ({ ...prev, cat: e.target.value }))}
          className="border rounded-xl px-3 py-2 dark:bg-slate-800"
        >
          {categories.map((c, i) => (
            <option key={`${c}-${i}`} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="text-sm text-slate-500 self-center">
          Menampilkan: {merchants.length} toko
        </div>
      </div>

      {isLoading && merchants.length === 0 ? (
        <MerchantListSkeleton count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {merchants.map((m) => (
              <div key={m.id}>
                <MerchantCard merchant={m} showReviews={true} />
              </div>
            ))}
          </div>
          
          {merchants.length === 0 && !isLoading && (
            <div className="text-center mt-10 text-slate-500">
              <p className="text-lg">Tidak ada toko yang cocok.</p>
              <p>Coba ubah kata kunci pencarian atau filter kategori Anda.</p>
            </div>
          )}

          <div className="text-center mt-6">
            {isLoading && merchants.length > 0 && (
              <div className="text-slate-500">Memuat lebih banyak...</div>
            )}
            {!isLoading && !pagination.hasMore && merchants.length > 0 && (
              <div className="text-slate-500">-- Anda telah mencapai akhir --</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

