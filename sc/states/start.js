import { Game } from './game.js';

export async function startTitle() {
  // --- Esperar fuentes ---
  await document.fonts.ready;

  // =========================
  // BOTÓN START
  // =========================
  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  startBtn.style.position = 'absolute';
  startBtn.style.top = '50%';
  startBtn.style.left = '50%';
  startBtn.style.transform = 'translate(-50%, -50%)';
  startBtn.style.fontSize = '32px';
  startBtn.style.padding = '20px 40px';
  startBtn.style.cursor = 'pointer';
  startBtn.style.border = 'none';
  startBtn.style.borderRadius = '10px';
  startBtn.style.background = '#1e90ff';
  startBtn.style.color = '#fff';
  startBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
  startBtn.style.zIndex = '9999';
  startBtn.style.fontFamily = 'VRCFont, Arial, sans-serif';
  document.body.appendChild(startBtn);

  // =========================
  // BOTÓN FULLSCREEN (IMAGEN)
  // =========================
  const fsBtn = document.createElement('img');
  fsBtn.src = 'assets/images/ui/play/screen.png';
  fsBtn.alt = 'Fullscreen';
  fsBtn.style.position = 'absolute';
  fsBtn.style.bottom = '12px';
  fsBtn.style.right = '12px';
  fsBtn.style.width = '42px';
  fsBtn.style.height = '42px';
  fsBtn.style.cursor = 'pointer';
  fsBtn.style.opacity = '0.55';
  fsBtn.style.zIndex = '9999';
  fsBtn.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  document.body.appendChild(fsBtn);

  fsBtn.addEventListener('mouseenter', () => {
    fsBtn.style.transform = 'scale(1.1)';
    fsBtn.style.opacity = '1';
  });

  fsBtn.addEventListener('mouseleave', () => {
    fsBtn.style.transform = 'scale(1)';
    fsBtn.style.opacity = '0.55';
  });

  // =========================
  // ESCALAR CANVAS
  // =========================
  function scaleCanvasToWindow(canvas, gameWidth = 1280, gameHeight = 720) {
    const scale = Math.min(
      window.innerWidth / gameWidth,
      window.innerHeight / gameHeight
    );

    canvas.style.width = gameWidth * scale + 'px';
    canvas.style.height = gameHeight * scale + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
  }

  // =========================
  // FULLSCREEN REAL (SIN BOTÓN VERDE)
  // =========================
  function goFullscreen() {
    const gameContainer = document.getElementById('gameContainer');

    if (!document.fullscreenElement) {
      gameContainer.requestFullscreen({ navigationUI: 'hide' })
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen();
    }
  }

  fsBtn.addEventListener('click', goFullscreen);
  fsBtn.addEventListener('touchstart', goFullscreen);

  // =========================
  // START GAME
  // =========================
  function startGame() {
    if (startBtn.parentNode) document.body.removeChild(startBtn);

    Game.start();

    const canvas = document.getElementById('canvas');
    if (canvas) scaleCanvasToWindow(canvas);

    window.addEventListener('resize', () => {
      if (canvas) scaleCanvasToWindow(canvas);
    });
  }

  startBtn.addEventListener('click', startGame);
  startBtn.addEventListener('touchstart', startGame);
}
