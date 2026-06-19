import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RequestItem, UserVote } from './RequestCard.types';

type Props = {
  item: RequestItem;
  requestType?: string;
  onVote?: (id: string, type: 'like' | 'dislike') => void;
};

export const PendingRequestCard = ({ item, onVote }: Props) => {
  return (
    <View style={styles.card}>
      <CardHeader item={item} />

      <View style={styles.bodyBlock}>
        <Text style={styles.problemTitle}>{item.problem}</Text>

        <Text style={styles.bodyLabel}>Вариант решения проблемы:</Text>

        <Text style={styles.solutionText}>{item.solution}</Text>
      </View>

      <VoteBar item={item} onVote={onVote} />
    </View>
  );
};

const CardHeader = ({ item }: { item: RequestItem }) => (
  <View style={styles.cardHeader}>
    <View style={styles.userInfo}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarEmoji}>👤</Text>
      </View>

      <View>
        <Text style={styles.userNameText}>Аноним</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>

    <View style={styles.tagLabel}>
      <Text style={styles.tagLabelText}>{item.tag}</Text>
    </View>
  </View>
);

const VoteBar = ({
  item,
  onVote,
}: {
  item: RequestItem;
  onVote?: (id: string, type: 'like' | 'dislike') => void;
}) => (
  <>
    <View style={styles.divider} />

    <View style={styles.interactionsBar}>
      <TouchableOpacity
        style={styles.voteNode}
        activeOpacity={0.6}
        onPress={() => onVote?.(item.id, 'like')}
      >
        <Text
          style={[
            styles.voteIcon,
            item.userVote === 'like' && styles.activeLikeText,
          ]}
        >
          {item.userVote === 'like' ? '❤️' : '🤍'}
        </Text>

        <Text
          style={[
            styles.voteCount,
            item.userVote === 'like' && styles.activeLikeText,
          ]}
        >
          {item.likes}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.voteNode}
        activeOpacity={0.6}
        onPress={() => onVote?.(item.id, 'dislike')}
      >
        <Text
          style={[
            styles.voteIcon,
            item.userVote === 'dislike' && styles.activeDislikeText,
          ]}
        >
          💔
        </Text>

        <Text
          style={[
            styles.voteCount,
            item.userVote === 'dislike' && styles.activeDislikeText,
          ]}
        >
          {item.dislikes}
        </Text>
      </TouchableOpacity>
    </View>
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  dateText: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  tagLabel: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 140,
  },
  tagLabelText: {
    fontSize: 11,
    color: '#2B6CB0',
    fontWeight: '700',
  },
  bodyBlock: {
    gap: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 22,
  },
  bodyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 4,
  },
  solutionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 14,
  },
  interactionsBar: {
    flexDirection: 'row',
    gap: 20,
  },
  voteNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voteIcon: {
    fontSize: 16,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  activeLikeText: {
    color: '#E53E3E',
    fontWeight: '700',
  },
  activeDislikeText: {
    color: '#4A5568',
    fontWeight: '700',
  },
});