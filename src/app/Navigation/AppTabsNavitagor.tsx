import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppTabsParamList } from "@shared/navigation/types";
import { colors } from "@shared/theme/colors";
import { TabBounceButton } from "@shared/ui/TabBounceButton";
import {
  HomeIcon,
  ProfileIcon,
  RequestsIcon,
  SurveyIcon,
} from "@shared/ui/TabIcons/TabIcons";
import { MainPage } from "@views/MainPageFlow/MainPage";
import { ProfilePage } from "@views/ProfileFlow/ProfilePage";
import { RequestPage } from "@views/RequestPageFlow/RequestPage";
import { SurveyPage } from "@views/SurveysFlow";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator<AppTabsParamList>();

type ProtectedTabName = "SurveysTab" | "ProfileTab";

export const AppTabsNavigator = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const createProtectedTabListener = (
    targetTab: ProtectedTabName,
  ) => {
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

            navigation.getParent()?.navigate("LoginPage", {
              redirectTab: targetTab,
            });
          } catch (error) {
            console.error(
              "Ошибка проверки авторизации:",
              error,
            );

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
        freezeOnBlur: true,
        lazy: true,

        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 10,
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },

        tabBarButton: (props) => (
          <TabBounceButton {...props} />
        ),
      }}
    >
      <Tab.Screen
        name="MainTab"
        component={MainPage}
        options={{
          tabBarLabel: t("navigation.tabs.main"),
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="RequestsTab"
        component={RequestPage}
        options={{
          tabBarLabel: t("navigation.tabs.request"),
          tabBarIcon: ({ color }) => (
            <RequestsIcon color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="SurveysTab"
        component={SurveyPage}
        listeners={createProtectedTabListener("SurveysTab")}
        options={{
          tabBarLabel: t("navigation.tabs.surveys"),
          tabBarIcon: ({ color }) => (
            <SurveyIcon
              color={color}
              width={20}
              height={20}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfilePage}
        listeners={createProtectedTabListener("ProfileTab")}
        options={{
          tabBarLabel: t("navigation.tabs.profile"),
          tabBarIcon: ({ color }) => (
            <ProfileIcon color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};