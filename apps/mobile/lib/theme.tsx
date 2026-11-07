import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, spacing, radii, type Theme } from '@nexuse/tokens';

/** Follows the device light/dark setting using the same tokens as the web app. */
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? darkTheme : lightTheme);
export { spacing, radii };
