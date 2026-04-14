export function registerEscapeHandler(outsideContainer: HTMLElement | null, cb: () => void) {
  if (!outsideContainer) return
  function click(this: HTMLElement, e: HTMLElementEventMap["click"]) {
    if (e.target !== this) return
    e.preventDefault()
    e.stopPropagation()
    cb()
  }

  function esc(e: HTMLElementEventMap["keydown"]) {
    if (!e.key.startsWith("Esc")) return
    e.preventDefault()
    cb()
  }

  outsideContainer?.addEventListener("click", click)
  window.addCleanup(() => outsideContainer?.removeEventListener("click", click))
  document.addEventListener("keydown", esc)
  window.addCleanup(() => document.removeEventListener("keydown", esc))
}

export function removeAllChildren(node: HTMLElement) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

// AliasRedirect emits HTML redirects which also have the link[rel="canonical"]
// containing the URL it's redirecting to.
// Extracting it here with regex is _probably_ faster than parsing the entire HTML
// with a DOMParser effectively twice (here and later in the SPA code), even if
// way less robust - we only care about our own generated redirects after all.
const canonicalRegex = /<link rel="canonical" href="([^"]*)">/

export async function fetchCanonical(url: URL): Promise<Response> {
  const res = await fetch(`${url}`)
  if (!res.headers.get("content-type")?.startsWith("text/html")) {
    return res
  }

  // reading the body can only be done once, so we need to clone the response
  // to allow the caller to read it if it's was not a redirect
  const text = await res.clone().text()
  const [_, redirect] = text.match(canonicalRegex) ?? []
  return redirect ? fetch(`${new URL(redirect, url)}`) : res
}

function setupLightbox() {
  const images = document.querySelectorAll('article img'); // On cible les images des notes
  
  images.forEach(img => {
    // On évite d'ajouter l'écouteur plusieurs fois
    if (img.getAttribute('data-lightbox')) return;
    img.setAttribute('data-lightbox', 'true');
    img.style.cursor = 'zoom-in';

    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(224, 229, 236, 0.9); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; cursor: zoom-out;
      `;
      
      const fullImg = document.createElement('img');
      fullImg.src = (img as HTMLImageElement).src;
      fullImg.style.cssText = `
        max-width: 90%; max-height: 90%; border-radius: 20px;
        border: 10px solid #e0e5ec;
        box-shadow: 20px 20px 40px #bec3c9, -20px -20px 40px #ffffff;
      `;

      modal.appendChild(fullImg);
      document.body.appendChild(modal);
      modal.onclick = () => modal.remove();
    });
  });
}

// On lance au chargement initial ET à chaque changement de page Quartz
document.addEventListener("nav", setupLightbox);
window.addEventListener("DOMContentLoaded", setupLightbox);
