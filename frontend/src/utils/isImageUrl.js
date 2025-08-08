export function isImageUrl(text = "") {
  try {
    const url = new URL(text);
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname);
  } catch {
    return false;
  }
}
