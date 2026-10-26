import type { AttendanceRecord, SyllabusTopic, TimetableEntry, Video } from './types';

// Deterministic attendance generator ported from js/data.js so the mobile app
// and the website render identical registers for the same demo month.
function generateMonthRecords(
  out: AttendanceRecord[],
  seq: { n: number },
  year: number,
  month: number,
  studentId: string,
  centerId: string,
  subject: string,
  presentProb: number,
) {
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0) continue; // Sunday off

    const rand = Math.sin(d * 19 + month * 29 + (studentId === 'student-1' ? 5 : 11));
    const val = (rand + 1) / 2;

    let status: AttendanceRecord['status'] = 'present';
    if (val > presentProb) status = val > presentProb + 0.08 ? 'absent' : 'late';

    out.push({
      id: `att-${seq.n++}`,
      student_id: studentId,
      center_id: centerId,
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      status,
      subject,
    });
  }
}

export const attendance: AttendanceRecord[] = (() => {
  const out: AttendanceRecord[] = [];
  const seq = { n: 1 };

  // Aryan Mehta (Class 10) — three centers
  generateMonthRecords(out, seq, 2025, 8, 'student-1', 'center-1', 'Maths & Physics', 0.9);
  generateMonthRecords(out, seq, 2025, 9, 'student-1', 'center-1', 'Maths & Physics', 0.88);
  generateMonthRecords(out, seq, 2025, 10, 'student-1', 'center-1', 'Maths & Physics', 0.92);
  generateMonthRecords(out, seq, 2025, 8, 'student-1', 'center-2', 'Chemistry', 0.86);
  generateMonthRecords(out, seq, 2025, 9, 'student-1', 'center-2', 'Chemistry', 0.85);
  generateMonthRecords(out, seq, 2025, 10, 'student-1', 'center-2', 'Chemistry', 0.89);
  generateMonthRecords(out, seq, 2025, 8, 'student-1', 'center-3', 'Biology', 0.87);
  generateMonthRecords(out, seq, 2025, 9, 'student-1', 'center-3', 'Biology', 0.84);
  generateMonthRecords(out, seq, 2025, 10, 'student-1', 'center-3', 'Biology', 0.88);

  // Priya Mehta (Class 8) — Stellar Academy + Horizon English Studio
  generateMonthRecords(out, seq, 2025, 9, 'student-2', 'center-1', 'Science & Maths', 0.85);
  generateMonthRecords(out, seq, 2025, 10, 'student-2', 'center-1', 'Science & Maths', 0.86);
  generateMonthRecords(out, seq, 2025, 9, 'student-2', 'center-4', 'English Studio', 0.92);
  generateMonthRecords(out, seq, 2025, 10, 'student-2', 'center-4', 'English Studio', 0.94);

  // Kabir Mehta (Class 12) — Stellar Academy + Apex Chemistry
  generateMonthRecords(out, seq, 2025, 9, 'student-3', 'center-1', 'PCM Super 30', 0.94);
  generateMonthRecords(out, seq, 2025, 10, 'student-3', 'center-1', 'PCM Super 30', 0.95);
  generateMonthRecords(out, seq, 2025, 9, 'student-3', 'center-2', 'Chemistry', 0.91);
  generateMonthRecords(out, seq, 2025, 10, 'student-3', 'center-2', 'Chemistry', 0.93);

  return out;
})();

