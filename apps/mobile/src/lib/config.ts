import { Platform } from 'react-native';

// Android emulator loopback uses 10.0.2.2; iOS simulator uses localhost
const defaultApi = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const Config = {
  API_URL: defaultApi,
} as const;
