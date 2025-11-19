import { useMemo, useState, useEffect } from "react"
import { useData } from "../context/DataContext.jsx"
import MerchantCard from "../components/MerchantCard.jsx"
import MerchantListSkeleton from "../components/MerchantListSkeleton.jsx"
import { CATEGORIES } from "../data/constants.js"

export default function Directory() {
  const { merchants, isLoading, loadMoreMerchants, pagination } = useData()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("Semua")

  const categories = ["Semua", ...CATEGORIES]


  const filtered = useMemo(() => {
    if (q === "" && cat === "Semua") {
      return merchants
    }
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
        .includes(q.toLowerCase())
      return byCat && byText
    })
  }, [merchants, q, cat])

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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama toko/menu..."
          className="border rounded-xl px-3 py-2 md:col-span-2 dark:bg-slate-800"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="border rounded-xl px-3 py-2 dark:bg-slate-800"
        >
          {categories.map((c, i) => (
            <option key={`${c}-${i}`} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="text-sm text-slate-500 self-center">
          Menampilkan: {filtered.length} toko
        </div>
      </div>
      
      {q !== "" && <p className="text-sm text-slate-500 mt-2">Pencarian dilakukan pada data yang sudah dimuat. Scroll ke bawah untuk memuat lebih banyak.</p>}

      {isLoading && merchants.length === 0 ? (
        <MerchantListSkeleton count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {filtered.map((m) => (
              <div key={m.id}>
                <MerchantCard merchant={m} showReviews={true} />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            {isLoading && merchants.length > 0 && (
              <div className="text-slate-500">Memuat lebih banyak...</div>
            )}
            {!isLoading && !pagination.hasMore && (
              <div className="text-slate-500">-- Anda telah mencapai akhir --</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
