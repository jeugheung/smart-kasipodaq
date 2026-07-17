import { NavigatorScreenParams } from "@react-navigation/native";

export type AppTabsParamList = {
  MainTab: undefined;
  RequestsTab: undefined;
  SurveysTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabsParamList> | undefined;

  LoginPage:
    | {
        redirectTab?: keyof AppTabsParamList;
      }
    | undefined;

  RegisterPage:
  | {
      redirectTab?: keyof AppTabsParamList;
    }
  | undefined;

  SurveyDetailPage: undefined;
  RequestsList: undefined;
  NewsDetailPage: {
    id?: number | string;
  };
  NewsPage: undefined;
  MyRequests: undefined;
  Favourite: undefined;
};