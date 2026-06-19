import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Text,
  DeviceEventEmitter, // Добавили для прослушивания событий
} from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "@shared/theme/colors";
import {
  PendingRequestCard,
  ResolvedRequestCard,
} from "@entities/RequestCard";


// Импорты API и утилит
import { getMyFavoritesList } from "@shared/api/endpoints";
import { getOrCreateUUID } from "@shared/lib/uuid";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";

export const FavouritePage = () => {
  const { t, i18n } = useTranslation();
  
  const lang = i18n.language || 'ru'; 

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Функция загрузки данных
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const uuid = await getOrCreateUUID();
      const data = await getMyFavoritesList(uuid, lang);
      setRequests(data);
      console.log(data)
    } catch (e) {
      console.error("Ошибка при загрузке избранного:", e);
      setRequests([]);
    } finally {
        setTimeout(() => {
          setLoading(false);
        }, 400);
    }
  };

  // 1. Первичная загрузка при смене языка или входе на страницу
  useEffect(() => {
    loadFavorites();
  }, [lang]);

  // 2. Слушатель события удаления из избранного
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'FAVORITE_TOGGLED', 
      ({ id, isRemoved }) => {
        if (isRemoved) {
          // Если элемент удален из избранного, убираем его из текущего стейта
          setRequests((prev) => prev.filter((item) => item.id.toString() !== id.toString()));
          console.log(`🗑️ [FAV PAGE] Удален элемент с ID: ${id}`);
        }
      }
    );

    // Очистка подписки при размонтировании компонента
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <DefaultLayout variant="back" title={"Избранное"}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingWrapper}>
               <SharedLoader visible={loading} />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>{"Избранные отсутствуют"}</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            {requests.map((item) =>
              item.status === "finished" ? (
                <ResolvedRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.type_name}
                  isFavorite={true}
                />
              ) : (
                <PendingRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.type_name}
                  isFavorite={true}
                />
              )
            )}
          </ScrollView>
        )}
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  loadingWrapper: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrapper: {
    flex: 1,
    
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    fontWeight: '500',
    marginBottom: 100
  },
  cardContent: {
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 100,
    gap: 15,
  },
});