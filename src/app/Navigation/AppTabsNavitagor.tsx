import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import {
  HomeIcon,
  RequestsIcon,
  NotificationsIcon,
  ProfileIcon,
} from '../../shared/ui/TabIcons/TabIcons';

import { AnimatedTabIcon } from '@shared/ui/AnimatedTabIcon';
import { TabBounceButton } from '@shared/ui/TabBounceButton';
import { MainPage } from '@views/MainPageFlow/MainPage';

const Tab = createBottomTabNavigator();

export const AppTabsNavigator = () => {
  const insets = useSafeAreaInsets();

  const TAB_HEIGHT = 56;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 10,
        },
          freezeOnBlur: true,
           lazy: true,
        tabBarActiveTintColor: '#002F42',
        tabBarInactiveTintColor: '#B2B7C7',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="MainTab"
        component={MainPage}
        options={{
          tabBarLabel: 'Main',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          // ДОБАВЛЯЕМ СЮДА НАШУ КНОПКУ:
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />

      {/* REQUESTS */}
      <Tab.Screen
        name="RequestsTab"
        component={RequestsPage}
        options={{
          tabBarLabel: 'Request',
          tabBarIcon: ({ color }) => <RequestsIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />

   

      {/* PROFILE */}
      {/* <Tab.Screen
        name="ProfileTab"
        component={ProfilePage}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      /> */}
    </Tab.Navigator>
  );
};