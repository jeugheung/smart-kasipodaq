import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const FAVORITES_KEY = 'favorites_ids';

// Получить список избранных
export const getFavorites = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Ошибка при чтении избранного', e);
    return [];
  }
};

// Добавить или удалить из избранного
export const toggleFavorite = async (id: string) => {
  try {
    const favorites = await getFavorites();
    const isRemoving = favorites.includes(id);
    
    const newFavorites = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    DeviceEventEmitter.emit('FAVORITE_TOGGLED', { id, isRemoved: isRemoving });
    return newFavorites;
  } catch (e) {
    console.error('Ошибка при обновлении избранного', e);
    return [];
  }
};

// Проверить, есть ли элемент в избранном
export const isFavorite = async (id: string): Promise<boolean> => {
  const favorites = await getFavorites();
  return favorites.includes(id);
};