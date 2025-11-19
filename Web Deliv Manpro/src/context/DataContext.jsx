import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getJSON, setJSON } from "../utils/storage"
import initialMerchants from "../data/merchants.json"
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient"
import { sanitizeRecommendationRecord } from "../utils/sanitize"

const DataContext = createContext(null)

const mapMerchantRows = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    logo: row.logo,
    phone: row.phone,
    whatsapp: row.whatsapp,
    menu: (row.menu_items || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      merchant_id: item.merchant_id,
    })),
    menu_images: (row.menu_images || []).map((item) => ({
      id: item.id,
      image_url: item.image_url,
      merchant_id: item.merchant_id,
    })),
  }))

export function DataProvider({ children }) {
  const [merchants, setMerchants] = useState(initialMerchants)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const refreshTimer = useRef(null)

  const usingSupabase = useMemo(
    () => Boolean(isSupabaseConfigured() && supabase),
    []
  )

  const hydrateFromLocal = () => {
    const localMerchants = getJSON("merchants", initialMerchants)
    const localRecommendations = getJSON("reco", [])
      .map((item) => sanitizeRecommendationRecord(item))
    setMerchants(localMerchants)
    setRecommendations(localRecommendations)
    setIsOnline(false)
    setIsLoading(false)
    setError(null)
  }

  const fetchFromSupabase = async (showLoading = true) => {
    if (!usingSupabase) {
      hydrateFromLocal()
      return
    }

    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      // Fetch SEMUA data - coba beberapa metode untuk memastikan semua data terambil
      console.log("🚀 Starting fetch from Supabase...")
      
      let allMerchants = []
      
      // Method 1: Coba fetch semua sekaligus tanpa pagination (jika < 1000 rows)
      try {
        const { data, error, count } = await supabase
          .from("merchants")
          .select("id, name, category, logo, phone, whatsapp", { count: "exact" })
          .order("created_at", { ascending: true })
        
        if (error) {
          console.error("❌ Supabase error (method 1):", error)
          throw error
        }
        
        if (count !== null) {
          console.log(`📊 Total merchants in database: ${count}`)
        }
        
        if (data && data.length > 0) {
          allMerchants = data
          console.log(`✅ Method 1: Fetched ${data.length} merchants (Expected: ${count || '?'})`)
          
          // Validasi: jika count ada dan data kurang, ada masalah
          if (count !== null && data.length < count) {
            console.warn(`⚠️ Warning: Only fetched ${data.length} of ${count} merchants!`)
            console.warn(`⚠️ This might be due to RLS policy or query limit`)
            
            // Coba method 2: dengan pagination
            console.log("🔄 Trying pagination method...")
            let page = 0
            const pageSize = 1000
            let hasMore = true
            allMerchants = []
            
            while (hasMore) {
              const from = page * pageSize
              const to = from + pageSize - 1
              
              const { data: pageData, error: pageError } = await supabase
                .from("merchants")
                .select("id, name, category, logo, phone, whatsapp")
                .order("created_at", { ascending: true })
                .range(from, to)
              
              if (pageError) {
                console.error(`❌ Error on page ${page + 1}:`, pageError)
                break
              }
              
              if (pageData && pageData.length > 0) {
                allMerchants = [...allMerchants, ...pageData]
                console.log(`📄 Page ${page + 1}: Fetched ${pageData.length} merchants (Total: ${allMerchants.length})`)
                
                if (pageData.length < pageSize) {
                  hasMore = false
                } else {
                  page++
                }
              } else {
                hasMore = false
              }
            }
            
            console.log(`✅ Pagination method: Fetched ${allMerchants.length} merchants`)
          }
        } else {
          console.warn("⚠️ No data returned from Supabase")
        }
      } catch (err) {
        console.error("❌ Error in fetch method 1:", err)
        throw err
      }
      
      // Fetch recommendations
      const recoRes = await supabase
        .from("recommendations")
        .select("id, name, contact, message, done, created_at")
        .order("created_at", { ascending: true })
        .limit(1000)
      
      if (recoRes.error) throw recoRes.error
      
      // Validasi final count
      console.log(`📊 Final count: ${allMerchants.length} merchants fetched`)
      
      if (allMerchants.length === 0) {
        console.error("❌ CRITICAL: No merchants fetched! Check Supabase connection and RLS policies.")
        throw new Error("No merchants data available")
      }
      
      // Map data dengan menu kosong (akan di-fetch on-demand)
      const mappedMerchants = allMerchants.map((row) => {
        if (!row || !row.id) {
          console.warn("⚠️ Invalid merchant row:", row)
          return null
        }
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          logo: row.logo,
          phone: row.phone,
          whatsapp: row.whatsapp,
          menu: [],
          menu_images: [],
        }
      }).filter(Boolean) // Filter out null values
      
      console.log(`✅ Mapped ${mappedMerchants.length} merchants`)
      
      if (mappedMerchants.length !== allMerchants.length) {
        console.warn(`⚠️ Warning: ${allMerchants.length - mappedMerchants.length} merchants were filtered out`)
      }
      
      // Final validation
      if (mappedMerchants.length < 50) {
        console.warn(`⚠️ WARNING: Only ${mappedMerchants.length} merchants loaded. Expected more.`)
        console.warn(`⚠️ This might indicate a problem with RLS policies or data access.`)
      }
      
      const mappedRecommendations = (recoRes.data || []).map((item) =>
        sanitizeRecommendationRecord({
          id: item.id,
          name: item.name,
          contact: item.contact,
          message: item.message,
          done: item.done,
          created_at: item.created_at,
        })
      )

      // Update state dan cache
      setMerchants(mappedMerchants)
      setRecommendations(mappedRecommendations)
      setIsOnline(true)
      setLastSyncedAt(Date.now())
      setJSON("merchants", mappedMerchants)
      setJSON("reco", mappedRecommendations)
      
      console.log(`💾 Saved ${mappedMerchants.length} merchants to cache`)
      if (showLoading) setIsLoading(false)
    } catch (err) {
      console.error("Supabase fetch error:", err)
      setError(err.message || "Gagal mengambil data dari Supabase")
      hydrateFromLocal()
    }
  }

  // Fetch merchant detail dengan menu_items dan menu_images (on-demand)
  const fetchMerchantDetail = async (merchantId) => {
    if (!usingSupabase) {
      const merchant = merchants.find((m) => m.id === merchantId)
      return merchant || null
    }

    try {
      console.log(`🔍 Fetching full detail for merchant ${merchantId}...`)
      
      // Fetch merchant dengan menu_items dan menu_images
      const { data, error } = await supabase
        .from("merchants")
        .select(
          "id, name, category, logo, phone, whatsapp, menu_items(id, name, price, merchant_id), menu_images(id, image_url, merchant_id)"
        )
        .eq("id", merchantId)
        .single()

      if (error) {
        console.error("❌ Supabase error:", error)
        throw error
      }
      if (!data) {
        console.warn(`⚠️ No data found for merchant ${merchantId}`)
        return null
      }

      console.log(`📦 Raw data from Supabase:`, {
        merchant_id: data.id,
        menu_items_count: data.menu_items?.length || 0,
        menu_images_count: data.menu_images?.length || 0,
        menu_images: data.menu_images
      })

      const fullMerchant = mapMerchantRows([data])[0]
      console.log(`✅ Mapped merchant: ${fullMerchant.menu?.length || 0} menu items, ${fullMerchant.menu_images?.length || 0} images`)
      
      if (fullMerchant.menu_images && fullMerchant.menu_images.length > 0) {
        console.log(`🖼️ Menu images URLs:`, fullMerchant.menu_images.map(img => img.image_url))
      } else {
        console.warn(`⚠️ No menu_images in mapped merchant!`)
      }
      
      // Update merchant di state dan cache
      setMerchants((prev) => {
        const updated = prev.map((m) => (m.id === merchantId ? fullMerchant : m))
        setJSON("merchants", updated)
        console.log(`💾 Updated merchant ${merchantId} in state and cache`)
        return updated
      })
      
      return fullMerchant
    } catch (err) {
      console.error("❌ Error fetching merchant detail:", err)
      const fallback = merchants.find((m) => m.id === merchantId) || null
      if (fallback) {
        console.log("Using cached merchant data as fallback")
      }
      return fallback
    }
  }

  // Load data - force fetch untuk memastikan data lengkap
  useEffect(() => {
    // Clear cache lama yang mungkin tidak lengkap
    const cachedMerchants = getJSON("merchants", null)
    if (cachedMerchants && cachedMerchants.length < 50) {
      console.log(`🗑️ Clearing incomplete cache (${cachedMerchants.length} merchants)...`)
      localStorage.removeItem("merchants")
      localStorage.removeItem("reco")
    }
    
    // FORCE FETCH - Langsung fetch fresh data dari Supabase
    console.log("🔄 Force fetching fresh data from Supabase...")
    fetchFromSupabase(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper function untuk fetch merchant lengkap dengan menu_items dan menu_images
  const fetchMerchantWithRelations = async (merchantId) => {
    try {
      const { data, error } = await supabase
        .from("merchants")
        .select(
          "id, name, category, logo, phone, whatsapp, menu_items(id, name, price, merchant_id), menu_images(id, image_url, merchant_id)"
        )
        .eq("id", merchantId)
        .single()

      if (error) throw error
      return data ? mapMerchantRows([data])[0] : null
    } catch (err) {
      console.error("Error fetching merchant:", err)
      return null
    }
  }

  useEffect(() => {
    if (!usingSupabase) return

    const channel = supabase
      .channel("manpro-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "merchants" },
        async (payload) => {
          const newMerchant = await fetchMerchantWithRelations(payload.new.id)
          if (newMerchant) {
            setMerchants((prev) => {
              // Cek apakah sudah ada
              if (prev.find((m) => m.id === newMerchant.id)) return prev
              const updated = [...prev, newMerchant]
              setJSON("merchants", updated)
              return updated
            })
            setLastSyncedAt(Date.now())
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "merchants" },
        async (payload) => {
          const updatedMerchant = await fetchMerchantWithRelations(payload.new.id)
          if (updatedMerchant) {
            setMerchants((prev) => {
              const updated = prev.map((m) => (m.id === updatedMerchant.id ? updatedMerchant : m))
              setJSON("merchants", updated)
              return updated
            })
            setLastSyncedAt(Date.now())
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "merchants" },
        (payload) => {
          setMerchants((prev) => {
            const updated = prev.filter((m) => m.id !== payload.old.id)
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "menu_items" },
        (payload) => {
          const merchantId = payload.new.merchant_id
          const newItem = {
            id: payload.new.id,
            name: payload.new.name,
            price: Number(payload.new.price || 0),
            merchant_id: merchantId,
          }
          setMerchants((prev) => {
            const updated = prev.map((merchant) =>
              merchant.id === merchantId
                ? { ...merchant, menu: [...(merchant.menu || []), newItem] }
                : merchant
            )
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        (payload) => {
          const merchantId = payload.new.merchant_id
          const updatedItem = {
            id: payload.new.id,
            name: payload.new.name,
            price: Number(payload.new.price || 0),
            merchant_id: merchantId,
          }
          setMerchants((prev) => {
            const updated = prev.map((merchant) =>
              merchant.id === merchantId
                ? {
                    ...merchant,
                    menu: merchant.menu.map((item) =>
                      item.id === updatedItem.id ? updatedItem : item
                    ),
                  }
                : merchant
            )
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "menu_items" },
        (payload) => {
          const merchantId = payload.old.merchant_id
          setMerchants((prev) => {
            const updated = prev.map((merchant) =>
              merchant.id === merchantId
                ? {
                    ...merchant,
                    menu: merchant.menu.filter((item) => item.id !== payload.old.id),
                  }
                : merchant
            )
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "menu_images" },
        (payload) => {
          const merchantId = payload.new.merchant_id
          const newImage = {
            id: payload.new.id,
            image_url: payload.new.image_url,
            merchant_id: merchantId,
          }
          setMerchants((prev) => {
            const updated = prev.map((merchant) =>
              merchant.id === merchantId
                ? {
                    ...merchant,
                    menu_images: [...(merchant.menu_images || []), newImage],
                  }
                : merchant
            )
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "menu_images" },
        (payload) => {
          const merchantId = payload.old.merchant_id
          setMerchants((prev) => {
            const updated = prev.map((merchant) =>
              merchant.id === merchantId
                ? {
                    ...merchant,
                    menu_images: merchant.menu_images.filter(
                      (image) => image.id !== payload.old.id
                    ),
                  }
                : merchant
            )
            setJSON("merchants", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "recommendations" },
        (payload) => {
          const newReco = sanitizeRecommendationRecord({
            id: payload.new.id,
            name: payload.new.name,
            contact: payload.new.contact,
            message: payload.new.message,
            done: payload.new.done,
            created_at: payload.new.created_at,
          })
          setRecommendations((prev) => {
            // Cek apakah sudah ada
            if (prev.find((r) => r.id === newReco.id)) return prev
            const updated = [...prev, newReco]
            setJSON("reco", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "recommendations" },
        (payload) => {
          const updatedReco = sanitizeRecommendationRecord({
            id: payload.new.id,
            name: payload.new.name,
            contact: payload.new.contact,
            message: payload.new.message,
            done: payload.new.done,
            created_at: payload.new.created_at,
          })
          setRecommendations((prev) => {
            const updated = prev.map((r) => (r.id === updatedReco.id ? updatedReco : r))
            setJSON("reco", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "recommendations" },
        (payload) => {
          setRecommendations((prev) => {
            const updated = prev.filter((r) => r.id !== payload.old.id)
            setJSON("reco", updated)
            return updated
          })
          setLastSyncedAt(Date.now())
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time sync aktif - perubahan database akan otomatis terupdate")
        }
      })

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingSupabase])

  useEffect(() => {
    if (usingSupabase) return
    setJSON("merchants", merchants)
    setJSON("reco", recommendations)
  }, [usingSupabase, merchants, recommendations])

  const addMerchant = async (payload) => {
    if (usingSupabase) {
      try {
        const { data, error: insertError } = await supabase
          .from("merchants")
          .insert([
            {
              name: payload.name,
              category: payload.category,
              logo: payload.logo,
              phone: payload.phone,
              whatsapp: payload.whatsapp,
            },
          ])
          .select("id, name, category, logo, phone, whatsapp")
          .single()

        if (insertError) throw insertError

        setMerchants((prev) => [...prev, { ...data, menu: [] }])
        setLastSyncedAt(Date.now())
        return data
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    const newMerchant = {
      ...payload,
      id: Date.now(),
      menu: payload.menu || [],
    }
    setMerchants((prev) => [...prev, newMerchant])
    return newMerchant
  }

  const updateMerchant = async (id, updates) => {
    if (usingSupabase) {
      try {
        const { error: updateError } = await supabase
          .from("merchants")
          .update(updates)
          .eq("id", id)

        if (updateError) throw updateError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === id ? { ...merchant, ...updates } : merchant
      )
    )
  }

  const removeMerchant = async (id) => {
    if (usingSupabase) {
      try {
        const { error: deleteError } = await supabase
          .from("merchants")
          .delete()
          .eq("id", id)

        if (deleteError) throw deleteError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setMerchants((prev) => prev.filter((merchant) => merchant.id !== id))
  }

  const addMenuItem = async (merchantId, item) => {
    if (usingSupabase) {
      try {
        const { data, error: insertError } = await supabase
          .from("menu_items")
          .insert([
            {
              merchant_id: merchantId,
              name: item.name,
              price: item.price,
            },
          ])
          .select("id, name, price, merchant_id")
          .single()

        if (insertError) throw insertError

        setMerchants((prev) =>
          prev.map((merchant) =>
            merchant.id === merchantId
              ? { ...merchant, menu: [...(merchant.menu || []), { ...data }] }
              : merchant
          )
        )
        return data
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    const newItem = { id: Date.now(), ...item }
    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === merchantId
          ? { ...merchant, menu: [...(merchant.menu || []), newItem] }
          : merchant
      )
    )
    return newItem
  }

  const updateMenuItem = async (merchantId, itemId, updates) => {
    if (usingSupabase) {
      try {
        const { error: updateError } = await supabase
          .from("menu_items")
          .update(updates)
          .eq("id", itemId)

        if (updateError) throw updateError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === merchantId
          ? {
              ...merchant,
              menu: merchant.menu.map((menuItem) =>
                menuItem.id === itemId ? { ...menuItem, ...updates } : menuItem
              ),
            }
          : merchant
      )
    )
  }

  const removeMenuItem = async (merchantId, itemId) => {
    if (usingSupabase) {
      try {
        const { error: deleteError } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", itemId)

        if (deleteError) throw deleteError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === merchantId
          ? {
              ...merchant,
              menu: merchant.menu.filter((menuItem) => menuItem.id !== itemId),
            }
          : merchant
      )
    )
  }

  const addMenuImage = async (merchantId, imageUrl) => {
    if (usingSupabase) {
      try {
        const { data, error: insertError } = await supabase
          .from("menu_images")
          .insert([
            {
              merchant_id: merchantId,
              image_url: imageUrl,
            },
          ])
          .select("id, image_url, merchant_id")
          .single()

        if (insertError) throw insertError

        setMerchants((prev) =>
          prev.map((merchant) =>
            merchant.id === merchantId
              ? {
                  ...merchant,
                  menu_images: [...(merchant.menu_images || []), { ...data }],
                }
              : merchant
          )
        )
        return data
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    const newImage = { id: Date.now(), image_url: imageUrl, merchant_id: merchantId }
    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === merchantId
          ? { ...merchant, menu_images: [...(merchant.menu_images || []), newImage] }
          : merchant
      )
    )
    return newImage
  }

  const removeMenuImage = async (merchantId, imageId) => {
    if (usingSupabase) {
      try {
        const { error: deleteError } = await supabase
          .from("menu_images")
          .delete()
          .eq("id", imageId)

        if (deleteError) throw deleteError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setMerchants((prev) =>
      prev.map((merchant) =>
        merchant.id === merchantId
          ? {
              ...merchant,
              menu_images: merchant.menu_images.filter(
                (image) => image.id !== imageId
              ),
            }
          : merchant
      )
    )
  }

  const addRecommendation = async (payload) => {
    const sanitizedPayload = sanitizeRecommendationRecord(payload)
    if (!sanitizedPayload.message) {
      throw new Error("Pesan rekomendasi tidak boleh kosong atau hanya simbol")
    }

    if (usingSupabase) {
      try {
        const { data, error: insertError } = await supabase
          .from("recommendations")
          .insert([{ ...sanitizedPayload, done: false }])
          .select("id, name, contact, message, done, created_at")
          .single()

        if (insertError) throw insertError

        const record = sanitizeRecommendationRecord(data)
        setRecommendations((prev) => [...prev, record])
        return record
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    const recommendation = {
      id: Date.now(),
      ...sanitizedPayload,
      done: false,
    }
    setRecommendations((prev) => [...prev, recommendation])
    return recommendation
  }

  const toggleRecommendationDone = async (id) => {
    const target = recommendations.find((r) => r.id === id)
    const nextDone = !target?.done

    if (usingSupabase) {
      try {
        const { error: updateError } = await supabase
          .from("recommendations")
          .update({ done: nextDone })
          .eq("id", id)

        if (updateError) throw updateError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: nextDone } : r))
    )
  }

  const removeRecommendation = async (id) => {
    if (usingSupabase) {
      try {
        const { error: deleteError } = await supabase
          .from("recommendations")
          .delete()
          .eq("id", id)

        if (deleteError) throw deleteError
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    setRecommendations((prev) => prev.filter((r) => r.id !== id))
  }

  const contextValue = {
    merchants,
    addMerchant,
    updateMerchant,
    removeMerchant,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addMenuImage,
    removeMenuImage,
    recommendations,
    addRecommendation,
    toggleRecommendationDone,
    removeRecommendation,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    refresh: fetchFromSupabase,
    fetchMerchantDetail,
    usingSupabase,
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
