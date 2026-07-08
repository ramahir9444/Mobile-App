const express = require('express');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/orders (all orders for admin tracker)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Helper function to update student enrollmentType in MongoDB
async function updateStudentEnrollment(db, phone, courseTitle, amount) {
  try {
    const isBooster = courseTitle.toLowerCase().includes('booster') || 
                      courseTitle.toLowerCase().includes('demo') || 
                      courseTitle.toLowerCase().includes('6-day') || 
                      courseTitle.toLowerCase().includes('6 day') || 
                      Number(amount) < 500;
    const enrollmentType = isBooster ? 'demo' : 'master';
    await db.collection('students').updateOne(
      { phone },
      { $set: { enrollmentType, updatedAt: new Date() } }
    );
    console.log(`[Enrollment] Updated student ${phone} to type: ${enrollmentType}`);
  } catch (err) {
    console.error('[Enrollment] Failed to update student:', err);
  }
}

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { studentPhone, courseTitle, classInfo, amount, couponDiscount, status } = req.body;
    const db = getDB();
    
    const orderStatus = status || 'pending';
    const newOrder = {
      studentPhone,
      courseTitle,
      classInfo,
      amount: String(amount),
      couponDiscount: String(couponDiscount || 0),
      status: orderStatus,
      createdAt: new Date(),
    };

    const result = await db.collection('orders').insertOne(newOrder);
    
    if (orderStatus === 'paid') {
      await updateStudentEnrollment(db, studentPhone, courseTitle, amount);
    }

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
    
    const order = await db.collection('orders').findOne(buildIdQuery(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await db.collection('orders').updateOne(
      buildIdQuery(req.params.id),
      { $set: { status, updatedAt: new Date() } }
    );

    if (status === 'paid') {
      await updateStudentEnrollment(db, order.studentPhone, order.courseTitle, order.amount);
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
