import FlxSpriteJS from '../utils/FlxSpriteJS.js';
import Paths from '../backend/Paths.js';
import ClientPrefs from '../backend/clientPrefs.js';

export default class BGSpriteJS extends FlxSpriteJS {
    constructor(image, x = 0, y = 0, scrollX = 1, scrollY = 1, animArray = null, loop = false, folder = null) {
        super(x, y);

        this.idleAnim = null;
        this.animation = {
            anims: {},
            current: null,
            playing: false,
            frame: 0,
            loop: loop,
            addByPrefix: (name, prefix, fps = 24, loop = false) => {
                this.animation.anims[name] = {
                    prefix: prefix,
                    fps: fps,
                    loop: loop,
                    frames: Paths.getSparrowAtlas(image, folder, prefix) // Debe devolver array de frames
                };
            },
            play: (name, force = false) => {
                if (this.animation.current !== name || force) {
                    this.animation.current = name;
                    this.animation.frame = 0;
                    this.animation.playing = true;
                }
            },
            update: (dt) => {
                const anim = this.animation.anims[this.animation.current];
                if (!anim || !this.animation.playing) return;

                this.animation.frame += anim.fps * dt;
                if (this.animation.frame >= anim.frames.length) {
                    if (anim.loop) {
                        this.animation.frame = 0;
                    } else {
                        this.animation.playing = false;
                        this.animation.frame = anim.frames.length - 1;
                    }
                }
                this.image = anim.frames[Math.floor(this.animation.frame)];
            }
        };

        if (animArray && Array.isArray(animArray)) {
            for (let i = 0; i < animArray.length; i++) {
                const anim = animArray[i];
                this.animation.addByPrefix(anim, anim, 24, loop);
                if (this.idleAnim === null) {
                    this.idleAnim = anim;
                    this.animation.play(anim);
                }
            }
        } else {
            if (image) {
                try {
                    const imgPath = Paths.image(image, folder);
                    this.loadGraphic(imgPath);
                } catch (err) {
                    console.error(err);
                }
            }
            this.active = false;
        }

        this.scrollFactor = [scrollX, scrollY];
        this.antialiasing = ClientPrefs?.data?.antialiasing ?? true;
    }

    dance(forceplay = false) {
        if (this.idleAnim != null) {
            this.animation.play(this.idleAnim, forceplay);
        }
    }

    update(dt) {
        this.animation.update(dt);
    }

    draw(ctx) {
        super.draw(ctx);
    }
    add(sprite) {
    this.members.push(sprite);
    return sprite; // Como FlxGroup, devuelve el sprite
}
}
