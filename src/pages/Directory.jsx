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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 // 12 items per page untuk performa optimal

  const debouncedSearch = useCallback(
    debounce((value) => setDebouncedQ(value), 300),
    []
  )


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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }, [filtered, currentPage, itemsPerPage])

  // Reset to page 1 when filter changes
  const handleSearchChange = (e) => {
    const value = e.target.value
    setQ(value)
    debouncedSearch(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (newCat) => {
    setCat(newCat)
    setCurrentPage(1)
  }

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
            onChange={(e) => handleCategoryChange(e.target.value)}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tidak ada toko ditemukan
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {paginatedData.map((m) => (
              <div key={m.id}>
                <MerchantCard merchant={m} showReviews={true} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand hover:scale-105"
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-semibold transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-brand to-brand2 text-white shadow-lg scale-110'
                              : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand hover:scale-105'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-slate-400">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand hover:scale-105"
                >
                  Next →
                </button>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Halaman {currentPage} dari {totalPages} ({filtered.length} toko)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

