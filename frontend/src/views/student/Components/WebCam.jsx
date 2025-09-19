import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';
import { UploadClient } from '@uploadcare/upload-client';
import axios from '../../../axios'; 

const client = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastDetectionTime, setLastDetectionTime] = useState({});
  const [screenshots, setScreenshots] = useState([]);

  const [faceAbsentStart, setFaceAbsentStart] = useState(null);
  const [focusLostStart, setFocusLostStart] = useState(null);

  useEffect(() => {
    if (cheatingLog && cheatingLog.screenshots) {
      setScreenshots(cheatingLog.screenshots);
    }
  }, [cheatingLog]);

  // Capture screenshot & upload
  const captureScreenshotAndUpload = async (type) => {
    const video = webcamRef.current?.video;

    if (!video || video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not ready for screenshot');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const file = dataURLtoFile(dataUrl, `cheating_${Date.now()}.jpg`);

    try {
      const result = await client.uploadFile(file);
      console.log('✅ Uploaded:', result.cdnUrl);

      const screenshot = {
        url: result.cdnUrl,
        type,
        detectedAt: new Date(),
      };

      setScreenshots((prev) => [...prev, screenshot]);
      return screenshot;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  };

  // Log event to backend
  const logToBackend = async (type, message, screenshotUrl) => {
    try {
      await axios.post('/api/exams/logEvent', {
        eventType: type,
        message,
        screenshot: screenshotUrl,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('❌ Failed to log event:', err);
    }
  };

  // Handle detections
  const handleDetection = async (type, customMessage = null) => {
    const now = Date.now();
    const lastTime = lastDetectionTime[type] || 0;

    if (now - lastTime >= 3000) {
      setLastDetectionTime((prev) => ({ ...prev, [type]: now }));

      const screenshot = await captureScreenshotAndUpload(type);

      if (screenshot) {
        const updatedLog = {
          ...cheatingLog,
          [`${type}Count`]: (cheatingLog[`${type}Count`] || 0) + 1,
          screenshots: [...(cheatingLog.screenshots || []), screenshot],
        };

        updateCheatingLog(updatedLog);

        await logToBackend(type, customMessage || `${type} detected`, screenshot.url);
      }

      // Alerts
      switch (type) {
        case 'noFace':
          swal('Face Not Visible (10s)', 'Warning Recorded', 'warning');
          break;
        case 'focusLost':
          swal('Focus Lost (>5s)', 'User looking away', 'warning');
          break;
        case 'multipleFace':
          swal('Multiple Faces Detected', 'Warning Recorded', 'warning');
          break;
        case 'cellPhone':
          swal('Cell Phone Detected', 'Warning Recorded', 'warning');
          break;
        case 'prohibitedObject':
          swal('Prohibited Object Detected', 'Warning Recorded', 'warning');
          break;
        default:
          break;
      }
    }
  };

  // Run COCO-SSD model
  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      console.log('✅ Model loaded.');
      setInterval(() => detect(net), 1000);
    } catch (error) {
      console.error('❌ Model load error:', error);
      swal('Error', 'AI model failed to load. Refresh page.', 'error');
    }
  };

  // Detection logic
  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const obj = await net.detect(video);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawRect(obj, ctx);

        let person_count = 0;
        let faceDetected = false;

        obj.forEach((element) => {
          const detectedClass = element.class;
          console.log('Detected:', detectedClass);

          if (detectedClass === 'cell phone') handleDetection('cellPhone');
          if (detectedClass === 'book' || detectedClass === 'laptop') handleDetection('prohibitedObject');
          if (detectedClass === 'person') {
            faceDetected = true;
            person_count++;
            if (person_count > 1) handleDetection('multipleFace');

            const [x, y, width, height] = element.bbox;
            const centerX = x + width / 2;
            if (centerX < videoWidth * 0.35 || centerX > videoWidth * 0.65) {
              if (!focusLostStart) setFocusLostStart(Date.now());
              else if (Date.now() - focusLostStart >= 5000) {
                handleDetection('focusLost');
                setFocusLostStart(null);
              }
            } else {
              setFocusLostStart(null);
            }
          }
        });

        // No face for >10s
        if (!faceDetected) {
          if (!faceAbsentStart) setFaceAbsentStart(Date.now());
          else if (Date.now() - faceAbsentStart >= 10000) {
            handleDetection('noFace');
            setFaceAbsentStart(null);
          }
        } else {
          setFaceAbsentStart(null);
        }
      } catch (error) {
        console.error('❌ Detection error:', error);
      }
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  return (
    <Box>
      <Card variant="outlined" sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
        />
      </Card>
    </Box>
  );
}

// Helper to convert base64 → File
function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}
