const Paths = {
  // Archivos de canciones
  songInst: (songName) => `assets/songs/${songName}/Inst.ogg`,
  songVoices: (songName, voiceFile = "Voices.ogg") => `assets/songs/${songName}/${voiceFile}`,
  songJSON: (songName) => `assets/data/songs/${songName}/${songName}.json`,
  songData: (songName) => `assets/data/songs/${songName}`,
  
  // Stages y weeks
  stageJSON: (name) => `assets/data/stages/${name}.json`,
  weekList: () => `assets/data/weeks/weekList.json`,

  // Imagen genérica (por nombre, sin carpeta extra)
  image: (name) => `assets/images/${name}.png`,

  // Imagen dentro de una carpeta (útil si organizas por subcarpetas)
  imageFrom: (folder, name) => `assets/images/${folder}/${name}.png`,

  // Sonidos genéricos
  sound: (name) => `assets/sounds/${name}.ogg`,

  // Música del juego
  music: (name) => `assets/music/${name}.ogg`,
  
  // Datos genéricos tipo JSON o XML
  json: (path) => `assets/data/${path}.json`,
  xml: (path) => `assets/images/${path}.xml`,
  txt: (path) => `assets/images/${path}.txt`,

  // Archivos estáticos en la raíz o directorio base
  file: (path) => `assets/${path}`,

  // Por ejemplo: notas tipo TextureAtlas
  textureAtlas: (name) => `assets/images/${name}.xml`,

  // 🔥 Ruta para archivos Lua de stages
  luaStage: (name) => `assets/scripts/stages/${name}.lua`,
};

export default Paths;
