import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@shared/navigation/types';
import { AppTabsNavigator } from './AppTabsNavitagor';
import { RequestsList } from '@views/MainPageFlow';
import { SurveyDetailPage } from '@views/SurveysFlow';
import { LoginPage } from '@views/Authentication/LoginPage';
import { NewsDetailPage } from '@views/MainPageFlow/NewsDetailPage';
import { NewsPage } from '@views/MainPageFlow/NewsPage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 1. Таб-бар — это экран №1 */}
      <Stack.Screen name="MainTabs" component={AppTabsNavigator} />

      {/* 2. Группируем все "глубокие" экраны, которые скроют табы */}
      <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
        {/* Home Flow Screens */}
          {/* <Stack.Screen name="EventsPage" component={EventsPage} /> */}
          <Stack.Screen name="SurveyDetailPage" component={SurveyDetailPage} />
          <Stack.Screen name="LoginPage" component={LoginPage} />
          <Stack.Screen name="RequestsList" component={RequestsList} />
          <Stack.Screen name="NewsDetailPage" component={NewsDetailPage} />
          <Stack.Screen name="NewsPage" component={NewsPage} />
      </Stack.Group>
    </Stack.Navigator>
  );
};