import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_CONFIG } from "@shared/api/config";
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

  // На случай, если API возвращает пользователя без поля client
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

  const handleOpenContacts = () => {
    Alert.alert(
      t("profilePage.contactsModal.title"),
      t("profilePage.contactsModal.message"),
    );
  };

  if (isLoading) {
    return (
      <DefaultLayout variant="default" title="Smart Kasipodaq">
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#004B87" />

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
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate("MyRequests")}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: "#E6F4FE",
                },
              ]}
            >
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
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate("Favourite")}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: "#FFF9E6",
                },
              ]}
            >
              <View style={styles.gearIcon} />
            </View>

            <Text style={styles.menuItemText}>
              {t("profilePage.menu.favourites")}
            </Text>

            <View style={styles.arrowRight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleOpenContacts}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: "#F0FBE6",
                },
              ]}
            >
              <View style={styles.contactsIcon} />
            </View>

            <Text style={styles.menuItemText}>
              {t("profilePage.menu.contacts")}
            </Text>

            <View style={styles.arrowRight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          activeOpacity={0.7}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#E40E0E" />
          ) : (
            <Text style={styles.logoutButtonText}>
              {t("profilePage.logoutButton")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },

  loaderText: {
    marginTop: 14,
    fontSize: 15,
    color: "#667085",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 120,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 32,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#004B87",
  },

  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  userName: {
    marginTop: 16,
    paddingHorizontal: 20,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  userIin: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#667085",
  },

  menuList: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  menuItem: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F3",
  },

  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  menuItemText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#1F2937",
  },

  arrowRight: {
    width: 9,
    height: 9,
    marginRight: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#98A2B3",
    transform: [{ rotate: "45deg" }],
  },

  msgIcon: {
    width: 22,
    height: 18,
    borderWidth: 2,
    borderColor: "#168ACD",
    borderRadius: 5,
  },

  msgIconDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#168ACD",
  },

  gearIcon: {
    width: 21,
    height: 21,
    borderWidth: 3,
    borderColor: "#E3AA00",
    borderRadius: 11,
  },

  contactsIcon: {
    width: 21,
    height: 21,
    borderWidth: 2,
    borderColor: "#62A52F",
    borderRadius: 11,
  },

  logoutButton: {
    minHeight: 54,
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#E40E0E",
  },
});
