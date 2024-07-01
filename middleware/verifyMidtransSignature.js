const crypto = require('crypto');



const verifyMidtransSignature = (req, res, next) => {
  const { signature_key, order_id, status_code, gross_amount } = req.body;
  const serverKey = process.env.SERVER_KEY_MIDTRANS;

  if (!signature_key) {
    return res.status(401).json({ status: 401, message: 'Missing signature' });
  }

  const payload = order_id + status_code + gross_amount + serverKey;
  const calculatedSignature = crypto
    .createHash('sha512')
    .update(payload)
    .digest('hex');

  if (calculatedSignature === signature_key) {
    next();
  } else {
    console.log('Expected:', calculatedSignature);
    console.log('Received:', signature_key);
    res.status(401).json({ status: 401, message: 'Invalid signature' });
  }
};
module.exports = verifyMidtransSignature;