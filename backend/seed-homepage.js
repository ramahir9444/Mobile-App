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

  let boosterSubjects = ['Maths', 'Science', 'English'];
  let boosterSubjectsLine = 'Maths & Science & Olympiads';
  let masterSubjects = 'Maths, Science, English, MAT, CS';
  let masterMetricCourses = '400+';
  let masterMetricConcepts = '200+';
  let masterMetricQuizzes = '5000+';
  let masterPrice = 31999;
  let boosterPrice = 149;
  let boosterOriginalPrice = 999;

  if (i <= 2) {
    boosterSubjectsLine = 'Maths & EVS (Foundation concepts)';
    boosterSubjects = ['Maths', 'EVS', 'English'];
    masterSubjects = 'Maths, EVS, English, MAT';
    masterMetricCourses = '200+'; masterMetricConcepts = '100+'; masterMetricQuizzes = '2000+';
    masterPrice = 19999; boosterPrice = 99; boosterOriginalPrice = 599;
  } else if (i <= 5) {
    boosterSubjectsLine = 'Maths & Science & Olympiads';
    masterSubjects = 'Maths, Science, English, MAT';
    masterMetricCourses = '300+'; masterMetricConcepts = '150+'; masterMetricQuizzes = '3500+';
    masterPrice = 24999; boosterPrice = 129; boosterOriginalPrice = 799;
  } else if (i <= 8) {
    boosterSubjectsLine = 'Maths & Science & SST (Core + Advanced)';
    masterSubjects = 'Maths, Science, English, SST, MAT, CS';
    masterMetricCourses = '400+'; masterMetricConcepts = '200+'; masterMetricQuizzes = '5000+';
    masterPrice = 31999; boosterPrice = 149; boosterOriginalPrice = 999;
  } else {
    boosterSubjectsLine = 'Physics, Chemistry, Biology & Maths (IIT Foundation)';
    boosterSubjects = ['Physics', 'Chemistry', 'Biology', 'Maths'];
    masterSubjects = 'Physics, Chemistry, Biology, Maths, English, CS';
    masterMetricCourses = '500+'; masterMetricConcepts = '300+'; masterMetricQuizzes = '8000+';
    masterPrice = 39999; boosterPrice = 199; boosterOriginalPrice = 1499;
  }

  const coreConcepts = i >= 9 ? '60+' : '50+';
  const solvingSkills = i >= 9 ? '70+' : '50+';
  const quizCount = i >= 9 ? '500+' : '300+';

  configs.push({
    classId,
    bannerText,
    teachers: [
      { name: 'Sonia Verma', role: 'Maths Expert', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120' },
      { name: 'Pankaj Goyal', role: 'Science Expert', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
      { name: 'Anshu Patel', role: 'English Expert', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }
    ],
    upcomingClass: {
      title: i <= 5 ? 'Fun with Numbers & Shapes - Lesson 1' : i <= 8 ? 'Linear Equations & Algebraic Identities' : 'IIT/JEE Foundation: Quadratic Functions',
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
      subjects: boosterSubjects,
      heroChipText: 'Active Enrollment Period Open',
      parentsBadgeText: "🏆 10,000,000+ Parents' Choice",
      bullets: [boosterSubjectsLine, `${coreConcepts} Core Concepts`, `${solvingSkills} Solving Skills`, 'IIT/NIT Teachers'],
      reviewSectionTitle: 'Highly Rated by Parents & Students',
      review1Name: 'Kabir',
      review1Date: '16 May 2026',
      review1Text: 'It is really good because you have the best teacher and they explain really nicely and energetic!!! Best Choice ever to join Oda!!',
      review1Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      review2Name: 'Aadhya',
      review2Date: '11 May 2026',
      review2Text: "It's very good learning app for children.. the teacher inspired our children and topics are also too good .... I think it is best learning app 💖😊",
      review2Avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
      score100Title: 'Score 100% and Become Topper',
      subjectsLine: boosterSubjectsLine,
      grid1Badge: 'Secret of 83%',
      grid1Title: 'Higher Score',
      grid2Title: `${coreConcepts} Core Concepts`,
      grid2Subtitle: 'Most asked concepts and topics',
      grid3Title: `${solvingSkills} Solving Skills`,
      grid3Subtitle: 'Summarized by IIT/NIT teachers',
      grid4Title: `${quizCount} Quizzes`,
      grid4Subtitle: 'Practice to master concepts',
      liveSectionTitle: 'Immersive & Interactive LIVE Course',
      trustMetric1Title: 'LIVE Course',
      trustMetric1Subtitle: 'Immersive Replay',
      trustMetric2Title: '1 on 1 Service',
      trustMetric2Subtitle: 'Mentor Support',
      trustMetric3Title: 'Quality Guaranteed',
      trustMetric3Subtitle: 'Best Educators',
      heroBannerImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80',
      teacherCardImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      teacher1Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      teacher2Avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      teacher3Avatar: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=100&auto=format&fit=crop&q=80',
      price: boosterPrice,
      originalPrice: boosterOriginalPrice
    },
    masterProgram: {
      headerTitle: `${classId} Master Program`,
      headerSubtitle: 'Long-term Comprehensive Intensive 🎯',
      title: `LIVE Interactive Full Syllabus Course for ${classId} (2026-27)`,
      bullets: ['Full Academic Year Preparation', 'Complete CBSE/ICSE Board Syllabus covered', `All Core Subjects: ${masterSubjects}`],
      subjectsCardLabel: 'Full Subjects:',
      subjectsCardText: masterSubjects,
      metricCourses: `${masterMetricCourses} Courses`,
      metricConcepts: `${masterMetricConcepts} Concepts`,
      metricQuizzes: `${masterMetricQuizzes} Quizzes`,
      scheduleText: 'LIVE at 7:00 pm, Tomorrow',
      subjectPillText: masterSubjects,
      outline: [
        `${masterSubjects.split(',')[0].trim()} - Core Concepts | Foundational Topics & Problem Solving`,
        `${masterSubjects.split(',')[1] ? masterSubjects.split(',')[1].trim() : 'Science'} - Chapter 1 | Key Principles & Lab Concepts`,
        `${masterSubjects.split(',')[2] ? masterSubjects.split(',')[2].trim() : 'English'} - Grammar Essentials | Writing & Comprehension`
      ],
      outlineSubtitle: 'The course outline prepares you step-by-step from foundational topics to advanced board standard prep',
      ratingsTitle: 'Ratings',
      ratingsCount: '2169812',
      ratingScore: '4.7',
      ratingChip1: 'Energetic Teaching(556133)',
      ratingChip2: 'Super Worthy(513807)',
      ratingChip3: 'Highly Recommended(496025)',
      testimonialName: 'Not_Dumb_girl_Ananya',
      testimonialDate: '30 Jun, 2026',
      testimonialText: 'Very fun class. I have a mini game for you play. Keep scrolling and keep your finger on the dashboard.',
      testimonialSessionTag: 'Session: Robotics | Light it UP in Patterns!',
      testimonialTags: ['Highly Recommended', 'Calm & Rigorous', 'Inspirational'],
      facultyTitle: 'Turbocharged Faculty Than Ever',
      facultySubtitle: 'Brand-New IIT/NIT Star Experts',
      featuredTeacherName: 'Vikas Sir',
      featuredTeacherRole: 'NIT.S Expert',
      featuredTeacherRating: '99.7% 👍',
      featuredTeacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      teamSectionTitle: 'Superior Teaching Team',
      teamBadge1: '20+ IIT/NIT Teachers',
      teamBadge2: 'Good Rate Avg. 98.6%',
      resultsSectionTitle: 'Top Teaching Results',
      resultsSectionSubtitle: 'Over 10 million students\nAverage score increase of 46.7%',
      studentResult1Name: 'Aarav',
      studentResult1Pct: '+71%',
      studentResult1Avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      studentResult2Name: 'Anaya',
      studentResult2Pct: '+37%',
      studentResult2Avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      studentResult3Name: 'Rohan',
      studentResult3Pct: '+51%',
      studentResult3Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      chatBubble1: 'Oda is revolutionizing online learning!',
      chatBubble2: 'Incredible courses! Oda makes learning fun!',
      chatBubble3: 'Seriously, learning has never been easier!',
      trustNumber: '20,103,026',
      trustLabel: 'parents and students\n oda class',
      price: masterPrice
    },
    updatedAt: new Date()
  });
}

async function run() {
  let client;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db(DB_NAME);
    await db.collection('homepage_configs').deleteMany({});
    console.log('Cleared existing homepage configs in Atlas');
    const result = await db.collection('homepage_configs').insertMany(configs);
    console.log(`Successfully seeded ${result.insertedCount} class homepage configurations in Atlas!`);
  } catch (err) {
    console.error('Error connecting to Atlas / seeding Atlas:', err.message);
    console.log('Falling back to seed local JSON file database instead...');
    
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(__dirname, 'db', 'local_db.json');
    
    let localData = {};
    if (fs.existsSync(localDbPath)) {
      try {
        localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      } catch (e) {
        localData = {};
      }
    }
    localData.homepage_configs = configs;
    
    // ensure db directory exists
    const dbDir = path.dirname(localDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), 'utf8');
    console.log(`Successfully seeded ${configs.length} class homepage configurations to local JSON file db!`);
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {}
    }
  }
}

run();
