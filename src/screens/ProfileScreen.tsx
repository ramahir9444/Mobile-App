import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  StyleSheet, 
  Dimensions, 
  StatusBar,
  Image,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const getFontSize = (size: number) => size;

interface EditModalProps {
  visible: boolean;
  title: string;
  value: string;
  onSave: (val: string) => void;
  onClose: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  multiline?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ visible, title, value, onSave, onClose, keyboardType = 'default', multiline = false }) => {
  const [text, setText] = useState(value);

  React.useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={[styles.modalCancelText, { fontFamily: Theme.fonts.poppinsMedium }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontFamily: Theme.fonts.poppinsBold }]}>{title}</Text>
            <TouchableOpacity 
              onPress={() => { onSave(text); onClose(); }}
              style={styles.modalSaveBtn}
            >
              <Text style={[styles.modalSaveText, { fontFamily: Theme.fonts.poppinsBold }]}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.modalInputContainer}>
            <TextInput
              style={[styles.modalInput, { fontFamily: Theme.fonts.poppinsRegular, height: multiline ? 100 : 52 }]}
              value={text}
              onChangeText={setText}
              keyboardType={keyboardType}
              autoFocus
              multiline={multiline}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholder={`Enter ${title.toLowerCase()}`}
              placeholderTextColor="#CBD5E1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ProfileScreen: React.FC = () => {
  const { goBack, navigateTo, selectedClass, authPhone, resetUser } = useApp();

  const [voiceReminder, setVoiceReminder] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [name, setName] = useState('Ram');
  const [email, setEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [board, setBoard] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');

  // Edit modal state
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLogout = () => {
    resetUser();
    navigateTo('LOGIN');
  };

  const displayPhone = authPhone || '9974483435';

  // Photo picker — works on web, Android and iOS
  const handlePhotoPress = async () => {
    if (Platform.OS === 'web') {
      // On web, go straight to file picker (no camera access in browser)
      await launchGallery();
    } else {
      // Native: offer camera or gallery via Alert
      Alert.alert(
        'Profile Photo',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: launchCamera },
          { text: 'Choose from Gallery', onPress: launchGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { showToast('Camera permission denied'); return; }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProfilePhoto(result.assets[0].uri);
        showToast('Profile photo updated!');
      }
    } catch (e) {
      showToast('Could not open camera');
    }
  };

  const launchGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { showToast('Gallery permission denied'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProfilePhoto(result.assets[0].uri);
        showToast('Profile photo updated! ✓');
      }
    } catch (e) {
      showToast('Could not open gallery');
    }
  };

  // Open edit modal
  const openEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
  };

  const saveField = (field: string, val: string) => {
    switch (field) {
      case 'Name': setName(val); break;
      case 'Email': setEmail(val); break;
      case 'Alternate Number': setAltPhone(val); break;
      case 'Board': setBoard(val); break;
      case 'State': setState(val); break;
      case 'Address': setAddress(val); break;
    }
    showToast(`${field} updated successfully`);
  };

  const rows = [
    { label: 'Name', value: name, field: 'Name', keyboard: 'default' as const },
    { label: 'Class', value: selectedClass, field: null },
    { label: 'Phone', value: displayPhone, field: null },
    { label: 'Alternate Number', value: altPhone || 'Add number', field: 'Alternate Number', keyboard: 'phone-pad' as const },
    { label: 'Board', value: board || 'Select board', field: 'Board', keyboard: 'default' as const },
    { label: 'State', value: state || 'Select state', field: 'State', keyboard: 'default' as const },
    { label: 'Email', value: email || 'Add email', field: 'Email', keyboard: 'email-address' as const },
    { label: 'Address', value: address || 'Add address', field: 'Address', keyboard: 'default' as const, multiline: true },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
          My Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* PROFILE PHOTO CARD */}
        <View style={styles.photoCard}>
          {/* Avatar */}
          <TouchableOpacity onPress={handlePhotoPress} style={styles.avatarWrapper} activeOpacity={0.85}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="school" size={44} color="#00B6A6" />
              </View>
            )}
            {/* Edit badge */}
            <View style={styles.editBadge}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.photoName, { fontFamily: Theme.fonts.poppinsBold }]}>{name}</Text>
          <Text style={[styles.photoSubtitle, { fontFamily: Theme.fonts.poppinsMedium }]}>
            Class {selectedClass} · Student ID: 26394
          </Text>

          <TouchableOpacity onPress={handlePhotoPress} style={styles.changePhotoBtn} activeOpacity={0.8}>
            <Feather name="camera" size={14} color="#00B6A6" />
            <Text style={[styles.changePhotoText, { fontFamily: Theme.fonts.poppinsMedium }]}>
              {profilePhoto ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionLabel, { fontFamily: Theme.fonts.poppinsBold }]}>
            Personal Details
          </Text>

          {rows.map((row, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => row.field ? openEdit(row.field, row.value === `Add ${row.field.toLowerCase()}` || row.value === `Select ${row.field.toLowerCase()}` ? '' : row.value) : showToast(`${row.label} cannot be changed`)}
              style={[styles.row, idx === rows.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={row.field ? 0.7 : 1}
            >
              <Text style={[styles.rowLabel, { fontFamily: Theme.fonts.poppinsMedium }]}>
                {row.label}
              </Text>
              <View style={styles.rowRight}>
                <Text 
                  style={[
                    styles.rowValue, 
                    { fontFamily: Theme.fonts.poppinsRegular },
                    (!row.value || row.value.startsWith('Add') || row.value.startsWith('Select')) && styles.rowValuePlaceholder
                  ]}
                  numberOfLines={1}
                >
                  {row.value || `Add ${row.label.toLowerCase()}`}
                </Text>
                <Feather name="chevron-right" size={15} color={row.field ? "#CCCCCC" : "#E2E8F0"} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* VOICE REMINDER TOGGLE */}
        <View style={styles.toggleCard}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.toggleTitle, { fontFamily: Theme.fonts.poppinsMedium }]}>
              Course Voice Reminder
            </Text>
            <Text style={[styles.toggleSubtitle, { fontFamily: Theme.fonts.poppinsRegular }]}>
              Get voice alerts before each live class
            </Text>
          </View>
          <Switch 
            value={voiceReminder}
            onValueChange={(val) => {
              setVoiceReminder(val);
              showToast(`Voice reminder turned ${val ? 'ON' : 'OFF'}`);
            }}
            trackColor={{ false: '#E2E8F0', true: '#00B6A6' }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* LOG OUT */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <TouchableOpacity 
            onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', onPress: handleLogout }
            ])}
            style={styles.logoutBtn}
            activeOpacity={0.85}
          >
            <Feather name="log-out" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { fontFamily: Theme.fonts.poppinsBold }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      {editField && (
        <EditModal
          visible={!!editField}
          title={`Edit ${editField}`}
          value={editValue}
          onSave={(val) => saveField(editField, val)}
          onClose={() => setEditField(null)}
          keyboardType={rows.find(r => r.field === editField)?.keyboard || 'default'}
          multiline={rows.find(r => r.field === editField)?.multiline || false}
        />
      )}

      {/* TOAST */}
      {toastMessage && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={15} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={[styles.toastText, { fontFamily: Theme.fonts.poppinsMedium }]}>
            {toastMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#1E293B',
  },

  // Photo card
  photoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#E0F7F6',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F7F6',
    borderWidth: 3,
    borderColor: '#B2DFDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00B6A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoName: {
    fontSize: 22,
    color: '#1E293B',
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    backgroundColor: '#F0FDFB',
  },
  changePhotoText: {
    fontSize: 13,
    color: '#00B6A6',
    marginLeft: 6,
  },

  // Details section
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  rowValue: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 6,
    textAlign: 'right',
  },
  rowValuePlaceholder: {
    color: '#CBD5E1',
    fontStyle: 'italic',
  },

  // Toggle
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleTitle: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 3,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 15,
    color: '#64748B',
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCancelBtn: { padding: 4 },
  modalCancelText: { fontSize: 15, color: '#94A3B8' },
  modalTitle: { fontSize: 16, color: '#1E293B' },
  modalSaveBtn: { padding: 4 },
  modalSaveText: { fontSize: 15, color: '#00B6A6' },
  modalInputContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E0F7F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 15,
    color: '#1E293B',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
});
