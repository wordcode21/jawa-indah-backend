const crypto = require('crypto');

function verifyMidtransSignature(req, res, next) {
  const signatureKey = process.env.SERVER_KEY_MIDTRANS;
  const body = JSON.stringify(req.body);
  const receivedSignature = req.headers['x-callback-signature'];
  const calculatedSignature = crypto
    .createHmac('sha512', signatureKey)
    .update(body)
    .digest('hex');

  if (calculatedSignature === receivedSignature) {
    next();
  } else {
    res.status(400).json({ status: 400, message: 'Invalid signature' });
  }
}

module.exports = verifyMidtransSignature;