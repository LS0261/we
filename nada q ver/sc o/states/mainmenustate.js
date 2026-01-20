// sc/states/mainmenustate.js
import FlxSpriteJS from "../utils/FlxSpriteJS.js";
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";
import TitleState from './TitleState.js';
import FreeplayState from "./freeplaystate.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";

export default class MainMenuState {
  constructor(game) {
    this.game = game;

    this.menuItems = [];
    this.curSelected = 0;
    this.selectedSomethin = false;
    this.curColumn = 'CENTER'; // LEFT, CENTER, RIGHT
    this.allowMouse = true;

    this.camY = 0;
    this.camTargetY = 0;
    this.scrollSpeed = 0.15;

    this.leftItem = null;
    this.rightItem = null;

    this.optionNames = ['story_mode','freeplay','mods','credits'];
    this.leftOption = 'achievements';
    this.rightOption = 'options';

    this.init();
  }

  async init() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    // --- Fondo ---
    this.bg = new FlxSpriteJS(-80, 0);
    await this.bg.loadGraphic(Paths.image('menuBG'));
    this.bg.antialiasing = true;
    this.bg.setGraphicSize(this.bg.width * 1.175);
    this.bg.updateHitbox();
    this.bg.screenCenter();

    // --- Items centrales ---
    const spacing = 140;
    const offsetForFewer = (4 - this.optionNames.length) * 70;
    for (let i = 0; i < this.optionNames.length; i++) {
      const name = this.optionNames[i];
      const anim = new SpriteAnim(`mainmenu/menu_${name}`);
      await anim.init({ imageName: `mainmenu/menu_${name}`, position: [0, i*spacing+90+offsetForFewer], scale: 1 });
      anim.addAnim('idle', `${name} idle`, 24, true);
      anim.addAnim('selected', `${name} selected`, 24, true);
      anim.play('idle');

      // Usa el getter width, no image.width
      anim.pos[0] = (this.canvas.width - anim.width) / 2;
      anim.baseY = anim.pos[1];
      this.menuItems.push(anim);
    }

    // --- Items laterales ---
    if(this.leftOption){
      this.leftItem = new SpriteAnim(`mainmenu/menu_${this.leftOption}`);
      await this.leftItem.init({ imageName: `mainmenu/menu_${this.leftOption}`, position: [60,490], scale: 1 });
      this.leftItem.addAnim('idle', `${this.leftOption} idle`,24,true);
      this.leftItem.addAnim('selected', `${this.leftOption} selected`,24,true);
      this.leftItem.play('idle');
      this.leftItem.baseY = this.leftItem.pos[1];
    }

    if(this.rightOption){
      this.rightItem = new SpriteAnim(`mainmenu/menu_${this.rightOption}`);
      await this.rightItem.init({ imageName: `mainmenu/menu_${this.rightOption}`, position: [this.canvas.width-60,490], scale: 1 });
      this.rightItem.addAnim('idle', `${this.rightOption} idle`,24,true);
      this.rightItem.addAnim('selected', `${this.rightOption} selected`,24,true);
      this.rightItem.play('idle');

      // Usa getter width aquí también
      this.rightItem.pos[0] -= this.rightItem.width;
      this.rightItem.baseY = this.rightItem.pos[1];
    }

    // Seleccionar primer item
    this.menuItems[this.curSelected].play('selected');
    this.updateCamTarget();

