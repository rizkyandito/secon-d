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
  const refreshTimer = useRef(null)

  const usingSupabase = useMemo(
    () => Boolean(isSupabaseConfigured() && supabase),
    []
  )

  const hydrateFromLocal = useCallback(() => {
    const localMerchants = getJSON("merchants", [])
    const localRecommendations = getJSON("reco", [])
      .map((item) => sanitizeRecommendationRecord(item))
    setMerchants(localMerchants)
    setRecommendations(localRecommendations)
    setIsOnline(false)
    setIsLoading(false)
    setError(null)
  }, [])

  const fetchAllMerchantsHybrid = useCallback(async () => {
    if (!usingSupabase) {
      hydrateFromLocal()
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const { data: firstPageData, error: firstPageError } = await supabase
        .from("merchants")
        .select("id, name, category, phone, whatsapp") // Temporarily remove 'logo'
        .order("created_at", { ascending: true })
        .range(0, 19)
      
      if (firstPageError) throw firstPageError

      const initialMappedMerchants = mapMerchantRows(firstPageData, false)
      setMerchants(initialMappedMerchants)
      setIsLoading(false)
      setIsOnline(true)

      let allData = [...firstPageData]
      let page = 1
      const pageSize = 1000
      let hasMore = true

      while(hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        const { data, error: fetchError } = await supabase
          .from("merchants")
          .select("id, name, category, phone, whatsapp") // Temporarily remove 'logo'
          .order("created_at", { ascending: true })
          .range(from, to)
        
        if (fetchError) {
          console.error("Background fetch failed:", fetchError)
          break
        }

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
      setMerchants(finalMappedMerchants)
      setJSON("merchants", finalMappedMerchants)
      setLastSyncedAt(Date.now())
      
    } catch (err) {
      setError(err.message || "Gagal mengambil data dari Supabase")
      hydrateFromLocal()
      setIsLoading(false)
    }
  }, [usingSupabase, hydrateFromLocal])

  useEffect(() => {
    fetchAllMerchantsHybrid()
  }, [fetchAllMerchantsHybrid])

  const fetchRecommendations = useCallback(async () => {
    if (!usingSupabase) return
    try {
      const { data, error } = await supabase
        .from("recommendations")
        .select("id, name, contact, message, done, created_at")
        .order("created_at", { ascending: true })
        .limit(1000)
      if (error) throw error
      setRecommendations(mapMerchantRows(data, false))
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
          "id, name, category, logo, phone, whatsapp, menu_items(id, name, price, merchant_id), menu_images(id, image_url, merchant_id)"
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
    // Function implementation
  }
  const updateMerchant = async (id, updates) => {
    // Function implementation
  }
  const removeMerchant = async (id) => {
    // Function implementation
  }
  const addMenuItem = async (merchantId, item) => {
    // Function implementation
  }
  const updateMenuItem = async (merchantId, itemId, updates) => {
    // Function implementation
  }
  const removeMenuItem = async (merchantId, itemId) => {
    // Function implementation
  }
  const addMenuImage = async (merchantId, imageUrl) => {
    // Function implementation
  }
  const removeMenuImage = async (merchantId, imageId) => {
    // Function implementation
  }
  const addRecommendation = async (payload) => {
    // Function implementation
  }
  const toggleRecommendationDone = async (id) => {
    // Function implementation
  }
  const removeRecommendation = async (id) => {
    // Function implementation
  }

  const contextValue = {
    merchants,
    recommendations,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    refresh: fetchAllMerchantsHybrid,
    fetchMerchantDetail,
    addMerchant,
    updateMerchant,
    removeMerchant,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addMenuImage,
    removeMenuImage,
    addRecommendation,
    toggleRecommendationDone,
    removeRecommendation,
    usingSupabase,
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
