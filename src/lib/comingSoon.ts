// Real-app sections that are designed (see the demo) but not connected to the
// database yet. Listed on the Coming soon screen, reached from the side menu.
import type { IconName } from '../components/ui/base';

export interface SoonFeature {
  title: string;
  icon: IconName;
  description: string;
}

export const COMING_SOON: { title: string; items: SoonFeature[] }[] = [
  {
    title: 'ACADEMICS',
    items: [
      { title: 'Syllabus', icon: 'book-outline', description: 'Chapter progress, grouped the way the teacher plans it.' },
      { title: 'Tests & Results', icon: 'document-text-outline', description: 'Test scores, subject mastery and weak topics to work on.' },
      { title: 'Marksheets', icon: 'ribbon-outline', description: 'Marksheets and certificates issued by teachers, each with a verify code.' },
    ],
  },
  {
    title: 'LEARN',
    items: [
      { title: 'STEM Labs', icon: 'flask-outline', description: 'Hands-on science experiments that earn the STEM Explorer badge.' },
      { title: 'Lessons', icon: 'play-circle-outline', description: 'Video lessons published by teachers.' },
      { title: 'Focus Room', icon: 'timer-outline', description: 'Timed study sessions on the topics teachers flag.' },
      { title: 'Practice', icon: 'help-circle-outline', description: 'Practice questions with an explanation for every answer.' },
    ],
  },
  {
    title: 'HONOURS',
    items: [{ title: 'Honours', icon: 'trophy-outline', description: 'Points, milestones and standing in each batch.' }],
  },
  {
    title: 'CENTRES & SUPPORT',
    items: [
      { title: 'Coaching centres', icon: 'business-outline', description: 'Join coaching centres with a code and see each centre’s weekly load.' },
      { title: 'Fee receipts', icon: 'receipt-outline', description: 'Downloadable receipts for the fees teachers record.' },
      { title: 'Verify Documents', icon: 'shield-checkmark-outline', description: 'Confirm any Vilarci marksheet or certificate from its code.' },
      { title: 'Help & Support', icon: 'help-buoy-outline', description: 'Answers, how Honours points work, and a person when you need one.' },
    ],
  },
];

export const COMING_SOON_COUNT = COMING_SOON.reduce((n, s) => n + s.items.length, 0);
