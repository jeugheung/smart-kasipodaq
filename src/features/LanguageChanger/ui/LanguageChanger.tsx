import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { useChangeLanguage, AppLanguage } from '../model/useChangeLanguage';
import { colors } from '../../../shared/theme/colors';

const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'kk', label: 'KZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const LanguageChanger = () => {
  const { language, changeLanguage } = useChangeLanguage();
  const currentLang = language ?? 'ru';

  const buttonRef = useRef<View>(null);

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) setVisible(true);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: open ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: open ? 0 : -6,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: open ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!open) setVisible(false);
    });
  }, [open]);

  const rotateIcon = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const openMenu = () => {
    buttonRef.current?.measure(
      (_fx, _fy, width, height, px, py) => {
        const androidOffset =
          Platform.OS === 'android'
            ? StatusBar.currentHeight ?? 0
            : 0;

        setLayout({
          x: px,
          y: py - androidOffset,
          width,
          height,
        });

        setOpen(true);
      }
    );
  };

  return (
    <>
      <Pressable
        ref={buttonRef}
        style={styles.button}
        onPress={() => (open ? setOpen(false) : openMenu())}
      >
        <Text style={styles.buttonText}>
          {currentLang.toUpperCase()}
        </Text>

        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={18}
            color="#fff"
          />
        </Animated.View>
      </Pressable>

      {visible && layout && (
        <Portal>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />

          <Animated.View
            style={[
              styles.dropdown,
              {
                top: layout.y + layout.height + 6,
                left: layout.x,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                style={styles.item}
                onPress={() => {
                  changeLanguage(lang.code);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.itemText,
                    currentLang === lang.code && styles.active,
                  ]}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </Portal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#002F42',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 55,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 14,
  },
  active: {
    fontWeight: '700',
    color: colors.primary,
  },
});