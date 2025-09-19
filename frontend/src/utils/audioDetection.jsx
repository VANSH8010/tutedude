export function startAudioDetection(logEvent) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const mic = audioContext.createMediaStreamSource(stream);
    mic.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;

      if (avg > 120) {
        logEvent("Background noise / voices detected");
      }
    }, 2000);
  });
}
