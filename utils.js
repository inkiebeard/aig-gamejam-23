function remap(value, initialLow, initialHigh, desiredLow, desiredHigh) {
  value = Math.min(Math.max(value, initialLow), initialHigh);
  const percentage = (value - initialLow) / (initialHigh - initialLow);

  return desiredLow + percentage * (desiredHigh - desiredLow);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function humanReadableTime(time) {
  time = time / 1000
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function stopAllSounds() {
  for (const sound of Object.values(sounds)) {
    sound.stop();
  }
}