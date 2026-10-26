import type {
  Badge,
  BatchLeaderboard,
  LeaderboardRow,
  Mcq,
  PointsHistoryEntry,
  Simulation,
} from './types';

export const simulations: Simulation[] = [
  {
    id: 'sim-1',
    title: 'Projectile Motion',
    subject: 'Physics',
    class: '10',
    description: 'Explore kinematic trajectory, launch angle, drag coefficients, and gravitational acceleration.',
    phet_url: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html',
    thumbnail_emoji: '🚀',
  },
  {
    id: 'sim-2',
    title: 'Wave on a String',
    subject: 'Physics',
    class: '10',
    description: 'Adjust frequency, amplitude, and tension to observe wave interference and standing nodes.',
    phet_url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html',
    thumbnail_emoji: '〰️',
  },
  {
    id: 'sim-3',
    title: 'Build an Atom',
    subject: 'Chemistry',
    class: '10',
    description: 'Construct stable isotopes using protons, neutrons, and electron shells. Observe atomic mass.',
    phet_url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html',
    thumbnail_emoji: '⚛️',
  },
  {
    id: 'sim-4',
    title: 'Acid–Base Solutions',
    subject: 'Chemistry',
    class: '10',
    description: 'Test conductivity, litmus paper indicators, and pH levels across strong and weak acids.',
    phet_url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html',
    thumbnail_emoji: '🧪',
  },
  {
    id: 'sim-5',
    title: 'Molecule Shapes (3D VSEPR)',
    subject: 'Chemistry',
    class: '10',
    description: 'Rotate and build 3D geometry of covalent molecules with bonding and lone pair electron repulsion.',
    phet_url: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html',
    thumbnail_emoji: '🔬',
  },
  {
    id: 'sim-6',
    title: 'Natural Selection Simulation',
    subject: 'Biology',
    class: '10',
    description: 'Introduce environmental selective pressures (fur mutation, predators) to witness genetic evolution.',
    phet_url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html',
    thumbnail_emoji: '🐇',
  },
];

export const leaderboard: LeaderboardRow[] = [
  { rank: 1, student_name: 'Rahul Sharma', points: 1840, badge: '🥇', center: 'Stellar Academy', batch: 'Class 10 Science & Maths Morning', student_id: 'ext-1' },
  { rank: 2, student_name: 'Ananya Patel', points: 1780, badge: '🥈', center: 'Apex Chemistry', batch: 'Class 10 Board Excellence Batch', student_id: 'ext-7' },
  { rank: 3, student_name: 'Kabir Mehta', points: 1650, badge: '🥉', center: 'Stellar Academy', batch: 'Class 12 Super 30 PCM', student_id: 'student-3' },
  { rank: 4, student_name: 'Meera Joshi', points: 1520, badge: '⭐', center: 'Zenith Biology', batch: 'Pre-Medical & High School Biology', student_id: 'ext-11' },
  { rank: 5, student_name: 'Vivek Gupta', points: 1490, badge: '⭐', center: 'Stellar Academy', batch: 'Class 10 Science & Maths Morning', student_id: 'ext-2' },
  { rank: 6, student_name: 'Aryan Mehta', points: 1420, badge: '⭐', center: 'Stellar Academy', batch: 'Class 10 Science & Maths Morning', student_id: 'student-1' },
  { rank: 7, student_name: 'Tanvi Desai', points: 1380, badge: '⭐', center: 'Stellar Academy', batch: 'Class 10 Science & Maths Morning', student_id: 'ext-3' },
  { rank: 8, student_name: 'Rohan Verma', points: 1310, badge: '⭐', center: 'Apex Chemistry', batch: 'Class 10 Board Excellence Batch', student_id: 'ext-8' },
  { rank: 9, student_name: 'Sneha Kulkarni', points: 1290, badge: '⭐', center: 'Zenith Biology', batch: 'Pre-Medical & High School Biology', student_id: 'ext-12' },
  { rank: 10, student_name: 'Riya Kapoor', points: 1190, badge: '⭐', center: 'Apex Chemistry', batch: 'Class 10 Board Excellence Batch', student_id: 'ext-9' },
];

