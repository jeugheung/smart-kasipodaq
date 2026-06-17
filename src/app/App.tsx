import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider } from '@shared/theme/ThemeProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useTranslation } from 'react-i18next';
import i18n from 'i18next'
import '@shared/i18n';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF', 
  },
};


export default function App() {

  
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
