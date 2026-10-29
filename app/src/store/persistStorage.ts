// Where the stores are saved on the device. Every store uses this,
// so switching storage technology later means changing only this file.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const persistStorage = createJSONStorage(() => AsyncStorage);
