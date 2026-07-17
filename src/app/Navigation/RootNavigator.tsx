import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "@shared/navigation/types";
import { AppTabsNavigator } from "./AppTabsNavitagor";

import { RequestsList } from "@views/MainPageFlow";
import { SurveyDetailPage } from "@views/SurveysFlow";
import { LoginPage } from "@views/Authentication/LoginPage";
import { NewsDetailPage } from "@views/MainPageFlow/NewsDetailPage";
import { NewsPage } from "@views/MainPageFlow/NewsPage";
import { MyRequestsPage } from "@views/ProfileFlow/MyRequestsPage";
import { FavouritePage } from "@views/ProfileFlow/FavouritePage";
import { RegisterPage } from "@views/Authentication/RegisterPage";

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={AppTabsNavigator}
      />

      <Stack.Group
        screenOptions={{
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="LoginPage"
          component={LoginPage}
        />

        {/* Публичные страницы */}
        <Stack.Screen
          name="NewsDetailPage"
          component={NewsDetailPage}
        />

        <Stack.Screen
          name="NewsPage"
          component={NewsPage}
        />

        {/* Закрытые страницы */}
        <Stack.Screen
          name="SurveyDetailPage"
          component={SurveyDetailPage}
        />

        <Stack.Screen
          name="RequestsList"
          component={RequestsList}
        />

        <Stack.Screen
          name="MyRequests"
          component={MyRequestsPage}
        />

        <Stack.Screen
          name="Favourite"
          component={FavouritePage}
        />

        <Stack.Screen
          name="RegisterPage"
          component={RegisterPage}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};