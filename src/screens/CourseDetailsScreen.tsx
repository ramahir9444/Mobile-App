import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

export const CourseDetailsScreen: React.FC = () => {
  const { navigateTo, goBack, selectedClass } = useApp();
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Finished'>('Scheduled');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const isScheduled = activeTab === 'Scheduled';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View className="flex-row items-center space-x-3.5">
          <TouchableOpacity onPress={() => showToast("Opening downloads...")} className="p-1">
            <Feather name="download" size={20} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showToast("Opening calendar schedule...")} className="p-1">
            <Feather name="calendar" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 bg-white"
      >
        {/* COURSE META SECTION */}
        <View className="px-5 pt-4 pb-5 border-b border-slate-50">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(21) }} className="text-slate-800 font-bold leading-tight">
            Bridge Course - {selectedClass}
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-600 mt-1.5">
            Concept Booster Course - 5X Efficient Learning Methods by IITians
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-1">
            6 Jul - 11 Jul
          </Text>

          {/* Teacher row and Contact Mentor */}
          <View className="flex-row justify-between items-center mt-5 pt-4 border-t border-slate-100/60">
            {/* Teacher avatars list */}
            <View className="flex-row items-center space-x-[-10px]">
              {['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'].map((av, id) => (
                <Image 
                  key={id}
                  source={{ uri: av }} 
                  className="w-7.5 h-7.5 rounded-full bg-slate-200 border-[2px] border-white shadow-sm"
                />
              ))}
            </View>

            {/* Whatsapp link */}
            <TouchableOpacity 
              onPress={() => showToast("Redirecting to WhatsApp Mentor support...")}
              className="flex-row items-center bg-slate-50 py-1.5 px-4 rounded-full border border-slate-100 active:bg-slate-100"
            >
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-slate-650 font-bold mr-1.5">
                Contact Mentor
              </Text>
              <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MID MODULE WIDGETS (Materials & Reports) */}
        <View className="flex-row justify-around py-5 border-b border-slate-100 bg-slate-50/30">
          {/* Materials Widget */}
          <TouchableOpacity 
            onPress={() => navigateTo('MATERIALS_MODULES')}
            className="items-center justify-center w-28"
          >
            <View className="relative">
              <MaterialCommunityIcons name="folder-text" size={34} color="#EA580C" />
              {/* Red dot */}
              <View className="w-2 h-2 rounded-full bg-red-500 absolute top-0 right-0 border border-white" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-700 font-bold mt-1.5">
              Materials
            </Text>
          </TouchableOpacity>

          {/* Reports Widget */}
          <TouchableOpacity 
            onPress={() => navigateTo('REPORT_PERIOD_SELECT')}
            className="items-center justify-center w-28"
          >
            <MaterialCommunityIcons name="clipboard-check" size={32} color="#D97706" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-700 font-bold mt-1.5">
              Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* DETAILS SECTION SUB-TABS */}
        <View className="flex-row border-b border-slate-100">
          {/* Scheduled Tab */}
          <TouchableOpacity 
            onPress={() => setActiveTab('Scheduled')} 
            className="flex-1 py-3.5 items-center justify-center relative"
          >
            <Text 
              style={{ 
                fontFamily: isScheduled ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                fontSize: getFontSize(13.5)
              }} 
              className={isScheduled ? 'text-slate-800 font-bold' : 'text-slate-400'}
            >
              Scheduled
            </Text>
            {isScheduled && <View className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900 rounded-t-full" />}
          </TouchableOpacity>

          {/* Finished Tab */}
          <TouchableOpacity 
            onPress={() => setActiveTab('Finished')} 
            className="flex-1 py-3.5 items-center justify-center relative"
          >
            <Text 
              style={{ 
                fontFamily: !isScheduled ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                fontSize: getFontSize(13.5)
              }} 
              className={!isScheduled ? 'text-slate-800 font-bold' : 'text-slate-400'}
            >
              Finished
            </Text>
            {!isScheduled && <View className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900 rounded-t-full" />}
          </TouchableOpacity>
        </View>

        {/* TAB DETAILS VIEW CONTENT */}
        <View className="bg-slate-50/50 flex-1 px-4 pt-4">
          {isScheduled ? (
            /* SCHEDULED LIST */
            <View className="space-y-6">
              {/* 6 Jul, Mon */}
              <View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold mb-3 pl-1">
                  6 Jul, Mon
                </Text>

                {/* Card */}
                <TouchableOpacity 
                  onPress={() => navigateTo('CLASS_DETAILS')}
                  className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm flex-row justify-between active:opacity-95"
                >
                  <View className="flex-1 pr-3 justify-between">
                    <View>
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-850 font-bold leading-snug">
                        Beyond Zero : The World of Integers with Ninja Mam!
                      </Text>
                      <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">Maths</Text>
                      </View>
                    </View>
                    
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-[#FF5E00] font-bold mt-4">
                      8:10 pm - 9:10 pm
                    </Text>
                  </View>

                  <View className="items-end justify-between">
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' }} 
                      className="w-14 h-14 rounded-full bg-slate-200"
                    />
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        showToast("Entering Live interactive Class...");
                      }}
                      className="bg-[#00B6A6] py-1 px-3.5 rounded-full active:bg-teal-650 mt-3"
                    >
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-white font-bold">Join Class</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 7 Jul, Tue */}
              <View className="space-y-4">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold pl-1">
                  7 Jul, Tue
                </Text>

                {/* Card 1: Vedic Maths */}
                <View className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm flex-row justify-between">
                  <View className="flex-1 pr-3 justify-between">
                    <View>
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-850 font-bold leading-snug">
                        Vedic Maths !!
                      </Text>
                      <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">Maths</Text>
                      </View>
                    </View>
                    
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-500 mt-4">
                      5:30 pm - 6:00 pm
                    </Text>
                  </View>

                  <View className="items-end justify-between">
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }} 
                      className="w-14 h-14 rounded-full bg-slate-200"
                    />
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-450 italic mt-3">
                      Not Started
                    </Text>
                  </View>
                </View>

                {/* Card 2: PTM */}
                <View className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm flex-row justify-between">
                  <View className="flex-1 pr-3 justify-between">
                    <View>
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-855 font-bold leading-snug">
                        PTM : Join with Parents for Surprise{"\n"}Olympiad Level Mastery With Ninja Mam!
                      </Text>
                      <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">Maths</Text>
                      </View>
                    </View>
                    
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-500 mt-4">
                      8:10 pm - 9:10 pm
                    </Text>
                  </View>

                  <View className="items-end justify-between">
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' }} 
                      className="w-14 h-14 rounded-full bg-slate-200"
                    />
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-455 italic mt-3">
                      Not Started
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* FINISHED LIST */
            <View className="space-y-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold pl-1 mb-2">
                29 Jun, Mon
              </Text>

              {/* Finished Card: Welcome Test */}
              <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold">
                  Welcome Test
                </Text>
                
                <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">Test</Text>
                </View>

                <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-slate-55">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-505 text-xs font-medium">
                    30 minutes
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigateTo('TEST_REPORT')}
                    className="bg-[#E0F7F6] py-1 px-4.5 rounded-full active:bg-[#B2DFDB]"
                  >
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-[#00B6A6] font-bold">
                      View Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Watermark divider */}
              <View className="items-center py-6 opacity-30">
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10) }} className="text-slate-400">
                  — Oda Class —
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-10 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-white font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}
    </SafeAreaView>
  );
};
