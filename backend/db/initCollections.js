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

  console.log('📦 DB collections + indexes ready');
}

module.exports = { initCollections };