    // --- Loop y controles ---
    this.lastTimestamp = performance.now();
    requestAnimationFrame((t)=>this.loop(t));
    window.addEventListener("keydown",(e)=>this.handleInput(e));
    window.addEventListener("mousemove",(e)=>this.handleMouse(e));
    window.addEventListener("click",(e)=>this.handleClick(e));
window.addEventListener("touchstart", (e) => this.handleTouchStart(e));
window.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

handleInput(e){
  if(this.selectedSomethin) return;

  if(e.key==="ArrowDown") this.changeItem(1);
  else if(e.key==="ArrowUp") this.changeItem(-1);
  else if(e.key==="Enter") this.selectItem();
  else if(e.key==="Escape") {
    this.selectedSomethin = true;
    console.log("Cancelar menú -> volver al título");

    this.game.changeState(new TitleState(this.game));
  }
}
handleMouse(e){
  if(!this.allowMouse || this.selectedSomethin) return;

  const rect = this.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let hoveredItem = false;

  // Items centrales (con scroll Y)
  for(let i=0; i<this.menuItems.length; i++){
    const item = this.menuItems[i];
    const [ox, oy] = item.offsets[item.animName] || [0, 0];
    const hitboxX = item.pos[0] + ox;
    const hitboxY = item.baseY - this.camY + oy;

    if(mouseX >= hitboxX && mouseX <= hitboxX + item.width &&
       mouseY >= hitboxY && mouseY <= hitboxY + item.height){
      if(this.curSelected !== i || this.curColumn !== 'CENTER'){
        this.deselectCurrentItem();

        this.curColumn = 'CENTER';
        this.curSelected = i;
        this.changeItem();
      }
      hoveredItem = true;
      break;
    }
  }

  // Items laterales (sin scroll)
  if(!hoveredItem && this.leftItem){
    const [ox, oy] = this.leftItem.offsets[this.leftItem.animName] || [0, 0];
    const hitboxX = this.leftItem.pos[0] + ox;
    const hitboxY = this.leftItem.baseY + oy;

    if(mouseX >= hitboxX && mouseX <= hitboxX + this.leftItem.width &&
       mouseY >= hitboxY && mouseY <= hitboxY + this.leftItem.height){
      if(this.curColumn !== 'LEFT'){
        this.deselectCurrentItem();

        this.curColumn = 'LEFT';
        this.changeItem();
      }
      hoveredItem = true;
    }
  }

  if(!hoveredItem && this.rightItem){
    const [ox, oy] = this.rightItem.offsets[this.rightItem.animName] || [0, 0];
    const hitboxX = this.rightItem.pos[0] + ox;
    const hitboxY = this.rightItem.baseY + oy;

    if(mouseX >= hitboxX && mouseX <= hitboxX + this.rightItem.width &&
       mouseY >= hitboxY && mouseY <= hitboxY + this.rightItem.height){
      if(this.curColumn !== 'RIGHT'){
        this.deselectCurrentItem();

        this.curColumn = 'RIGHT';
        this.changeItem();
      }
      hoveredItem = true;
    }
  }
}

  // Nueva función para poner en idle el item actualmente seleccionado
  deselectCurrentItem() {
    let selectedItem;
    switch(this.curColumn){
      case 'CENTER': selectedItem = this.menuItems[this.curSelected]; break;
      case 'LEFT': selectedItem = this.leftItem; break;
      case 'RIGHT': selectedItem = this.rightItem; break;
    }
    if(selectedItem) selectedItem.play('idle');
  }

  handleClick(e){
    if(this.selectedSomethin) return;
    this.selectItem();
  }

  changeItem(change=0){
    if(change !== 0) this.curColumn = 'CENTER';

    if(this.curColumn === 'CENTER') this.menuItems[this.curSelected].play('idle');

    if(this.curColumn === 'CENTER') {
      this.curSelected = (this.curSelected + change + this.menuItems.length) % this.menuItems.length;
    }

    // Reproducir anim seleccionada
    let selectedItem;
    switch(this.curColumn){
      case 'CENTER': selectedItem = this.menuItems[this.curSelected]; break;
      case 'LEFT': selectedItem = this.leftItem; break;
      case 'RIGHT': selectedItem = this.rightItem; break;
    }
    
    selectedItem.play('selected');
    const audio = new Audio(Paths.sound('scrollMenu'));
    audio.volume = 0.7;
    audio.play();
    this.updateCamTarget();

    if(this.scrollMenuSound){
      this.scrollMenuSound.currentTime = 0; // Reinicia el sonido para que suene bien seguido
      this.scrollMenuSound.play();
    }
    console.log("Item seleccionado:", this.curColumn === 'CENTER' ? this.optionNames[this.curSelected] : this.curColumn === 'LEFT' ? this.leftOption : this.rightOption);
  }

