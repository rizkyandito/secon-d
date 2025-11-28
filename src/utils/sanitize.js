const htmlNamedEntities = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

const decodeHtmlEntities = (value = "") => {
  if (!value || typeof value !== "string") return ""

  return value
    .replace(/&#x([\da-f]+);?/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&(amp|lt|gt|quot|apos);/gi, (_, named) => htmlNamedEntities[named.toLowerCase()] || named)
}

const stripDangerousContent = (value = "") =>
  value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")

const collapseWhitespace = (value = "") => value.replace(/\s+/g, " ").trim()

const truncate = (value = "", maxLength = 280) =>
  maxLength && value.length > maxLength ? value.slice(0, maxLength) : value

export const cleanText = (value = "", maxLength = 280) => {
  if (!value) return ""
  const decoded = decodeHtmlEntities(value)
  const stripped = stripDangerousContent(decoded)
  const collapsed = collapseWhitespace(stripped)
  return truncate(collapsed, maxLength)
}

export const sanitizeRecommendationRecord = (record = {}) => ({
  ...record,
  name: cleanText(record.name || "", 60),
  contact: cleanText(record.contact || "", 120),
  message: cleanText(record.message || "", 400),
})