export const timetable: TimetableEntry[] = [
  // Center 1: Stellar Academy
  { id: 'tt-1', center_id: 'center-1', day_of_week: 'Mon', subject: 'Maths', start_time: '08:30', end_time: '09:45', teacher: 'Er. Alok Sharma', room: 'Hall A (Maths Studio)' },
  { id: 'tt-2', center_id: 'center-1', day_of_week: 'Mon', subject: 'Physics', start_time: '10:00', end_time: '11:15', teacher: 'Dr. Deepa Nair', room: 'Physics Lab 1' },
  { id: 'tt-3', center_id: 'center-1', day_of_week: 'Wed', subject: 'Maths', start_time: '08:30', end_time: '09:45', teacher: 'Er. Alok Sharma', room: 'Hall A (Maths Studio)' },
  { id: 'tt-4', center_id: 'center-1', day_of_week: 'Wed', subject: 'Physics', start_time: '10:00', end_time: '11:15', teacher: 'Dr. Deepa Nair', room: 'Physics Lab 1' },
  { id: 'tt-5', center_id: 'center-1', day_of_week: 'Fri', subject: 'Maths', start_time: '08:30', end_time: '09:45', teacher: 'Er. Alok Sharma', room: 'Hall A (Problem Solving)' },
  { id: 'tt-6', center_id: 'center-1', day_of_week: 'Sat', subject: 'Physics', start_time: '09:00', end_time: '11:00', teacher: 'Dr. Deepa Nair', room: 'Numerical Workshop' },

  // Center 2: Apex Chemistry Institute
  { id: 'tt-7', center_id: 'center-2', day_of_week: 'Tue', subject: 'Chemistry', start_time: '16:00', end_time: '17:30', teacher: 'Dr. Rashmi Verma', room: 'Organic Chemistry Room' },
  { id: 'tt-8', center_id: 'center-2', day_of_week: 'Thu', subject: 'Chemistry', start_time: '16:00', end_time: '17:30', teacher: 'Dr. Rashmi Verma', room: 'Inorganic Analysis Lab' },
  { id: 'tt-9', center_id: 'center-2', day_of_week: 'Sat', subject: 'Chemistry', start_time: '15:00', end_time: '17:00', teacher: 'Dr. Rashmi Verma', room: 'Board Question Bank Revision' },

  // Center 3: Zenith Biology Tuitions
  { id: 'tt-10', center_id: 'center-3', day_of_week: 'Tue', subject: 'Biology', start_time: '18:00', end_time: '19:15', teacher: 'Prof. Arindam Sen', room: 'Microscopy Suite' },
  { id: 'tt-11', center_id: 'center-3', day_of_week: 'Thu', subject: 'Biology', start_time: '18:00', end_time: '19:15', teacher: 'Prof. Arindam Sen', room: 'Physiology Lecture Hall' },
  { id: 'tt-12', center_id: 'center-3', day_of_week: 'Sun', subject: 'Biology', start_time: '10:00', end_time: '11:30', teacher: 'Prof. Arindam Sen', room: 'Doubt Clearing & Diagram Drill' },

  // Center 4: Horizon English Studio
  { id: 'tt-13', center_id: 'center-4', day_of_week: 'Wed', subject: 'English', start_time: '17:00', end_time: '18:15', teacher: 'Mrs. Kavita Roy', room: 'Creative Writing Chamber' },
  { id: 'tt-14', center_id: 'center-4', day_of_week: 'Fri', subject: 'English', start_time: '17:00', end_time: '18:15', teacher: 'Mrs. Kavita Roy', room: 'Literature & Drama Studio' },
];

