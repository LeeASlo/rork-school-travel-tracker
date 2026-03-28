import { useSettings } from '@/contexts/SettingsContext';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save } from 'lucide-react-native';

export default function SettingsScreen() {
  const { settings, updateSettings, isSaving } = useSettings();

  const [mileageRate, setMileageRate] = useState<string>((settings.mileageRate || 0.14).toString());
  const [contractedHours, setContractedHours] = useState<string>(
    (settings.contractedHoursPerWeek || 40).toString()
  );
  const [contractedHoursPerDay, setContractedHoursPerDay] = useState<string>(
    (settings.contractedHoursPerDay || 7.2).toString()
  );
  const [annualHolidayDays, setAnnualHolidayDays] = useState<string>(
    (settings.totalAnnualHolidayDays || 28).toString()
  );

  const holidayYearMonth = new Date(settings.holidayYearStart).toLocaleString('default', {
    month: 'long',
  });

  const handleSave = () => {
    const rate = parseFloat(mileageRate);
    const hours = parseFloat(contractedHours);
    const hoursPerDay = parseFloat(contractedHoursPerDay);
    const holidays = parseFloat(annualHolidayDays);

    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Error', 'Please enter a valid mileage rate');
      return;
    }

    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Error', 'Please enter valid contracted hours per week');
      return;
    }

    if (isNaN(hoursPerDay) || hoursPerDay <= 0) {
      Alert.alert('Error', 'Please enter valid contracted hours per day');
      return;
    }

    if (isNaN(holidays) || holidays <= 0) {
      Alert.alert('Error', 'Please enter valid annual holiday days');
      return;
    }

    updateSettings({
      mileageRate: rate,
      contractedHoursPerWeek: hours,
      contractedHoursPerDay: hoursPerDay,
      totalAnnualHolidayDays: holidays,
    });

    Alert.alert('Success', 'Settings saved successfully');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mileage Settings</Text>
          <Text style={styles.label}>Mileage Rate (£ per mile)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.14"
            keyboardType="decimal-pad"
            value={mileageRate}
            onChangeText={setMileageRate}
          />
          <Text style={styles.helperText}>
            UK company petrol van rate is currently £0.14 per mile
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Schedule</Text>
          <Text style={styles.label}>Contracted Hours Per Week</Text>
          <TextInput
            style={styles.input}
            placeholder="40"
            keyboardType="decimal-pad"
            value={contractedHours}
            onChangeText={setContractedHours}
          />
          <Text style={styles.helperText}>
            Your contracted weekly hours for calculating overtime
          </Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Contracted Hours Per Day</Text>
          <TextInput
            style={styles.input}
            placeholder="7.2"
            keyboardType="decimal-pad"
            value={contractedHoursPerDay}
            onChangeText={setContractedHoursPerDay}
          />
          <Text style={styles.helperText}>
            Hours that equal 1 working day for holiday calculations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holiday Entitlement</Text>
          <Text style={styles.label}>Base Annual Holiday Days</Text>
          <TextInput
            style={styles.input}
            placeholder="28"
            keyboardType="decimal-pad"
            value={annualHolidayDays}
            onChangeText={setAnnualHolidayDays}
          />
          <Text style={styles.helperText}>
            Your base annual holiday entitlement (typically 28 days in the UK)
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Holiday Year</Text>
            <Text style={styles.infoText}>
              Your holiday year starts on 1st {holidayYearMonth}
            </Text>
            <Text style={styles.infoSubtext}>
              Fixed to April 1st to align with UK tax year
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>• 1 holiday day = {settings.contractedHoursPerDay || 7.2} hours</Text>
            <Text style={styles.infoText}>
              • Overtime hours convert to additional holiday days
            </Text>
            <Text style={styles.infoText}>
              • Marking a day as &ldquo;Day Off&rdquo; uses 1 holiday day ({settings.contractedHoursPerDay || 7.2} hours)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color="#fff" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  infoCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0d47a1',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#1976d2',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
