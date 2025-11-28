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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Daftar Toko</h1>

      <div className="card mt-4 grid md:grid-cols-4 gap-3">
        <input
          value={q}
          onChange={handleSearchChange}
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
          Total: {filtered.length} toko
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

