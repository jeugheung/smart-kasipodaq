import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";

import { getOrCreateUUID } from "@shared/lib/uuid";
import {
  PendingRequestCard,
  ResolvedRequestCard,
} from "@entities/RequestCard";
import { getMySolutions } from "@shared/api/endpoints";
import { colors } from "@shared/theme/colors";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";

export type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

export type RequestItem = {
  type_name: RequestType;
  updated_at: any;
  comment: any;
  solution: string;
  created_at: any;
  id: string;
  problem: string;
  status: any;
  type: RequestType;
  solution_likes: number
  solution_dislikes: number
  
  comment_likes: number
  comment_dislikes: number
};

export const MyRequestsPage = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const uuid = await getOrCreateUUID();
        const data = await getMySolutions(uuid);
        setRequests(data);
        console.log(data)
      } catch (err) {
        console.error("Ошибка при загрузке заявок:", err);
        setError(t("myRequestsPage.loadError"));
      } finally {
         setTimeout(() => {
          setLoading(false);
        }, 400);
      }
    };

    fetchRequests();
  }, []);

  return (
    <DefaultLayout variant="back" title={"История обращений"}>
      <View style={styles.content}>
        {loading && (
          <View style={styles.centered}>
            <SharedLoader visible={loading} />
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={{ color: "red" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && requests.length === 0 && (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>{t("myRequestsPage.empty")}</Text>
          </View>
        )}

        {!loading && !error && requests.length > 0 && (
          <ScrollView contentContainerStyle={styles.cardContent}>
            {requests.map(item => {
              if (item.status === 'finished') {
                return (
                  <ResolvedRequestCard
                    key={item.id}
                    item={item}
                    requestType={item.type_name}
                  />
                );
              }

              return (
                <PendingRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.type_name}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    paddingTop: 15,
    paddingHorizontal: 15,
    gap: 20,
    minHeight: "100%",
    paddingBottom: 80,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardContent: { gap: 16 },
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
});