

import { jsPDF } from 'jspdf';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  } catch {
    return dateString;
  }
};

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
  doc.setFontSize(initialSize); // Reset font size
}

const getLogoData = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = '/assets/logo.png';
  });
};

// --- HELPER: Draw a Tick Mark (Check Mark) ---
const drawCheckmark = (doc, x, y, size = 3) => {
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0); // Black
  // Draw a tick
  doc.line(x, y + size / 2, x + size / 3, y + size); // Down stroke
  doc.line(x + size / 3, y + size, x + size + 1, y - 1); // Up stroke (longer)
};

// ==========================================
// STUDENT PDF GENERATOR (UNTOUCHED)
// ==========================================
export const generateStudentPDF = async (data, shouldSave = true) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  const logoData = await getLogoData();
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin + 2, margin + 2, 25, 25);
  }

  // Outer Border
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, 277);

  // Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('NATIONAL INSTITUTE OF TECHNOLOGY TIRUCHIRAPPALLI', margin + 30, 20);
  doc.setFontSize(12);
  doc.text('TAMIL NADU, INDIA-620015', margin + 50, 26);

  doc.setFontSize(13);
  doc.text('STUDENT APPLICATION FOR DUPLICATE IDENTITY CARD', pageWidth / 2, 36, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('(to be filled by the student)', pageWidth / 2, 42, { align: 'center' });

  // Main Info Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  let y = 45;
  const rowHeight = 10;

  // Row 1: Name, Roll No, Branch
  doc.rect(margin, y, contentWidth, rowHeight * 2);
  doc.line(margin + 50, y, margin + 50, y + rowHeight * 2);
  doc.line(margin + 110, y, margin + 110, y + rowHeight * 2);
  doc.line(margin + 150, y, margin + 150, y + rowHeight * 2);

  doc.text('Name of the', margin + 5, y + 7);
  doc.text('Student', margin + 5, y + 13);
  doc.setFont('helvetica', 'normal');
  drawFitText(doc, data.name || '', margin + 52, y + 10, 53, 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Roll No.', margin + 112, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.rollNo || '', margin + 112, y + 13, { maxWidth: 33 });

  doc.setFont('helvetica', 'bold');
  doc.text('Branch', margin + 152, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.branch || '', margin + 152, y + 13, { maxWidth: 35 });

  y += rowHeight * 2;

  // Row 2: Parent's Name, Blood Group, D.O.B
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + 50, y, margin + 50, y + rowHeight);
  doc.line(margin + 110, y, margin + 110, y + rowHeight);
  doc.line(margin + 150, y, margin + 150, y + rowHeight);

  doc.setFont('helvetica', 'bold');
  doc.text("Parent's Name", margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  drawFitText(doc, data.fatherName || '', margin + 52, y + 7, 56, 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Blood', margin + 112, y + 4);
  doc.text('Group', margin + 112, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.bloodGroup || '', margin + 130, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('D.O.B', margin + 152, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.dob), margin + 170, y + 7);

  y += rowHeight;

  // Row 3: Contact No, Email ID
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + 50, y, margin + 50, y + rowHeight);
  doc.line(margin + 110, y, margin + 110, y + rowHeight);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact No.', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.phone || '', margin + 55, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Email ID', margin + 112, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.email || '', margin + 130, y + 7);

  y += rowHeight;

  // Row 4: Address
  doc.rect(margin, y, contentWidth, rowHeight * 3);
  doc.line(margin + 50, y, margin + 50, y + rowHeight * 3);
  doc.setFont('helvetica', 'bold');
  doc.text('Address', margin + 20, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text( data.permanentAddress  || data.address|| '', margin + 55, y + 7, { maxWidth: contentWidth - 60 });

  y += rowHeight * 3;

  // Section 2: Details of loss/damage
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.text('Where the ID has been lost (please tick mark)', margin + 2, y + 4, { maxWidth: 85 });
  doc.line(margin + 90, y, margin + 90, y + rowHeight);
  doc.text('Within the Campus', margin + 95, y + 7);
  doc.line(margin + 150, y, margin + 150, y + rowHeight);
  doc.text('During Travelling', margin + 155, y + 7);

  if (data.requestCategory === 'Lost') {
    doc.text('X', margin + 91, y + 7); // Student still uses X unless you want to change it
  }

  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.text('Damaged (If so, please return the damaged one)', margin + 2, y + 4, { maxWidth: 85 });
  doc.line(margin + 90, y, margin + 90, y + rowHeight);
  doc.text('At home', margin + 95, y + 7);
  doc.line(margin + 150, y, margin + 150, y + rowHeight);
  doc.text('Any other: Pl. specify:', margin + 155, y + 5);
  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.text('Have you ever lost the Identity Card before', margin + 2, y + 4, { maxWidth: 85 });
  doc.line(margin + 90, y, margin + 90, y + rowHeight);
  doc.text('If so When (Month/year)', margin + 95, y + 7);
  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + 90, y, margin + 90, y + rowHeight);
  doc.text('How many times you have been issued duplicate ID Cards', margin + 95, y + 4, { maxWidth: 90 });
  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.text('Number of books issued to you with your ID Card', margin + 2, y + 4, { maxWidth: 85 });
  doc.line(margin + 90, y, margin + 90, y + rowHeight);
  doc.setFont('helvetica', 'normal');
  doc.text(String(data.issuedBooks || '0'), margin + 95, y + 7);
  doc.setFont('helvetica', 'bold');
  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight * 2);
  doc.text('Fee for Duplicate ID Card Rs. 500/- (copy of receipt should be attached)', margin + 2, y + 4, { maxWidth: 85 });
  doc.line(margin + 90, y, margin + 90, y + rowHeight * 2);
  doc.line(margin + 90, y + rowHeight, contentWidth + margin, y + rowHeight);

  doc.text('Receipt No.', margin + 92, y + rowHeight + 7);
  doc.line(margin + 125, y + rowHeight, margin + 125, y + rowHeight * 2);
  doc.text('Amount (Rs.)', margin + 127, y + rowHeight + 7);
  doc.line(margin + 165, y + rowHeight, margin + 165, y + rowHeight * 2);
  doc.text('Date', margin + 167, y + rowHeight + 7);
  y += rowHeight * 2;

  // Declaration
  doc.setFontSize(11);
  doc.text('DECLARATION', pageWidth / 2, y + 7, { align: 'center' });
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const declaration = "I hereby declare that the information given by me is correct. I am also aware that the Identity Card declared to have lost by me has been irrecoverably lost and in case anyone makes wrong use of the same and or any claim based on the usage of this Identity Card, I am fully responsible for the same. I will be liable for all the future losses/damages/consequences that may incur to the Institute, which shall be made good by me without making any counter claim. In the event, if it is traced, old ID will be surrendered immediately to the Institute.";
  doc.text(declaration, margin + 5, y, { maxWidth: contentWidth - 10, align: 'justify' });

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(data.createdAt || new Date())}`, margin + 5, y);
  doc.text(`Name: ${data.name || ''}`, margin + 40, y);
  doc.text(`Roll No: ${data.rollNo || ''}`, margin + 100, y);
  doc.text('Signature', margin + 160, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('(Office Use – Department/Section Level)', pageWidth / 2, y, { align: 'center' });

  y += 3;
  doc.rect(margin, y, contentWidth, 40);
  doc.line(margin + 110, y, margin + 110, y + 40);
  doc.line(margin, y + 20, margin + contentWidth, y + 20);

  doc.text('Clearance from Head of the Department for issuing Duplicate ID', margin + 2, y + 7, { maxWidth: 100 });
  doc.text('Library Clearance after making necessary changes in the database', margin + 2, y + 27, { maxWidth: 100 });

  if (shouldSave) {
    doc.save(`NITT_Duplicate_ID_${data.rollNo || 'application'}.pdf`);
  }
  return doc;
};

// ==========================================
// FACULTY / STAFF PDF GENERATOR (UPDATED)
// ==========================================
export const generateFacultyStaffPDF = async (data, shouldSave = true) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  const logoData = await getLogoData();
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin + 2, margin + 2, 25, 25);
  }

  // Outer Border
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, 277);

  // Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('NATIONAL INSTITUTE OF TECHNOLOGY TIRUCHIRAPPALLI', margin + 30, 20);
  doc.setFontSize(12);
  doc.text('TAMIL NADU, INDIA-620015', margin + 50, 26);

  doc.setFontSize(13);
  doc.text('STAFF APPLICATION FOR DUPLICATE IDENTITY CARD', pageWidth / 2, 36, { align: 'center' });

  doc.setFontSize(10);
  doc.text('(DESIGNATION/OTHER OFFICIAL CHANGES)', pageWidth / 2, 42, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.text('(to be filled by the staff)', pageWidth / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  let y = 53;
  const rowHeight = 8;

  // Main table structure
  // Adjusted col3 from 125 to 110 to give more space for Date
  const col1 = 45;
  const col2 = 85;
  const col3 = 110; 
  const mainTableWidth = contentWidth - 50;

  // Row 1
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.text('Name of the Staff', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  drawFitText(doc, data.staffName || data.name || '', margin + col1 + 2, y + 5, mainTableWidth - col1 - 2, 10);
  y += rowHeight;

  // Row 2
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.line(margin + col2, y, margin + col2, y + rowHeight);
  doc.line(margin + col3, y, margin + col3, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff No.', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.staffNo || '', margin + col1 + 2, y + 5, { maxWidth: col2 - col1 - 2 });
  doc.setFont('helvetica', 'bold');
  doc.text('Designation', margin + col2 + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  drawFitText(doc, data.designation || '', margin + col3 + 2, y + 5, mainTableWidth - col3 - 2, 10);
  y += rowHeight;

  // Row 3
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.line(margin + col2, y, margin + col2, y + rowHeight);
  doc.line(margin + col3, y, margin + col3, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Title: Prof. / Dr./', margin + 2, y + 3);
  doc.text('Mr. / Ms. / Mrs.', margin + 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.title || '', margin + col1 + 2, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Gender:', margin + col2 + 2, y + 3);
  doc.text('M/F', margin + col2 + 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.gender === 'Male' ? 'M' : 'F', margin + col3 - 10, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Blood', margin + col3 + 2, y + 3);
  doc.text('Group', margin + col3 + 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.bloodGroup || '', margin + col3 + 15, y + 5);
  y += rowHeight;

  // Row 4
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.line(margin + col3, y, margin + col3, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Dept./ Section', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.department || '', margin + col1 + 2, y + 5, { maxWidth: col3 - col1 - 2 });
  doc.setFont('helvetica', 'bold');
  doc.text('D.O.B', margin + col3 + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.dob), margin + col3 + 13, y + 5);
  y += rowHeight;

  // Row 5
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.line(margin + col2, y, margin + col2, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Joining', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.joiningDate), margin + col1 + 2, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Retirement', margin + col2 + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.retirementDate), margin + col2 + 35, y + 5);
  y += rowHeight;

  // Contact No
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact No.', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.phone || '', margin + col1 + 2, y + 5);
  y += rowHeight;

  // Email ID
  doc.rect(margin, y, mainTableWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Email ID', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.email || '', margin + col1 + 2, y + 5);
  y += rowHeight;

  // Photo Box
  doc.rect(margin + mainTableWidth, 53, 50, y - 53);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Recent Passport Size', margin + mainTableWidth + 10, 70);
  doc.text('Photo', margin + mainTableWidth + 20, 75);

  // Address
  doc.setFontSize(10);
  doc.rect(margin, y, contentWidth, rowHeight * 3);
  doc.line(margin + col1, y, margin + col1, y + rowHeight * 3);
  doc.setFont('helvetica', 'bold');
  doc.text('Address', margin + 15, y + 10);
  doc.setFont('helvetica', 'normal');
  //  doc.text( data.permanentAddress  || data.address|| '', margin + 55, y + 7, { maxWidth: contentWidth - 60 });
  doc.text( data.permanentAddress  || data.address || '', margin + col1 + 2, y + 5, { maxWidth: contentWidth - col1 - 5 });
  y += rowHeight * 3;

  // Request Category
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Request Category', pageWidth / 2, y + 5, { align: 'center' });
  y += rowHeight;

  // OPTION A (New)
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.rect(margin + 2, y + 2, 4, 4);
  
  if (data.requestCategory === 'New') {
    drawCheckmark(doc, margin + 2, y + 2, 4);
  }
  
  doc.text('A – New Appointment/Transfer/Promotion/Redesignation (From __________ To ___________ )', margin + 8, y + 5);
  y += rowHeight;

  // OPTION B (Correction)
  doc.rect(margin, y, contentWidth, rowHeight * 2);
  doc.rect(margin + 2, y + 2, 4, 4);

  if (data.requestCategory !== 'New') {
    drawCheckmark(doc, margin + 2, y + 2, 4);
  }

  doc.text('B – Lost Card/Damaged/Correction – Corrections to be made (If any) Photo Change//Mobile No./', margin + 8, y + 5);
  doc.text('/Address', margin + 8, y + 10);
  y += rowHeight * 2;

  // Payment Details
  doc.rect(margin, y, contentWidth, rowHeight * 2);
  doc.line(margin + 45, y, margin + 45, y + rowHeight * 2);
  doc.line(margin + 110, y, margin + 110, y + rowHeight * 2);
  doc.line(margin + 150, y, margin + 150, y + rowHeight * 2);
  doc.line(margin + 110, y + rowHeight, contentWidth + margin, y + rowHeight);

  doc.text('Payment Details', margin + 2, y + 5);
  doc.setFontSize(8);
  doc.text('(For Category B Only Rs. 500)', margin + 2, y + 9);
  doc.text('*Attach the Payment Receipt', margin + 2, y + 13);
  doc.setFontSize(10);

  doc.text('Challan No.', margin + 47, y + rowHeight);
  doc.text('Date:', margin + 152, y + rowHeight);
  y += rowHeight * 2;

  // Data boxes
  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  
  // Strikethrough for "Data Available in the ID Card" to match real format
  const textLabel = 'Data Available';
  doc.text(textLabel, margin + 2, y + 5, { maxWidth: 42 });
  // doc.setLineWidth(0.3);
  // doc.line(margin + 2, y + 4, margin + 2 + doc.getTextWidth(textLabel), y + 4);
  // doc.setLineWidth(0.5); // Reset

  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.text('Data to be Changed', margin + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.dataToChange?.join(', ') || '', margin + col1 + 2, y + 5);
  y += rowHeight;

  doc.rect(margin, y, contentWidth, rowHeight);
  doc.line(margin + col1, y, margin + col1, y + rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Office Order No. Details', margin + 2, y + 5);
  y += rowHeight;

  // Declaration
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('DECLARATION', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('I hereby declare that the above particulars of facts and information stated are true, correct and complete', pageWidth / 2, y, { align: 'center' });
  doc.text('to the best of my belief and knowledge.', pageWidth / 2, y + 4, { align: 'center' });
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Signature', contentWidth - 10, y, { align: 'right' });

  // Competent Authority
  y += 3;
  doc.rect(margin, y, contentWidth, 35);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);
  doc.line(margin + 120, y, margin + 120, y + 10);
  doc.text('Signature of the HoD with Office Seal', margin + 2, y + 7);
  doc.text('Certified by Supdt. Estt.', margin + 122, y + 7);

  doc.text('Competent Authority', pageWidth / 2, y + 18, { align: 'center' });
  doc.text('Registrar', pageWidth / 2, y + 32, { align: 'center' });

  y += 35;
  doc.rect(margin, y, contentWidth, 25);
  doc.setFontSize(9);
  doc.text('Office use Only:', margin + 2, y + 5);
  doc.text('Application Number: ________________________ Date: ___________________', margin + 2, y + 12);
  doc.text('Signature of the ID card Distributor: ___________________________________', margin + 2, y + 20);

  y += 30;
  doc.setFontSize(8);
  doc.text('*Note: Applicant should come in person to submit application form and to collect new card after handing over old card.', margin + 2, y);

  if (shouldSave) {
    doc.save(`NITT_Staff_ID_${data.staffNo || 'application'}.pdf`);
  }
  return doc;
};
