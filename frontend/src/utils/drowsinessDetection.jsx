// src/utils/drowsinessDetection.jsx

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

let eyeClosureTimer = null;

/**
 * Euclidean distance between two points
 */
function euclideanDist(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Eye Aspect Ratio (EAR) calculation
 */
function getEAR(eye) {
  const A = euclideanDist(eye[1], eye[5]);
  const B = euclideanDist(eye[2], eye[4]);
  const C = euclideanDist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

/**
 * Starts drowsiness detection on the given video element.
 * Logs events using logEvent callback.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {function} logEvent
 */
export async function startDrowsinessDetection(videoEl, logEvent) {
  // Create the face detector
  const detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    }
  );

  setInterval(async () => {
    try {
      const predictions = await detector.estimateFaces(videoEl);

      if (predictions.length > 0) {
        const keypoints = predictions[0].keypoints;

        // Left and right eye landmarks (MediaPipe indexes)
        const leftEye = [33, 160, 158, 133, 153, 144].map((i) => keypoints[i]);
        const rightEye = [362, 385, 387, 263, 373, 380].map((i) => keypoints[i]);

        const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

        // Eyes closed for >3s
        if (ear < 0.25) {
          if (!eyeClosureTimer) {
            eyeClosureTimer = setTimeout(() => {
              logEvent("Drowsiness detected: Eyes closed >3s");
            }, 3000);
          }
        } else {
          if (eyeClosureTimer) {
            clearTimeout(eyeClosureTimer);
            eyeClosureTimer = null;
          }
        }
      } else {
        // If no face detected, reset timer
        if (eyeClosureTimer) {
          clearTimeout(eyeClosureTimer);
          eyeClosureTimer = null;
        }
      }
    } catch (err) {
      console.error("Drowsiness detection error:", err);
    }
  }, 500);
}
