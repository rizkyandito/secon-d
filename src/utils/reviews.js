import { getJSON } from "./storage";

export function getAverageRating(merchantId) {
  const reviews = getJSON(`reviews_${merchantId}`, []);
  if (!reviews.length) return 0;
  const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  return avg;
}
