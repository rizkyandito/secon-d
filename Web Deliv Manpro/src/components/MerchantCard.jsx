import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { getJSON } from "../utils/storage"

export default function MerchantCard({ merchant }) {
  const reviews = getJSON("reviews_" + merchant.id, [])
  const avg = reviews.length
    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <Link to={`/merchant/${merchant.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="card p-4 h-full"
      >
        <div className="flex items-center gap-3">
          {merchant.logo ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className="w-14 h-14 object-cover rounded-2xl shadow"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500">
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