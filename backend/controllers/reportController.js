import { generateReport } from "../utils/reportGenerator.js";

export const getReport = async (req, res) => {
  const candidate = req.params.candidate;
  // Example: fetch logs from DB
  const events = await EventLog.find({ candidate });
  const duration = 3600; // replace with actual interview duration

  const file = generateReport(candidate, events, duration);
  res.download(file);
};
