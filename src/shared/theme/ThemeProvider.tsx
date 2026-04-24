import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors as defaultColors } from "./colors";

const STORAGE_KEYS = { theme: "app_theme" };

export type ThemeOption = "light" | "dark" | "system";

export const ThemeContext = createContext({
  theme: "system" as ThemeOption,
  colors: defaultColors,
  setTheme: (theme: ThemeOption) => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeOption>("system");
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Загружаем тему из AsyncStorage
    (async () => {
      const savedTheme = (await AsyncStorage.getItem(STORAGE_KEYS.theme)) as ThemeOption;
      if (savedTheme) setThemeState(savedTheme);
    })();

    // Слушаем системные изменения
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setTheme = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(STORAGE_KEYS.theme, newTheme);
  };

  const colors = getColors(theme, systemTheme);

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Вычисляем цвета с учетом темы
function getColors(theme: ThemeOption, systemTheme: ColorSchemeName) {
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");
  return {
    primary: defaultColors.primary,
    background: isDark ? "#121212" : defaultColors.background,
    card: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#fff" : "#111",
    inactive: defaultColors.inactive,
  };
}