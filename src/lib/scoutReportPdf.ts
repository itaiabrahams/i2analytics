import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScoutReportData } from '@/components/ScoutReportDialog';

const DARK_BG = [30, 41, 59];    // slate-800
const GOLD = [234, 179, 8];      // yellow/gold
const PURPLE = [147, 51, 234];   // purple
const GREEN = [34, 197, 94];     // green
const WHITE = [255, 255, 255];
const LIGHT_BG = [241, 245, 249]; // slate-100
const TEXT_DARK = [15, 23, 42];   // slate-900

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK_BG as [number, number, number]);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD as [number, number, number]);
  doc.text('E.PM Scout Report', pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.setTextColor(...WHITE as [number, number, number]);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 8, { align: 'right' });
}

function addSectionHeader(doc: jsPDF, title: string, y: number, color: number[] = DARK_BG): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...color as [number, number, number]);
  doc.rect(15, y, pageWidth - 30, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE as [number, number, number]);
  doc.text(title, pageWidth / 2, y + 7, { align: 'center' });
  return y + 14;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 30) {
    doc.addPage();
    return 15;
  }
  return y;
}

export async function generateScoutReportPDF(data: ScoutReportData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-GB');

  // ===== PAGE 1: Header =====
  // Dark header background
  doc.setFillColor(...DARK_BG as [number, number, number]);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Try to load logo
  try {
    const logoData = await loadImage('/scout-report-logo.png');
    doc.addImage(logoData, 'PNG', pageWidth / 2 - 25, 3, 50, 30);
  } catch {
    doc.setFontSize(22);
    doc.setTextColor(...WHITE as [number, number, number]);
    doc.text('E.PM SCOUT REPORT', pageWidth / 2, 20, { align: 'center' });
  }

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${today}`, pageWidth / 2, 43, { align: 'center' });

  // Gold line
  doc.setFillColor(...GOLD as [number, number, number]);
  doc.rect(0, 50, pageWidth, 3, 'F');

  // ===== Player Card =====
  let y = 62;
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(15, y, pageWidth - 30, 38, 3, 3, 'S');

  // Avatar - try to load player photo, fallback to initial circle
  let avatarLoaded = false;
  if (data.avatarUrl) {
    try {
      const avatarData = await loadImage(data.avatarUrl);
      // Clip circle avatar
      doc.saveGraphicsState();
      doc.circle(32, y + 15, 10, 'F');  // dark bg as fallback
      doc.addImage(avatarData, 'JPEG', 22, y + 5, 20, 20);
      doc.setDrawColor(...DARK_BG as [number, number, number]);
      doc.circle(32, y + 15, 10, 'S');
      doc.restoreGraphicsState();
      avatarLoaded = true;
    } catch {
      // fallback below
    }
  }
  if (!avatarLoaded) {
    doc.setFillColor(...DARK_BG as [number, number, number]);
    doc.circle(32, y + 15, 10, 'F');
    doc.setFontSize(16);
    doc.setTextColor(...WHITE as [number, number, number]);
    const initial = data.playerName.charAt(0).toUpperCase();
    doc.text(initial, 32, y + 19, { align: 'center' });
  }

  // Player info
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK as [number, number, number]);
  doc.text(data.playerName, 48, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.position}  |  Age ${data.age}`, 48, y + 17);
  doc.text(`Height: ${data.height || '-'} cm  |  Weight: ${data.weight || '-'} kg  |  Attendance: ${data.attendance || '-'}  |  Progress Index: ${data.progressIndex || '-'}`, 48, y + 23);

  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK as [number, number, number]);
  doc.text(`Status: ${data.status}`, 48, y + 32);
  doc.text(`Category: ${data.category}`, 100, y + 32);

  y = 108;

  // ===== Basketball Metrics =====
  y = addSectionHeader(doc, 'Basketball Metrics', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [['Metric', 'Rating']],
    body: [
      ['Shooting', data.shooting || '-'],
      ['Defense', data.defense || '-'],
      ['Decision Making', data.decisionMaking || '-'],
      ['Ball Handling', data.ballHandling || '-'],
      ['Passing', data.passing || '-'],
      ['Rebounds', data.rebounds || '-'],
      ['Game Reading', data.gameReading || '-'],
    ],
    headStyles: { fillColor: DARK_BG as [number, number, number], textColor: GOLD as [number, number, number], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
    theme: 'grid',
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===== Physical Metrics =====
  y = checkPageBreak(doc, y, 60);
  y = addSectionHeader(doc, 'Physical Metrics', y, GREEN);
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [['Metric', 'Value']],
    body: [
      ['Sprint 20m', data.sprint20m || '-'],
      ['Vertical Jump', data.verticalJump || '-'],
      ['Agility', data.agility || '-'],
      ['Strength', data.strength || '-'],
      ['Endurance', data.endurance || '-'],
    ],
    headStyles: { fillColor: GREEN as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
    theme: 'grid',
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===== Mental Metrics =====
  y = checkPageBreak(doc, y, 60);
  y = addSectionHeader(doc, 'Mental Metrics', y, PURPLE);
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [['Metric', 'Rating']],
    body: [
      ['Self Confidence', data.selfConfidence || '-'],
      ['Discipline', data.discipline || '-'],
      ['Teamwork', data.teamwork || '-'],
      ['Pressure Handling', data.pressureHandling || '-'],
      ['Error Recovery', data.errorRecovery || '-'],
    ],
    headStyles: { fillColor: PURPLE as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
    theme: 'grid',
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===== Nutrition Data =====
  y = checkPageBreak(doc, y, 50);
  y = addSectionHeader(doc, 'Nutrition Data', y, GREEN);
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [['Metric', 'Value']],
    body: [
      ['Weight', data.nutritionWeight || '-'],
      ['Body Fat', data.bodyFat || '-'],
      ['Last Measured', data.lastMeasured || '-'],
    ],
    headStyles: { fillColor: GREEN as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
    theme: 'grid',
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Recommendations
  const validRecs = data.recommendations.filter(r => r.trim());
  if (validRecs.length > 0) {
    y = checkPageBreak(doc, y, 20);
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK as [number, number, number]);
    doc.text('Recommendations:', 15, y + 3);
    y += 7;
    validRecs.forEach(rec => {
      y = checkPageBreak(doc, y, 8);
      doc.setFontSize(9);
      doc.text(`• ${rec}`, 18, y);
      y += 5;
    });
    y += 3;
  }

  // ===== Goals & Objectives =====
  if (data.goals.length > 0 && data.goals.some(g => g.goal)) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, 'Goals & Objectives', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [['Goal', 'Status', 'Progress', 'Target Date']],
      body: data.goals.filter(g => g.goal).map(g => [g.goal, g.status, g.progress, g.targetDate]),
      headStyles: { fillColor: DARK_BG as [number, number, number], textColor: GOLD as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Improvement Reports =====
  if (data.improvements.length > 0 && data.improvements.some(i => i.domain)) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, 'Improvement Reports', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [['Domain', 'Period', 'Rating', 'Notes', 'Coach']],
      body: data.improvements.filter(i => i.domain).map(i => [i.domain, i.period, i.rating, i.notes, i.coach]),
      headStyles: { fillColor: DARK_BG as [number, number, number], textColor: GOLD as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Training Notes =====
  if (data.trainingNotes.length > 0 && data.trainingNotes.some(n => n.date)) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, 'Training Notes', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [['Date', 'Coach', 'Quality', 'Notes']],
      body: data.trainingNotes.filter(n => n.date).map(n => [n.date, n.coach, n.quality, n.notes]),
      headStyles: { fillColor: DARK_BG as [number, number, number], textColor: GOLD as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: LIGHT_BG as [number, number, number] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Attendance Summary =====
  if (data.totalSessions) {
    y = checkPageBreak(doc, y, 30);
    y = addSectionHeader(doc, 'Attendance Summary', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [['Total Sessions', 'Present', 'Absent', 'Attendance Rate']],
      body: [[data.totalSessions, data.present, data.absent, data.attendanceRate]],
      headStyles: { fillColor: DARK_BG as [number, number, number], textColor: GOLD as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
    });
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  // Download
  doc.save(`Scout_Report_${data.playerName.replace(/\s+/g, '_')}.pdf`);
}
