import React, { ReactNode } from 'react';
import { StyleSheet, RefreshControl, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { DefaultHeader } from '@widgets/Header';

type Props = {
  children: ReactNode;
  variant?: 'main' | 'default' | 'back';
  title?: string;
  onRightPress?: () => void;
  onBackPress?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollEnabled?: boolean; // добавить возможность отключить скролл
};

export const DefaultLayout = ({
  children,
  variant = 'default',
  title,
  onRightPress,
  onBackPress,
  refreshing,
  onRefresh,
  scrollEnabled = true, // по умолчанию скролл включён
}: Props) => {
  const edges: ('top' | 'left' | 'right' | 'bottom')[] = ['top', 'left', 'right'];
  // Если скролл выключен, используем обычный View
  if (!scrollEnabled) {
    return (
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {/* {variant === 'main' && <MainHeader onRightPress={onRightPress} />} */}
        {variant === 'default' && <DefaultHeader title={title || ''} />}
        {/* {variant === 'back' && <BackHeader title={title || ''} />} */}
        <View style={styles.flex}>{children}</View>
      </SafeAreaView>
    );
  }

  // Иначе используем KeyboardAwareScrollView
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {/* {variant === 'main' && <MainHeader onRightPress={onRightPress} />} */}
      {variant === 'default' && <DefaultHeader title={title || ''} />}
      {/* {variant === 'back' && <BackHeader title={title || ''} />} */}

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'android' ? 180 : 20}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor="#002F42"
              colors={['#002F42']}
            />
          ) : undefined
        }
      >
        {children}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
});