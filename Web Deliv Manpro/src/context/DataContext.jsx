import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { getJSON, setJSON } from "../utils/storage"
import initialMerchants from "../data/merchants.json"
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
      
      // Step 1: Fetch the first page quickly
      const { data: firstPageData, error: firstPageError } = await supabase
        .from("merchants")
        .select("id, name, category, logo, phone, whatsapp")
        .order("created_at", { ascending: true })
        .range(0, 19)
      
      if (firstPageError) throw firstPageError

      const initialMappedMerchants = mapMerchantRows(firstPageData, false)
      setMerchants(initialMappedMerchants)
      setIsLoading(false) // Set loading to false so UI is interactive
      setIsOnline(true)

      // Step 2: Fetch the rest in the background
      let allData = [...firstPageData]
      let page = 1
      const pageSize = 1000 // Fetch larger chunks in the background
      let hasMore = true

      while(hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        const { data, error: fetchError } = await supabase
          .from("merchants")
          .select("id, name, category, logo, phone, whatsapp")
          .order("created_at", { ascending: true })
          .range(from, to)
        
        if (fetchError) {
          console.error("Background fetch failed:", fetchError)
          break // Stop background fetch on error
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
      
      // Step 3: Once all data is fetched, update the state with the full list
      const finalMappedMerchants = mapMerchantRows(allData, false)
      setMerchants(finalMappedMerchants)
      setJSON("merchants", finalMappedMerchants) // Cache the full list
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
      const mapped = (data || []).map(sanitizeRecommendationRecord)
      setRecommendations(mapped)
      setJSON("reco", mapped)
    } catch (err) {
      console.error("Failed to fetch recommendations:", err)
    }
  }, [usingSupabase])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // ... (rest of the functions: addMerchant, updateMerchant, etc.)

  const contextValue = {
    merchants,
    recommendations,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    refresh: fetchAllMerchantsHybrid,
    // ... other functions
  }
  
  // ... (rest of the component)
}
