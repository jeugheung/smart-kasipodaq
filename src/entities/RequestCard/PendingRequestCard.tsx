import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RequestItem, RequestType } from './RequestCard.types';
import AnonIcon from '../../../assets/request-card/anon.svg';
import StarIcon from '../../../assets/request-card/start.svg';
import StarFilledIcon from '../../../assets/request-card/star-filled.svg';
import LikeIcon from '../../../assets/request-card/like.svg';
import DislikeIcon from '../../../assets/request-card/dislike.svg';
import { getOrCreateUUID } from '../../shared/lib/uuid';
import { getFavorites, toggleFavorite } from '@shared/lib/favourites';
import { useTranslation } from 'react-i18next';
import { sendLikeDislike, toggleFavoriteApi } from '../../shared/api/endpoints';

type Props = { 
  item: RequestItem; 
  requestType: RequestType; 
  isFavorite?: boolean 
};

const VOTES_STORAGE_KEY = '@user_votes';

const TYPE_COLOR: Record<RequestType, string> = {
  violation: '#C9F2FF', // Нарушение ТК
  work: '#FFF1B7',      // Условия труда
  salary: '#FFE9B1',    // Оплата труда
  social: '#F4FFB5',    // Социальные льготы
  collective: '#E8DDFF', // Коллективный договор
};

