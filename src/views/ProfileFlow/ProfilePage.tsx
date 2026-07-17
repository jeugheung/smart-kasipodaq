import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_CONFIG } from "@shared/api/config";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useCallback, useState } from "react";
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
        if (response.status === 401) {
          await AsyncStorage.removeItem("access_token");
          setUser(null);
          redirectToLogin();
          return;
        }

        throw new Error(
          typeof data?.msg === "string"
            ? data.msg
            : "Не удалось загрузить профиль",
        );
      }

      if (!data) {
        throw new Error("Сервер вернул пустой ответ");
      }

      if (typeof data.result === "number" && data.result !== 1) {
        throw new Error(data.msg || "Не удалось загрузить профиль");
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
        throw new Error("Сервер не вернул данные пользователя");
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);

      const message =
        error instanceof Error ? error.message : "Не удалось загрузить профиль";

      Alert.alert("Ошибка", message);
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useFocusEffect(
    useCallback(() => {
      void loadCurrentUser();
    }, [loadCurrentUser]),
  );

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert("Выход", "Вы действительно хотите выйти из аккаунта?", [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Выйти",
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

            Alert.alert("Ошибка", "Не удалось выполнить выход");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

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

    return "Пользователь";
  };

  const getInitials = (): string => {
    const userName = getUserName();

    const initials = userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    return initials || "П";
  };

  if (isLoading) {
    return (
      <DefaultLayout
        variant="default"
        title="Smart Kasipodaq"
        onRightPress={() => Alert.alert("Язык", "Переключение языка")}
      >
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#004B87" />

          <Text style={styles.loaderText}>Загружаем профиль...</Text>
        </View>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      variant="default"
      title="Smart Kasipodaq"
      onRightPress={() => Alert.alert("Язык", "Переключение языка")}
    >
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

          <Text style={styles.userIin}>ИИН {user?.iin || "не указан"}</Text>
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

            <Text style={styles.menuItemText}>История обращений</Text>

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

            <Text style={styles.menuItemText}>Избранное</Text>

            <View style={styles.arrowRight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert("Контакты", "Страница контактов ещё не подключена")
            }
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

            <Text style={styles.menuItemText}>Контакты</Text>

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
            <Text style={styles.logoutButtonText}>Выйти</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background || "#F5F7FA",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 30,
    paddingBottom: 100,
    alignItems: "center",
  },

  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background || "#F5F7FA",
    gap: 12,
  },

  loaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#004B87",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
  },

  userName: {
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: "700",
    color: "#1C2530",
    marginBottom: 6,
    textAlign: "center",
  },

  userIin: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },

  menuList: {
    width: "100%",
    gap: 12,
    marginBottom: 40,
  },

  menuItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F3049",
  },

  arrowRight: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#0F3049",
    transform: [
      {
        rotate: "45deg",
      },
    ],
    marginRight: 4,
  },

  msgIcon: {
    width: 18,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },

  msgIconDot: {
    width: 6,
    height: 2,
    backgroundColor: "#007AFF",
  },

  gearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFB300",
  },

  contactsIcon: {
    width: 14,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#84CC16",
  },

  logoutButton: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "rgba(255, 153, 153, 1)",
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutButtonText: {
    color: "#E40E0E",
    fontSize: 16,
    fontWeight: "700",
  },
});
