import { useData } from "../context/DataContext.jsx"
import { useAuth } from "../context/AuthContext.jsx"
import { Navigate } from "react-router-dom"
import { useState } from "react"
import { uploadImage } from "../utils/imageUploader.js"

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const {
    merchants,
    addMerchant,
    updateMerchant,
    removeMerchant,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    recommendations,
    toggleRecommendationDone,
    removeRecommendation,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    usingSupabase,
    refresh,
  } = useData()

  const [form, setForm] = useState({
    name: "",
    category: "Makanan",
    logo: "",
    phone: "",
    whatsapp: "",
  })
  const [editId, setEditId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [menuFormType, setMenuFormType] = useState('manual') // 'manual' or 'image'

  if (!user) return <Navigate to="/" replace />

  const showNotification = (message, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setForm({ ...form, logo: reader.result })
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      category: "Makanan",
      logo: "",
      phone: "",
      whatsapp: "",
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      showNotification("⚠️ Nama toko dan nomor telepon wajib diisi!", "warning")
      return
    }

    try {
      if (editId) {
        await updateMerchant(editId, form)
        setEditId(null)
        showNotification("✅ Toko berhasil diperbarui!", "success")
      } else {
        await addMerchant({ ...form, menu: [] })
        showNotification("✅ Toko berhasil ditambahkan!", "success")
      }
      resetForm()
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menyimpan toko"}`, "error")
    }
  }

  const startEdit = (m) => {
    setEditId(m.id)
    setForm({
      name: m.name,
      category: m.category,
      logo: m.logo,
      phone: m.phone,
      whatsapp: m.whatsapp,
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    resetForm()
  }

  const handleRemoveMerchant = async (merchant) => {
    if (!confirm(`Yakin ingin menghapus toko "${merchant.name}"?`)) return
    try {
      await removeMerchant(merchant.id)
      showNotification("✅ Toko berhasil dihapus!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menghapus toko"}`, "error")
    }
  }

  const handleAddMenuItem = async (merchantId, e) => {
    e.preventDefault()
    const name = e.target.menuName.value
    const price = Number(e.target.menuPrice.value)
    const imageFile = e.target.menuImage ? e.target.menuImage.files[0] : null

    if (!name || !price) {
      showNotification("⚠️ Nama menu dan harga wajib diisi!", "warning")
      return
    }

    try {
      let imageUrl = null
      if (imageFile) {
        showNotification("⏳ Mengunggah gambar...", "info")
        imageUrl = await uploadImage(imageFile)
      }

      await addMenuItem(merchantId, { name, price, image_url: imageUrl })
      showNotification("✅ Menu berhasil ditambahkan!", "success")
      e.target.reset()
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menambah menu"}`, "error")
    }
  }

  const handleUpdateMenuItem = async (merchantId, itemId, updates) => {
    try {
      await updateMenuItem(merchantId, itemId, updates)
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal memperbarui menu"}`, "error")
    }
  }

  const handleUpdateMenuItemImage = async (merchantId, itemId, file) => {
    if (!file) return

    try {
      showNotification("⏳ Mengunggah gambar...", "info")
      const imageUrl = await uploadImage(file)
      await updateMenuItem(merchantId, itemId, { image_url: imageUrl })
      showNotification("✅ Gambar menu berhasil diperbarui!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal memperbarui gambar menu"}`, "error")
    }
  }

  const handleRemoveMenuItem = async (merchantId, itemId) => {
    try {
      await removeMenuItem(merchantId, itemId)
      showNotification("✅ Menu berhasil dihapus!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menghapus menu"}`, "error")
    }
  }

  const handleToggleRecommendation = async (id) => {
    try {
      await toggleRecommendationDone(id)
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal memperbarui rekomendasi"}`, "error")
    }
  }

  const handleRemoveRecommendation = async (id) => {
    if (!confirm("Yakin ingin menghapus rekomendasi ini?")) return
    try {
      await removeRecommendation(id)
      showNotification("✅ Rekomendasi berhasil dihapus!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menghapus rekomendasi"}`, "error")
    }
  }

  const statusLabel = () => {
    if (isLoading) return "⏳ Sinkronisasi..."
    if (error) return `⚠️ ${error}`
    if (usingSupabase) {
      return isOnline
        ? `☁️ Terhubung ke Supabase${lastSyncedAt ? ` (sync ${new Date(lastSyncedAt).toLocaleTimeString()})` : ""}`
        : "⚠️ Supabase tidak tersedia, menggunakan data lokal"
    }
    return "💾 Menggunakan data lokal (localStorage)"
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 shadow-lg bg-white dark:bg-slate-800 ${
            notification.type === "success"
              ? "border-emerald-200 text-emerald-600"
              : notification.type === "error"
              ? "border-rose-200 text-rose-600"
              : notification.type === "warning"
              ? "border-amber-200 text-amber-600"
              : "border-slate-200 text-slate-600"
          }`}
        >
          <div className="flex items-start gap-3">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            {statusLabel()}
            {usingSupabase && (
              <button
                onClick={refresh}
                className="btn btn-outline btn-sm"
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            👁️ Lihat Website
          </a>
          <button onClick={logout} className="btn btn-danger">
            Keluar
          </button>
        </div>
      </div>

      {editId === null && (
        <form
          onSubmit={submit}
          className="card mt-4 grid gap-3 md:grid-cols-2 p-4 shadow-lg"
        >
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama Toko"
            className="border rounded-xl px-3 py-2 dark:bg-slate-800"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded-xl px-3 py-2 dark:bg-slate-800"
          >
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
            <option value="Laundry">Laundry</option>
            <option value="Kebutuhan">Kebutuhan Harian</option>
          </select>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="No. Telepon"
            className="border rounded-xl px-3 py-2 dark:bg-slate-800"
          />
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="No. WhatsApp (format 62...)"
            className="border rounded-xl px-3 py-2 dark:bg-slate-800"
          />
          <div className="md:col-span-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="border rounded-xl px-3 py-2 w-full dark:bg-slate-800"
            />
            {form.logo && (
              <img
                src={form.logo}
                alt="Preview"
                className="mt-2 w-28 h-28 object-cover rounded-xl shadow-md"
              />
            )}
          </div>
          <button className="btn btn-primary md:col-span-2">Tambah Toko</button>
        </form>
      )}

      <div className="mt-8">
        <h2 className="font-semibold text-xl mb-4">Daftar Toko</h2>
        <div className="grid gap-3">
          {merchants.map((m) => (
            <div key={m.id} className="card p-4 shadow-md">
              {editId === m.id ? (
                <>
                  <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nama Toko"
                      className="border rounded-xl px-3 py-2 dark:bg-slate-800"
                    />
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="border rounded-xl px-3 py-2 dark:bg-slate-800"
                    >
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Laundry">Laundry</option>
                      <option value="Kebutuhan">Kebutuhan Harian</option>
                    </select>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="No. Telepon"
                      className="border rounded-xl px-3 py-2 dark:bg-slate-800"
                    />
                    <input
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="No. WhatsApp (format 62...)"
                      className="border rounded-xl px-3 py-2 dark:bg-slate-800"
                    />
                    <div className="md:col-span-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        className="border rounded-xl px-3 py-2 w-full dark:bg-slate-800"
                      />
                      {form.logo && (
                        <img
                          src={form.logo}
                          alt="Preview"
                          className="mt-2 w-28 h-28 object-cover rounded-xl shadow-md"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 md:col-span-2">
                      <button className="btn btn-primary flex-1">Simpan</button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn btn-outline flex-1"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                  <div className="mt-4">
                    <h3 className="font-medium">Menu</h3>
                    <ul className="space-y-2 mt-2">
                      {(m.menu || []).map((item) => (
                        <li
                          key={item.id}
                          className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded px-2 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-500 text-xs">
                                No Image
                              </div>
                            )}
                            <input
                              type="text"
                              defaultValue={item.name}
                              onBlur={(e) =>
                                handleUpdateMenuItem(m.id, item.id, {
                                  name: e.target.value,
                                })
                              }
                              className="border rounded px-2 py-1 flex-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={item.price}
                              onBlur={(e) =>
                                handleUpdateMenuItem(m.id, item.id, {
                                  price: Number(e.target.value),
                                })
                              }
                              className="border rounded px-2 py-1 w-28"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="border rounded px-2 py-1 w-full"
                              onChange={(e) =>
                                handleUpdateMenuItemImage(
                                  m.id,
                                  item.id,
                                  e.target.files[0]
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRemoveMenuItem(m.id, item.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <div className="flex border-b">
                        <button
                          onClick={() => setMenuFormType('manual')}
                          className={`py-2 px-4 ${menuFormType === 'manual' ? 'border-b-2 border-blue-500' : ''}`}
                        >
                          Manual
                        </button>
                        <button
                          onClick={() => setMenuFormType('image')}
                          className={`py-2 px-4 ${menuFormType === 'image' ? 'border-b-2 border-blue-500' : ''}`}
                        >
                          Dengan Gambar
                        </button>
                      </div>

                      {menuFormType === 'manual' && (
                        <form
                          onSubmit={(e) => handleAddMenuItem(m.id, e)}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3"
                        >
                          <input
                            name="menuName"
                            placeholder="Nama menu"
                            className="border rounded px-2 py-1 flex-1"
                          />
                          <input
                            name="menuPrice"
                            type="number"
                            placeholder="Harga"
                            className="border rounded px-2 py-1 w-full"
                          />
                          <button className="btn btn-primary md:col-span-2">Tambah Menu</button>
                        </form>
                      )}

                      {menuFormType === 'image' && (
                        <form
                          onSubmit={(e) => handleAddMenuItem(m.id, e)}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3"
                        >
                          <input
                            name="menuName"
                            placeholder="Nama menu"
                            className="border rounded px-2 py-1 flex-1"
                          />
                          <input
                            name="menuPrice"
                            type="number"
                            placeholder="Harga"
                            className="border rounded px-2 py-1 w-full"
                          />
                          <div className="md:col-span-2">
                            <input
                              name="menuImage"
                              type="file"
                              accept="image/*"
                              className="border rounded px-2 py-1 w-full"
                            />
                          </div>
                          <button className="btn btn-primary md:col-span-2">Tambah Menu dengan Gambar</button>
                        </form>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-slate-500">{m.category}</div>
                    <div className="text-sm">📞 {m.phone}</div>
                    {m.whatsapp && <div className="text-sm">💬 {m.whatsapp}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="btn btn-outline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveMerchant(m)}
                      className="btn btn-danger"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-8 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-xl">Rekomendasi dari Pengunjung</h2>
          {usingSupabase && (
            <span className="text-xs text-slate-500">
              {isLoading ? "Mengambil data..." : `${recommendations.length} rekomendasi`}
            </span>
          )}
        </div>
        {!recommendations?.length ? (
          <div className="text-sm text-slate-500">Belum ada rekomendasi.</div>
        ) : (
          <ul className="space-y-3">
            {recommendations
              .slice()
              .reverse()
              .map((r) => (
                <li
                  key={r.id}
                  className="border rounded-xl p-3 text-sm bg-slate-50 dark:bg-slate-800 flex justify-between items-center gap-3"
                >
                  <div>
                    <div className="font-medium">{r.name || "Anonim"}</div>
                    {r.contact && (
                      <div className="text-slate-500">{r.contact}</div>
                    )}
                    <div className="mt-1">{r.message}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(r.done)}
                        onChange={() => handleToggleRecommendation(r.id)}
                      />
                      Selesai
                    </label>
                    <button
                      onClick={() => handleRemoveRecommendation(r.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
