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
import { ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react-native';
import { exportMonthlySummary } from '@/utils/exportHelpers';

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })} - ${endDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })}`;
}

export default function MonthlySummaryScreen() {
  const {
    currentMonthSummary,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useWorkTracking();
  const { settings } = useSettings();

  const ratePerMile = settings.mileageRate;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.monthInfo}>
          <Text style={styles.monthTitle}>Monthly Summary</Text>
          <Text style={styles.monthDate}>
            {formatMonthYear(currentMonthSummary.monthStart)}
          </Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <ChevronRight size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.todayButton} onPress={goToCurrentMonth}>
          <Calendar size={16} color="#007AFF" />
          <Text style={styles.todayButtonText}>Current Month</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={async () => {
            try {
              await exportMonthlySummary(
                currentMonthSummary, 
                settings.mileageRate,
                settings.contractedHoursPerWeek,
                settings.contractedHoursPerDay
              );
              Alert.alert('Success', 'Monthly summary exported');
            } catch {
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
              {currentMonthSummary.totalHours.toFixed(1)}
            </Text>
            <Text style={styles.summaryCardUnit}>hours</Text>
          </View>

          <View style={[styles.summaryCard, styles.milesCard]}>
            <Text style={styles.summaryCardLabel}>Total Miles</Text>
            <Text style={styles.summaryCardValue}>
              {currentMonthSummary.totalMiles.toFixed(1)}
            </Text>
            <Text style={styles.summaryCardUnit}>miles</Text>
          </View>
        </View>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.rebookingsCard]}>
            <Text style={styles.summaryCardLabel}>Rebookings</Text>
            <Text style={styles.summaryCardValue}>
              {currentMonthSummary.rebookingsCount}
            </Text>
            <Text style={styles.summaryCardUnit}>this month</Text>
          </View>

          <View style={[styles.summaryCard, styles.overtimeCard]}>
            <Text style={styles.summaryCardLabel}>Overtime</Text>
            <Text style={styles.summaryCardValue}>
              {currentMonthSummary.overtimeHours.toFixed(1)}
            </Text>
            <Text style={styles.summaryCardUnit}>hours</Text>
          </View>
        </View>

        <View style={styles.holidayCard}>
          <Text style={styles.holidayTitle}>Holiday Entitlement</Text>
          <View style={styles.holidayStats}>
            <View style={styles.holidayStat}>
              <Text style={styles.holidayStatValue}>
                {currentMonthSummary.totalHolidayEntitlement.toFixed(1)}
              </Text>
              <Text style={styles.holidayStatLabel}>Total Days</Text>
            </View>
            <View style={styles.holidayStatDivider} />
            <View style={styles.holidayStat}>
              <Text style={styles.holidayStatValue}>
                {currentMonthSummary.holidaysUsed.toFixed(1)}
              </Text>
              <Text style={styles.holidayStatLabel}>Used</Text>
            </View>
            <View style={styles.holidayStatDivider} />
            <View style={styles.holidayStat}>
              <Text style={[styles.holidayStatValue, styles.holidayStatRemaining]}>
                {currentMonthSummary.holidaysRemaining.toFixed(1)}
              </Text>
              <Text style={styles.holidayStatLabel}>Remaining</Text>
            </View>
          </View>
          <Text style={styles.holidayNote}>
            1 day = {settings.contractedHoursPerDay} hours • Year starts {new Date(settings.holidayYearStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        <View style={styles.expenseCard}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseTitle}>Mileage Expenses</Text>
            <Text style={styles.expenseSubtitle}>
              Based on selected expenses: {ratePerMile}p/mile
            </Text>
          </View>
          <Text style={styles.expenseAmount}>
            £{currentMonthSummary.mileageExpense.toFixed(2)}
          </Text>
        </View>

        {currentMonthSummary.additionalExpenses > 0 && (
          <View style={[styles.expenseCard, styles.additionalExpenseCard]}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle}>Additional Expenses</Text>
              <Text style={styles.expenseSubtitle}>
                Food, parking, and other expenses
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              £{currentMonthSummary.additionalExpenses.toFixed(2)}
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
            £{(currentMonthSummary.mileageExpense + currentMonthSummary.additionalExpenses).toFixed(2)}
          </Text>
        </View>

        {currentMonthSummary.weeklyBreakdown.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
            {currentMonthSummary.weeklyBreakdown.map((week, index) => (
              <View key={index} style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <Text style={styles.weekDate}>
                    {formatDateRange(week.weekStart, week.weekEnd)}
                  </Text>
                </View>
                <View style={styles.weekStats}>
                  <View style={styles.weekStatItem}>
                    <Text style={styles.weekStatValue}>{week.hours.toFixed(1)}</Text>
                    <Text style={styles.weekStatLabel}>hours</Text>
                  </View>
                  <View style={styles.weekStatDivider} />
                  <View style={styles.weekStatItem}>
                    <Text style={styles.weekStatValue}>{week.miles.toFixed(1)}</Text>
                    <Text style={styles.weekStatLabel}>miles</Text>
                  </View>
                  <View style={styles.weekStatDivider} />
                  <View style={styles.weekStatItem}>
                    <Text style={styles.weekStatValue}>{week.rebookings}</Text>
                    <Text style={styles.weekStatLabel}>rebookings</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No entries for this month yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add daily entries to see your monthly summary
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
    paddingVertical: 16,
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
  monthInfo: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  monthDate: {
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
  overtimeCard: {
    backgroundColor: '#fce4ec',
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekCard: {
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
  weekHeader: {
    marginBottom: 12,
  },
  weekDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  weekStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  weekStatItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  weekStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 4,
  },
  weekStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  weekStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
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
  holidayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  holidayTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  holidayStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 16,
  },
  holidayStat: {
    alignItems: 'center' as const,
    flex: 1,
  },
  holidayStatValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 4,
  },
  holidayStatRemaining: {
    color: '#4caf50',
  },
  holidayStatLabel: {
    fontSize: 13,
    color: '#666',
  },
  holidayStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  holidayNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as const,
  },
});
