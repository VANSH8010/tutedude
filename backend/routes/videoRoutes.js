import express from "express";
import multer from "multer";
import { uploadChunk } from "../controllers/videoController.js";

const router = express.Router();
const upload = multer();

router.post("/upload-chunk", upload.single("videoChunk"), uploadChunk);

export default router;
