import { useEffect, useRef, useState } from "react"

export default function LazyImage({ src, alt, className, width, height, fallback }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: "100px", // Load earlier untuk smoother UX
        threshold: 0.01,
      }
    )

    observer.observe(imgRef.current)

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [])

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  return (
    <div ref={imgRef} className={className} style={{ width, height }}>
      {isInView ? (
        hasError ? (
          <div className={`${className} bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl`}>
            🖼️
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            width={width}
            height={height}
            className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
          />
        )
      ) : (
        fallback || <div className={`${className} bg-slate-200 dark:bg-slate-700 animate-pulse`} />
      )}
    </div>
  )
}
