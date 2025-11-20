import { useMemo, useState } from "react"
import { useData } from "../context/DataContext.jsx"
import MerchantCard from "../components/MerchantCard.jsx"
import MerchantListSkeleton from "../components/MerchantListSkeleton.jsx"

export default function Directory() {
  const { merchants, isLoading, isBackgroundLoading } = useData()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("Semua")

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(merchants.map((m) => m.category)))],
    [merchants]
  )

  const filtered = useMemo(() => {
    // Filtering logic is correct and can stay the same
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Daftar Toko</h1>

      <div className="card mt-4 grid md:grid-cols-4 gap-3">
        {/* Input and select are correct */}
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
          Total: {filtered.length} toko
        </div>
      </div>

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
          {isBackgroundLoading && (
            <div className="text-center mt-6 text-slate-500 animate-pulse">
              Memuat semua toko di latar belakang...
            </div>
          )}
        </>
      )}
    </div>
  )
}

