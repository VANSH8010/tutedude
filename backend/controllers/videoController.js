import fs from "fs";
import path from "path";

const recordingsDir = path.join(process.cwd(), "recordings");
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

export const uploadChunk = (req, res) => {
  const filePath = path.join(recordingsDir, `${req.user ? req.user._id : "guest"}.webm`);
  fs.appendFileSync(filePath, req.file.buffer);
  res.sendStatus(200);
};