export const batchLeaderboards: Record<string, BatchLeaderboard> = {
  'Class 10 Science & Maths Morning': {
    center: 'Stellar Academy',
    subject: 'Maths & Physics',
    teacher: 'Er. Alok Sharma',
    students: [
      { rank: 1, student_name: 'Rahul Sharma', points: 1840, badge: '🥇', streak: '22d streak', role_tag: 'Batch Topper', student_id: 'ext-1' },
      { rank: 2, student_name: 'Vivek Gupta', points: 1490, badge: '🥈', streak: '18d streak', role_tag: 'Rising Challenger', student_id: 'ext-2' },
      { rank: 3, student_name: 'Aryan Mehta', points: 1420, badge: '🥉', streak: '14d streak', role_tag: 'Active Learner', student_id: 'student-1' },
      { rank: 4, student_name: 'Tanvi Desai', points: 1380, badge: '⭐', streak: '11d streak', role_tag: 'Top Quizzer', student_id: 'ext-3' },
      { rank: 5, student_name: 'Rohan Sen', points: 1260, badge: '⭐', streak: '9d streak', role_tag: 'Consistent', student_id: 'ext-4' },
      { rank: 6, student_name: 'Aditi Rao', points: 1180, badge: '⭐', streak: '7d streak', role_tag: 'Focus Ace', student_id: 'ext-5' },
      { rank: 7, student_name: 'Parth Joshi', points: 1050, badge: '⭐', streak: '5d streak', role_tag: 'Steady Effort', student_id: 'ext-6' },
    ],
  },
  'Class 10 Board Excellence Batch': {
    center: 'Apex Chemistry Institute',
    subject: 'Chemistry',
    teacher: 'Dr. Rashmi Verma',
    students: [
      { rank: 1, student_name: 'Ananya Patel', points: 1780, badge: '🥇', streak: '20d streak', role_tag: 'Batch Topper', student_id: 'ext-7' },
      { rank: 2, student_name: 'Rohan Verma', points: 1310, badge: '🥈', streak: '15d streak', role_tag: 'Lab Master', student_id: 'ext-8' },
      { rank: 3, student_name: 'Aryan Mehta', points: 1220, badge: '🥉', streak: '12d streak', role_tag: 'Active', student_id: 'student-1' },
      { rank: 4, student_name: 'Riya Kapoor', points: 1190, badge: '⭐', streak: '10d streak', role_tag: 'Formula Whiz', student_id: 'ext-9' },
      { rank: 5, student_name: 'Devansh Shah', points: 1040, badge: '⭐', streak: '6d streak', role_tag: 'Consistent', student_id: 'ext-10' },
    ],
  },
  'Pre-Medical & High School Biology': {
    center: 'Zenith Biology Tuitions',
    subject: 'Biology',
    teacher: 'Prof. Arindam Sen',
    students: [
      { rank: 1, student_name: 'Meera Joshi', points: 1520, badge: '🥇', streak: '17d streak', role_tag: 'Genetics Topper', student_id: 'ext-11' },
      { rank: 2, student_name: 'Sneha Kulkarni', points: 1290, badge: '🥈', streak: '14d streak', role_tag: 'Physiology Ace', student_id: 'ext-12' },
      { rank: 3, student_name: 'Aryan Mehta', points: 1150, badge: '🥉', streak: '10d streak', role_tag: 'Active', student_id: 'student-1' },
      { rank: 4, student_name: 'Ishaan Roy', points: 980, badge: '⭐', streak: '8d streak', role_tag: 'Cell Bio Pro', student_id: 'ext-13' },
    ],
  },
  'Class 8-10 English Literature Club': {
    center: 'Horizon English Studio',
    subject: 'English',
    teacher: 'Mrs. Kavita Roy',
    students: [
      { rank: 1, student_name: 'Diya Mukherjee', points: 1460, badge: '🥇', streak: '16d streak', role_tag: 'Poetry Critic', student_id: 'ext-14' },
      { rank: 2, student_name: 'Priya Mehta', points: 1350, badge: '🥈', streak: '12d streak', role_tag: 'Grammar Ace', student_id: 'student-2' },
      { rank: 3, student_name: 'Aman Sheikh', points: 1120, badge: '🥉', streak: '9d streak', role_tag: 'Essayist', student_id: 'ext-15' },
    ],
  },
  'Class 12 Super 30 PCM': {
    center: 'Stellar Academy',
    subject: 'Maths & Physics',
    teacher: 'Er. Alok Sharma',
    students: [
      { rank: 1, student_name: 'Kabir Mehta', points: 1850, badge: '🥇', streak: '21d streak', role_tag: 'Batch Topper', student_id: 'student-3' },
      { rank: 2, student_name: 'Nikhil Bose', points: 1690, badge: '🥈', streak: '19d streak', role_tag: 'Calculus Ace', student_id: 'ext-16' },
      { rank: 3, student_name: 'Shruti Iyer', points: 1540, badge: '🥉', streak: '15d streak', role_tag: 'Mock Test Pro', student_id: 'ext-17' },
      { rank: 4, student_name: 'Harsh Vora', points: 1320, badge: '⭐', streak: '11d streak', role_tag: 'Consistent', student_id: 'ext-18' },
    ],
  },
};

