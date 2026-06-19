import { colors } from '@shared/theme/colors';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

const SURVEY_TITLE =
  'Отраслевое соглашение по условиям труда на 2024 год';

const INITIAL_SURVEYS = [
  {
    id: '1',
    question:
      'Поддерживаете ли вы проект “Отраслевого соглашения” по условиям труда на 2024 год?',
    options: ['Да', 'Нет', 'Возможно', 'Затрудняюсь ответить'],
    selectedOption: '',
  },
  {
    id: '2',
    question:
      'Считаете ли вы предложенные условия труда достаточными для работников?',
    options: ['Да', 'Нет', 'Частично', 'Затрудняюсь ответить'],
    selectedOption: '',
  },
];

export const SurveyDetailPage = ({ navigation }: any) => {
  const [surveys, setSurveys] = useState(INITIAL_SURVEYS);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const answeredCount = surveys.filter(item => item.selectedOption).length;
  const totalCount = surveys.length;
  const canSubmit = answeredCount === totalCount;

  const handleSelectOption = (surveyId: string, option: string) => {
    setSurveys(prev =>
      prev.map(item =>
        item.id === surveyId ? { ...item, selectedOption: option } : item
      )
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSuccessModalVisible(true);
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    navigation.goBack();
  };

  return (
    <DefaultLayout
      variant="back"
      title="Анкета"
      onRightPress={() => alert('EN')}
    >
      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageTitle}>Анкетирование</Text>
           
            </View>

            <View style={styles.progressBadge}>
              <Text style={styles.progressValue}>
                {answeredCount}/{totalCount}
              </Text>
              <Text style={styles.progressLabel}>ответов</Text>
            </View>
          </View>

          <View style={styles.surveyHeader}>
            <Text style={styles.surveyTitle}>{SURVEY_TITLE}</Text>

            <Text style={styles.surveyDescription}>
              Ознакомьтесь с вопросами и выберите наиболее подходящие варианты
              ответов.
            </Text>
          </View>

          {surveys.map((survey, index) => (
            <View key={survey.id} style={styles.card}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>

                <Text style={styles.cardTitle}>{survey.question}</Text>
              </View>

              <View style={styles.optionsList}>
                {survey.options.map(option => {
                  const isSelected = survey.selectedOption === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectOption(survey.id, option)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.checkboxDot} />}
                      </View>

                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text
              style={[
                styles.submitButtonText,
                !canSubmit && styles.submitButtonTextDisabled,
              ]}
            >
              {canSubmit
                ? 'Отправить ответы'
                : `Ответьте на все вопросы (${answeredCount}/${totalCount})`}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeSuccessModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>✅</Text>
              </View>

              <Text style={styles.modalTitle}>Анкета пройдена</Text>

              <Text style={styles.modalDescription}>
                Спасибо! Ваши ответы успешно сохранены и будут учтены в
                голосовании.
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.8}
                onPress={closeSuccessModal}
              >
                <Text style={styles.modalButtonText}>Готово</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background || '#F5F7FA',
  },

  scrollView: {
    backgroundColor: colors.background || '#F5F7FA',
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002F42',
  },

  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A8494',
    fontWeight: '500',
  },

  progressBadge: {
    minWidth: 64,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  progressValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0057B8',
    lineHeight: 20,
  },

  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  surveyHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  surveyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002F42',
    lineHeight: 24,
  },

  surveyDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  questionNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0057B8',
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    color: '#111827',
  },

  optionsList: {
    gap: 10,
  },

  optionRow: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  optionRowSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#0057B8',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  checkboxSelected: {
    borderColor: '#0057B8',
  },

  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0057B8',
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },

  optionTextSelected: {
    color: '#002F42',
  },

  submitButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  submitButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  submitButtonTextDisabled: {
    color: '#94A3B8',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },

  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalIcon: {
    fontSize: 34,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002F42',
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },

  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});