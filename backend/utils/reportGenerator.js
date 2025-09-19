import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export function generateReport(candidate, events, duration) {
  const doc = new PDFDocument();
  const filePath = path.join("reports", `${candidate}.pdf`);
  if (!fs.existsSync("reports")) fs.mkdirSync("reports");

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(18).text("Proctoring Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Candidate: ${candidate}`);
  doc.text(`Duration: ${duration} seconds`);
  doc.moveDown();

  events.forEach((e, i) => {
    doc.text(`${i + 1}. ${e.event} @ ${new Date(e.timestamp).toLocaleTimeString()}`);
  });

  const score = 100 - events.length * 5;
  doc.moveDown().text(`Integrity Score: ${score}`);

  doc.end();
  return filePath;
}
