require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'oda_class';

const configs = [];
for (let i = 1; i <= 11; i++) {
  const classId = `Class ${i}`;
  const isOlderClass = i >= 8;
  const bannerText = isOlderClass 
    ? "Most Pioneer LIVE Learning Platform" 
    : "Best with 20 Million Users' Trust";

  configs.push({
    classId,
    bannerText,
    teachers: [
      { name: 'Sonia Verma', role: 'Maths Expert', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120' },
      { name: 'Pankaj Goyal', role: 'Science Expert', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
      { name: 'Anshu Patel', role: 'English Expert', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }
    ],
    upcomingClass: {
      title: i <= 5 
        ? 'Fun with Numbers & Shapes - Lesson 1' 
        : i <= 8 
          ? 'Linear Equations & Algebraic Identities' 
          : 'IIT/JEE Foundation: Quadratic Functions',
      subject: i <= 5 ? 'Maths' : 'Mathematics',
      time: 'Today, 6:00 PM',
      teacherName: 'Sonia Verma',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'
    },
    boosterCourse: {
      headerTitle: '6-Day Head Start Course',
      headerSubtitle: 'IIT/NIT Premium BootCamp',
      cardTitle: "Maximize Your Child's Potential 100%",
      title: 'Concept Booster Course - 5X Efficient Learning Methods by IITians',
      subjects: ['Maths', 'Science', 'English'],
      bullets: [
        'Maths & Science & Olympiads',
        '50+ Core Concepts',
        '50+ Solving Skills',
        'IIT/NIT Teachers'
      ],
      price: 149,
      originalPrice: 999
    },
    masterProgram: {
      headerTitle: 'Master Program',
      headerSubtitle: 'Long-term Comprehensive Intensive 🎯',
      title: `LIVE Interactive Full Syllabus Course for ${classId} (2026-27)`,
      bullets: [
        'Full Academic Year Preparation',
        'Complete CBSE/ICSE Board Syllabus covered',
        'All Core Subjects: Maths, Science, SST & English'
      ],
      outline: [
        'LIVE classes twice a week with interactive quiz challenges',
        'Prepares students from basics to advanced board standards',
        'Direct 1-on-1 chat doubt-solving and customized mentorship'
      ],
      price: 31999
    },
    updatedAt: new Date()
  });
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    
    // Clear and insert
    await db.collection('homepage_configs').deleteMany({});
    console.log('Cleared existing homepage configs');
    
    const result = await db.collection('homepage_configs').insertMany(configs);
    console.log(`Successfully seeded ${result.insertedCount} class homepage configurations!`);
  } catch (err) {
    console.error('Error seeding homepage:', err);
  } finally {
    await client.close();
  }
}

run();
