import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { getJSON } from "../utils/storage"

// Helper function to get optimized image URL from Supabase
const getOptimizedUrl = (url) => {
  if (!url || !url.includes("supabase.co")) {
    return url;
  }

  // Check if it's a storage object URL and transform it into a render URL
  if (url.includes("/storage/v1/object/public/")) {
    const transformedUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    // Now add transformation parameters
    return `${transformedUrl}?width=128&height=128&quality=75&format=webp`;
  }

  return url; // Return original URL if it's not the expected format
};

export default function MerchantCard({ merchant }) {
  const reviews = getJSON("reviews_" + merchant.id, [])
  const avg = reviews.length
    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
    : null

  const optimizedLogo = getOptimizedUrl(merchant.logo);

  return (
    <Link to={`/merchant/${merchant.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="card p-4 h-full"
      >
        <div className="flex items-center gap-3">
          {optimizedLogo ? (
            <img
              src={optimizedLogo}
              alt={merchant.name}
              loading="lazy"
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
