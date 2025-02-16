const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');

const router = express.Router();  // ✅ Define a router instance
router.use(express.json());
router.use(cors());

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_LvN2Or4O5JP9tu',  // Replace with your Razorpay key ID
    key_secret: 'TmdWxl3OEFpWVwKphNGH4IAz',  // Replace with your Razorpay secret key
});

// Create an order with ₹30 as the default amount
router.post('/payment', async (req, res) => {
  try {
    const options = {
      amount: 30 * 100, // ₹30 in paise (3000 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Automatically capture payment
    };

    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error creating payment order' });
  }
});

module.exports = router;  // ✅ Correctly export the router
