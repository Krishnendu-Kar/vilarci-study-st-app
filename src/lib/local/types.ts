// Rows as the server's sync call sends them (new-db-plan.md §7–§9). Money is
// paise, app times are milliseconds, months 'YYYY-MM', days 'YYYY-MM-DD'.

export type Gender = 'male' | 'female' | 'other';
export type Relation = 'self' | 'father' | 'mother' | 'friend' | 'teacher' | 'other';
export type EnrolmentStatus = 'pending' | 'approved' | 'declined' | 'left' | 'removed';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeekSchedule = Record<DayKey, string>;

/** The signed-in account (public.users). */
export interface AccountMe {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender | null;
  whatsapp_number: string | null;
  email: string | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
}

/** A student profile this account sees, with the account's relation to it. */
export interface StudentProfile {
  id: string;
  owner_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender | null;
  dob: string | null;
  class_name: string | null;
  board: string | null;
  created_at: number;
  updated_at: number;
  my_role: 'owner' | 'guardian';
  relation: Relation;
  relation_other: string | null;
}

/** How a batch shows on a request that isn't approved. */
export interface BatchCard {
  name: string;
  subject: string;
  grade: string | null;
  board: string | null;
  teacher_name: string | null;
}

/** One of this account's students in one batch. */
export interface AccountEnrolment {
  id: string;
  batch_id: string;
  student_id: string;
  status: EnrolmentStatus;
  requested_at: number;
  decided_at: number | null;
  joined_month: string | null;
  fee_override: number | null;
  batch_deleted: boolean;
  /** Only for requests that aren't approved; approved ones come as batch rows. */
  batch: BatchCard | null;
}

export interface AccountSnapshot {
  rev: number;
  me: AccountMe | null;
  teacher: Record<string, unknown> | null;
  students: StudentProfile[];
  enrolments: AccountEnrolment[];
  teaching: { batch_id: string; role: string; name: string; deleted_at: number | null }[];
}

export interface TeacherCard {
  name: string;
  qualification: string;
  subject: string;
  experience_years: number | null;
  achievements: string[];
}

export interface Batch {
  id: string;
  owner_id: string;
  name: string;
  subject: string;
  grade: string | null;
  board: string | null;
  room: string;
  weekly_schedule: WeekSchedule;
  monthly_fee: number;
  capacity: number;
  course_start: string | null;
  course_end: string | null;
  teacher_card: TeacherCard;
  seq: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Session {
  held: boolean;
  extra?: boolean;
  time?: string;
  note?: string;
}

export interface BatchMonth {
  batch_id: string;
  month: string;
  sessions: Record<string, Session>;
  seq: number;
}

export type FeeMode = 'cash' | 'upi' | 'bank' | 'other';

export interface MonthFee {
  status: 'paid' | 'waived';
  amount: number;
  paid_on?: string | null;
  mode?: FeeMode | null;
  note?: string | null;
}

/** One student's month in one batch: attendance exceptions, fee, marks, remark. */
export interface EnrolmentMonth {
  enrolment_id: string;
  month: string;
  batch_id: string;
  att: Record<string, 'A' | 'L'>;
  fee: MonthFee | null;
  score: Record<string, number | 'AB'>;
  remark: string | null;
  seq: number;
}

export interface BatchTest {
  batch_id: string;
  id: string;
  title: string;
  subject: string | null;
  held_on: string;
  max_marks: number;
  summary: Record<string, unknown> | null;
  deleted_at: number | null;
  seq: number;
}

export interface BatchNotice {
  batch_id: string;
  id: string;
  body: string;
  pinned: boolean;
  created_at: number;
  deleted_at: number | null;
  seq: number;
}

// ── the sync call ─────────────────────────────────────────────────────────

export interface BatchPage {
  upto: number;
  more: boolean;
  full: boolean;
  role: string;
  batch: Batch | null;
  batch_months: BatchMonth[];
  batch_tests: BatchTest[];
  batch_notices: BatchNotice[];
  enrolment_months: EnrolmentMonth[];
}

export type BatchAnswer = BatchPage | { gone: true } | { later: true };

export interface SyncResponse {
  server_now: number;
  results: unknown[];
  account: AccountSnapshot | null;
  batches: Record<string, BatchAnswer>;
}
