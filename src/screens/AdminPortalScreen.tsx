import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet, 
  Dimensions, 
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getHomepageConfig, updateHomepageConfig, HomepageConfig, Teacher } from '../services/api';

const { width } = Dimensions.get('window');

const CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3',
  'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9',
  'Class 10', 'Class 11'
];

export const AdminPortalScreen: React.FC = () => {
  const { navigateTo } = useApp();
  
  const [selectedClass, setSelectedClass] = useState('Class 6');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HomepageConfig | null>(null);

  // Form states
  const [bannerText, setBannerText] = useState('');
  
  // Upcoming class states
  const [upcomingTitle, setUpcomingTitle] = useState('');
  const [upcomingSubject, setUpcomingSubject] = useState('');
  const [upcomingTime, setUpcomingTime] = useState('');
  const [upcomingTeacherName, setUpcomingTeacherName] = useState('');
  const [upcomingTeacherAvatar, setUpcomingTeacherAvatar] = useState('');

  // Teacher roster states (Sonia, Pankaj, Anshu)
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Load config for selected class
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setConfig(res.data);
          setBannerText(res.data.bannerText || '');
          
          const uc = res.data.upcomingClass || {};
          setUpcomingTitle(uc.title || '');
          setUpcomingSubject(uc.subject || '');
          setUpcomingTime(uc.time || '');
          setUpcomingTeacherName(uc.teacherName || '');
          setUpcomingTeacherAvatar(uc.teacherAvatar || '');
          
          setTeachers(res.data.teachers || []);
        }
      } catch (err: any) {
        console.error('Failed to load homepage config:', err);
        Alert.alert('Error', 'Failed to load configuration for this class.');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [selectedClass]);

  const handleTeacherChange = (index: number, field: keyof Teacher, val: string) => {
    const updated = [...teachers];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setTeachers(updated);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    const updatedConfig: Partial<HomepageConfig> = {
      bannerText,
      upcomingClass: {
        title: upcomingTitle,
        subject: upcomingSubject,
        time: upcomingTime,
        teacherName: upcomingTeacherName,
        teacherAvatar: upcomingTeacherAvatar
      },
      teachers
    };

    try {
      const res = await updateHomepageConfig(selectedClass, updatedConfig);
      if (res.success) {
        Alert.alert('Success', `Homepage configuration for ${selectedClass} updated! ✨`);
      }
    } catch (err: any) {
      console.error('Failed to save config:', err);
      Alert.alert('Save Failed', err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('DASHBOARD')} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
          Homepage Admin Editor
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* CLASS SELECTOR SCROLL */}
        <View style={styles.classSelectorCard}>
          <Text style={[styles.sectionTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
            Select Class to Edit
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classRow}>
            {CLASSES_LIST.map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <TouchableOpacity
                  key={cls}
                  onPress={() => setSelectedClass(cls)}
                  style={[styles.classItem, isSelected && styles.classItemActive]}
                >
                  <Text style={[styles.classText, isSelected && styles.classTextActive, { fontFamily: Theme.fonts.poppinsSemiBold }]}>
                    {cls}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00B6A6" />
            <Text style={[styles.loaderText, { fontFamily: Theme.fonts.poppinsMedium }]}>
              Loading configurations...
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            
            {/* BRAND BANNER SECTION */}
            <View style={styles.formCard}>
              <Text style={[styles.cardTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
                1. Top Brand Banner
              </Text>
              <Text style={styles.label}>Banner Subtitle / Value Text</Text>
              <TextInput
                value={bannerText}
                onChangeText={setBannerText}
                placeholder="Enter banner marketing text"
                style={styles.input}
              />
            </View>

            {/* UPCOMING CLASS SECTION */}
            <View style={styles.formCard}>
              <Text style={[styles.cardTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
                2. Live Upcoming Class
              </Text>
              
              <Text style={styles.label}>Class Title</Text>
              <TextInput
                value={upcomingTitle}
                onChangeText={setUpcomingTitle}
                placeholder="e.g. Quadratic Equations Part 1"
                style={styles.input}
              />

              <Text style={styles.label}>Subject</Text>
              <TextInput
                value={upcomingSubject}
                onChangeText={setUpcomingSubject}
                placeholder="e.g. Mathematics"
                style={styles.input}
              />

              <Text style={styles.label}>Time Label</Text>
              <TextInput
                value={upcomingTime}
                onChangeText={setUpcomingTime}
                placeholder="e.g. Today, 6:00 PM"
                style={styles.input}
              />

              <Text style={styles.label}>Teacher Name</Text>
              <TextInput
                value={upcomingTeacherName}
                onChangeText={setUpcomingTeacherName}
                placeholder="e.g. Sonia Verma"
                style={styles.input}
              />

              <Text style={styles.label}>Teacher Avatar Image URL</Text>
              <TextInput
                value={upcomingTeacherAvatar}
                onChangeText={setUpcomingTeacherAvatar}
                placeholder="Unsplash image URL"
                style={styles.input}
              />
            </View>

            {/* TEACHER ROSTER SECTION */}
            <View style={styles.formCard}>
              <Text style={[styles.cardTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
                3. Teacher Roster (Renders in Booster & Details)
              </Text>

              {teachers.map((t, idx) => (
                <View key={idx} style={styles.teacherFormGroup}>
                  <Text style={[styles.teacherSubHeader, { fontFamily: Theme.fonts.poppinsSemiBold }]}>
                    Teacher #{idx + 1}
                  </Text>
                  
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    value={t.name}
                    onChangeText={(val) => handleTeacherChange(idx, 'name', val)}
                    placeholder="Teacher Name"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Role / Credentials</Text>
                  <TextInput
                    value={t.role}
                    onChangeText={(val) => handleTeacherChange(idx, 'role', val)}
                    placeholder="e.g. Maths Expert (IITian)"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Avatar Image URL</Text>
                  <TextInput
                    value={t.avatar}
                    onChangeText={(val) => handleTeacherChange(idx, 'avatar', val)}
                    placeholder="Unsplash image URL"
                    style={styles.input}
                  />
                </View>
              ))}
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Feather name="save" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={[styles.saveBtnText, { fontFamily: Theme.fonts.poppinsBold }]}>
                    Save Configurations
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'center',
  },
  classSelectorCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
  },
  classRow: {
    paddingRight: 16,
  },
  classItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  classItemActive: {
    backgroundColor: '#E0F7F6',
    borderColor: '#00B6A6',
  },
  classText: {
    fontSize: 13,
    color: '#64748B',
  },
  classTextActive: {
    color: '#00B6A6',
  },
  loaderContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  formContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#334155',
  },
  teacherFormGroup: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FCFDFF',
  },
  teacherSubHeader: {
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#00B6A6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#00B6A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
