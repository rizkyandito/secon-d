import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getJSON, setJSON } from "../utils/storage"
import initialMerchants from "../data/merchants.json"
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient"

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
      image_url: item.image_url,
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
    setMerchants(localMerchants)
    setRecommendations(localRecommendations)
    setIsOnline(false)
    setIsLoading(false)
    setError(null)
  }

  const fetchFromSupabase = async () => {
    if (!usingSupabase) {
      hydrateFromLocal()
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [merchantsRes, recoRes] = await Promise.all([
        supabase
          .from("merchants")
          .select(
            "id, name, category, logo, phone, whatsapp, menu_items(id, name, price, merchant_id, image_url)"
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("recommendations")
          .select("id, name, contact, message, done, created_at")
          .order("created_at", { ascending: true }),
      ])

      if (merchantsRes.error) throw merchantsRes.error
      if (recoRes.error) throw recoRes.error

      const mappedMerchants = mapMerchantRows(merchantsRes.data)
      const mappedRecommendations = (recoRes.data || []).map((item) => ({
        id: item.id,
        name: item.name,
        contact: item.contact,
        message: item.message,
        done: item.done,
        created_at: item.created_at,
      }))

      setMerchants(mappedMerchants)
      setRecommendations(mappedRecommendations)
      setIsOnline(true)
      setLastSyncedAt(Date.now())
      setJSON("merchants", mappedMerchants)
      setJSON("reco", mappedRecommendations)
      setIsLoading(false)
    } catch (err) {
      console.error("Supabase fetch error:", err)
      setError(err.message || "Gagal mengambil data dari Supabase")
      hydrateFromLocal()
    }
  }

  useEffect(() => {
    fetchFromSupabase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!usingSupabase) return

    const channel = supabase
      .channel("manpro-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merchants" },
        () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current)
          refreshTimer.current = setTimeout(fetchFromSupabase, 400)
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current)
          refreshTimer.current = setTimeout(fetchFromSupabase, 400)
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recommendations" },
        () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current)
          refreshTimer.current = setTimeout(fetchFromSupabase, 400)
        }
      )
      .subscribe()

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
              image_url: item.image_url,
            },
          ])
          .select("id, name, price, merchant_id, image_url")
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

  const addRecommendation = async (payload) => {
    if (usingSupabase) {
      try {
        const { data, error: insertError } = await supabase
          .from("recommendations")
          .insert([{ ...payload, done: false }])
          .select("id, name, contact, message, done, created_at")
          .single()

        if (insertError) throw insertError

        setRecommendations((prev) => [...prev, data])
        return data
      } catch (err) {
        setError(err.message)
        throw err
      }
    }

    const recommendation = { id: Date.now(), ...payload, done: false }
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
    recommendations,
    addRecommendation,
    toggleRecommendationDone,
    removeRecommendation,
    isLoading,
    isOnline,
    error,
    lastSyncedAt,
    refresh: fetchFromSupabase,
    usingSupabase,
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
