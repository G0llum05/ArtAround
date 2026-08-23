export function getImageUrl(assets, preferredOrientation = "landscape", fallbackImage = "/assets/images/place_holder.jpg") {
  if (!assets) {
    return fallbackImage;
  }

  if (typeof assets === 'string') {
    return assets.trim() !== '' && assets !== 'undefined' && assets !== 'null' ? assets : fallbackImage;
  }

  if (assets.url) {
    return assets.url;
  }

  const images = assets.images || assets.gallery;

  if (!Array.isArray(images) || images.length === 0) {
    return fallbackImage;
  }

  let targetImg = images.find(img => img?.orientation === preferredOrientation);

  if (!targetImg) {
    targetImg = images[0];
  }

  const resultUrl = targetImg?.url || targetImg;
  if (!resultUrl || typeof resultUrl !== 'string' || resultUrl === 'undefined' || resultUrl === 'null') {
    return fallbackImage;
  }

  return resultUrl;
}