export const PendingRequestCard = ({ item, requestType, isFavorite = false }: Props) => {
  const { t } = useTranslation();
  
  const [expanded, setExpanded] = useState(false);

  // --- ИЗБРАННОЕ ---
  const [isStarred, setIsStarred] = useState(isFavorite);
  const [isStarring, setIsStarring] = useState(false); 

  // --- ЛАЙКИ / ДИЗЛАЙКИ ---
  const [likesCount, setLikesCount] = useState(Number(item.solution_likes) || 0);
  const [dislikesCount, setDislikesCount] = useState(Number(item.solution_dislikes) || 0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false); 

  // Загрузка состояния при монтировании
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Загрузка избранного
        const favorites = await getFavorites();
        setIsStarred(favorites.includes(item.id.toString()));

        // Загрузка голоса
        const storedVotes = await AsyncStorage.getItem(VOTES_STORAGE_KEY);
        if (storedVotes) {
          const votesObj = JSON.parse(storedVotes);
          const myVote = votesObj[item.id.toString()];
          if (myVote) {
            setUserVote(myVote);
          }
        }
      } catch (e) {
        console.error('Error loading persisted data', e);
      }
    };
    loadPersistedData();
  }, [item.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  /* ===== ЛОГИКА ИЗБРАННОГО ===== */
  const handleStarPress = async () => {
    if (isStarring) {
      console.log('⛔ [FAVORITE] Already processing');
      return;
    }

    console.log('-----------------------------------');
    console.log('⭐ [FAVORITE CLICK]');
    console.log('item.id:', item.id);
    console.log('current isStarred:', isStarred);

    setIsStarring(true);

    const prevStarred = isStarred;
    const nextStarred = !prevStarred;

    setIsStarred(nextStarred);

    console.log('UI updated:', {
      prevStarred,
      nextStarred,
    });

    try {
      console.log('📦 Getting UUID...');

      const uuid = await getOrCreateUUID();

      console.log('✅ UUID:', uuid);

      console.log('📡 Calling toggleFavoriteApi...');
      console.log({
        uuid,
        solutionId: item.id,
      });

      const apiResponse = await toggleFavoriteApi(uuid, item.id);

      console.log('✅ API SUCCESS');
      console.log('API RESPONSE:', apiResponse);

      console.log('💾 Updating local favorites storage...');

      await toggleFavorite(item.id.toString());

      console.log('✅ Local storage updated');

      console.log('⭐ Favorite state after success:', nextStarred);
    } catch (error) {
      console.log('❌ FAVORITE ERROR');
      console.log('item.id:', item.id);
      console.log('error:', error);

      setIsStarred(prevStarred);

      console.log('↩️ Rollback UI state:', prevStarred);
    } finally {
      console.log('🏁 FAVORITE FINISHED');
      console.log('final isStarred:', nextStarred);

      setIsStarring(false);

      console.log('-----------------------------------');
    }
  };

  /* ===== ЛОГИКА ГОЛОСОВАНИЯ (ОДНОРАЗОВАЯ) ===== */
  const handleVote = async (type: 'like' | 'dislike') => {
    // Блокируем, если уже голосуем или уже есть голос
    if (isVoting || userVote) return; 

    setIsVoting(true);

    // Оптимистичное обновление UI
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;
    
    setUserVote(type);
    if (type === 'like') setLikesCount(prev => prev + 1);
    else setDislikesCount(prev => prev + 1);

    try {
      const uuid = await getOrCreateUUID();
      
      console.log(`📡 [API SEND] category=${requestType}, target=solution, id=${item.id}, status=${type}`);
      const response = await sendLikeDislike(requestType, 'solution', uuid, item.id, type);
      console.log('✅ [API SUCCESS]', response);

      // Сохраняем голос в локальную память навсегда
      const storedVotes = await AsyncStorage.getItem(VOTES_STORAGE_KEY);
      const votesObj = storedVotes ? JSON.parse(storedVotes) : {};
      votesObj[item.id.toString()] = type;
      await AsyncStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesObj));

    } catch (error) {
      console.error(`❌ [VOTE ERROR]`, error);
      // Откат при ошибке сети
      setUserVote(null);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    } finally {
      setIsVoting(false);
    }
  };

  // Кнопки выключены, если: статус 'new', идет загрузка или уже проголосовали
  const isInteractionDisabled = item.status === 'new' || isVoting || userVote !== null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[TYPE_COLOR[requestType] || '#fff', '#FFFFFF']}
        locations={[0, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ backgroundColor: "rgba(0,0,0,0.5)" }}/>

      <View style={styles.content}>
        <View style={styles.leftSide}>
          <AnonIcon width={36} height={36} />
        </View>

        <View style={styles.rightSide}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.anon}>Аноним</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>

            <Pressable onPress={handleStarPress} hitSlop={10} disabled={isStarring}>
              {isStarred ? <StarFilledIcon width={22} height={22} /> : <StarIcon width={22} height={22} />}
            </Pressable>
          </View>

          <Text style={styles.requestTitle}>{item.problem}</Text>
          <Text style={styles.requestSubtitle}>Вариант решения</Text>

          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text 
              style={styles.requestText}
              numberOfLines={expanded ? undefined : 3} 
              ellipsizeMode="tail" 
            >
              {item.solution}
            </Text>
            {!expanded && item.solution && item.solution.length > 120 && (
              <Text style={styles.moreTextInline}>{t('pendingRequestCard.more', '...ещё')}</Text>
            )}
          </Pressable>

          <View style={styles.btnStack}>
            {/* Кнопка ЛАЙК */}
            <Pressable 
              style={[
                styles.btnItem, 
                userVote === 'like' && styles.btnActiveLike,
                isInteractionDisabled && styles.btnDisabled
              ]} 
              onPress={() => handleVote('like')} 
              disabled={isInteractionDisabled}
            >
              {isVoting && userVote === 'like' ? (
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : (
                <>
                  <LikeIcon width={18} height={16} fill={userVote === 'like' ? '#2E7D32' : '#fff'} />
                  <Text style={[styles.textInactive, userVote === 'like' && styles.textActiveLike]}>
                    {likesCount}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Кнопка ДИЗЛАЙК */}
            <Pressable 
              style={[
                styles.btnItem, 
                userVote === 'dislike' && styles.btnActiveDislike,
                isInteractionDisabled && styles.btnDisabled
              ]} 
              onPress={() => handleVote('dislike')} 
              disabled={isInteractionDisabled}
            >
              {isVoting && userVote === 'dislike' ? (
                <ActivityIndicator size="small" color="#D32F2F" />
              ) : (
                <>
                  <DislikeIcon width={18} height={16} fill={userVote === 'dislike' ? '#D32F2F' : '#fff'} />
                  <Text style={[styles.textInactive, userVote === 'dislike' && styles.textActiveDislike]}>
                    {dislikesCount}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 10, overflow: "hidden", minHeight: 230, marginBottom: 15 },
  content: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 16, gap: 8 },
  leftSide: { width: 36, height: 36 },
  rightSide: { flex: 1 },
  header: { flexDirection: "row", height: 30, alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", gap: 10, minWidth: 200 },
  anon: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  date: { fontSize: 15, fontWeight: "400", lineHeight: 21, color: "#999999" },
  requestTitle: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  requestSubtitle: { fontSize: 14, lineHeight: 21, fontWeight: "600", marginTop: 5 },
  requestText: { fontSize: 12, lineHeight: 21 },
  moreTextInline: { color: "#838282", fontWeight: "600", fontSize: 12, marginTop: 2 },
  btnStack: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  btnItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 100,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  textInactive: { fontWeight: '600', color: '#666', fontSize: 13 },
  btnActiveLike: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  textActiveLike: { color: '#2E7D32', fontWeight: '700' },
  btnActiveDislike: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  textActiveDislike: { color: '#D32F2F', fontWeight: '700' }
});