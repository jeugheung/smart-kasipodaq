import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider } from '@shared/theme/ThemeProvider';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF', 
  },
};


export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
       
            <PaperProvider>
              <NavigationContainer theme={MyTheme}>
                <RootNavigator />
                <StatusBar style="light" />
              </NavigationContainer>
            </PaperProvider>
  
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