export const syllabus: SyllabusTopic[] = [
  // Center 1: Stellar Academy (Maths & Physics)
  { id: 'syl-1', center_id: 'center-1', subject: 'Maths', chapter: 'Real Numbers', topic: "Euclid's Division Lemma & HCF", planned_date: '2025-08-04', covered_date: '2025-08-04', status: 'covered', revised_by_student: true },
  { id: 'syl-2', center_id: 'center-1', subject: 'Maths', chapter: 'Real Numbers', topic: 'Fundamental Theorem of Arithmetic', planned_date: '2025-08-11', covered_date: '2025-08-11', status: 'covered', revised_by_student: true },
  { id: 'syl-3', center_id: 'center-1', subject: 'Maths', chapter: 'Polynomials', topic: 'Geometrical Meaning of Zeros', planned_date: '2025-08-18', covered_date: '2025-08-18', status: 'covered', revised_by_student: true },
  { id: 'syl-4', center_id: 'center-1', subject: 'Maths', chapter: 'Polynomials', topic: 'Division Algorithm & Remainder', planned_date: '2025-09-01', covered_date: '2025-09-02', status: 'partial', revised_by_student: false },
  { id: 'syl-5', center_id: 'center-1', subject: 'Maths', chapter: 'Quadratic Equations', topic: 'Solving by Factorisation Method', planned_date: '2025-09-15', covered_date: '2025-09-15', status: 'covered', revised_by_student: true },
  { id: 'syl-6', center_id: 'center-1', subject: 'Physics', chapter: 'Light – Reflection', topic: 'Laws of Reflection & Curved Mirrors', planned_date: '2025-08-05', covered_date: '2025-08-05', status: 'covered', revised_by_student: true },
  { id: 'syl-7', center_id: 'center-1', subject: 'Physics', chapter: 'Light – Reflection', topic: 'Ray Diagrams for Concave & Convex', planned_date: '2025-08-12', covered_date: '2025-08-12', status: 'covered', revised_by_student: true },
  { id: 'syl-8', center_id: 'center-1', subject: 'Physics', chapter: 'Light – Refraction', topic: "Snell's Law and Refractive Index", planned_date: '2025-09-02', covered_date: '2025-09-02', status: 'covered', revised_by_student: false },
  { id: 'syl-9', center_id: 'center-1', subject: 'Physics', chapter: 'Electricity', topic: "Ohm's Law & Resistance Factors", planned_date: '2025-09-16', covered_date: null, status: 'skipped', revised_by_student: false },
  { id: 'syl-10', center_id: 'center-1', subject: 'Physics', chapter: 'Electricity', topic: 'Combination of Resistors (Series / Parallel)', planned_date: '2025-10-06', covered_date: '2025-10-07', status: 'covered', revised_by_student: true },

  // Center 2: Apex Chemistry Institute
  { id: 'syl-11', center_id: 'center-2', subject: 'Chemistry', chapter: 'Chemical Reactions', topic: 'Balancing Chemical Equations', planned_date: '2025-08-06', covered_date: '2025-08-06', status: 'covered', revised_by_student: true },
  { id: 'syl-12', center_id: 'center-2', subject: 'Chemistry', chapter: 'Chemical Reactions', topic: 'Types of Reactions (Redox & Precipitation)', planned_date: '2025-08-13', covered_date: '2025-08-13', status: 'covered', revised_by_student: true },
  { id: 'syl-13', center_id: 'center-2', subject: 'Chemistry', chapter: 'Acids, Bases & Salts', topic: 'Properties of Acids & Bases', planned_date: '2025-09-03', covered_date: '2025-09-03', status: 'covered', revised_by_student: false },
  { id: 'syl-14', center_id: 'center-2', subject: 'Chemistry', chapter: 'Acids, Bases & Salts', topic: 'Importance of pH Scale & Indicators', planned_date: '2025-09-17', covered_date: '2025-09-18', status: 'partial', revised_by_student: false },
  { id: 'syl-15', center_id: 'center-2', subject: 'Chemistry', chapter: 'Metals & Non-metals', topic: 'Reactivity Series of Metals', planned_date: '2025-10-07', covered_date: '2025-10-07', status: 'covered', revised_by_student: true },

  // Center 3: Zenith Biology Tuitions
  { id: 'syl-16', center_id: 'center-3', subject: 'Biology', chapter: 'Life Processes', topic: 'Autotrophic & Heterotrophic Nutrition', planned_date: '2025-08-07', covered_date: '2025-08-07', status: 'covered', revised_by_student: true },
  { id: 'syl-17', center_id: 'center-3', subject: 'Biology', chapter: 'Life Processes', topic: 'Aerobic & Anaerobic Cellular Respiration', planned_date: '2025-08-14', covered_date: '2025-08-14', status: 'covered', revised_by_student: false },
  { id: 'syl-18', center_id: 'center-3', subject: 'Biology', chapter: 'Control & Coordination', topic: 'Human Nervous System & Reflex Arc', planned_date: '2025-09-04', covered_date: '2025-09-05', status: 'partial', revised_by_student: false },
  { id: 'syl-19', center_id: 'center-3', subject: 'Biology', chapter: 'Control & Coordination', topic: 'Endocrine Glands & Hormones in Animals', planned_date: '2025-09-18', covered_date: '2025-09-18', status: 'covered', revised_by_student: true },
  { id: 'syl-20', center_id: 'center-3', subject: 'Biology', chapter: 'How Organisms Reproduce', topic: 'Modes of Reproduction by Single Cells', planned_date: '2025-10-08', covered_date: null, status: 'upcoming', revised_by_student: false },

  // Center 4: Horizon English Studio
  { id: 'syl-21', center_id: 'center-4', subject: 'English', chapter: 'First Flight Prose', topic: 'A Letter to God (Thematic Analysis)', planned_date: '2025-08-08', covered_date: '2025-08-08', status: 'covered', revised_by_student: true },
  { id: 'syl-22', center_id: 'center-4', subject: 'English', chapter: 'First Flight Prose', topic: 'Nelson Mandela: Long Walk to Freedom', planned_date: '2025-08-15', covered_date: '2025-08-15', status: 'covered', revised_by_student: true },
  { id: 'syl-23', center_id: 'center-4', subject: 'English', chapter: 'Grammar & Usage', topic: 'Reported Speech (Direct to Indirect)', planned_date: '2025-09-05', covered_date: '2025-09-05', status: 'covered', revised_by_student: false },
  { id: 'syl-24', center_id: 'center-4', subject: 'English', chapter: 'Grammar & Usage', topic: 'Conditionals & Modal Auxiliaries', planned_date: '2025-09-19', covered_date: null, status: 'skipped', revised_by_student: false },
  { id: 'syl-25', center_id: 'center-4', subject: 'English', chapter: 'Writing Skills', topic: 'Analytical Paragraph & Formal Letter', planned_date: '2025-10-09', covered_date: '2025-10-09', status: 'covered', revised_by_student: true },
];

