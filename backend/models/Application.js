import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  userType: {
    type: String,
    enum: ['student', 'faculty', 'staff'],
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Student fields
  rollNo: String,
  name: String,
  fatherName: String,
  programme: String,
  branch: String,
  batch: String,
  issuedBooks: Number,
  
  // Faculty/Staff fields
  staffNo: String,
  staffName: String,
  title: String,
  designation: String,
  department: String,
  joiningDate: Date,
  retirementDate: Date,
  
  // Common fields
  phone: String,
  parentMobile: String,
  dob: Date,
  gender: String,
  bloodGroup: String,
  
  // Address
  // addressLine1: String,
  // addressLine2: String,
  // district: String,
  // state: String,
  // pinCode: String,
  address: String,
  permanentAddress: String,

  
  // Document request
  requestCategory: {
    type: String,
    enum: [
    'Lost', 
    'Damaged', 
    'Correction', 
    'Stolen', 
    'New',          
    'Update',       
    'Replacement',
    'Upgrade' ]
  },
  reasonDetails: String,
  
  // File URLs & Extra details
  photoPath: String,
  photoBase64: String,   // base64-encoded photo for direct PDF embedding
  firPath: String,
  firNumber: String,
  firRegisteredDate: Date,
  paymentPath: String,
  transactionNumber: String,
  transactionDate: Date,
  applicationPdfUrl: String,
  
  // Status
  status: {
    type: String,
    enum: [
      'pending',
      'physical_copy_received',
      'verified',
      'printed',
      'rejected',
      'approved', // Keep for backward compatibility
      'Application Submitted',
      'Physical Copy Received',
      'Verification Completed',
      'ID Card Printed – Ready for Collection (Library)'
    ],
    default: 'pending'
  },
  adminNotes: String,
  rejectionReason: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Application', applicationSchema);

// Indexes
applicationSchema.index({ email: 1 });
applicationSchema.index({ applicationId: 1 });
