import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_CONFIG } from "@shared/api/config";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppLogo from "../../../assets/request-card/solution2.svg";

type CurrentClient = {
  id: number;
  iin: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  phone?: string | null;
};

type MeResponse = {
  msg?: string;
  result?: number;
  client?: CurrentClient;

  id?: number;
  iin?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;

  [key: string]: unknown;
};

export const ProfilePage = ({ navigation }: any) => {
  const { t } = useTranslation();

  const [user, setUser] = useState<CurrentClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const parseResponse = async <T,>(response: Response): Promise<T | null> => {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch {
      console.error("Сервер вернул некорректный JSON:", responseText);

      return null;
    }
  };

  const redirectToLogin = useCallback(() => {
    const rootNavigation = navigation.getParent();

    if (rootNavigation) {
      rootNavigation.reset({
        index: 1,
        routes: [
          {
            name: "MainTabs",
            params: {
              screen: "MainTab",
            },
          },
          {
            name: "LoginPage",
            params: {
              redirectTab: "ProfileTab",
            },
          },
        ],
      });

      return;
    }

    navigation.navigate("MainTab");
  }, [navigation]);

  const loadCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);

      const accessToken = await AsyncStorage.getItem("access_token");

      if (!accessToken) {
        setUser(null);
        redirectToLogin();

        return;
      }

      const response = await fetch(API_CONFIG.ME_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await parseResponse<MeResponse>(response);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.removeItem("access_token");

          setUser(null);
          redirectToLogin();

          return;
        }

        throw new Error(
          typeof data?.msg === "string"
            ? data.msg
            : t("profilePage.errors.loadProfile"),
        );
      }

      if (!data) {
        throw new Error(t("profilePage.errors.emptyResponse"));
      }

      if (typeof data.result === "number" && data.result !== 1) {
        throw new Error(data.msg || t("profilePage.errors.loadProfile"));
      }

      const currentUser: CurrentClient | null =
        data.client ??
        (data.id && data.iin
          ? {
              id: data.id,
              iin: data.iin,
              email: data.email,
              full_name: data.full_name,
              first_name: data.first_name,
              last_name: data.last_name,
              middle_name: data.middle_name,
            }
          : null);

      if (!currentUser) {
        throw new Error(t("profilePage.errors.noUserData"));
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);

      const message =
        error instanceof Error
          ? error.message
          : t("profilePage.errors.loadProfile");

      Alert.alert(t("profilePage.errors.title"), message);
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin, t]);

  useFocusEffect(
    useCallback(() => {
      void loadCurrentUser();
    }, [loadCurrentUser]),
  );

  const handleLogout = useCallback(() => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      t("profilePage.logoutModal.title"),
      t("profilePage.logoutModal.message"),
      [
        {
          text: t("profilePage.logoutModal.cancel"),
          style: "cancel",
        },
        {
          text: t("profilePage.logoutModal.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoggingOut(true);

              await AsyncStorage.removeItem("access_token");

              setUser(null);

              const rootNavigation = navigation.getParent();

              if (rootNavigation) {
                rootNavigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainTabs",
                      params: {
                        screen: "MainTab",
                      },
                    },
                  ],
                });

                return;
              }

              navigation.navigate("MainTab");
            } catch (error) {
              console.error("Ошибка выхода:", error);

              Alert.alert(
                t("profilePage.errors.title"),
                t("profilePage.errors.logout"),
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  }, [isLoggingOut, navigation, t]);

  const getUserName = (): string => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim();
    }

    const nameParts = [
      user?.last_name,
      user?.first_name,
      user?.middle_name,
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

    if (nameParts.length > 0) {
      return nameParts.join(" ");
    }

    return t("profilePage.defaultUserName");
  };

  const getInitials = (): string => {
    const userName = getUserName();

    const initials = userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    return initials || t("profilePage.defaultUserInitial");
  };

  if (isLoading) {
    return (
      <DefaultLayout variant="default" title="Smart Kasipodaq">
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent} />

          <Text style={styles.loaderText}>{t("profilePage.loading")}</Text>
        </View>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>

          <Text style={styles.userName}>{getUserName()}</Text>

          <Text style={styles.userIin}>
            {t("profilePage.iin")} {user?.iin || t("profilePage.notSpecified")}
          </Text>
        </View>

        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.72}
            onPress={() => navigation.getParent()?.navigate("MyRequests")}
          >
            <View style={[styles.iconWrapper, styles.requestsIconBackground]}>
              <View style={styles.msgIcon}>
                <View style={styles.msgIconDot} />
              </View>
            </View>

            <Text style={styles.menuItemText}>
              {t("profilePage.menu.requests")}
            </Text>

            <View style={styles.arrowRight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            activeOpacity={0.72}
            onPress={() => navigation.getParent()?.navigate("Favourite")}
          >
            <View style={[styles.iconWrapper, styles.favouritesIconBackground]}>
              <View style={styles.gearIcon} />
            </View>

            <Text style={styles.menuItemText}>
              {t("profilePage.menu.favourites")}
            </Text>

            <View style={styles.arrowRight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          activeOpacity={0.72}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Text style={styles.logoutButtonText}>
              {t("profilePage.logoutButton")}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.logoWrapper}>
            <AppLogo width={50} height={50} />
          </View>

          <Text style={styles.footerTitle}>Smart Kasipodaq</Text>

          <Text style={styles.footerVersion}>Версия 1.0.0</Text>
        </View>
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  loaderText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 110,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  avatarText: {
    color: colors.white,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
  },

  userName: {
    marginTop: 14,
    paddingHorizontal: 18,
    color: colors.textDark,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  userIin: {
    marginTop: 5,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },

  menuList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  menuItem: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  lastMenuItem: {
    borderBottomWidth: 0,
  },

  iconWrapper: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  requestsIconBackground: {
    backgroundColor: colors.violationLight,
  },

  favouritesIconBackground: {
    backgroundColor: colors.workLight,
  },

  menuItemText: {
    flex: 1,
    marginLeft: 13,
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },

  arrowRight: {
    width: 8,
    height: 8,
    marginRight: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.inactive,
    transform: [{ rotate: "45deg" }],
  },

  msgIcon: {
    width: 21,
    height: 17,
    borderWidth: 2,
    borderColor: colors.profileBlue,
    borderRadius: 5,
  },

  msgIconDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.profileBlue,
  },

  gearIcon: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: colors.profileYellow,
    borderRadius: 10,
  },

  logoutButton: {
    minHeight: 50,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
  },

  logoutButtonDisabled: {
    opacity: 0.55,
  },

  logoutButtonText: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 40,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  logoWrapper: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  footerTitle: {
    marginTop: 10,
    color: colors.textDark,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },

  footerVersion: {
    marginTop: 3,
    color: colors.inactive,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
});
