import { useData } from "../context/DataContext.jsx"
import { useAuth } from "../context/AuthContext.jsx"
import { Navigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { uploadImage } from "../utils/imageUploader.js"
import TabNavigation from "../components/admin/TabNavigation.jsx"
import SearchBar from "../components/admin/SearchBar.jsx"

export default function AdminPanel() {
  const {
    user,
    logout
  } = useAuth()
  const {
    merchants,
    addMerchant,
    updateMerchant,
    removeMerchant,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addMenuImage,
    removeMenuImage,
    removeLogo,
    recommendations,
    toggleRecommendationDone,
    removeRecommendation,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    usingSupabase,
    refresh,
    clearCache,
  } = useData()

  const [form, setForm] = useState({
    name: "",
    category: "Makanan",
    logo: "",
    phone: "",
    whatsapp: "",
    tags: [], // Array of tag strings
  })
  const [tagInput, setTagInput] = useState("") // Input untuk menambah tag baru
  const [editId, setEditId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [newMenuItems, setNewMenuItems] = useState([])
  const [newMenuImages, setNewMenuImages] = useState([])

  // New states for UI improvements
  const [activeTab, setActiveTab] = useState('merchants')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const handleNewMenuImageFile = (e, index) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const updatedMenuItems = [...newMenuItems]
        updatedMenuItems[index].image = reader.result
        updatedMenuItems[index].file = file // Store file object for upload
        setNewMenuItems(updatedMenuItems)
      }
      reader.readAsDataURL(file)
    }
  }

  const addMenuItemField = () => {
    setNewMenuItems([...newMenuItems, { name: "", price: "", image: null, file: null }])
  }

  const removeMenuItemField = (index) => {
    const updatedMenuItems = [...newMenuItems]
    updatedMenuItems.splice(index, 1)
    setNewMenuItems(updatedMenuItems)
  }

  const handleNewMenuItemChange = (e, index, field) => {
    const updatedMenuItems = [...newMenuItems]
    updatedMenuItems[index][field] = e.target.value
    setNewMenuItems(updatedMenuItems)
  }

  const resetForm = () => {
    setForm({
      name: "",
      category: "Makanan",
      logo: "",
      phone: "",
      whatsapp: "",
      tags: [],
    })
    setTagInput("")
    setNewMenuItems([])
  }

  // Handler untuk menambah tag
  const handleAddTag = (e) => {
    e.preventDefault()
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !form.tags.includes(trimmedTag)) {
      setForm({ ...form, tags: [...form.tags, trimmedTag] })
      setTagInput("")
    }
  }

  // Handler untuk menghapus tag
  const handleRemoveTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      showNotification("⚠️ Nama toko dan nomor telepon wajib diisi!", "warning")
      return
    }

    try {
      showNotification("⏳ Menyimpan toko...", "info")

      // 1. Upload logo if it's a new file (base64 string)
      let logoUrl = form.logo
      if (logoUrl && logoUrl.startsWith('data:image')) {
        const logoFile = await (await fetch(logoUrl)).blob()
        logoUrl = await uploadImage(logoFile, `logo_${Date.now()}`)
      }

      // 2. Upload menu images and prepare menu data
      const menuWithImageUrls = await Promise.all(
        newMenuItems.map(async (item) => {
          let imageUrl = null
          if (item.file) {
            imageUrl = await uploadImage(item.file, `menu_${Date.now()}`)
          }
          return {
            name: item.name,
            price: Number(item.price),
            image: imageUrl,
          }
        })
      )

      const merchantData = {
        name: form.name,
        category: form.category,
        phone: form.phone,
        whatsapp: form.whatsapp,
        logo: logoUrl,
        tags: form.tags,
        menu: menuWithImageUrls,
        menu_images: menuWithImageUrls.filter(m => m.image).map(m => ({ image_url: m.image }))
      }

      if (editId) {
        await updateMerchant(editId, merchantData)
        setEditId(null)
        showNotification("✅ Toko berhasil diperbarui!", "success")
      } else {
        await addMerchant(merchantData)
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
      tags: m.tags || [],
    })
    setTagInput("")
    setNewMenuItems(m.menu || []) // Allow editing existing menu items
  }

  const cancelEdit = () => {
    setEditId(null)
    resetForm()
  }

  const handleRemoveLogo = async (merchantId) => {
    if (!confirm("Yakin ingin menghapus logo toko ini?")) return
    try {
      await removeLogo(merchantId)
      showNotification("✅ Logo berhasil dihapus!", "success")
      // Also update the form state to reflect the change immediately
      setForm(prev => ({ ...prev, logo: null }))
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menghapus logo"}`, "error")
    }
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

    if (!name) {
      showNotification("⚠️ Nama menu wajib diisi!", "warning")
      return
    }

    try {
      await addMenuItem(merchantId, {
        name,
        price
      })
      showNotification("✅ Menu berhasil ditambahkan!", "success")
      e.target.reset()
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menambah menu"}`, "error")
    }
  }

  const handleAddMenuImage = async (merchantId, file) => {
    if (!file) return

    try {
      showNotification("⏳ Mengunggah gambar...", "info")
      const imageUrl = await uploadImage(file)
      await addMenuImage(merchantId, imageUrl)
      showNotification("✅ Gambar menu berhasil ditambahkan!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menambah gambar menu"}`, "error")
    }
  }

  const handleUpdateMenuItem = async (merchantId, itemId, updates) => {
    try {
      await updateMenuItem(merchantId, itemId, updates)
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal memperbarui menu"}`, "error")
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

  const handleRemoveMenuImage = async (merchantId, imageId) => {
    if (!confirm("Yakin ingin menghapus gambar menu ini?")) return
    try {
      await removeMenuImage(merchantId, imageId)
      showNotification("✅ Gambar menu berhasil dihapus!", "success")
    } catch (err) {
      showNotification(`❌ ${err.message || "Gagal menghapus gambar menu"}`, "error")
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

  // Filter merchants berdasarkan search (name, category, tags)
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const query = searchQuery.toLowerCase()
      const matchName = m.name.toLowerCase().includes(query)
      const matchCategory = m.category.toLowerCase().includes(query)
      const matchTags = (m.tags || []).some(tag => tag.toLowerCase().includes(query))
      return matchName || matchCategory || matchTags
    })
  }, [merchants, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage)
  const paginatedMerchants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredMerchants.slice(start, start + itemsPerPage)
  }, [filteredMerchants, currentPage])

  // Tabs configuration
  const tabs = [
    { id: 'merchants', label: 'Kelola Toko', icon: '🏪', count: merchants.length },
    { id: 'recommendations', label: 'Rekomendasi', icon: '💬', count: recommendations.length },
  ]

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

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-brand to-brand2 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-2">
            {statusLabel()}
          </p>
        </div>
        <div className="flex gap-2">
          {usingSupabase && (
            <>
              <button
                onClick={refresh}
                className="btn btn-outline btn-sm"
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => {
                  if (confirm("Yakin ingin clear cache? Data akan di-reload dari Supabase.")) {
                    clearCache()
                  }
                }}
                className="btn btn-outline btn-sm text-amber-600 border-amber-300 hover:border-amber-600"
                disabled={isLoading}
              >
                🗑️ Clear Cache
              </button>
            </>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            👁️ Website
          </a>
          <button onClick={logout} className="btn btn-danger btn-sm">
            🚪 Keluar
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

      {/* Merchants Tab */}
      {activeTab === 'merchants' && (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar
              placeholder="🔍 Cari toko berdasarkan nama atau kategori..."
              onSearch={(q) => {
                setSearchQuery(q)
                setCurrentPage(1) // Reset ke halaman 1 saat search
              }}
            />
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
              accept="image/png, image/jpeg, image/jpg"
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

          {/* --- Tags Section --- */}
          <div className="md:col-span-2 mt-2">
            <label className="block text-sm font-medium mb-2">Tags (untuk pencarian)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag(e)
                  }
                }}
                placeholder="Contoh: Ayam Geprek, Chinese Food, Pedas..."
                className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-outline btn-sm"
              >
                + Tambah Tag
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-brand/10 to-brand2/10 rounded-full text-sm font-medium text-brand dark:text-brand2 border border-brand/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-rose-500 hover:text-rose-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* --- End of Tags Section --- */}

          {/* --- Menu Items Section --- */}
          <div className="md:col-span-2 mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg">Menu Items</h3>
              <button type="button" onClick={addMenuItemField} className="btn btn-sm btn-outline">
                + Tambah Menu
              </button>
            </div>
            <div className="space-y-3">
              {newMenuItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 border rounded-lg">
                  <input
                    type="text"
                    placeholder="Nama Menu"
                    value={item.name}
                    onChange={(e) => handleNewMenuItemChange(e, index, 'name')}
                    className="border rounded-xl px-3 py-2 dark:bg-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="Harga"
                    value={item.price}
                    onChange={(e) => handleNewMenuItemChange(e, index, 'price')}
                    className="border rounded-xl px-3 py-2 dark:bg-slate-700"
                  />
                  <div className="md:col-span-2 grid grid-cols-2 gap-2 items-center">
                     <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => handleNewMenuImageFile(e, index)}
                        className="border rounded-xl px-3 py-2 w-full text-sm dark:bg-slate-700"
                      />
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg shadow-md"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMenuItemField(index)}
                          className="btn btn-sm btn-danger"
                        >
                          Hapus
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* --- End of Menu Items Section --- */}

          <button className="btn btn-primary md:col-span-2 mt-4">
            {editId ? "Simpan Perubahan" : "Tambah Toko"}
          </button>
        </form>
      )}

      <div className="mt-8">
        <h2 className="font-semibold text-xl mb-4">Daftar Toko ({filteredMerchants.length})</h2>
        <div className="grid gap-3">
          {paginatedMerchants.map((m) => (
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
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFile}
                        className="border rounded-xl px-3 py-2 w-full dark:bg-slate-800"
                      />
                      <div className="flex items-center gap-4 mt-2">
                        {form.logo && (
                          <img
                            src={form.logo}
                            alt="Preview"
                            className="w-28 h-28 object-cover rounded-xl shadow-md"
                          />
                        )}
                        {form.logo && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(m.id)}
                            className="btn btn-danger"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                    </div>
                    {/* --- Tags Section (Edit Mode) --- */}
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-sm font-medium mb-2">Tags (untuk pencarian)</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTag(e)
                            }
                          }}
                          placeholder="Contoh: Ayam Geprek, Chinese Food, Pedas..."
                          className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="btn btn-outline btn-sm"
                        >
                          + Tag
                        </button>
                      </div>
                      {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-brand/10 to-brand2/10 rounded-full text-sm font-medium text-brand dark:text-brand2 border border-brand/20"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 text-rose-500 hover:text-rose-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* --- End of Tags Section (Edit Mode) --- */}
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
                    <h3 className="font-medium">Daftar Item Menu</h3>
                    <ul className="space-y-2 mt-2">
                      {(m.menu || []).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 border rounded px-2 py-1 text-sm"
                        >
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
                          <button
                            onClick={() => handleRemoveMenuItem(m.id, item.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                    </ul>
                    <form
                      onSubmit={(e) => handleAddMenuItem(m.id, e)}
                      className="flex gap-2 mt-3"
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
                        className="border rounded px-2 py-1 w-28"
                      />
                      <button className="btn btn-primary">Tambah</button>
                    </form>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium">Gambar Menu</h3>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(m.menu_images || []).map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.image_url}
                            alt="Menu"
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            onClick={() => handleRemoveMenuImage(m.id, image.id)}
                            className="absolute top-1 right-1 btn btn-danger btn-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="border rounded px-2 py-1 w-full"
                        onChange={(e) => handleAddMenuImage(m.id, e.target.files[0])}
                      />
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
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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

        {/* Pagination Controls */}
        {Math.ceil(filteredMerchants.length / itemsPerPage) > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-sm font-semibold">
              Halaman {currentPage} dari {Math.ceil(filteredMerchants.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMerchants.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(filteredMerchants.length / itemsPerPage)}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
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
      )}
    </div>
  )
}
