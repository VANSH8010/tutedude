// src/utils/focusDetection.jsx

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

let lookAwayTimer = null;
let noFaceTimer = null;
let focusLost = false;

/**
 * Starts focus detection on the given video element.
 * Logs events using the provided logEvent callback.
 *
 * @param {HTMLVideoElement} videoEl - The video element to analyze.
 * @param {function} logEvent - Callback to log events like "looked away" or "no face detected".
 */
export async function startFocusDetection(videoEl, logEvent) {
  // Create the face detector
  const detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    }
  );

  // Run detection every 500ms
  setInterval(async () => {
    try {
      const predictions = await detector.estimateFaces(videoEl);

      // ---- No face detected ----
      if (predictions.length === 0) {
        if (!noFaceTimer) {
          noFaceTimer = setTimeout(() => {
            logEvent("No face detected for 10s");
          }, 10000);
        }
        return;
      } else {
        if (noFaceTimer) {
          clearTimeout(noFaceTimer);
          noFaceTimer = null;
        }
      }

      // ---- Look away detection ----
      const nose = predictions[0].keypoints.find((p) => p.name === "noseTip");
      const thresholdX = 0.1 * videoEl.width; // 10% from left/right

      if (nose && (nose.x < thresholdX || nose.x > videoEl.width - thresholdX)) {
        if (!lookAwayTimer) {
          lookAwayTimer = setTimeout(() => {
            focusLost = true;
            logEvent("Candidate looked away >5s");
          }, 5000);
        }
      } else {
        if (lookAwayTimer) {
          clearTimeout(lookAwayTimer);
          lookAwayTimer = null;
        }
        if (focusLost) {
          logEvent("Candidate refocused");
          focusLost = false;
        }
      }
    } catch (err) {
      console.error("Focus detection error:", err);
    }
  }, 500);
}