export const mcqs: Mcq[] = [
  {
    id: 'mcq-1',
    subject: 'Maths',
    question: 'If p(x) = x² – 3x + 2, what are the zeros of the polynomial?',
    options: { a: '1 and 2', b: '–1 and –2', c: '–1 and 2', d: '1 and –2' },
    correct: 'a',
    explanation: 'Factoring gives (x – 1)(x – 2) = 0, which yields roots x = 1 and x = 2.',
  },
  {
    id: 'mcq-2',
    subject: 'Physics',
    question: 'Which type of optical mirror is utilized in automobile headlights to produce a strong parallel beam?',
    options: { a: 'Plane mirror', b: 'Convex mirror', c: 'Concave mirror', d: 'Cylindrical mirror' },
    correct: 'c',
    explanation: 'When a light source is placed at the principal focus of a concave mirror, reflected rays emerge as a concentrated parallel beam.',
  },
  {
    id: 'mcq-3',
    subject: 'Chemistry',
    question: 'What is the theoretical pH value of pure neutral water at standard room temperature (25°C)?',
    options: { a: '0', b: '5.5', c: '7.0', d: '14.0' },
    correct: 'c',
    explanation: 'In pure water at 25°C, [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M, so pH = –log(10⁻⁷) = 7.0.',
  },
  {
    id: 'mcq-4',
    subject: 'Biology',
    question: 'Which subcellular organelle is designated as the cellular "powerhouse" due to aerobic ATP generation?',
    options: { a: 'Endoplasmic Reticulum', b: 'Ribosome', c: 'Mitochondrion', d: 'Golgi Apparatus' },
    correct: 'c',
    explanation: 'Mitochondria carry out the Krebs cycle and oxidative phosphorylation to synthesize ATP molecules.',
  },
  {
    id: 'mcq-5',
    subject: 'Maths',
    question: "Applying Euclid's Division Algorithm, what is the Highest Common Factor (HCF) of 26 and 91?",
    options: { a: '13', b: '7', c: '26', d: '2' },
    correct: 'a',
    explanation: '91 = 26 × 3 + 13. Next step: 26 = 13 × 2 + 0. Since the remainder is zero, the divisor 13 is the HCF.',
  },
];

