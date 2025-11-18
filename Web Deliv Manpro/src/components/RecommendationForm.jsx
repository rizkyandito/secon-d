import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'

export default function RecommendationForm() {
  const { addRecommendation } = useData()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')

  const submit = e => {
    e.preventDefault()
    if (!message) return
    addRecommendation({ name, contact, message })
    setName('')
    setContact('')
    setMessage('')
    alert('Terima kasih! Rekomendasi terkirim.')
  }

  return (
    <div className="card mt-6">
      <h2 className="wp-h2 mb-4 text-center">Punya rekomendasi toko?</h2>
      <form onSubmit={submit} className="grid md:grid-cols-3 gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nama"
          className="border rounded-xl px-3 py-2 dark:bg-slate-800"
        />
        <input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Kontak"
          className="border rounded-xl px-3 py-2 dark:bg-slate-800"
        />
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Saran toko/menu/kategori..."
          className="md:col-span-2 border rounded-xl px-3 py-2 dark:bg-slate-800"
        />
        <button className="btn btn-primary md:col-span-3">Kirim</button>
      </form>
    </div>
  )
}

