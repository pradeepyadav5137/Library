import fs from 'fs';

const filePath = 'frontend/src/services/pdfGenerator.js';
let content = fs.readFileSync(filePath, 'utf8');

// The jsPDF library supports doc.splitTextToSize or dynamic sizing, but standard text clipping via maxWidth
// might cause the text to be split into multiple lines instead of being scaled down if we don't control the lines.
// We can dynamically shrink font size to fit within maxWidth.
// A helper function `fitText` can be added to standardise this.

const fitTextFn = 
function drawFitText(doc, text, x, y, maxWidth, initialSize = 10, isBold = false) {
  if (!text) return;
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  let currentSize = initialSize;
  doc.setFontSize(currentSize);

  while (doc.getTextWidth(text) > maxWidth && currentSize > 4) {
    currentSize -= 0.5;
    doc.setFontSize(currentSize);
  }

  doc.text(text, x, y);

  // reset to initial so we don't bleed into next calls
  doc.setFontSize(initialSize);
};

if (!content.includes('drawFitText')) {
  content = content.replace('export const generatePdf = (data, isStudent = true, shouldSave = true) => {',
    fitTextFn + '\nexport const generatePdf = (data, isStudent = true, shouldSave = true) => {');
}

// Replace student name
content = content.replace(
  `doc.text(data.name || '', margin + 52, y + 10, { maxWidth: 53 });`,
  `drawFitText(doc, data.name || '', margin + 52, y + 10, 53, 10);`
);

// Replace parent name
content = content.replace(
  `doc.text(data.fatherName || '', margin + 52, y + 7, { maxWidth: 56 });`,
  `drawFitText(doc, data.fatherName || '', margin + 52, y + 7, 56, 10);`
);

// Replace Staff Name
content = content.replace(
  `doc.text(data.staffName || data.name || '', margin + col1 + 2, y + 5, { maxWidth: mainTableWidth - col1 - 2 });`,
  `drawFitText(doc, data.staffName || data.name || '', margin + col1 + 2, y + 5, mainTableWidth - col1 - 2, 10);`
);


// Replace Staff Designation
content = content.replace(
  `doc.text(data.designation || '', margin + col3 + 2, y + 5, { maxWidth: mainTableWidth - col3 - 2 });`,
  `drawFitText(doc, data.designation || '', margin + col3 + 2, y + 5, mainTableWidth - col3 - 2, 10);`
);

fs.writeFileSync(filePath, content);
