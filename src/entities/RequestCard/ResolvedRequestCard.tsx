import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RequestItem, RequestType } from './RequestCard.types';
import AnonIcon from '../../../assets/request-card/anon.svg';
import SolutionIcon from '../../../assets/request-card/solution.svg';
import StarIcon from '../../../assets/request-card/start.svg';
import StarFilledIcon from '../../../assets/request-card/star-filled.svg';
import LikeIcon from '../../../assets/request-card/like.svg';
import DislikeIcon from '../../../assets/request-card/dislike.svg';

import { toggleFavorite, getFavorites } from '../../shared/lib/favourites';
import { getOrCreateUUID } from '../../shared/lib/uuid';
import { sendLikeDislike, toggleFavoriteApi } from '../../shared/api/endpoints';

type Props = {
  item: RequestItem;
  requestType: RequestType;
  isFavorite?: boolean;
};

const VOTES_STORAGE_KEY = '@user_resolved_votes';

const TYPE_COLOR: Record<RequestType, string> = {
  violation: '#C9F2FF', // Нарушение ТК
  work: '#FFF1B7',      // Условия труда
  salary: '#FFE9B1',    // Оплата труда
  social: '#F4FFB5',    // Социальные льготы
  collective: '#E8DDFF', // Коллективный договор
};