export const videos: Video[] = [
  { id: 'vid-1', center_id: 'center-1', teacher_name: 'Er. Alok Sharma', title: 'Quadratic Equations Masterclass', subject: 'Maths', chapter: 'Quadratic Equations', youtube_id: 'IWigcMGGMIs', duration: '18:24', description: 'Step-by-step breakdown of factorisation, completing the square, and the quadratic formula.' },
  { id: 'vid-2', center_id: 'center-1', teacher_name: 'Er. Alok Sharma', title: 'Trigonometry Ratios & Values', subject: 'Maths', chapter: 'Trigonometry', youtube_id: 'F21S9Wpi0y8', duration: '22:10', description: 'Visual intuition behind Sine, Cosine, Tangent and standard angle identities.' },
  { id: 'vid-3', center_id: 'center-1', teacher_name: 'Dr. Deepa Nair', title: "Newton's Laws of Motion in Action", subject: 'Physics', chapter: 'Force & Laws of Motion', youtube_id: 'ZM8ECpBuQYE', duration: '15:44', description: 'Inertia, momentum vectors, and action-reaction pairs illustrated with animations.' },
  { id: 'vid-4', center_id: 'center-1', teacher_name: 'Dr. Deepa Nair', title: 'Current Electricity & Circuit Diagrams', subject: 'Physics', chapter: 'Electricity', youtube_id: 'BLbHC7elJAM', duration: '20:30', description: "Potential difference, Ohm's Law, and equivalent resistance calculations." },
  { id: 'vid-5', center_id: 'center-2', teacher_name: 'Dr. Rashmi Verma', title: "Bohr's Model of the Atom", subject: 'Chemistry', chapter: 'Structure of the Atom', youtube_id: 'FSyAehMdpyQ', duration: '16:52', description: 'Electronic configurations, valency electrons, and modern atomic structure.' },
  { id: 'vid-6', center_id: 'center-2', teacher_name: 'Dr. Rashmi Verma', title: 'Chemical Reactions & Equations', subject: 'Chemistry', chapter: 'Chemical Reactions', youtube_id: 'vt8pvLByTfQ', duration: '19:05', description: 'Balancing coefficients, oxidation states, and precipitation reactions.' },
  { id: 'vid-7', center_id: 'center-3', teacher_name: 'Prof. Arindam Sen', title: 'Cell Structure and Organelles', subject: 'Biology', chapter: 'Life Processes', youtube_id: '8IlzKri08kQ', duration: '24:18', description: 'Detailed walkthrough of cellular machinery: mitochondria, ribosomes, ER, and nucleus.' },
  { id: 'vid-8', center_id: 'center-4', teacher_name: 'Mrs. Kavita Roy', title: 'Reported Speech & Direct Indirect', subject: 'English', chapter: 'Grammar & Usage', youtube_id: 'Dqjb_mdvhM4', duration: '12:00', description: 'Tense backshifting rules, modal changes, and pronoun transformations.' },
];
