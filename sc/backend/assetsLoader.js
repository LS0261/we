// sc/backend/assetsLoader.js
export default class AssetsLoader {
  constructor() {
    this.images = {};
    this.sounds = {};
    this.jsons = {};
    this.xmls = {};
  }

  /**
   * Cargar una imagen y devolver una promesa
   */
  loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = () => reject(`Error al cargar imagen: ${src}`);
      img.src = src;
    });
  }

  /**
   * Cargar un sonido (ogg/mp3)
   */
  loadSound(key, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener("canplaythrough", () => {
        this.sounds[key] = audio;
        resolve(audio);
      });
      audio.onerror = () => reject(`Error al cargar sonido: ${src}`);
      audio.src = src;
    });
  }

  /**
   * Cargar JSON
   */
  loadJSON(key, src) {
    return fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Error al cargar JSON: ${src}`);
        return res.json();
      })
      .then((data) => {
        this.jsons[key] = data;
        return data;
      });
  }

  /**
   * Cargar XML
   */
  loadXML(key, src) {
    return fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Error al cargar XML: ${src}`);
        return res.text();
      })
      .then((str) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, "application/xml");
        this.xmls[key] = xml;
        return xml;
      });
  }

  /**
   * Cargar múltiples assets en paralelo
   */
  loadAll(assets) {
    const promises = [];

    if (assets.images) {
      for (const [key, src] of Object.entries(assets.images)) {
        promises.push(this.loadImage(key, src));
      }
    }

    if (assets.sounds) {
      for (const [key, src] of Object.entries(assets.sounds)) {
        promises.push(this.loadSound(key, src));
      }
    }

    if (assets.jsons) {
      for (const [key, src] of Object.entries(assets.jsons)) {
        promises.push(this.loadJSON(key, src));
      }
    }

    if (assets.xmls) {
      for (const [key, src] of Object.entries(assets.xmls)) {
        promises.push(this.loadXML(key, src));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Obtener un asset ya cargado
   */
  get(type, key) {
    if (type === "image") return this.images[key];
    if (type === "sound") return this.sounds[key];
    if (type === "json") return this.jsons[key];
    if (type === "xml") return this.xmls[key];
    return null;
  }
}

// ⚡ También exportar funciones directas si quieres importarlas
export const loadXML = (key, src, loader = new AssetsLoader()) =>
  loader.loadXML(key, src);
