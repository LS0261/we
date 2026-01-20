// alphabet.js
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";

export class AlphaCharacter {
  static allLetters = new Map();

  static isTypeAlphabet(c) {
    const ascii = c.charCodeAt(0);
    return (ascii >= 65 && ascii <= 90) ||
           (ascii >= 97 && ascii <= 122) ||
           (ascii >= 192 && ascii <= 214) ||
           (ascii >= 216 && ascii <= 246) ||
           (ascii >= 248 && ascii <= 255);
  }

  static async loadAlphabetData(jsonName = "alphabet") {
    try {
      const res = await fetch(Paths.json(jsonName));
      const data = await res.json();

      AlphaCharacter.allLetters = new Map();

      // allowed characters
      if(data.allowed) {
        for(const c of data.allowed) {
          if(c !== " ") AlphaCharacter.allLetters.set(c.toLowerCase(), null);
        }
      }

      // characters info
      if(data.characters) {
        for(const char in data.characters) {
          const ch = char.toLowerCase();
          if(AlphaCharacter.allLetters.has(ch)) {
            const info = data.characters[char];
            AlphaCharacter.allLetters.set(ch, {
              anim: info.animation || null,
              offsets: info.normal || [0,0],
              offsetsBold: info.bold || [0,0]
            });
          }
        }
      }

      if(!AlphaCharacter.allLetters.has("?"))
        AlphaCharacter.allLetters.set("?", {anim: "question", offsets:[0,0], offsetsBold:[0,0]});
        
      console.log("Alphabet loaded", AlphaCharacter.allLetters);
    } catch(e) {
      console.error("Error loading alphabet JSON:", e);
    }
  }

  constructor(character = "?", parent = null) {
    this.character = character;
    this.parent = parent;
    this.alignOffset = 0;
    this.letterOffset = [0,0];
    this.row = 0;
    this.rowWidth = 0;
    this.scale = {x:1, y:1};
    this.animation = new SpriteAnim("alphabet");
    this.curLetter = null;
    this.x = 0;
    this.y = 0;
  }

  setupAlphaCharacter(x, y, character = null, bold = null) {
    this.x = x;
    this.y = y;

    if(this.parent != null) {
      if(bold == null) bold = this.parent.bold;
      this.scale.x = this.parent.scaleX;
      this.scale.y = this.parent.scaleY;
    }

    if(character != null) {
      this.character = character;
      const lower = character.toLowerCase();
      this.curLetter = AlphaCharacter.allLetters.get(lower) || AlphaCharacter.allLetters.get("?");

      let postfix = '';
      if(!bold) {
        if(AlphaCharacter.isTypeAlphabet(lower)) {
          postfix = lower !== character ? ' uppercase' : ' lowercase';
        } else postfix = ' normal';
      } else postfix = ' bold';

      let alphaAnim = this.curLetter?.anim || lower;
      let anim = alphaAnim + postfix;

      this.animation.addByPrefix(anim, anim, 24);
      this.animation.play(anim, true);

      if(!this.animation.curAnim) {
        anim = 'question' + postfix;
        this.animation.addByPrefix(anim, anim, 24);
        this.animation.play(anim, true);
      }
    }
    this.updateHitbox();
  }

  updateLetterOffset() {
    if(!this.animation.curAnim) return;

    let add = 110;
    if(this.animation.curAnim.name.endsWith('bold')) {
      if(this.curLetter?.offsetsBold) this.letterOffset = [...this.curLetter.offsetsBold];
      add = 70;
    } else {
      if(this.curLetter?.offsets) this.letterOffset = [...this.curLetter.offsets];
    }

    add *= this.scale.y;
    this.offset = {
      x: (this.offset?.x || 0) + this.letterOffset[0] * this.scale.x,
      y: (this.offset?.y || 0) + this.letterOffset[1] * this.scale.y - (add - (this.height || 0))
    };
  }

  updateHitbox() {
    this.updateLetterOffset();
  }
}

// ---------------------------------------------

export class Alphabet {
  static Y_PER_ROW = 85;

