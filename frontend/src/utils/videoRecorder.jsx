export function startRecording(stream, onData) {
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) onData(e.data);
  };
  recorder.start(2000); // send chunks every 2s
  return recorder;
}
