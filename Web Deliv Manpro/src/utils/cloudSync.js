// Cloud sync service menggunakan JSONBin.io
// Gratis untuk penggunaan kecil, data tersimpan di cloud dan bisa diakses dari perangkat manapun
// 
// CARA SETUP:
// 1. Daftar gratis di https://jsonbin.io
// 2. Buat bin baru dan copy Bin ID
// 3. Dapatkan API Key (Master Key) dari dashboard
// 4. Set di Vercel Environment Variables:
//    - VITE_JSONBIN_API_KEY = your-api-key
//    - VITE_JSONBIN_BIN_ID = your-bin-id
// 5. Redeploy aplikasi

// Get Bin ID dari environment atau gunakan default
const getBinId = () => {
  return import.meta.env.VITE_JSONBIN_BIN_ID || 'web-delivery-manpro-data'
}

// Get API key from environment
const getApiKey = () => {
  // Di production, set di Vercel Environment Variables
  return import.meta.env.VITE_JSONBIN_API_KEY || ''
}

const getApiUrl = () => {
  const binId = getBinId()
  return `https://api.jsonbin.io/v3/b/${binId}`
}

// Load data dari cloud
export const loadFromCloud = async () => {
  try {
    const apiKey = getApiKey()
    if (!apiKey) {
      return null // Fallback ke localStorage
    }

    const apiUrl = getApiUrl()
    const response = await fetch(apiUrl + '/latest', {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey,
        'X-Bin-Meta': 'false'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Bin belum ada, return null untuk menggunakan default
        return null
      }
      throw new Error(`Failed to load: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading from cloud:', error)
    return null // Fallback ke localStorage
  }
}

// Save data ke cloud
export const saveToCloud = async (data) => {
  try {
    const apiKey = getApiKey()
    if (!apiKey) {
      return false // Hanya menyimpan ke localStorage
    }

    const apiUrl = getApiUrl()
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Error saving to cloud:', error)
    return false
  }
}

// Check jika cloud sync tersedia
export const isCloudSyncAvailable = () => {
  return !!getApiKey()
}

