import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  StyleSheet, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const { goBack, navigateTo, selectedClass, authPhone, resetUser } = useApp();
  const [voiceReminder, setVoiceReminder] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleLogout = () => {
    resetUser();
    navigateTo('LOGIN');
  };

  const displayPhone = authPhone || '9974483435';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold }}
          className="text-slate-800 text-[18px] font-bold text-center flex-1 mr-6"
        >
          Profile
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-white"
      >
        {/* LIST OF PROFILE DETAILS */}
        <View className="px-5 pt-3">
          {/* Photo */}
          <TouchableOpacity 
            onPress={() => showToast("Edit Photo clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Photo
            </Text>
            <View className="flex-row items-center">
              {/* Circular teal avatar with mortarboard */}
              <View className="w-10 h-10 rounded-full bg-[#E0F7F6] items-center justify-center border border-[#B2DFDB] mr-2 relative">
                <MaterialCommunityIcons name="school" size={20} color="#00B6A6" />
                {/* Notification dot next to photo */}
                <View className="absolute top-0 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF5E00]" />
              </View>
              <Feather name="chevron-right" size={16} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <TouchableOpacity 
            onPress={() => showToast("Edit Name clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Name
            </Text>
            <View className="flex-row items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsRegular }} className="text-slate-400 text-sm mr-2">
                Ram
              </Text>
              <Feather name="chevron-right" size={16} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          {/* Class */}
          <TouchableOpacity 
            onPress={() => showToast("Edit Class clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Class
            </Text>
            <View className="flex-row items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsRegular }} className="text-slate-400 text-sm mr-2">
                {selectedClass}
              </Text>
              <Feather name="chevron-right" size={16} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity 
            onPress={() => showToast("Phone settings clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Phone
            </Text>
            <View className="flex-row items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsRegular }} className="text-slate-400 text-sm mr-2">
                {displayPhone}
              </Text>
              <Feather name="chevron-right" size={16} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          {/* Alternate Number */}
          <TouchableOpacity 
            onPress={() => showToast("Add alternate number clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Alternate Number
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Board */}
          <TouchableOpacity 
            onPress={() => showToast("Select Board clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Board
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* State */}
          <TouchableOpacity 
            onPress={() => showToast("Select State clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              State
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity 
            onPress={() => showToast("Edit Email clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Email
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity 
            onPress={() => showToast("Edit Address clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Address
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity 
            onPress={() => showToast("Request account deletion clicked")}
            className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-800 text-[15px] font-medium">
              Delete Account
            </Text>
            <Feather name="chevron-right" size={16} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* VOICE REMINDER TOGGLE */}
        <View className="flex-row items-center justify-between px-5 py-5 mt-4 border-b border-slate-100/60 bg-white">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-850 text-[15px] font-medium">
            Course Voice Reminder
          </Text>
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

        {/* LOG OUT BUTTON */}
        <View className="px-5 mt-10">
          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutBtn}
            className="w-full py-3.5 rounded-xl items-center justify-center active:scale-[0.98]"
          >
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-700 text-base font-bold"
            >
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-10 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-white text-[11px] font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  logoutBtn: {
    backgroundColor: '#F1F5F9',
  }
});
