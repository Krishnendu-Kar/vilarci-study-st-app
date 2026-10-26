// Shared relational types mirroring the website's window.DATA schema
// (Vilarci-Study-demo/Anitigravity/js/data.js). Keep field names identical
// so a later Supabase swap only touches src/lib/api, never the screens.

export type CenterId = string;
export type StudentId = string;

export interface Center {
  id: CenterId;
  name: string;
  type: string;
  tagline: string;
  teacher_name: string;
  subjects: string[];
  code: string;
  logo_text: string;
  established: number;
  phone: string;
  email: string;
  address: string;
  color: string;
  monthly_fee: number;
  active_batch: string;
}

export interface Student {
  id: StudentId;
  name: string;
  roll: string;
  class: string;
  board: string;
  dob: string;
  phone: string;
  phone_verified: boolean;
  father_name: string;
  father_phone: string;
  father_phone_verified: boolean;
  mother_name: string;
  mother_phone: string;
  mother_phone_verified: boolean;
  guardian_name: string;
  guardian_phone: string;
  guardian_phone_verified: boolean;
  photo_initials: string;
  avatar_gradient: [string, string];
  enrolled_centers: CenterId[];
  points: number;
  streak: number;
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  id: string;
  student_id: StudentId;
  center_id: CenterId;
  date: string;
  status: AttendanceStatus;
  subject: string;
}

export type FeeStatus = 'paid' | 'pending';

export interface FeeInvoice {
  id: string;
  student_id: StudentId;
  center_id: CenterId;
  month: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: FeeStatus;
  mode: string | null;
  receipt_no: string | null;
}

export interface TimetableEntry {
  id: string;
  center_id: CenterId;
  day_of_week: string;
  subject: string;
  start_time: string;
  end_time: string;
  teacher: string;
  room: string;
}

export type SyllabusStatus = 'covered' | 'partial' | 'skipped' | 'upcoming';

export interface SyllabusTopic {
  id: string;
  center_id: CenterId;
  subject: string;
  chapter: string;
  topic: string;
  planned_date: string;
  covered_date: string | null;
  status: SyllabusStatus;
  revised_by_student: boolean;
}

export interface TestResult {
  id: string;
  student_id: StudentId;
  center_id: CenterId;
  name: string;
  subject: string;
  date: string;
  total_marks: number;
  marks_obtained: number;
  duration_min: number;
  topics_tested: string[];
  weak_topics: string[];
}

export interface Simulation {
  id: string;
  title: string;
  subject: string;
  class: string;
  description: string;
  phet_url: string;
  thumbnail_emoji: string;
}

export interface LeaderboardRow {
  rank: number;
  student_name: string;
  points: number;
  badge: string;
  center: string;
  batch: string;
  student_id: string;
}

export interface BatchLeaderboardStudent {
  rank: number;
  student_name: string;
  points: number;
  badge: string;
  streak: string;
  role_tag: string;
  student_id: string;
}

export interface BatchLeaderboard {
  center: string;
  subject: string;
  teacher: string;
  students: BatchLeaderboardStudent[];
}

export type PointsAwardType = 'teacher' | 'system';

export interface PointsHistoryEntry {
  id: string;
  student_id: StudentId;
  center_id: CenterId | null;
  center_name: string | null;
  award_type: PointsAwardType;
  awarded_by: string;
  date: string;
  action: string;
  points: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  earned: boolean;
  earned_date: string | null;
}

export interface MotivationBanner {
  kind: 'rank1' | 'ranked' | 'spectator';
  title: string;
  subtitle: string;
  icon: string;
}

export interface Video {
  id: string;
  center_id: CenterId;
  teacher_name: string;
  title: string;
  subject: string;
  chapter: string;
  youtube_id: string;
  duration: string;
  description: string;
}

export type DocumentType = 'marksheet' | 'certificate';
export type DocumentStatus = 'valid' | 'revoked';

export interface SubjectMark {
  subject: string;
  max: number;
  obtained: number;
}

export interface AcademicDocument {
  id: string;
  student_id: StudentId;
  center_id: CenterId;
  type: DocumentType;
  title: string;
  issue_date: string;
  code: string;
  status: DocumentStatus;
  exam_name: string;
  center_name: string;
  director_name: string;
  subject_marks: SubjectMark[];
  total_max: number;
  total_obtained: number;
  percentage: number;
  grade: string;
  attendance_percent: number;
}

export type McqOptionKey = 'a' | 'b' | 'c' | 'd';

export interface Mcq {
  id: string;
  subject: string;
  question: string;
  options: Record<McqOptionKey, string>;
  correct: McqOptionKey;
  explanation: string;
}

/** The full relational store, mirroring window.DATA on the website. */
export interface VilarciData {
  centers: Center[];
  students: Student[];
  attendance: AttendanceRecord[];
  fees: FeeInvoice[];
  timetable: TimetableEntry[];
  syllabus: SyllabusTopic[];
  videos: Video[];
  tests: TestResult[];
  documents: AcademicDocument[];
  simulations: Simulation[];
  leaderboard: LeaderboardRow[];
  batch_leaderboards: Record<string, BatchLeaderboard>;
  mcqs: Mcq[];
  points_history: PointsHistoryEntry[];
  badges: Badge[];
}
