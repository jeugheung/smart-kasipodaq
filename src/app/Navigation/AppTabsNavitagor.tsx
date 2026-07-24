import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  HomeIcon,
  RequestsIcon,
  ProfileIcon,
} from "@shared/ui/TabIcons/TabIcons";

import { TabBounceButton } from "@shared/ui/TabBounceButton";
import { MainPage } from "@views/MainPageFlow/MainPage";
import { RequestPage } from "@views/RequestPageFlow/RequestPage";
import { SurveyPage } from "@views/SurveysFlow";
import { ProfilePage } from "@views/ProfileFlow/ProfilePage";

import { AppTabsParamList } from "@shared/navigation/types";

const Tab = createBottomTabNavigator<AppTabsParamList>();

type ProtectedTabName = "RequestsTab" | "SurveysTab" | "ProfileTab";

export const AppTabsNavigator = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const TAB_HEIGHT = 56;

  /**
   * Проверяет токен перед переходом на закрытый таб.
   *
   * event.preventDefault() вызываем сразу, чтобы React Navigation
   * самостоятельно не открыл закрытую страницу до проверки токена.
   */
  const createProtectedTabListener = (targetTab: ProtectedTabName) => {
    return ({ navigation }: any) => ({
      tabPress: (event: any) => {
        event.preventDefault();

        void (async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");

            if (token) {
              navigation.navigate(targetTab);
              return;
            }

            /**
             * AppTabsNavigator находится внутри RootNavigator,
             * поэтому LoginPage открываем через родительский navigator.
             */
            navigation.getParent()?.navigate("LoginPage", {
              redirectTab: targetTab,
            });
          } catch (error) {
            console.error("Ошибка проверки авторизации:", error);

            navigation.getParent()?.navigate("LoginPage", {
              redirectTab: targetTab,
            });
          }
        })();
      },
    });
  };

  return (
    <Tab.Navigator
      initialRouteName="MainTab"
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 10,
        },

        freezeOnBlur: true,
        lazy: true,

        tabBarActiveTintColor: "#002F42",
        tabBarInactiveTintColor: "#B2B7C7",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      {/* Публичная главная */}
      <Tab.Screen
        name="MainTab"
        component={MainPage}
        options={{
          tabBarLabel: t("navigation.tabs.main"),
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />

      {/* Закрытая страница заявок */}
      <Tab.Screen
        name="RequestsTab"
        component={RequestPage}
        listeners={createProtectedTabListener("RequestsTab")}
        options={{
          tabBarLabel: t("navigation.tabs.request"),
          tabBarIcon: ({ color }) => <RequestsIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />

      {/* Закрытая страница опросов */}
      <Tab.Screen
        name="SurveysTab"
        component={SurveyPage}
        listeners={createProtectedTabListener("SurveysTab")}
        options={{
          tabBarLabel: t("navigation.tabs.surveys"),
          tabBarIcon: ({ color }) => <RequestsIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />

      {/* Закрытая страница профиля */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfilePage}
        listeners={createProtectedTabListener("ProfileTab")}
        options={{
          tabBarLabel: t("navigation.tabs.profile"),
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarButton: (props) => <TabBounceButton {...props} />,
        }}
      />
    </Tab.Navigator>
  );
};
