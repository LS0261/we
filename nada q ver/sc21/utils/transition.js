// sc/utils/transition.js
window.playTransition = function(menuDiv, color = 'white', duration = 0.6, callback = null) {
  if (!menuDiv) return;

  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = color;
  flash.style.opacity = '0';
  flash.style.transition = `opacity ${duration}s ease-in-out`;
  flash.style.zIndex = '9999';
  menuDiv.appendChild(flash);

  // trigger
  requestAnimationFrame(() => { flash.style.opacity = '1'; });

  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
      if (callback) callback();
    }, duration * 1000);
  }, duration * 1000);
};
