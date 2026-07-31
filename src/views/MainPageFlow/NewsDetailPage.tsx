import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { useTranslation } from "react-i18next";

import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { colors } from "@shared/theme/colors";

export const NewsDetailPage = ({ route }: any) => {
  const { news } = route.params;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const cleanHtml = String(news?.text ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s\s+/g, " ");

  return (
    <DefaultLayout variant="back" title={t("news.single")}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            {imageLoading && !imageError && (
              <View style={styles.imageLoader}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />
              </View>
            )}

            {imageError ? (
              <View style={styles.imageError}>
                <Text style={styles.imageErrorText}>
                  Не удалось загрузить изображение
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: news.img }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoadEnd={() => {
                  setImageLoading(false);
                }}
                onError={(event) => {
                  console.log(
                    "NEWS IMAGE ERROR:",
                    event.nativeEvent.error,
                  );

                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </View>

          <View style={styles.mainContentBlock}>
            <Text style={styles.date}>{news.date}</Text>

            <Text style={styles.title}>{news.title}</Text>

            <RenderHTML
              contentWidth={width - 60}
              source={{ html: cleanHtml }}
              tagsStyles={htmlStyles}
              ignoredStyles={[
                "fontSize",
                "fontFamily",
                "color",
              ]}
              baseStyle={{
                fontSize: 14,
                lineHeight: 22,
                color: "#222",
              }}
            />
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </DefaultLayout>
  );
};

const htmlStyles = {
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: "#222",
    marginBottom: 10,
    textAlign: "left" as const,
  },

  li: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },

  ul: {
    paddingLeft: 20,
    marginBottom: 10,
  },

  strong: {
    fontWeight: "700" as const,
  },
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: colors.background,
  },

  imageContainer: {
    width: "100%",
    height: 200,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },

  imageError: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },

  imageErrorText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },

  mainContentBlock: {
    gap: 15,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  date: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "500",
  },

  title: {
    color: "#1A1A1A",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 40,
  },
});