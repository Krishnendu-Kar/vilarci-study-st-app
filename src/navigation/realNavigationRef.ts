import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets the real app's side menu navigate and read the active route. */
export const realNavigationRef = createNavigationContainerRef<any>();

/** Screens that live in the bottom tabs (nested under the 'Tabs' stack screen). */
export const REAL_TAB_ROUTES = ['RealHome', 'Batches', 'StudentTimetable', 'Honours'] as const;
export type RealTabRoute = (typeof REAL_TAB_ROUTES)[number];

/**
 * Navigate to a tab from anywhere in the real app. React Navigation 7 only
 * reaches a nested navigator's screen through its parent route.
 */
export function navigateToTab(navigation: { navigate: (...args: any[]) => void }, tab: RealTabRoute) {
  navigation.navigate('Tabs', { screen: tab });
}