  constructor(x = 0, y = 0, text = "", bold = true) {
    this.x = x;
    this.y = y;
    this.startPosition = {x, y};
    this.text = text;
    this.bold = bold;
    this.letters = [];
    this.scaleX = 1;
    this.scaleY = 1;
    this.alignment = "LEFT"; // LEFT | CENTERED | RIGHT
    this.rows = 0;
    this.distancePerItem = {x:20, y:120};
    this.isMenuItem = false;
    this.targetY = 0;
    this.changeX = true;
    this.changeY = true;

    if(text) this.setText(text);
  }

  setAlignmentFromString(align) {
    const l = align.toLowerCase().trim();
    if(l === "right") this.alignment = "RIGHT";
    else if(l === "center" || l === "centered") this.alignment = "CENTERED";
    else this.alignment = "LEFT";
    this.updateAlignment();
  }

  updateAlignment() {
    for(const letter of this.letters) {
      let newOffset = 0;
      switch(this.alignment) {
        case "CENTERED": newOffset = letter.rowWidth/2; break;
        case "RIGHT": newOffset = letter.rowWidth; break;
        default: newOffset = 0;
      }

      letter.offset.x -= letter.alignOffset || 0;
      letter.alignOffset = newOffset * this.scaleX;
      letter.offset.x += letter.alignOffset;
    }
  }

  setText(newText) {
    newText = newText.replace("\\n","\n");
    this.clearLetters();
    this.createLetters(newText);
    this.updateAlignment();
    this.text = newText;
  }

  clearLetters() {
    this.letters = [];
    this.rows = 0;
  }

  setScale(newX, newY = null) {
    if(newY == null) newY = newX;
    const ratioX = newX / this.scaleX;
    const ratioY = newY / this.scaleY;
    this.scaleX = newX;
    this.scaleY = newY;
    this.softReloadLetters(ratioX, ratioY);
  }

  softReloadLetters(ratioX = 1, ratioY = null) {
    if(ratioY == null) ratioY = ratioX;
    for(const letter of this.letters) {
      letter.setupAlphaCharacter(
        (letter.x - this.x) * ratioX + this.x,
        (letter.y - this.y) * ratioY + this.y,
        letter.character,
        this.bold
      );
    }
  }

  createLetters(newText) {
    let xPos = 0;
    let rowData = [];
    this.rows = 0;
    let consecutiveSpaces = 0;

    for(const character of newText) {
      if(character !== '\n') {
        const spaceChar = character === " " || (this.bold && character === "_");
        if(spaceChar) consecutiveSpaces++;

        const isAlphabet = AlphaCharacter.isTypeAlphabet(character.toLowerCase());
        const exists = AlphaCharacter.allLetters.has(character.toLowerCase());
        if(exists && (!this.bold || !spaceChar)) {
          if(consecutiveSpaces > 0) {
            xPos += 28 * consecutiveSpaces * this.scaleX;
            rowData[this.rows] = xPos;
          }
          consecutiveSpaces = 0;

          const letter = new AlphaCharacter(character, this);
          letter.scale.x = this.scaleX;
          letter.scale.y = this.scaleY;
          letter.rowWidth = 0;
          letter.setupAlphaCharacter(xPos, this.rows*Alphabet.Y_PER_ROW*this.scaleY, character, this.bold);

          letter.row = this.rows;
          const off = this.bold ? 0 : 2;
          xPos += (letter.width || 20) + (letter.letterOffset[0]+off) * this.scaleX;
          rowData[this.rows] = xPos;

          this.letters.push(letter);
        }
      } else {
        xPos = 0;
        this.rows++;
      }
    }

    for(const letter of this.letters) {
      letter.rowWidth = rowData[letter.row] / this.scaleX;
    }

    if(this.letters.length > 0) this.rows++;
  }

  snapToPosition() {
    if(this.isMenuItem) {
      if(this.changeX) this.x = (this.targetY*this.distancePerItem.x)+this.startPosition.x;
      if(this.changeY) this.y = (this.targetY*1.3*this.distancePerItem.y)+this.startPosition.y;
    }
  }

  update(elapsed) {
    if(this.isMenuItem) {
      const lerpVal = Math.exp(-elapsed*9.6);
      if(this.changeX) this.x = lerp((this.targetY*this.distancePerItem.x)+this.startPosition.x, this.x, lerpVal);
      if(this.changeY) this.y = lerp((this.targetY*1.3*this.distancePerItem.y)+this.startPosition.y, this.y, lerpVal);
    }
  }
}

// helper lerp
function lerp(a,b,t){return a*(1-t)+b*t;}
