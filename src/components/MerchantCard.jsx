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
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="merchant-card group relative"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-brand2/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none"></div>

        <div className="relative">
          <div className="flex items-center gap-4">
            {merchant.logo ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand2 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                <LazyImage
                  src={merchant.logo}
                  alt={merchant.name}
                  width="72"
                  height="72"
                  className="relative w-18 h-18 object-cover rounded-2xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                  fallback={
                    <div className="w-18 h-18 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
                  }
                />
              </div>
            ) : (
              <div className="w-18 h-18 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                🏪
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold text-xl mb-1 group-hover:text-brand transition-colors duration-300">{merchant.name}</div>
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-brand/10 to-brand2/10 rounded-full text-xs font-semibold text-brand dark:text-brand2 border border-brand/20">
                {merchant.category}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-amber-500">⭐</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {avg ? avg : "Belum ada ulasan"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default memo(MerchantCard)
