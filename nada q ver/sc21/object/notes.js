// sc/object/notes.js
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";

class NotesAssets extends SpriteAnim {
  constructor() {
    super("NOTE_assets");
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return this; // 🔒 evita recargar

    try {
      await this.init({ imageName: "NOTE_assets" });

      // Animaciones flechas
      this.addAnim("purple", "arrowLEFT");
      this.addAnim("blue", "arrowDOWN");
      this.addAnim("green", "arrowUP");
      this.addAnim("red", "arrowRIGHT");

      // Press
      this.addAnim("purple press", "left press", 24, false);
      this.addAnim("blue press", "down press", 24, false);
      this.addAnim("green press", "up press", 24, false);
      this.addAnim("red press", "right press", 24, false);

      // Confirm
      this.addAnim("purple confirm", "left confirm", 24, false);
      this.addAnim("blue confirm", "down confirm", 24, false);
      this.addAnim("green confirm", "up confirm", 24, false);
      this.addAnim("red confirm", "right confirm", 24, false);

      // Notas
      this.addAnim("purple note", "purple0000");
      this.addAnim("blue note", "blue0000");
      this.addAnim("green note", "green0000");
      this.addAnim("red note", "red0000");

      // Sustains
      this.addAnim("purple hold piece", "purple hold piece0000");
      this.addAnim("purple hold end", "purple end hold0000"); // corregí el typo
      this.addAnim("blue hold piece", "blue hold piece0000");
      this.addAnim("blue hold end", "blue hold end0000");
      this.addAnim("green hold piece", "green hold piece0000");
      this.addAnim("green hold end", "green hold end0000");
      this.addAnim("red hold piece", "red hold piece0000");
      this.addAnim("red hold end", "red hold end0000");

      this.loaded = true;
      console.log("✅ NotesAssets cargado con sustains");
    } catch (err) {
      console.error("❌ Error cargando NotesAssets:", err);
    }

    return this;
  }
}

// 🔹 Singleton
const NotesAssetsInstance = new NotesAssets();

// 🔹 Promesa de precache
const NotesAssetsPromise = NotesAssetsInstance.load();

export default NotesAssetsInstance;
export { NotesAssetsPromise };
