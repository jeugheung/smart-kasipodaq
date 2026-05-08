import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { colors } from '../../theme/colors';

type Props = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  maxLength: number;
  placeholder?: string;
  multiline?: boolean;
};

export const InputWithCounter = ({
  value,
  onChangeText,
  maxLength,
  placeholder,
  multiline = false,
  ...props
}: Props) => {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inactive}
        maxLength={maxLength}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        {...props}
      />
      <Text style={styles.counter}>
        {value.length}/{maxLength}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    borderWidth: 2,
    borderColor: '#rgba(137, 137, 137, 1)'
  },
  input: {
    fontSize: 14,
    color: colors.primary,
    padding: 0,
    minHeight: 40,
    justifyContent: 'flex-start'
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.inactive,
    marginTop: 8,
  },
});