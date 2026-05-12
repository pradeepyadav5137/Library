import Joi from 'joi';

export const validateApplicationSubmit = (req, res, next) => {
  const body = req.body;
  const userType = body.userType;

  // Basic structure
  const schema = Joi.object({
    userType: Joi.string().valid('student', 'faculty', 'staff').required(),
    requestCategory: Joi.string().valid('Lost', 'Damaged', 'Correction', 'Stolen', 'New', 'Update', 'Replacement', 'Upgrade').required(),
    email: Joi.string().email().required(),
  }).unknown(true);

  const { error } = schema.validate({ userType, requestCategory: body.requestCategory, email: body.email });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Complex conditional rules
  const { requestCategory } = body;

  if (requestCategory === 'Lost' || requestCategory === 'Stolen') {
    if (!req.files?.fir && !body.firPath) {
      return res.status(400).json({ message: 'FIR document is mandatory for Lost/Stolen applications.' });
    }
    if (!body.firNumber || !body.firDate) {
      return res.status(400).json({ message: 'FIR Number and Registered Date are mandatory for Lost/Stolen applications.' });
    }
  }

  if (requestCategory === 'Update') {
    if (userType === 'student') {
      return res.status(400).json({ message: 'Students are not allowed to apply for "Update".' });
    }
  }

  // Payment rules
  const requiresPayment = (userType === 'student') && (requestCategory === 'Lost' || requestCategory === 'Correction' || requestCategory === 'Stolen');

  if (requiresPayment) {
    if (!req.files?.payment && !body.paymentPath) {
      return res.status(400).json({ message: 'Payment document is mandatory for this application type.' });
    }
    if (!body.transactionNumber || !body.transactionDate) {
      return res.status(400).json({ message: 'Transaction Number and Date are mandatory for this application type.' });
    }
  }

  next();
};