  updateCamTarget(){
    const selectedItem = this.curColumn === 'CENTER' ? this.menuItems[this.curSelected] : this.curColumn === 'LEFT' ? this.leftItem : this.rightItem;

    this.camTargetY = selectedItem.baseY - this.canvas.height/2 + selectedItem.height/2;
  }

selectItem(){
  let option = this.curColumn === 'CENTER' 
    ? this.optionNames[this.curSelected] 
    : this.curColumn === 'LEFT' 
      ? this.leftOption 
      : this.rightOption;

  console.log("Opción confirmada:", option);
  this.selectedSomethin = true;

  const audio = new Audio(Paths.sound("confirmMenu"));
  audio.volume = 0.7;
  audio.play();

  if(option === "story_mode"){
    // transición con delay de 1 segundo
    new CustomFadeTransition(this.game, 1.0, () => {
      this.game.changeState(new FreeplayState(this.game));
    });
  }
  else if(option === "freeplay"){
    alert("Aquí iría Story Mode");
  }
  else if(option === "mods"){
    alert("Aquí iría Mods");
  }
  else if(option === "credits"){
    alert("Aquí irían los Créditos");
  }
  else if(option === "achievements"){
    alert("Aquí irían los Logros");
  }
  else if(option === "options"){
    alert("Aquí irían las Opciones");
  }
}

loop(timestamp) {
  const delta = (timestamp - this.lastTimestamp)/1000;
  this.lastTimestamp = timestamp;

  // suavizar camY
  this.camY += (this.camTargetY - this.camY) * this.scrollSpeed;

  // actualizar items
  this.menuItems.forEach(item => item.update(delta));
  if(this.leftItem) this.leftItem.update(delta);
  if(this.rightItem) this.rightItem.update(delta);

  // --- dibujar ---
  this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

  this.bg.draw(this.ctx);

  // Dibuja items centrales con scroll
  this.menuItems.forEach(item => {
    const origY = item.pos[1];
    item.pos[1] = item.baseY - this.camY;
    item.draw(this.ctx);
    item.pos[1] = origY;
  });

  if(this.leftItem) this.leftItem.draw(this.ctx);
  if(this.rightItem) this.rightItem.draw(this.ctx);

  this.rafId = requestAnimationFrame((t)=>this.loop(t)); // ✅ guardar id
}

handleTouchStart(e) {
  if (!this.allowMouse || this.selectedSomethin) return;

  this.touchStart = e.touches[0];
}

handleTouchEnd(e) {
  if (!this.allowMouse || this.selectedSomethin) return;

  const touch = e.changedTouches[0];
  const rect = this.canvas.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;

  let tapped = false;

  // Reutilizamos el mismo sistema que el mouse
  const simulateMouseEvent = {
    clientX: touch.clientX,
    clientY: touch.clientY
  };

  this.handleMouse(simulateMouseEvent); // Para selección visual
  this.handleClick(simulateMouseEvent); // Para confirmar
}
// al final de MainMenuState.js
destroy() {
  console.log("Destruyendo MainMenuState...");

  // limpiar items
  this.menuItems = [];
  this.leftItem = null;
  this.rightItem = null;

  // quitar listeners
  window.removeEventListener("keydown", this.handleInput);
  window.removeEventListener("mousemove", this.handleMouse);
  window.removeEventListener("click", this.handleClick);
  window.removeEventListener("touchstart", this.handleTouchStart);
  window.removeEventListener("touchend", this.handleTouchEnd);

  // detener loop
  if (this.rafId) {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

}
