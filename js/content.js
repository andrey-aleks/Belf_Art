// Loads the editable content in content/*.json (edited through the CMS at /admin/).
//
// `cache: "no-cache"` makes the browser revalidate with the server on every load, so a
// change published from the CMS shows up as soon as GitHub Pages has deployed it
// instead of after the HTTP cache expires.

function fetchContent(path) {
  return fetch(path, { cache: "no-cache" }).then((response) => {
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  });
}

// Content paths are stored relative ("media/web/x.webp") because the site is served from
// a sub-path on GitHub Pages; strip a leading slash defensively in case one slips in.
function assetUrl(path) {
  return String(path || "").replace(/^\/+/, "");
}

function applySiteImages(site) {
  const hero = document.querySelector(".hero-image");
  if (hero && site.heroImage) hero.src = assetUrl(site.heroImage);

  const aboutPhoto = document.querySelector(".about-photo");
  if (aboutPhoto && site.aboutPhoto) {
    const img = document.createElement("img");
    img.className = "about-photo-image";
    img.src = assetUrl(site.aboutPhoto);
    img.alt = "";
    aboutPhoto.replaceChildren(img);
    aboutPhoto.classList.add("has-photo");
  }
}

if (typeof document !== "undefined") {
  fetchContent("content/site.json")
    .then(applySiteImages)
    .catch((error) => console.error("Could not load site images:", error));
}

if (typeof module !== "undefined") {
  module.exports = { assetUrl };
}
