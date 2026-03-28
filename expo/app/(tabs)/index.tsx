import { useWorkTracking } from '@/contexts/WorkTrackingContext';
import { DayEntry, School } from '@/types/work';
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
import { Plus, X, Save } from 'lucide-react-native';

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function convert24To12Hour(time24: string): { time12: string; period: 'AM' | 'PM' } {
  if (!time24) return { time12: '', period: 'AM' };
  const [hours24, minutes] = time24.split(':').map(Number);
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return { time12: `${hours12}:${minutes.toString().padStart(2, '0')}`, period };
}

function convert12To24Hour(time12: string, period: 'AM' | 'PM'): string {
  if (!time12) return '';
  const [hoursStr, minutes] = time12.split(':');
  let hours = parseInt(hoursStr, 10);
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export default function DailyEntryScreen() {
  const { addOrUpdateEntry, getEntryForDate, isSaving } = useWorkTracking();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = formatDateForInput(selectedDate);
  const existingEntry = getEntryForDate(dateStr);

  const [schools, setSchools] = useState<School[]>(existingEntry?.schools || []);
  const [newSchoolName, setNewSchoolName] = useState<string>('');
  
  const startTimeConverted = convert24To12Hour(existingEntry?.startTime || '');
  const endTimeConverted = convert24To12Hour(existingEntry?.endTime || '');
  
  const [startTime12, setStartTime12] = useState<string>(startTimeConverted.time12);
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>(startTimeConverted.period);
  const [endTime12, setEndTime12] = useState<string>(endTimeConverted.time12);
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>(endTimeConverted.period);
  
  const [startFromHome, setStartFromHome] = useState<boolean>(
    existingEntry?.startLocation === 'Home' || false
  );
  const [endAtLab, setEndAtLab] = useState<boolean>(
    existingEntry?.endLocation === 'Lab' || false
  );
  const [customStartLocation, setCustomStartLocation] = useState<string>(
    existingEntry?.startLocation && existingEntry.startLocation !== 'Home'
      ? existingEntry.startLocation
      : ''
  );
  const [customEndLocation, setCustomEndLocation] = useState<string>(
    existingEntry?.endLocation && existingEntry.endLocation !== 'Lab'
      ? existingEntry.endLocation
      : ''
  );
  const [startMileage, setStartMileage] = useState<string>(
    existingEntry?.startMileage?.toString() || ''
  );
  const [endMileage, setEndMileage] = useState<string>(
    existingEntry?.endMileage?.toString() || ''
  );
  const [personalMiles, setPersonalMiles] = useState<string>(
    existingEntry?.personalMiles?.toString() || '0'
  );
  const [additionalExpenses, setAdditionalExpenses] = useState<string>(
    existingEntry?.additionalExpenses?.toString() || '0'
  );
  const [isRebooking, setIsRebooking] = useState<boolean>(
    existingEntry?.isRebooking || false
  );
  const [isDayOff, setIsDayOff] = useState<boolean>(
    existingEntry?.isDayOff || false
  );
  const [isWorkingInLab, setIsWorkingInLab] = useState<boolean>(
    existingEntry?.isWorkingInLab || false
  );
  const [hasDeliveries, setHasDeliveries] = useState<boolean>(
    existingEntry?.hasDeliveries || false
  );
  const [comments, setComments] = useState<string>(
    existingEntry?.comments || ''
  );

  const addSchool = () => {
    if (!newSchoolName.trim()) {
      Alert.alert('Error', 'Please enter a school name');
      return;
    }
    const school: School = {
      id: Date.now().toString(),
      name: newSchoolName.trim(),
    };
    setSchools([...schools, school]);
    setNewSchoolName('');
  };

  const removeSchool = (id: string) => {
    setSchools(schools.filter((s) => s.id !== id));
  };

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    let totalMinutes = endInMinutes - startInMinutes;
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    totalMinutes -= 30;
    
    if (!endAtLab) {
      totalMinutes -= 30;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const startTime24 = convert12To24Hour(startTime12, startPeriod);
  const endTime24 = convert12To24Hour(endTime12, endPeriod);
  const hoursWorked = isDayOff ? 7.2 : calculateHours(startTime24, endTime24);



  const handleSave = () => {
    if (isDayOff) {
      const entry: DayEntry = {
        id: existingEntry?.id || Date.now().toString(),
        date: dateStr,
        schools: [],
        startTime: '00:00',
        endTime: '00:00',
        hoursWorked: 7.2,
        startLocation: 'Day Off',
        endLocation: 'Day Off',
        startMileage: 0,
        endMileage: 0,
        personalMiles: 0,
        additionalExpenses: 0,
        isRebooking: false,
        isDayOff: true,
        isWorkingInLab: false,
        hasDeliveries: false,
        comments: comments.trim() || undefined,
      };

      addOrUpdateEntry(entry);
      Alert.alert('Success', 'Day off saved successfully');
      return;
    }

    if (!isWorkingInLab && schools.length === 0) {
      Alert.alert('Error', 'Please add at least one school');
      return;
    }
    if (!startTime12 || !endTime12) {
      Alert.alert('Error', 'Please enter start and end times');
      return;
    }
    if (!startFromHome && !customStartLocation.trim()) {
      Alert.alert('Error', 'Please enter start location or check "Start from Home"');
      return;
    }
    if (!endAtLab && !customEndLocation.trim()) {
      Alert.alert('Error', 'Please enter end location or check "End at Lab"');
      return;
    }
    if (!isWorkingInLab || hasDeliveries) {
      if (!startMileage || !endMileage) {
        Alert.alert('Error', 'Please enter mileage');
        return;
      }

      const start = parseFloat(startMileage);
      const end = parseFloat(endMileage);

      if (isNaN(start) || isNaN(end)) {
        Alert.alert('Error', 'Please enter valid mileage numbers');
        return;
      }

      if (end < start) {
        Alert.alert('Error', 'End mileage must be greater than start mileage');
        return;
      }
    }

    const finalSchools = isWorkingInLab ? [{ id: 'lab', name: 'Working in Lab' }] : schools;
    const shouldTrackMileage = !isWorkingInLab || hasDeliveries;
    const start = shouldTrackMileage ? parseFloat(startMileage) : 0;
    const end = shouldTrackMileage ? parseFloat(endMileage) : 0;
    const personal = shouldTrackMileage ? parseFloat(personalMiles || '0') : 0;

    const additionalExpensesNum = parseFloat(additionalExpenses || '0');

    const entry: DayEntry = {
      id: existingEntry?.id || Date.now().toString(),
      date: dateStr,
      schools: finalSchools,
      startTime: startTime24,
      endTime: endTime24,
      hoursWorked,
      startLocation: startFromHome ? 'Home' : customStartLocation.trim(),
      endLocation: endAtLab ? 'Lab' : customEndLocation.trim(),
      startMileage: start,
      endMileage: end,
      personalMiles: personal,
      additionalExpenses: additionalExpensesNum,
      isRebooking,
      isDayOff: false,
      isWorkingInLab,
      hasDeliveries,
      comments: comments.trim() || undefined,
    };

    addOrUpdateEntry(entry);
    Alert.alert('Success', 'Entry saved successfully');
  };

  const changeDay = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);

    const newDateStr = formatDateForInput(newDate);
    const newEntry = getEntryForDate(newDateStr);
    
    setSchools(newEntry?.schools || []);
    
    const newStartTime = convert24To12Hour(newEntry?.startTime || '');
    const newEndTime = convert24To12Hour(newEntry?.endTime || '');
    
    setStartTime12(newStartTime.time12);
    setStartPeriod(newStartTime.period);
    setEndTime12(newEndTime.time12);
    setEndPeriod(newEndTime.period);
    
    setStartFromHome(newEntry?.startLocation === 'Home' || false);
    setEndAtLab(newEntry?.endLocation === 'Lab' || false);
    setCustomStartLocation(
      newEntry?.startLocation && newEntry.startLocation !== 'Home'
        ? newEntry.startLocation
        : ''
    );
    setCustomEndLocation(
      newEntry?.endLocation && newEntry.endLocation !== 'Lab'
        ? newEntry.endLocation
        : ''
    );
    setStartMileage(newEntry?.startMileage?.toString() || '');
    setEndMileage(newEntry?.endMileage?.toString() || '');
    setPersonalMiles(newEntry?.personalMiles?.toString() || '0');
    setAdditionalExpenses(newEntry?.additionalExpenses?.toString() || '0');
    setIsRebooking(newEntry?.isRebooking || false);
    setIsDayOff(newEntry?.isDayOff || false);
    setIsWorkingInLab(newEntry?.isWorkingInLab || false);
    setHasDeliveries(newEntry?.hasDeliveries || false);
    setComments(newEntry?.comments || '');
  };

  const totalMilesDriven =
    startMileage && endMileage
      ? parseFloat(endMileage) - parseFloat(startMileage)
      : 0;
  
  const personalMilesNum = parseFloat(personalMiles || '0');
  const businessMiles = Math.max(0, totalMilesDriven - personalMilesNum);
  const milesDriven = totalMilesDriven.toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dayButton}
          onPress={() => changeDay(-1)}
        >
          <Text style={styles.dayButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateForDisplay(selectedDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.dayButton}
          onPress={() => changeDay(1)}
        >
          <Text style={styles.dayButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsDayOff(!isDayOff)}
          >
            <View style={[styles.checkbox, isDayOff && styles.checkboxDayOff]}>
              {isDayOff && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Day Off (Holiday)</Text>
          </TouchableOpacity>
          {isDayOff && (
            <View style={styles.dayOffInfo}>
              <Text style={styles.dayOffText}>
                This will use 1 day (7.2 hours) of your holiday entitlement
              </Text>
            </View>
          )}
        </View>

        {!isDayOff && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsWorkingInLab(!isWorkingInLab)}
            >
              <View style={[styles.checkbox, isWorkingInLab && styles.checkboxChecked]}>
                {isWorkingInLab && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Working in Lab</Text>
            </TouchableOpacity>
            {isWorkingInLab && (
              <View style={styles.labOptionsContainer}>
                <Text style={styles.labNote}>Mileage tracking disabled for lab work</Text>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setHasDeliveries(!hasDeliveries)}
                >
                  <View style={[styles.checkbox, hasDeliveries && styles.checkboxChecked]}>
                    {hasDeliveries && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Made Deliveries</Text>
                </TouchableOpacity>
                {hasDeliveries && (
                  <Text style={styles.labNote}>Mileage tracking enabled for deliveries</Text>
                )}
              </View>
            )}
          </View>
        )}

        {!isDayOff && !isWorkingInLab && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schools Visited</Text>
            <View style={styles.schoolInputContainer}>
              <TextInput
                style={styles.schoolInput}
                placeholder="Enter school name"
                value={newSchoolName}
                onChangeText={setNewSchoolName}
                onSubmitEditing={addSchool}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSchool}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {schools.map((school) => (
              <View key={school.id} style={styles.schoolChip}>
                <Text style={styles.schoolChipText}>{school.name}</Text>
                <TouchableOpacity onPress={() => removeSchool(school.id)}>
                  <X size={18} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!isDayOff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Hours</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Start Time</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[styles.input, styles.timeTextInput]}
                    placeholder="9:00"
                    value={startTime12}
                    onChangeText={setStartTime12}
                  />
                  <TouchableOpacity
                    style={styles.periodButton}
                    onPress={() => setStartPeriod(startPeriod === 'AM' ? 'PM' : 'AM')}
                  >
                    <Text style={styles.periodButtonText}>{startPeriod}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.label}>End Time</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[styles.input, styles.timeTextInput]}
                    placeholder="5:30"
                    value={endTime12}
                    onChangeText={setEndTime12}
                  />
                  <TouchableOpacity
                    style={styles.periodButton}
                    onPress={() => setEndPeriod(endPeriod === 'AM' ? 'PM' : 'AM')}
                  >
                    <Text style={styles.periodButtonText}>{endPeriod}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {hoursWorked > 0 && (
              <View style={styles.hoursCard}>
                <Text style={styles.hoursLabel}>Total Hours (with deductions)</Text>
                <Text style={styles.hoursValue}>{hoursWorked.toFixed(2)} hours</Text>
                <Text style={styles.hoursNote}>
                  • 30 min lunch deducted
                  {!endAtLab && '\n• 30 min travel deducted'}
                </Text>
              </View>
            )}
          </View>
        )}

        {!isDayOff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>
            
            <View style={styles.locationSection}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setStartFromHome(!startFromHome)}
              >
                <View style={[styles.checkbox, startFromHome && styles.checkboxChecked]}>
                  {startFromHome && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Start from Home</Text>
              </TouchableOpacity>
              {!startFromHome && (
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  placeholder="Enter start location"
                  value={customStartLocation}
                  onChangeText={setCustomStartLocation}
                />
              )}
            </View>

            <View style={styles.locationSection}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setEndAtLab(!endAtLab)}
              >
                <View style={[styles.checkbox, endAtLab && styles.checkboxChecked]}>
                  {endAtLab && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>End at Lab</Text>
              </TouchableOpacity>
              {!endAtLab && (
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  placeholder="Enter end location"
                  value={customEndLocation}
                  onChangeText={setCustomEndLocation}
                />
              )}
            </View>
          </View>
        )}

        {!isDayOff && (!isWorkingInLab || hasDeliveries) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mileage</Text>
            <View style={styles.mileageRow}>
              <View style={styles.mileageInput}>
                <Text style={styles.label}>Start</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 45000"
                  keyboardType="decimal-pad"
                  value={startMileage}
                  onChangeText={setStartMileage}
                />
              </View>
              <View style={styles.mileageInput}>
                <Text style={styles.label}>End</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 45120"
                  keyboardType="decimal-pad"
                  value={endMileage}
                  onChangeText={setEndMileage}
                />
              </View>
            </View>
            <View style={styles.mileageInput}>
              <Text style={styles.label}>Personal Miles</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={personalMiles}
                onChangeText={setPersonalMiles}
              />
            </View>
            {parseFloat(milesDriven) > 0 && (
              <View style={styles.milesCard}>
                <Text style={styles.milesLabel}>Total Miles Driven</Text>
                <Text style={styles.milesValue}>{milesDriven} miles</Text>
                {personalMilesNum > 0 && (
                  <View style={styles.mileageBreakdown}>
                    <Text style={styles.breakdownText}>Personal: {personalMilesNum.toFixed(1)} miles</Text>
                    <Text style={styles.breakdownText}>Business: {businessMiles.toFixed(1)} miles</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {!isDayOff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Expenses</Text>
            <Text style={styles.expenseNote}>
              Enter additional expenses like food, parking, etc.
            </Text>
            <View style={styles.expenseInputContainer}>
              <Text style={styles.currencySymbol}>£</Text>
              <TextInput
                style={styles.expenseInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={additionalExpenses}
                onChangeText={setAdditionalExpenses}
              />
            </View>
          </View>
        )}

        {!isDayOff && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsRebooking(!isRebooking)}
            >
              <View style={[styles.checkbox, isRebooking && styles.checkboxChecked]}>
                {isRebooking && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Rebooking</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <Text style={styles.commentsNote}>
            Add any additional notes or comments about this day
          </Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Enter your comments here..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color="#fff" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : isDayOff ? 'Save Day Off' : 'Save Entry'}
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
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dayButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600' as const,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center' as const,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1a1a',
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
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  schoolInputContainer: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  schoolInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  schoolChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  schoolChipText: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
  mileageRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  mileageInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  milesCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  milesLabel: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  milesValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1b5e20',
  },
  mileageBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#c8e6c9',
    width: '100%' as const,
  },
  breakdownText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center' as const,
    marginVertical: 2,
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
  timeRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeInputRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  timeTextInput: {
    flex: 1,
  },
  periodButton: {
    width: 60,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  hoursCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  hoursLabel: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 4,
  },
  hoursValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0d47a1',
    marginBottom: 8,
  },
  hoursNote: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center' as const,
  },
  locationSection: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxDayOff: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500' as const,
  },
  locationInput: {
    marginTop: 4,
  },
  dayOffInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  dayOffText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center' as const,
  },
  labOptionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  labNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  expenseNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  expenseInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600' as const,
    marginRight: 4,
  },
  expenseInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  commentsNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  commentsInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
});
