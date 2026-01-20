// sc/object/notes.js
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";
import AssetsLoader, { loadXML } from "../backend/assetsLoader.js";

const loader = new AssetsLoader(); // 👈 crea un loader

class NotesAssets extends SpriteAnim {
  constructor() {
    super("NOTE_assets");
    this.loaded = false;
  }

async load() {
  try {
    await this.init({ imageName: "NOTE_assets" });

    // Animaciones de notas
    this.addAnim("purple", "arrowLEFT");
    this.addAnim("blue", "arrowDOWN");
    this.addAnim("green", "arrowUP");
    this.addAnim("red", "arrowRIGHT");

    this.addAnim("purple press", "left press", 24, false);
    this.addAnim("blue press", "down press", 24, false);
    this.addAnim("green press", "up press", 24, false);
    this.addAnim("red press", "right press", 24, false);

    this.addAnim("purple confirm", "left confirm", 24, false);
this.addAnim("blue confirm", "down confirm", 24, false);
this.addAnim("green confirm", "up confirm", 24, false);
this.addAnim("red confirm", "right confirm", 24, false);
    this.addAnim("purple note", "purple0");
    this.addAnim("blue note", "blue0");
    this.addAnim("green note", "green0");
    this.addAnim("red note", "red0");

    this.loaded = true;
    console.log("✅ NotesAssets cargado");
  } catch (err) {
    console.error("❌ Error cargando NotesAssets:", err);
  }
}

}

const NotesAssetsInstance = new NotesAssets();
const NotesAssetsPromise = NotesAssetsInstance.load().then(() => NotesAssetsInstance);

export default NotesAssetsInstance;
export { NotesAssetsPromise };
