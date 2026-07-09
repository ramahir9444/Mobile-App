/**
 * db/initCollections.js
 *
 * Runs once at server startup.
 * Creates all collections + enforces indexes.
 *
 * Collections
 * ───────────
 *  students        – one doc per verified phone (unique)
 *  attendance      – one doc per class per student
 *  quiz_results    – one doc per quiz attempt per student
 *  daily_reports   – aggregated daily snapshot per student per date
 */

const { getDB } = require('./mongo');

async function initCollections() {
  const db = getDB();

  // ── 1. students ──────────────────────────────────────────────────
  await db.createCollection('students').catch(() => {});   // ignore if exists
  await db.collection('students').createIndexes([
    { key: { phone: 1 }, unique: true, name: 'phone_unique' },
    { key: { selectedClass: 1 },        name: 'class_idx'   },
    { key: { lastLoginAt: -1 },         name: 'login_idx'   },
  ]);

  // ── 2. attendance ────────────────────────────────────────────────
  await db.createCollection('attendance').catch(() => {});
  await db.collection('attendance').createIndexes([
    // One attendance record per student per class session
    {
      key: { studentPhone: 1, classId: 1 },
      unique: true,
      name: 'attendance_unique',
    },
    { key: { studentPhone: 1, date: -1 }, name: 'attendance_student_date' },
    { key: { date: -1 },                  name: 'attendance_date'         },
    { key: { subjectName: 1 },            name: 'attendance_subject'      },
  ]);

  // ── 3. quiz_results ──────────────────────────────────────────────
  await db.createCollection('quiz_results').catch(() => {});
  await db.collection('quiz_results').createIndexes([
    // A student can attempt the same quiz more than once, so no unique here
    { key: { studentPhone: 1, date: -1 },      name: 'quiz_student_date'    },
    { key: { studentPhone: 1, subjectName: 1 }, name: 'quiz_student_subject' },
    { key: { quizId: 1 },                       name: 'quiz_id_idx'          },
  ]);

  // ── 4. daily_reports ────────────────────────────────────────────
  await db.createCollection('daily_reports').catch(() => {});
  await db.collection('daily_reports').createIndexes([
    // One report per student per calendar day
    {
      key: { studentPhone: 1, reportDate: 1 },
      unique: true,
      name: 'daily_report_unique',
    },
    { key: { reportDate: -1 }, name: 'report_date_idx' },
  ]);

  // ── 5. Seed schedules ────────────────────────────────────────────
  await db.createCollection('schedules').catch(() => {});
  const schedulesCount = await db.collection('schedules').countDocuments();
  if (schedulesCount === 0) {
    console.log('🌱 Seeding default class schedules...');
    const defaultSchedules = [];
    const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    const courseTypes = ['booster', 'master'];

    for (const cls of classes) {
      for (const cType of courseTypes) {
        defaultSchedules.push(
          {
            title: 'Beyond Zero : The World of Integers with Ninja Mam!',
            subject: 'Maths',
            time: '8:10 pm - 9:10 pm',
            dateText: '6 Jul, Mon',
            gradeClass: cls,
            courseType: cType,
            teacherName: 'Ninja Mam (Priyanka)',
            teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
            status: 'Scheduled',
            createdAt: new Date()
          },
          {
            title: 'Vedic Maths !!',
            subject: 'Maths',
            time: '5:30 pm - 6:00 pm',
            dateText: '7 Jul, Tue',
            gradeClass: cls,
            courseType: cType,
            teacherName: 'Manish Sir',
            teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            status: 'Scheduled',
            createdAt: new Date()
          },
          {
            title: 'PTM : Join with Parents for Surprise Olympiad Level Mastery',
            subject: 'Maths',
            time: '8:10 pm - 9:10 pm',
            dateText: '7 Jul, Tue',
            gradeClass: cls,
            courseType: cType,
            teacherName: 'Rishabh Sir',
            teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            status: 'Scheduled',
            createdAt: new Date()
          },
          {
            title: 'Welcome Test',
            subject: 'Test',
            time: '30 minutes',
            dateText: '29 Jun, Mon',
            gradeClass: cls,
            courseType: cType,
            teacherName: 'System',
            teacherAvatar: '',
            status: 'Finished',
            createdAt: new Date()
          }
        );
      }
    }
    await db.collection('schedules').insertMany(defaultSchedules);
    console.log(`✅ Seeded ${defaultSchedules.length} class schedules.`);
  }

  // ── 6. Seed study_materials ──────────────────────────────────────
  await db.createCollection('study_materials').catch(() => {});
  const materialsCount = await db.collection('study_materials').countDocuments();
  if (materialsCount === 0) {
    console.log('🌱 Seeding default study materials...');
    const defaultMaterials = [];
    const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    const courseTypes = ['booster', 'master'];
    const mockPDFs = [
      { fileName: '[E-Module]Motion.pdf', fileSize: '1.6M' },
      { fileName: '[E-Module]Fun with magnet.pdf', fileSize: '1.2M' },
      { fileName: '[E-Module]Body Movement.pdf', fileSize: '1.0M' },
      { fileName: '[E-Module]Day 6 Knowing Our Numbers.pdf', fileSize: '0.3M' },
      { fileName: '[E-Module]Day 5 and 6 Playing with Numbers.pdf', fileSize: '0.9M' },
      { fileName: '[E-Module]Day 3 Fractions Mind-Map.pdf', fileSize: '0.4M' },
      { fileName: '[E-Module]Day 1 Integers E-book.pdf', fileSize: '1.1M' }
    ];

    for (const cls of classes) {
      for (const cType of courseTypes) {
        for (const pdf of mockPDFs) {
          defaultMaterials.push({
            fileName: pdf.fileName,
            fileSize: pdf.fileSize,
            gradeClass: cls,
            courseType: cType,
            fileUrl: '',
            createdAt: new Date()
          });
        }
      }
    }
    await db.collection('study_materials').insertMany(defaultMaterials);
    console.log(`✅ Seeded ${defaultMaterials.length} study materials.`);
  }

  console.log('📦 DB collections + indexes ready');
}

module.exports = { initCollections };
