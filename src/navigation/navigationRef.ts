import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets UI outside a screen (the side menu) navigate and read the active route. */
export const navigationRef = createNavigationContainerRef<any>();
