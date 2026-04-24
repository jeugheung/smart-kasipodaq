import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@shared/navigation/types';
import { AppTabsNavigator } from './AppTabsNavitagor';
import { EventsPage } from '@views/MainPageFlow';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 1. Таб-бар — это экран №1 */}
      <Stack.Screen name="MainTabs" component={AppTabsNavigator} />

      {/* 2. Группируем все "глубокие" экраны, которые скроют табы */}
      <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
        {/* Home Flow Screens */}
         <Stack.Screen name="EventsPage" component={EventsPage} />
      </Stack.Group>
    </Stack.Navigator>
  );
};