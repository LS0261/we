export function getProgress(ps) {
  if (!ps.audioInst || !ps.audioInst.duration) return 0;
  return ps.audioInst.currentTime / ps.audioInst.duration;
}
