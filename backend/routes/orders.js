const express = require('express');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/orders/:phone
router.get('/:phone', async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection('orders')
      .find({ studentPhone: req.params.phone })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { studentPhone, courseTitle, classInfo, amount, couponDiscount } = req.body;
    const db = getDB();
    
    const newOrder = {
      studentPhone,
      courseTitle,
      classInfo,
      amount: String(amount),
      couponDiscount: String(couponDiscount || 0),
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await db.collection('orders').insertOne(newOrder);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...newOrder } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const buildIdQuery = (idStr) => {
  try {
    const { ObjectId } = require('mongodb');
    if (ObjectId.isValid(idStr)) {
      return {
        $or: [
          { _id: idStr },
          { _id: new ObjectId(idStr) }
        ]
      };
    }
  } catch (err) {
    // fallback
  }
  return { _id: idStr };
};

// PUT /api/orders/:id  — update payment status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const db = getDB();
    const result = await db.collection('orders').updateOne(
      buildIdQuery(req.params.id),
      { $set: { status, updatedAt: new Date() } }
    );
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
