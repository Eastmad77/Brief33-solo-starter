import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { MeetingSummary } from "./types";

const C = {
  dark: rgb(0x0a/255, 0x1e/255, 0x33/255),
  text: rgb(0x14/255, 0x19/255, 0x21/255),
  aqua: rgb(0x22/255, 0xc1/255, 0xdc/255),
  blue: rgb(0x25/255, 0x63/255, 0xeb/255),
  white: rgb(1,1,1)
};

export async function exportSummaryToPDF(s: MeetingSummary) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width } = page.getSize();

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdf.embedFont(StandardFonts.Helvetica);

  const bandH = 70;
  page.drawRectangle({ x:0, y:841.89-bandH, width, height:bandH, color:C.dark });
  page.drawText("Brief", { x:24, y: 841.89 - 48, size:22, font:fontBold, color:C.aqua });
  page.drawText("33",   { x:24+56, y:841.89 - 48, size:22, font:fontBold, color:C.white });

  const title = s.title || "Meeting Summary";
  const dateStr = new Date().toLocaleString();
  page.drawText(title, { x:24, y: 841.89 - bandH - 24, size:16, font:fontBold, color:C.text });
  page.drawText(dateStr, { x:24, y: 841.89 - bandH - 42, size:10, font:fontReg, color:C.text });

  let y = 841.89 - bandH - 70;
  const lineGap = 14;

  const drawHeading = (t:string) => { page.drawText(t, { x:24, y, size:12, font:fontBold, color:C.blue }); y -= lineGap; };
  const drawBullet = (t:string) => { page.drawText("• " + t, { x:32, y, size:11, font:fontReg, color:C.text }); y -= lineGap; };
  const drawPara = (t:string) => {
    const words = t.split(" ");
    let line = ""; const max = 85;
    for (const w of words){
      if ((line + " " + w).trim().length > max){
        page.drawText(line.trim(), { x:24, y, size:11, font:fontReg, color:C.text });
        y -= lineGap; line = w;
      } else line += " " + w;
    }
    if (line.trim()){ page.drawText(line.trim(), { x:24, y, size:11, font:fontReg, color:C.text }); y -= lineGap; }
  };

  drawHeading("Summary");
  if (s.summary) drawPara(s.summary);
  if (s.agenda?.length){ drawHeading("Agenda"); s.agenda.forEach(a => drawBullet(a)); }
  if (s.discussion?.length){
    drawHeading("Discussion");
    s.discussion.forEach(d => { page.drawText(d.topic + ":", { x:24, y, size:11, font:fontBold, color:C.text }); y -= lineGap; d.notes.forEach(n => drawBullet(n)); });
  }
  if (s.decisions?.length){ drawHeading("Decisions"); s.decisions.forEach(d => drawBullet(d)); }
  if (s.actions?.length){ drawHeading("Actions"); s.actions.forEach(a => drawBullet(`${a.task}${a.due ? ` (due ${a.due})` : ""}`)); }

  [ -12, 0, 12 ].forEach((off,i)=>{
    page.drawCircle({ x: width-60 + off, y: 30, radius: 3, color: i===1 ? C.blue : C.aqua });
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (s.title || "meeting") + ".pdf";
  a.click();
}