export const pointsHistory: PointsHistoryEntry[] = [
  { id: 'ph-1', student_id: 'student-1', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'teacher', awarded_by: 'Er. Alok Sharma (Physics)', date: '2025-10-17', action: 'focus_session', points: 50, description: '45-minute distraction-free focus study verified by faculty' },
  { id: 'ph-2', student_id: 'student-1', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'System QR Scanner', date: '2025-10-16', action: 'attendance', points: 10, description: 'On-time QR Attendance check-in verified at Stellar Academy' },
  { id: 'ph-3', student_id: 'student-1', center_id: 'center-2', center_name: 'Apex Chemistry', award_type: 'teacher', awarded_by: 'Dr. Rashmi Verma (Chemistry)', date: '2025-10-15', action: 'test_score', points: 80, description: 'Top marks in Chemical Reactions & Equations test (18/20)' },
  { id: 'ph-4', student_id: 'student-1', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'Curriculum Tracker', date: '2025-10-14', action: 'topic_revised', points: 15, description: 'Self-revision confirmed: Zeros of Polynomials' },
  { id: 'ph-5', student_id: 'student-1', center_id: 'center-3', center_name: 'Zenith Biology', award_type: 'teacher', awarded_by: 'Prof. Arindam Sen (Biology)', date: '2025-10-13', action: 'attendance', points: 25, description: 'Active classroom engagement & lab demonstration honor' },
  { id: 'ph-6', student_id: 'student-1', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'Streak Engine', date: '2025-10-12', action: 'streak_bonus', points: 25, description: '10-Day continuous study streak milestone bonus!' },
  { id: 'ph-7', student_id: 'student-1', center_id: 'center-2', center_name: 'Apex Chemistry', award_type: 'teacher', awarded_by: 'Dr. Rashmi Verma', date: '2025-10-11', action: 'focus_session', points: 50, description: 'Periodic Table mnemonic mastery verified in class' },
  { id: 'ph-8', student_id: 'student-1', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'Syllabus Engine', date: '2025-10-10', action: 'topic_done', points: 20, description: 'Topic mastery checked: Laws of Reflection' },

  { id: 'ph-9', student_id: 'student-2', center_id: 'center-4', center_name: 'Horizon English Studio', award_type: 'teacher', awarded_by: 'Mrs. Kavita Roy (English)', date: '2025-10-16', action: 'test_score', points: 60, description: 'Outstanding analytical paragraph in Term 1 evaluation' },
  { id: 'ph-10', student_id: 'student-2', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'System QR Scanner', date: '2025-10-15', action: 'attendance', points: 10, description: 'On-time QR Attendance check-in verified at Stellar Academy' },
  { id: 'ph-11', student_id: 'student-2', center_id: null, center_name: null, award_type: 'system', awarded_by: 'Focus Room Engine', date: '2025-10-14', action: 'focus_session', points: 25, description: 'Pomodoro focus session completed in the study room' },

  { id: 'ph-12', student_id: 'student-3', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'teacher', awarded_by: 'Er. Alok Sharma (Maths)', date: '2025-10-19', action: 'test_score', points: 150, description: 'Rank #1 in Super 30 PCM Full Syllabus Mock (91/100)' },
  { id: 'ph-13', student_id: 'student-3', center_id: 'center-2', center_name: 'Apex Chemistry', award_type: 'teacher', awarded_by: 'Dr. Rashmi Verma', date: '2025-10-18', action: 'test_score', points: 100, description: 'Flawless named-reaction mechanism sheet in Grand Test' },
  { id: 'ph-14', student_id: 'student-3', center_id: 'center-1', center_name: 'Stellar Academy', award_type: 'system', awarded_by: 'Streak Engine', date: '2025-10-17', action: 'streak_bonus', points: 50, description: '21-Day continuous study streak milestone bonus!' },
];

export const badges: Badge[] = [
  { id: 'badge-1', name: 'Multi-Center Scholar', description: 'Enrolled and actively learning across multiple coaching faculties', icon_emoji: '🏛️', earned: true, earned_date: '2025-08-01' },
  { id: 'badge-2', name: '7-Day Flame', description: 'Active learning streak of 7 continuous days', icon_emoji: '🔥', earned: true, earned_date: '2025-08-08' },
  { id: 'badge-3', name: 'Honor Roll', description: 'Scored above 85% in any formal assessment across any faculty', icon_emoji: '🏆', earned: true, earned_date: '2025-09-06' },
  { id: 'badge-4', name: 'Deep Focus Pro', description: 'Finished 10 verified timer focus sessions in the study room', icon_emoji: '🎯', earned: false, earned_date: null },
  { id: 'badge-5', name: 'On-Time Scholar', description: 'All term fees cleared prior to due dates across all coaching centers', icon_emoji: '💎', earned: true, earned_date: '2025-10-02' },
  { id: 'badge-6', name: 'STEM Explorer', description: 'Completed 5 interactive virtual laboratory simulations', icon_emoji: '🧪', earned: true, earned_date: '2025-10-12' },
];
