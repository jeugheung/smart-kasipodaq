import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, Alert, Linking, Platform } from 'react-native';

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider } from '@shared/theme/ThemeProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'
import { getOrCreateUUID } from '@shared/lib/uuid';
import { getAppVersion } from '@shared/api/endpoints';
import '@shared/i18n';
import { useCallback, useEffect, useState } from 'react';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF', 
  },
};

SplashScreen.preventAutoHideAsync();
const CURRENT_APP_VERSION = '1.2'; 

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { t } = useTranslation();

  const showUpdateAlert = useCallback(() => {
    Alert.alert(
      i18n.t("update.title") || "Обновление",
      i18n.t("update.message") || "Доступна новая версия приложения.",
      [
        {
          text: i18n.t("update.button") || "Обновить",
          onPress: () => {
            const url = Platform.OS === 'ios'
              ? 'itms-apps://apps.apple.com/kz/app/su-solutions/id1583725427'
              : 'market://details?id=com.feftio.susolutions';

            Linking.canOpenURL(url).then(supported => {
              if (supported) Linking.openURL(url);
              else {
                const webUrl = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/kz/app/su-solutions/id1583725427' 
                  : 'https://play.google.com/store/apps/details?id=com.feftio.susolutions';
                Linking.openURL(webUrl);
              }
            });
          },
        },
        { text: i18n.t("update.later") || "Позже", style: "cancel" }
      ]
    );
  }, []);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log("🚀 [INIT] Старт подготовки...");

        // 1. ПРОВЕРКА ИНТЕРНЕТА (СТРОГО ТОЛЬКО ДЛЯ iOS)
        if (Platform.OS === 'ios') {
          const state = await NetInfo.fetch();
          if (!state.isConnected) {
            console.log("📡 [NET-iOS] Ожидаем сеть...");
            await Promise.race([
              new Promise(res => {
                const unsub = NetInfo.addEventListener(s => {
                  if (s.isConnected) { unsub(); res(true); }
                });
              }),
              new Promise(res => setTimeout(res, 4000))
            ]);
          }
        }

        // 2. UUID
        await getOrCreateUUID();

        // 3. ПРОВЕРКА ВЕРСИИ
        try {
          const versionPromise = getAppVersion();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          );

          const rawServerVersion = await Promise.race([versionPromise, timeoutPromise]);
          const serverVersion = String(rawServerVersion || "").trim();
          const localVersion = String(CURRENT_APP_VERSION).trim();

          if (serverVersion && serverVersion !== localVersion) {
            showUpdateAlert();
          }
        } catch (vError) {
          console.warn("⚠️ [VERSION] Скипнули проверку из-за таймаута");
        }

        // 🔥 ДОБАВЛЯЕМ ПРИНУДИТЕЛЬНУЮ ПАУЗУ 🔥
        // Чтобы сплэш не мелькал, а висел хотя бы 1 секунду
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (e) {
        console.error("🛑 [INIT] Ошибка:", e);
      } finally {
        // Теперь setAppIsReady(true) сработает только через секунду
        setAppIsReady(true);
      }
    };

    prepareApp();
  }, [showUpdateAlert]);

   // Срабатывает в ту же миллисекунду, когда корневой View отрисовался
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
      console.log("💥 Сплэш-скрин скрыт чисто и без таймеров!");
    }
  }, [appIsReady]);

  if (!appIsReady) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={onLayoutRootView}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <PaperProvider>
              <NavigationContainer theme={MyTheme}>
                <RootNavigator />
                <StatusBar style="light" />
              </NavigationContainer>
            </PaperProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </View>
  );
}

