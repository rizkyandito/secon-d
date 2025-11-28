import { useEffect, useState } from 'react'
import { getJSON, setJSON } from '../utils/storage'
import { motion } from 'framer-motion'

export default function Reviews({ merchantId }) {
  const key = `reviews_${merchantId}`
  const [list, setList] = useState(() => getJSON(key, []))
  const [rating, setRating] = useState(5)

  useEffect(() => setJSON(key, list), [list])

  const add = (e) => {
    e.preventDefault()
    setList([...list, { id: Date.now(), rating: Number(rating) }])
    setRating(5)
  }

  const avg = list.length
    ? (list.reduce((a, b) => a + b.rating, 0) / list.length).toFixed(1)
    : null

  return (
    <div className="mt-4">
      <div className="font-semibold">
        Ulasan {avg ? `(Rata-rata ${avg} ⭐)` : '(Belum ada)'}
      </div>

      <form onSubmit={add} className="grid sm:grid-cols-3 gap-2 mt-2">
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border rounded-xl px-3 py-2 dark:bg-slate-800"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ⭐
            </option>
          ))}
        </select>
        <button className="btn btn-primary sm:col-span-2">Kirim</button>
      </form>

      {/* Tidak menampilkan komentar, hanya rata-rata */}
      <motion.div
        className="mt-2 text-sm text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Total review: {list.length}
      </motion.div>
    </div>
  )
}
