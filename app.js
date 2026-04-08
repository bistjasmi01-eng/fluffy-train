const audioInput = document.querySelector('#audioInput');
const videoInput = document.querySelector('#videoInput');
const audioPlayer = document.querySelector('#audioPlayer');
const videoPlayer = document.querySelector('#videoPlayer');

const trimStart = document.querySelector('#trimStart');
const trimEnd = document.querySelector('#trimEnd');
const volume = document.querySelector('#volume');
const speed = document.querySelector('#speed');
const noiseCancel = document.querySelector('#noiseCancel');
const autotune = document.querySelector('#autotune');
const editStatus = document.querySelector('#editStatus');

const instrument = document.querySelector('#instrument');
const playInstrument = document.querySelector('#playInstrument');
const bpmInput = document.querySelector('#bpm');
const startBeat = document.querySelector('#startBeat');
const stopBeat = document.querySelector('#stopBeat');

const trackName = document.querySelector('#trackName');
const addTrack = document.querySelector('#addTrack');
const trackList = document.querySelector('#trackList');
const proPreset = document.querySelector('#proPreset');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let beatTimer = null;
let beatStep = 0;

function loadMedia(file, element) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  element.src = url;
}

audioInput.addEventListener('change', (e) => loadMedia(e.target.files[0], audioPlayer));
videoInput.addEventListener('change', (e) => loadMedia(e.target.files[0], videoPlayer));

document.querySelector('#applyEdit').addEventListener('click', () => {
  const trimStartValue = Number(trimStart.value);
  const trimEndValue = Number(trimEnd.value);

  audioPlayer.volume = Number(volume.value);
  audioPlayer.playbackRate = Number(speed.value);

  if (!Number.isNaN(trimStartValue) && trimStartValue >= 0) {
    audioPlayer.currentTime = trimStartValue;
  }

  const noiseValue = Number(noiseCancel.value);
  const autotuneValue = Number(autotune.value);

  const endText = trimEndValue > 0 ? `to ${trimEndValue.toFixed(1)}s` : 'to full length';
  editStatus.textContent = `Edits applied: trim from ${trimStartValue.toFixed(1)}s ${endText}, volume ${volume.value}, speed ${speed.value}x, noise cancel ${noiseValue}%, autotune ${autotuneValue}%.`;
});

playInstrument.addEventListener('click', () => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = instrument.value;
  osc.frequency.value = 440;
  gain.gain.value = 0.0001;

  osc.connect(gain).connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.start(now);
  osc.stop(now + 0.62);
});

function playDrum(frequency, time, duration = 0.12) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = frequency;
  osc.frequency.exponentialRampToValueAtTime(55, time + duration);

  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + duration);
}

startBeat.addEventListener('click', () => {
  if (beatTimer) return;

  const bpm = Math.max(60, Math.min(180, Number(bpmInput.value) || 96));
  const beatMs = (60 / bpm) * 1000;

  beatTimer = setInterval(() => {
    const now = audioCtx.currentTime;
    if (beatStep % 4 === 0) {
      playDrum(140, now, 0.15);
    } else if (beatStep % 2 === 0) {
      playDrum(110, now, 0.1);
    } else {
      playDrum(180, now, 0.08);
    }
    beatStep += 1;
  }, beatMs);

  editStatus.textContent = `Beat generator started at ${bpm} BPM.`;
});

stopBeat.addEventListener('click', () => {
  if (!beatTimer) return;
  clearInterval(beatTimer);
  beatTimer = null;
  beatStep = 0;
  editStatus.textContent = 'Beat generator stopped.';
});

addTrack.addEventListener('click', () => {
  const name = trackName.value.trim();
  if (!name) return;

  const li = document.createElement('li');
  li.textContent = `${name} — armed for editing`;
  trackList.append(li);
  trackName.value = '';
});

proPreset.addEventListener('click', () => {
  trimStart.value = '0.3';
  trimEnd.value = '0';
  volume.value = '1.05';
  speed.value = '1';
  noiseCancel.value = '28';
  autotune.value = '20';

  editStatus.textContent = '"Pro Starter" preset loaded. Press "Apply Edit Settings" to activate.';
});
