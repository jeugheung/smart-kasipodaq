import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const SWITCH_WIDTH = 46;
const SWITCH_HEIGHT = 26;
const THUMB_SIZE = 22;
const PADDING = 2;

export const ToggleSwitch = ({ label, value, onChange }: Props) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SWITCH_WIDTH - THUMB_SIZE - PADDING * 2],
  });

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D1D5DB', '#002F42'],
  });

  return (
    <Pressable style={styles.container} onPress={() => onChange(!value)}>
      <Text style={styles.label}>{label}</Text>

      <Animated.View style={[styles.switch, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    // borderBottomWidth: 1,
    // borderBottomColor: "rgb(209, 213, 219)"
  },
  label: {
    fontSize: 16,
    color: '#111',
  },
  switch: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',

    // чуть объёма
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});