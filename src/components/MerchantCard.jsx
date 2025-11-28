import { memo, useMemo } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { useData } from "../context/DataContext"
import LazyImage from "./LazyImage"

function MerchantCard({ merchant }) {
  const { reviewsCache } = useData()

  const avg = useMemo(() => {
    const reviews = reviewsCache[merchant.id] || []
    return reviews.length
      ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
      : null
  }, [reviewsCache, merchant.id])

  return (
    <Link to={`/merchant/${merchant.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="card p-4 h-full"
      >
        <div className="flex items-center gap-3">
          {merchant.logo ? (
            <LazyImage
              src={merchant.logo}
              alt={merchant.name}
              width="56"
              height="56"
              className="w-14 h-14 object-cover rounded-2xl shadow"
              fallback={
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              }
            />
          ) : (
            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500">
              📷
            </div>
          )}
          <div>
            <div className="font-semibold text-lg">{merchant.name}</div>
            <div className="text-xs text-slate-500">{merchant.category}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          ⭐ Rata-rata: {avg ? avg : "Belum ada ulasan"}
        </div>
      </motion.div>
    </Link>
  )
}

export default memo(MerchantCard)
