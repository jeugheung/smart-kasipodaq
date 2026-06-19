import AsyncStorage from '@react-native-async-storage/async-storage';
import UUID from 'react-native-uuid';

export const getOrCreateUUID = async (): Promise<string> => {
  let id = await AsyncStorage.getItem('userIdentifier');
  if (!id) {
    id = UUID.v4() as string;
    await AsyncStorage.setItem('userIdentifier', id);
  }
  return id;
};