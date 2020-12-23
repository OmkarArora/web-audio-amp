const volume = document.getElementById("volume");
const bass = document.getElementById("bass");
const mid = document.getElementById("mid");
const treble = document.getElementById("treble");
const visualizer = document.getElementById("visualizer");
const muteBtn = document.querySelector(".mute");

const audioContext = new AudioContext();
// Try fftSize values - 128, 1024
const analyserNode = new AnalyserNode(audioContext, { fftSize: 256 });
const gainNode = new GainNode(audioContext, { gain: volume.value });
const bassEQ = new BiquadFilterNode(audioContext, {
  type: "lowshelf",
  frequency: 500,
  gain: bass.value,
});
const midEQ = new BiquadFilterNode(audioContext, {
  type: "peaking",
  Q: Math.SQRT1_2,
  frequency: 1500,
  gain: mid.value,
});
const trebleEQ = new BiquadFilterNode(audioContext, {
  type: "highshelf",
  frequency: 3000,
  gain: treble.value,
});

init();
function init(){
    setupEventListeners();
    setupContext();
    resize();
    drawVisualizer();
}

function setupEventListeners() {
  window.addEventListener("resize", resize);

  volume.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value);
    // gainNode.gain.value = value;

    // This is better method, smoother transitions
    gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
  });

  bass.addEventListener("input", (event) => {
    const value = parseInt(event.target.value);
    bassEQ.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
  });

  mid.addEventListener("input", (event) => {
    const value = parseInt(event.target.value);
    midEQ.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
  });

  treble.addEventListener("input", (event) => {
    const value = parseInt(event.target.value);
    trebleEQ.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
  });

  muteBtn.addEventListener("click", () => {
    // 0 - muted
    // 1 - unmuted
    if (muteBtn.id === "") {
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      muteBtn.id = "activated";
      muteBtn.textContent = "Unmute";
    } else {
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      muteBtn.id = "";
      muteBtn.textContent = "Mute";
    }
  });
}

async function setupContext() {
  const userAudio = await getUserAudio();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const source = audioContext.createMediaStreamSource(userAudio);
  source
    .connect(bassEQ)
    .connect(midEQ)
    .connect(trebleEQ)
    .connect(gainNode)
    .connect(analyserNode)
    .connect(audioContext.destination);
}

function getUserAudio() {
  // set browser flags to false so we get raw audio
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      latency: 0,
    },
  });
}

function drawVisualizer() {
  // If muted, do not display visualizer
  if (muteBtn.id === "activated") {
    visualizer.style.display = "none";
  } else {
    visualizer.style.display = "unset";
  }
  requestAnimationFrame(drawVisualizer);
  //  Number of frequencies
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);

  //   Canvas measurements
  const width = visualizer.width;
  const height = visualizer.height;

  const barWidth = width / bufferLength;

  const canvasContext = visualizer.getContext("2d");
  canvasContext.clearRect(0, 0, width, height);

  dataArray.forEach((item, index) => {
    //   item is frequency value
    // item ranges from 0 to 255
    const y = ((item / 255) * height) / 2;
    const x = barWidth * index;

    // Hue goes from 0 to 360
    // We are using 0 to 200 values
    canvasContext.fillStyle = `hsl(${(y / height) * 2 * 200}, 100%, 50%)`;
    canvasContext.fillRect(x, height - y, barWidth, y);
  });
}

// makes canvas items look better by adjusting to device display
function resize() {
  visualizer.width = visualizer.clientWidth * window.devicePixelRatio;
  visualizer.height = visualizer.clientHeight * window.devicePixelRatio;
}


