import { colors } from "@shared/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface SkeletonItemProps {
  opacity: Animated.Value;
  style?: object | object[];
}

export const SkeletonItem = ({ opacity, style }: SkeletonItemProps) => {
  return (
    <Animated.View
      style={[
        styles.skeletonItem,
        style,
        {
          opacity,
        },
      ]}
    />
  );
};

export const WelcomeCardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <LinearGradient
      colors={[
        colors.welcomeGradientStart,
        colors.welcomeGradientMiddle,
        colors.welcomeGradientEnd,
      ]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.topRow}>
        <View style={styles.welcomeBlock}>
          <SkeletonItem
            opacity={opacity}
            style={styles.welcomeSkeleton}
          />

          <SkeletonItem
            opacity={opacity}
            style={styles.nameSkeleton}
          />

          <SkeletonItem
            opacity={opacity}
            style={styles.nameSecondSkeleton}
          />
        </View>

        <SkeletonItem
          opacity={opacity}
          style={styles.statusSkeleton}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.organizationRow}>
        <SkeletonItem
          opacity={opacity}
          style={styles.organizationIconSkeleton}
        />

        <View style={styles.organizationContent}>
          <SkeletonItem
            opacity={opacity}
            style={styles.organizationLabelSkeleton}
          />

          <SkeletonItem
            opacity={opacity}
            style={styles.organizationTitleSkeleton}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: "100%",
    minHeight: 168,
    paddingHorizontal: 18,
    paddingVertical: 17,
    overflow: "hidden",
    borderRadius: 22,
    shadowColor: colors.welcomeShadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  decorCircleLarge: {
    position: "absolute",
    top: -74,
    right: -54,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.welcomeDecoration,
  },

  decorCircleSmall: {
    position: "absolute",
    right: 24,
    bottom: -56,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.welcomeDecorationLight,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  welcomeBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  divider: {
    height: 1,
    marginTop: 15,
    marginBottom: 13,
    backgroundColor: colors.welcomeDivider,
  },

  organizationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  organizationContent: {
    flex: 1,
    minWidth: 0,
  },

  skeletonItem: {
    backgroundColor: colors.white,
  },

  welcomeSkeleton: {
    width: 82,
    height: 12,
    marginTop: 3,
    marginBottom: 9,
    borderRadius: 6,
  },

  nameSkeleton: {
    width: "72%",
    height: 21,
    marginBottom: 6,
    borderRadius: 8,
  },

  nameSecondSkeleton: {
    width: "45%",
    height: 21,
    borderRadius: 8,
  },

  statusSkeleton: {
    width: 104,
    height: 34,
    borderRadius: 13,
  },

  organizationIconSkeleton: {
    width: 38,
    height: 38,
    marginRight: 10,
    flexShrink: 0,
    borderRadius: 12,
  },

  organizationLabelSkeleton: {
    width: 86,
    height: 10,
    marginBottom: 7,
    borderRadius: 5,
  },

  organizationTitleSkeleton: {
    width: "78%",
    height: 16,
    borderRadius: 7,
  },
});