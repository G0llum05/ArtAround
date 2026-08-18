export function getImageUrl(assets, preferredOrientation = "landscape", fallbackImage = "/assets/images/place_holder.jpg") {
  const images = assets?.images;

  if (!Array.isArray(images) || images.length === 0) {
    return fallbackImage;
  }

  let targetImg = images.find(img => img?.orientation === preferredOrientation);

  if (!targetImg) {
    targetImg = images[0];
  }

  return targetImg.url;
}
