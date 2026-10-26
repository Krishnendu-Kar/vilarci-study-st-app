// Single assembled relational store — the mobile equivalent of window.DATA.
// Screens never import these tables directly; they go through src/lib/api so a
// later Supabase swap only touches the query layer.
import { centers, household, students } from './centers';
import { attendance, syllabus, timetable, videos } from './academics';
import { documents, fees, tests } from './records';
import { badges, batchLeaderboards, leaderboard, mcqs, pointsHistory, simulations } from './honors';
import type { VilarciData } from './types';

export const DATA: VilarciData = {
  centers,
  students,
  attendance,
  fees,
  timetable,
  syllabus,
  videos,
  tests,
  documents,
  simulations,
  leaderboard,
  batch_leaderboards: batchLeaderboards,
  mcqs,
  points_history: pointsHistory,
  badges,
};

export { household };
export * from './types';
