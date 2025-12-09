import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { getJSON, setJSON } from "../utils/storage"
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient"
import { sanitizeRecommendationRecord } from "../utils/sanitize"

const DataContext = createContext(null)

const mapMerchantRows = (rows = [], detailFetched = false) =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    logo: row.logo,
    phone: row.phone,
    whatsapp: row.whatsapp,
    tags: row.tags || [], // Array of tag strings (e.g., ["Chinese Food", "Ayam Geprek"])
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
    detailFetched,
  }))

export function DataProvider({ children }) {
  const [merchants, setMerchants] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [reviewsCache, setReviewsCache] = useState({})
  const refreshTimer = useRef(null)

  const usingSupabase = useMemo(
    () => Boolean(isSupabaseConfigured() && supabase),
    []
  )

  const hydrateFromLocal = useCallback(() => {
    const localMerchants = getJSON("merchants", [])
    const localRecommendations = getJSON("reco", [])
      .map((item) => sanitizeRecommendationRecord(item))

    // Cache all reviews at once
    const cache = {}
    localMerchants.forEach(m => {
      cache[m.id] = getJSON("reviews_" + m.id, [])
    })

    setMerchants(localMerchants)
    setRecommendations(localRecommendations)
    setReviewsCache(cache)
    setIsOnline(false)
    setIsLoading(false)
    setError(null)
  }, [])

  const fetchAllMerchants = useCallback(async () => {
    if (!usingSupabase) {
      hydrateFromLocal()
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while(hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        const { data, error: fetchError } = await supabase
          .from("merchants")
          .select("*, menu_items(*), menu_images(*)")
          .order("created_at", { ascending: true })
          .range(from, to)
        
        if (fetchError) throw fetchError

        if (data.length > 0) {
          allData.push(...data)
        }
        
        if (data.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      }
      
      const finalMappedMerchants = mapMerchantRows(allData, false)

      // Cache all reviews at once
      const cache = {}
      finalMappedMerchants.forEach(m => {
        cache[m.id] = getJSON("reviews_" + m.id, [])
      })

      setMerchants(finalMappedMerchants)
      setReviewsCache(cache)
      setJSON("merchants", finalMappedMerchants)
      setLastSyncedAt(Date.now())
      setIsOnline(true)
      
    } catch (err) {
      setError(err.message || "Gagal mengambil data dari Supabase")
      hydrateFromLocal()
    } finally {
      setIsLoading(false)
    }
  }, [usingSupabase, hydrateFromLocal])

  useEffect(() => {
    fetchAllMerchants()
  }, [fetchAllMerchants])

  const fetchRecommendations = useCallback(async () => {
    if (!usingSupabase) return
    try {
      const { data, error } = await supabase
        .from("recommendations")
        .select("id, name, contact, message, done, created_at")
        .order("created_at", { ascending: true })
        .limit(1000)
      if (error) throw error
      const sanitized = (data || []).map((item) => sanitizeRecommendationRecord(item))
      setRecommendations(sanitized)
    } catch (err) {
      console.error("Failed to fetch recommendations:", err)
    }
  }, [usingSupabase])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const fetchMerchantDetail = useCallback(async (merchantId) => {
    if (!usingSupabase) {
      const merchant = merchants.find((m) => m.id === merchantId)
      return merchant || null
    }

    try {
      const { data, error } = await supabase
        .from("merchants")
        .select(
          "id, name, category, logo, phone, whatsapp, tags, menu_items(id, name, price, merchant_id), menu_images(id, image_url, merchant_id)"
        )
        .eq("id", merchantId)
        .single()

      if (error) throw error
      if (!data) return null

      const fullMerchant = mapMerchantRows([data], true)[0]
      
      setMerchants((prev) => {
        const updated = prev.map((m) => (m.id === merchantId ? fullMerchant : m))
        setJSON("merchants", updated)
        return updated
      })
      
      return fullMerchant
    } catch (err) {
      console.error("Error fetching merchant detail:", err)
      return merchants.find((m) => m.id === merchantId) || null
    }
  }, [usingSupabase, merchants])

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
              tags: payload.tags || [],
            },
          ])
          .select("id, name, category, logo, phone, whatsapp, tags")
          .single()

        if (insertError) throw insertError

        setMerchants((prev) => [...prev, { ...data, menu: [], tags: data.tags || [] }])
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
      tags: payload.tags || [],
    }
    setMerchants((prev) => [...prev, newMerchant])
    return newMerchant
  }

  const updateMerchant = async (id, updates) => {
    if (usingSupabase) {
      try {
        // Exclude menu and menu_images from the main merchant update payload
        const { menu, menu_images, ...merchantUpdates } = updates

        const { error: updateError } = await supabase
          .from("merchants")
          .update(merchantUpdates)
          .eq("id", id)

        if (updateError) throw updateError
        
        // Note: This doesn't handle updates/deletions of existing menu items
        // during a bulk merchant save. The AdminPanel handles additions separately.
        // This change primarily prevents the crash.
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
        // Find the image to get its URL for storage deletion
        const merchant = merchants.find(m => m.id === merchantId);
        const image = merchant?.menu_images.find(img => img.id === imageId);
        
        if (image && image.image_url) {
          const url = new URL(image.image_url);
          const filePath = url.pathname.split('/').pop();
          
          // 1. Delete from Storage
          if (filePath) {
            await supabase.storage.from('menu-images').remove([filePath]);
          }
        }

        // 2. Delete from database
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

  const removeLogo = async (merchantId) => {
    if (usingSupabase) {
      try {
        const merchant = merchants.find(m => m.id === merchantId);
        if (merchant && merchant.logo) {
          const url = new URL(merchant.logo);
          const filePath = url.pathname.split('/').pop();

          // 1. Delete from Storage
          if (filePath) {
            await supabase.storage.from('menu-images').remove([filePath]);
          }
        }

        // 2. Update database
        await updateMerchant(merchantId, { logo: null });

      } catch (err) {
        setError(err.message);
        throw err;
      }
    }
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

  const contextValue = useMemo(
    () => ({
      merchants,
      recommendations,
      isLoading,
      isOnline,
      error,
      lastSyncedAt,
      reviewsCache,
      refresh: fetchAllMerchants,
      fetchMerchantDetail,
      addMerchant,
      updateMerchant,
      removeMerchant,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      addMenuImage,
      removeMenuImage,
      removeLogo,
      addRecommendation,
      toggleRecommendationDone,
      removeRecommendation,
      usingSupabase,
    }),
    [
      merchants,
      recommendations,
      isLoading,
      isOnline,
      error,
      lastSyncedAt,
      reviewsCache,
      fetchAllMerchants,
      fetchMerchantDetail,
      usingSupabase,
    ]
  )

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)