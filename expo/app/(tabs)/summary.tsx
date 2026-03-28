import { useWorkTracking } from '@/contexts/WorkTrackingContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar, Edit2, Download, Camera, ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { exportWeeklySummary } from '@/utils/exportHelpers';

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })} - ${endDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function formatDayOfWeek(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WeeklySummaryScreen() {
  const {
    currentWeekSummary,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    deleteEntry,
    selectedWeek,
    updateTimesheetPhoto,
  } = useWorkTracking();
  const { settings } = useSettings();
  const [localTimesheetPhoto, setLocalTimesheetPhoto] = useState<string | undefined>(
    currentWeekSummary.timesheetPhotoUri
  );

  const ratePerMile = settings.mileageRate;
  
  const rebookingsCount = currentWeekSummary.dailyBreakdown.filter(
    (day) => day.isRebooking
  ).length;

  const handleEditDay = (date: string) => {
    router.push('/');
  };

  const handleDeleteDay = (date: string, dayName: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the entry for ${dayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEntry(date);
            Alert.alert('Success', 'Entry deleted');
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant camera roll permissions to add photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalTimesheetPhoto(result.assets[0].uri);
      updateTimesheetPhoto(selectedWeek, result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalTimesheetPhoto(result.assets[0].uri);
      updateTimesheetPhoto(selectedWeek, result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setLocalTimesheetPhoto(undefined);
    updateTimesheetPhoto(selectedWeek, undefined);
  };

  useEffect(() => {
    setLocalTimesheetPhoto(currentWeekSummary.timesheetPhotoUri);
  }, [currentWeekSummary.timesheetPhotoUri]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousWeek}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>Week Summary</Text>
          <Text style={styles.weekDates}>
            {formatDateRange(
              currentWeekSummary.weekStart,
              currentWeekSummary.weekEnd
            )}
          </Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <ChevronRight size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.todayButton} onPress={goToCurrentWeek}>
          <Calendar size={16} color="#007AFF" />
          <Text style={styles.todayButtonText}>Current Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={async () => {
            try {
              await exportWeeklySummary(currentWeekSummary, settings.mileageRate);
              Alert.alert('Success', 'Weekly summary exported');
            } catch (error) {
              Alert.alert('Error', 'Failed to export summary');
            }
          }}
        >
          <Download size={16} color="#007AFF" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.hoursCard]}>
            <Text style={styles.summaryCardLabel}>Total Hours</Text>
            <Text style={styles.summaryCardValue}>
              {currentWeekSummary.totalHours.toFixed(1)}
            </Text>
            <Text style={styles.summaryCardUnit}>hours</Text>
          </View>

          <View style={[styles.summaryCard, styles.milesCard]}>
            <Text style={styles.summaryCardLabel}>Total Miles</Text>
            <Text style={styles.summaryCardValue}>
              {currentWeekSummary.totalMiles.toFixed(1)}
            </Text>
            <Text style={styles.summaryCardUnit}>miles</Text>
          </View>
        </View>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.rebookingsCard]}>
            <Text style={styles.summaryCardLabel}>Rebookings</Text>
            <Text style={styles.summaryCardValue}>{rebookingsCount}</Text>
            <Text style={styles.summaryCardUnit}>this week</Text>
          </View>
        </View>

        <View style={styles.expenseCard}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseTitle}>Mileage Expenses</Text>
            <Text style={styles.expenseSubtitle}>
              Based on selected expenses: {ratePerMile}p/mile
            </Text>
          </View>
          <Text style={styles.expenseAmount}>
            £{currentWeekSummary.mileageExpense.toFixed(2)}
          </Text>
        </View>

        {currentWeekSummary.additionalExpenses > 0 && (
          <View style={[styles.expenseCard, styles.additionalExpenseCard]}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle}>Additional Expenses</Text>
              <Text style={styles.expenseSubtitle}>
                Food, parking, and other expenses
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              £{currentWeekSummary.additionalExpenses.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={[styles.expenseCard, styles.totalExpenseCard]}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseTitle}>Total Expenses</Text>
            <Text style={styles.expenseSubtitle}>
              All expenses combined
            </Text>
          </View>
          <Text style={styles.expenseAmount}>
            £{(currentWeekSummary.mileageExpense + currentWeekSummary.additionalExpenses).toFixed(2)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timesheet Photo (Optional)</Text>
          {localTimesheetPhoto ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: localTimesheetPhoto }}
                style={styles.photoPreview}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={removePhoto}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Camera size={24} color="#007AFF" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <ImageIcon size={24} color="#007AFF" />
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {currentWeekSummary.dailyBreakdown.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            {currentWeekSummary.dailyBreakdown.map((day, index) => (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayDate}>{formatDayOfWeek(day.date)}</Text>
                    {day.isRebooking && (
                      <View style={styles.rebookingBadge}>
                        <Text style={styles.rebookingBadgeText}>Rebooking</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.dayStats}>
                    <Text style={styles.dayStat}>{day.hours.toFixed(1)}h</Text>
                    <Text style={styles.dayStatDivider}>•</Text>
                    <Text style={styles.dayStat}>{day.miles.toFixed(1)}mi</Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditDay(day.date)}
                    >
                      <Edit2 size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                {day.schools.length > 0 && (
                  <View style={styles.schoolsList}>
                    {day.schools.map((school, idx) => (
                      <View key={idx} style={styles.schoolTag}>
                        <Text style={styles.schoolTagText}>{school}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteDay(day.date, formatDayOfWeek(day.date))}
                >
                  <Text style={styles.deleteButtonText}>Delete Entry</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No entries for this week yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add daily entries to see your weekly summary
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
  },
  weekTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  weekDates: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  actionsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  todayButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  exportButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
  todayButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  summaryCards: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hoursCard: {
    backgroundColor: '#e3f2fd',
  },
  milesCard: {
    backgroundColor: '#f3e5f5',
  },
  rebookingsCard: {
    backgroundColor: '#fff3e0',
  },
  summaryCardLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  summaryCardValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  summaryCardUnit: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  expenseCard: {
    backgroundColor: '#4caf50',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  additionalExpenseCard: {
    backgroundColor: '#ff9800',
    shadowColor: '#ff9800',
  },
  totalExpenseCard: {
    backgroundColor: '#2196f3',
    shadowColor: '#2196f3',
  },
  expenseHeader: {
    marginBottom: 12,
  },
  expenseTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  expenseAmount: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#fff',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  dayHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  rebookingBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rebookingBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600' as const,
  },
  dayStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  dayStat: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600' as const,
  },
  dayStatDivider: {
    fontSize: 14,
    color: '#ccc',
  },
  editButton: {
    padding: 4,
  },
  schoolsList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 12,
  },
  schoolTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  schoolTagText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  deleteButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center' as const,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
  },
  photoContainer: {
    position: 'relative' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  photoButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
  },
  photoButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
});
