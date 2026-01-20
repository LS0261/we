// AlphabetText.js
import Paths from "../backend/Paths.js";
import { SpriteAnim } from "../backend/SpriteAnim.js";

export class AlphabetText {
  static allLetters = null;

  static async loadAlphabetData(jsonName = "alphabet") {
    const path = Paths.json(jsonName); // path al JSON
    try {
      const res = await fetch(path);
      const data = await res.json();
      AlphabetText.allLetters = new Map();

      // Allowed characters
      if(data.allowed) {
        for (const c of data.allowed) {
          if(c !== " ") AlphabetText.allLetters.set(c.toLowerCase(), null);
        }
      }

      // Characters info
      if(data.characters) {
        for(const char in data.characters) {
          const ch = char.toLowerCase();
          if(AlphabetText.allLetters.has(ch)) {
            const info = data.characters[char];
            AlphabetText.allLetters.set(ch, {
              anim: info.animation || null,
              offsets: info.normal || [0,0],
              offsetsBold: info.bold || [0,0]
            });
          }
        }
      }

      // Fallback
      if(!AlphabetText.allLetters.has("?"))
        AlphabetText.allLetters.set("?", {anim:"question", offsets:[0,0], offsetsBold:[0,0]});

      console.log("Alphabet loaded", AlphabetText.allLetters);
    } catch(e) {
      console.error("Error loading alphabet JSON:", e);
    }
  }

  constructor(text, x, y, scale = 1, style = "normal", bold = false) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.style = style; // normal / lowercase / uppercase / bold
    this.bold = bold;
    this.letters = [];
    this.loaded = false;
  }

  async init() {
    this.font = new SpriteAnim("alphabet");
    await this.font.init({ imageName:"alphabet", scale: this.scale });

    this.letters = [];
    let posX = this.x;

    for(const char of this.text) {
      if(char === " ") { posX += 40 * this.scale; continue; }

      const lower = char.toLowerCase();
      let letterInfo = AlphabetText.allLetters.get(lower) || AlphabetText.allLetters.get("?");

      let postfix = this.bold ? "bold" : "normal";
      if(!this.bold && /^[a-z]$/i.test(lower)) {
        postfix = lower !== char ? "uppercase" : "lowercase";
      }

      const animName = (letterInfo.anim || lower) + " " + postfix;

      if(!this.font.frames[animName]) {
        console.warn(`Frame "${animName}" not found, fallback to question`);
        this.font.addAnim("question " + postfix, "question " + postfix, 24);
      }

      this.letters.push({
        char,
        frameName: animName,
        offsets: this.bold ? letterInfo.offsetsBold : letterInfo.offsets,
        x: posX,
        y: this.y
      });

      const f = this.font.frames[animName];
      posX += ((f?.frameWidth || f?.width || 20) + (letterInfo.offsets[0] || 0)) * this.scale;
    }

    this.loaded = true;
  }

  update(delta) {
    if(!this.loaded) return;
    this.font.update(delta);
  }

  draw(ctx) {
    if(!this.loaded) return;

    for(const letter of this.letters) {
      const f = this.font.frames[letter.frameName];
      if(!f) continue;

      const ox = (letter.offsets?.[0] || 0) * this.scale;
      const oy = (letter.offsets?.[1] || 0) * this.scale;

      ctx.drawImage(
        this.font.image,
        f.x, f.y, f.width, f.height,
        letter.x + ox, letter.y + oy,
        f.width * this.scale, f.height * this.scale
      );
    }
  }
}
