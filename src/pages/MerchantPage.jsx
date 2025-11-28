import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useData } from "../context/DataContext"
import Reviews from "../components/Reviews"
import ImageModal from "../components/ImageModal"
import LazyImage from "../components/LazyImage"

export default function MerchantPage() {
  const { id } = useParams()
  const { merchants, isLoading, fetchMerchantDetail } = useData()
  const [selectedImage, setSelectedImage] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const merchant = merchants.find((m) => m.id.toString() === id)

  // Fetch detail hanya jika belum ada
  useEffect(() => {
    const merchant = merchants.find((m) => m.id.toString() === id)

    if (!merchant) {
      return
    }

    if (merchant.detailFetched) {
      return
    }

    if (!fetchMerchantDetail) {
      return
    }

    setLoadingDetail(true)
    fetchMerchantDetail(merchant.id)
      .catch((err) => {
        console.error("Error fetching merchant detail:", err)
      })
      .finally(() => setLoadingDetail(false))
  }, [id, merchants, fetchMerchantDetail])

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        </div>
        <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="p-4">
        <div className="text-center text-slate-500">Merchant not found</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        {merchant.logo ? (
          <img
            src={merchant.logo}
            alt={merchant.name}
            loading="eager"
            decoding="async"
            width="96"
            height="96"
            className="w-24 h-24 object-cover rounded-2xl shadow"
          />
        ) : (
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500">
            📷
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{merchant.name}</h1>
          <p className="text-slate-500">{merchant.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <div className="space-y-2">
            <div>📞 {merchant.phone || "-"}</div>
            {merchant.whatsapp && (
              <a
                href={`https://wa.me/${merchant.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary flex items-center gap-2 w-fit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  className="w-4 h-4"
                  fill="currentColor"
                >
                  <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.5 31.5l7.8-2.1c2.3 1.3 4.9 2 7.7 2 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28c-2.6 0-5.1-.7-7.2-2.1l-.5-.3-4.6 1.2 1.2-4.5-.3-.5C3.2 20.1 2.5 18.1 2.5 16 2.5 8.5 8.5 2.5 16 2.5S29.5 8.5 29.5 16 23.5 28.5 16 28.5zm8.1-11.5c-.4-.2-2.2-1.1-2.5-1.2s-.6-.2-.8.2c-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.5-.6-2.8-1.9-1-1-1.7-2.2-1.9-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.5-.6.2-.2.3-.4.5-.7.2-.3.1-.6 0-.8-.2-.2-.8-2-1.1-2.8-.3-.8-.6-.7-.8-.7h-.7c-.2 0-.6.1-.9.4s-1.1 1-1.1 2.4c0 1.4 1.1 2.8 1.2 3 .2.2 2.2 3.5 5.4 4.9.8.4 1.4.6 1.9.8.8.3 1.5.2 2.1.1.6-.1 2-0.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.2-.4-.3-.8-.5z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>

          <div className="mt-6">
            {(merchant.menu_images?.length > 0 || merchant.menu?.length > 0 || loadingDetail) && (
              <h2 className="text-2xl font-semibold mb-3">Menu</h2>
            )}

            {loadingDetail && (
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            )}

            {!loadingDetail && merchant.menu_images?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchant.menu_images.map((image) => (
                  <div
                    key={image.id}
                    className="border rounded-lg shadow-sm cursor-pointer overflow-hidden"
                    onClick={() => setSelectedImage(image.image_url)}
                  >
                    <LazyImage
                      src={image.image_url}
                      alt="Menu"
                      className="w-full h-48 object-cover"
                      fallback={
                        <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {merchant.menu?.length > 0 && (
              <ul className="list-disc ml-5 space-y-2 mt-4">
                {merchant.menu.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold">{item.name}</span> — Rp{" "}
                    {Number(item.price || 0).toLocaleString("id-ID")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <h2 className="text-2xl font-semibold mb-3">Reviews</h2>
          <Reviews merchantId={merchant.id} />
        </div>
      </div>

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  )
}