export const ResolvedRequestCard = ({ item, requestType, isFavorite = false }: Props) => {
  const { t } = useTranslation();

  const [expandedQ, setExpandedQ] = useState(false);
  const [expandedA, setExpandedA] = useState(false);

  // --- ИЗБРАННОЕ ---
  const [isStarred, setIsStarred] = useState(isFavorite);
  const [isStarring, setIsStarring] = useState(false);

  // --- ЛАЙКИ ВОПРОСА (Q - Solution) ---
  const [qLikes, setQLikes] = useState(Number(item.solution_likes) || 0);
  const [qDislikes, setQDislikes] = useState(Number(item.solution_dislikes) || 0);
  const [userVoteQ, setUserVoteQ] = useState<'like' | 'dislike' | null>(null);
  const [isVotingQ, setIsVotingQ] = useState(false);

  // --- ЛАЙКИ ОТВЕТА (A - Comment) ---
  const [aLikes, setALikes] = useState(Number(item.comment_likes) || 0);
  const [aDislikes, setADislikes] = useState(Number(item.comment_dislikes) || 0);
  const [userVoteA, setUserVoteA] = useState<'like' | 'dislike' | null>(null);
  const [isVotingA, setIsVotingA] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const favorites = await getFavorites();
        setIsStarred(favorites.includes(item.id.toString()));

        const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);
        if (stored) {
          const votesObj = JSON.parse(stored);
          if (votesObj[`${item.id}_Q`]) setUserVoteQ(votesObj[`${item.id}_Q`]);
          if (votesObj[`${item.id}_A`]) setUserVoteA(votesObj[`${item.id}_A`]);
        }
      } catch (e) {
        console.error('Error loading votes', e);
      }
    };
    loadPersistedData();
  }, [item.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  /* ===== ЛОГИКА ИЗБРАННОГО ===== */
  const handleStarPress = async () => {
    if (isStarring) return;
    setIsStarring(true);
    const prevStarred = isStarred;
    setIsStarred(!prevStarred);
    try {
      const uuid = await getOrCreateUUID();
      await toggleFavoriteApi(uuid, item.id);
      await toggleFavorite(item.id.toString());
    } catch (error) {
      setIsStarred(prevStarred);
    } finally {
      setIsStarring(false);
    }
  };

  /* ===== УНИВЕРСАЛЬНОЕ СОХРАНЕНИЕ ===== */
  const saveVoteToStorage = async (suffix: '_Q' | '_A', type: 'like' | 'dislike') => {
    const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);
    const votesObj = stored ? JSON.parse(stored) : {};
    votesObj[`${item.id}${suffix}`] = type;
    await AsyncStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesObj));
  };

  /* ===== ГОЛОС ЗА ВОПРОС (targetType = 'solution') ===== */
  const handleVoteQ = async (type: 'like' | 'dislike') => {
    if (isVotingQ || userVoteQ) return;
    setIsVotingQ(true);
    
    // Оптимистичный UI
    setUserVoteQ(type);
    if (type === 'like') setQLikes(prev => prev + 1);
    else setQDislikes(prev => prev + 1);

    try {
      const uuid = await getOrCreateUUID();
      console.log(`📡 [API Q] type=${requestType}, target=solution, id=${item.id}, status=${type}`);
      
      await sendLikeDislike(requestType, 'solution', uuid, item.id, type);
      await saveVoteToStorage('_Q', type);
    } catch (error) {
      console.error('❌ Vote Q Error:', error);
      setUserVoteQ(null); // Откат при ошибке
      if (type === 'like') setQLikes(prev => prev - 1);
      else setQDislikes(prev => prev - 1);
    } finally {
      setIsVotingQ(false);
    }
  };

  /* ===== ГОЛОС ЗА ОТВЕТ (targetType = 'comment') ===== */
  const handleVoteA = async (type: 'like' | 'dislike') => {
    if (isVotingA || userVoteA) return;
    setIsVotingA(true);

    // Оптимистичный UI
    setUserVoteA(type);
    if (type === 'like') setALikes(prev => prev + 1);
    else setADislikes(prev => prev + 1);

    try {
      const uuid = await getOrCreateUUID();
      console.log(`📡 [API A] type=${requestType}, target=comment, id=${item.id}, status=${type}`);
      
      await sendLikeDislike(requestType, 'comment', uuid, item.id, type);
      await saveVoteToStorage('_A', type);
    } catch (error) {
      console.error('❌ Vote A Error:', error);
      setUserVoteA(null);
      if (type === 'like') setALikes(prev => prev - 1);
      else setADislikes(prev => prev - 1);
    } finally {
      setIsVotingA(false);
    }
  };

  const isQDisabled = isVotingQ || userVoteQ !== null;
  const isADisabled = isVotingA || userVoteA !== null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[TYPE_COLOR[requestType] || '#fff', '#FFFFFF']}
        locations={[0, 0.7]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ backgroundColor: "rgba(0,0,0,0.5)" }}/>

      <View style={styles.content}>
        
        {/* БЛОК ВОПРОСА (Solution) */}
        <View style={styles.sectionRow}>
          <View style={styles.leftSide}><AnonIcon width={36} height={36} /></View>
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
            <Pressable onPress={() => setExpandedQ(!expandedQ)}>
              <Text style={styles.text} numberOfLines={expandedQ ? undefined : 3}>{item.solution}</Text>
              {!expandedQ && item.solution && item.solution.length > 120 && (
                <Text style={styles.moreTextInline}>{t('pendingRequestCard.more', '...ещё')}</Text>
              )}
            </Pressable>

            <View style={styles.btnStack}>
              <Pressable 
                style={[styles.btnItem, userVoteQ === 'like' && styles.btnActiveLike, isQDisabled && styles.btnDisabled]} 
                onPress={() => handleVoteQ('like')} disabled={isQDisabled}
              >
                {isVotingQ && userVoteQ === 'like' ? <ActivityIndicator size="small" color="#2E7D32" /> : (
                  <>
                    <LikeIcon width={18} height={16} fill={userVoteQ === 'like' ? '#2E7D32' : '#fff'} />
                    <Text style={[styles.textInactive, userVoteQ === 'like' && styles.textActiveLike]}>{qLikes}</Text>
                  </>
                )}
              </Pressable>
              <Pressable 
                style={[styles.btnItem, userVoteQ === 'dislike' && styles.btnActiveDislike, isQDisabled && styles.btnDisabled]} 
                onPress={() => handleVoteQ('dislike')} disabled={isQDisabled}
              >
                {isVotingQ && userVoteQ === 'dislike' ? <ActivityIndicator size="small" color="#D32F2F" /> : (
                  <>
                    <DislikeIcon width={18} height={16} fill={userVoteQ === 'dislike' ? '#D32F2F' : '#fff'} />
                    <Text style={[styles.textInactive, userVoteQ === 'dislike' && styles.textActiveDislike]}>{qDislikes}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* БЛОК ОТВЕТА (Comment) */}
        <View style={styles.sectionRow}>
          <View style={styles.leftSide}><SolutionIcon width={36} height={36} /></View>
          <View style={styles.rightSide}>
            <View style={styles.headerLeftA}>
                <Text style={styles.solution}>SU Solution</Text>
                <Text style={styles.date}>{formatDate(item.updated_at)}</Text>
            </View>
            <Pressable onPress={() => setExpandedA(!expandedA)}>
              <Text style={styles.text} numberOfLines={expandedA ? undefined : 3}>{item.comment}</Text>
              {!expandedA && item.comment && item.comment.length > 120 && (
                <Text style={styles.moreTextInline}>{t('pendingRequestCard.more', '...ещё')}</Text>
              )}
            </Pressable>

            <View style={styles.btnStack}>
              <Pressable 
                style={[styles.btnItem, userVoteA === 'like' && styles.btnActiveLike, isADisabled && styles.btnDisabled]} 
                onPress={() => handleVoteA('like')} disabled={isADisabled}
              >
                {isVotingA && userVoteA === 'like' ? <ActivityIndicator size="small" color="#2E7D32" /> : (
                  <>
                    <LikeIcon width={18} height={16} fill={userVoteA === 'like' ? '#2E7D32' : '#fff'} />
                    <Text style={[styles.textInactive, userVoteA === 'like' && styles.textActiveLike]}>{aLikes}</Text>
                  </>
                )}
              </Pressable>
              <Pressable 
                style={[styles.btnItem, userVoteA === 'dislike' && styles.btnActiveDislike, isADisabled && styles.btnDisabled]} 
                onPress={() => handleVoteA('dislike')} disabled={isADisabled}
              >
                {isVotingA && userVoteA === 'dislike' ? <ActivityIndicator size="small" color="#D32F2F" /> : (
                  <>
                    <DislikeIcon width={18} height={16} fill={userVoteA === 'dislike' ? '#D32F2F' : '#fff'} />
                    <Text style={[styles.textInactive, userVoteA === 'dislike' && styles.textActiveDislike]}>{aDislikes}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 10, overflow: 'hidden', marginBottom: 15 },
  content: { padding: 16, gap: 24 },
  sectionRow: { flexDirection: 'row', gap: 12 },
  leftSide: { width: 36, alignItems: 'center' },
  rightSide: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headerLeftA: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 },
  anon: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 14, color: '#999' },
  requestTitle: { fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 4 },
  solution: { fontSize: 16, fontWeight: '700' },
  text: { fontSize: 12, lineHeight: 20 },
  moreTextInline: { color: "#838282", fontWeight: "600", fontSize: 12, marginTop: 2 },
  btnStack: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  btnItem: { 
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: 100, 
  },
  btnDisabled: { opacity: 0.6 },
  textInactive: { fontWeight: '600', color: '#666', fontSize: 13 },
  btnActiveLike: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  textActiveLike: { color: '#2E7D32', fontWeight: '700' },
  btnActiveDislike: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  textActiveDislike: { color: '#D32F2F', fontWeight: '700' }
});