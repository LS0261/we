import TitleState from './titlestate.js';  
import { Game } from './game.js';  

export function startTitle() {  
  // --- Botón Start ---
  const startBtn = document.createElement('button');  
  startBtn.textContent = 'Start';  
  startBtn.style.position = 'absolute';  
  startBtn.style.top = '50%';  
  startBtn.style.left = '45%';  // un poco a la izquierda
  startBtn.style.transform = 'translate(-50%, -50%)';  
  startBtn.style.fontSize = '32px';  
  startBtn.style.padding = '20px 40px';  
  startBtn.style.cursor = 'pointer';  
  startBtn.style.border = 'none';  
  startBtn.style.borderRadius = '10px';  
  startBtn.style.background = '#1e90ff';  
  startBtn.style.color = '#fff';  
  startBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';  
  startBtn.style.textAlign = 'center';  
  startBtn.style.zIndex = '9999';  
  document.body.appendChild(startBtn);  

  // --- Botón Fullscreen ---
  const fsBtn = document.createElement('button');  
  fsBtn.textContent = 'Fullscreen';  
  fsBtn.style.position = 'absolute';  
  fsBtn.style.top = '50%';  
  fsBtn.style.left = '55%';  // un poco a la derecha
  fsBtn.style.transform = 'translate(-50%, -50%)';  
  fsBtn.style.fontSize = '28px';  
  fsBtn.style.padding = '20px 40px';  
  fsBtn.style.cursor = 'pointer';  
  fsBtn.style.border = 'none';  
  fsBtn.style.borderRadius = '10px';  
  fsBtn.style.background = '#32cd32';  
  fsBtn.style.color = '#fff';  
  fsBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';  
  fsBtn.style.textAlign = 'center';  
  fsBtn.style.zIndex = '9999';  
  document.body.appendChild(fsBtn);  

  function scaleCanvasToWindow(canvas, gameWidth = 1280, gameHeight = 720) {
    const scale = Math.min(window.innerWidth / gameWidth, window.innerHeight / gameHeight);
    canvas.style.width = gameWidth * scale + 'px';
    canvas.style.height = gameHeight * scale + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
  }

  function goFullscreen() {  
    const docEl = document.documentElement;  
    if (docEl.requestFullscreen) docEl.requestFullscreen();  
    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();  
    else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();  
  }  

  function startGame() {  
    if (startBtn.parentNode) document.body.removeChild(startBtn);  
    if (fsBtn.parentNode) document.body.removeChild(fsBtn);  

    Game.start();  

    const canvas = document.getElementById('canvas');
    if (canvas) scaleCanvasToWindow(canvas);

    window.addEventListener('resize', () => {
      if (canvas) scaleCanvasToWindow(canvas);
    });
  }  

  startBtn.addEventListener('click', startGame);  
  startBtn.addEventListener('touchstart', startGame);  

  fsBtn.addEventListener('click', goFullscreen);  
  fsBtn.addEventListener('touchstart', goFullscreen);  
}