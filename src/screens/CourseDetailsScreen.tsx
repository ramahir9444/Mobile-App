import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getAvatarUrl, updateScheduleStatus } from '../services/api';

const { width } = Dimensions.get('window');

const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

export const CourseDetailsScreen: React.FC = () => {
  const { navigateTo, goBack, setActiveClassSchedule, activeCourseClass, activeCourseType, user, homeworkSubmissions, refreshHomeworkSubmissions } = useApp();
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Finished' | 'Pending HW'>('Scheduled');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/schedules`);
        const json = await res.json();
        if (json.success && json.data) {
          const filtered = json.data.filter((s: any) => 
            s.gradeClass === activeCourseClass && 
            s.courseType === activeCourseType
          );
          setSchedules(filtered);
        }
      } catch (err) {
        console.error('Failed to load schedules in student app:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
    // Also refresh homework submissions from DB on every mount
    if (user.phone) refreshHomeworkSubmissions(user.phone);
  }, [activeCourseClass, activeCourseType]);

  const isScheduled = activeTab === 'Scheduled';
  const isFinished = activeTab === 'Finished';
  const isPendingHw = activeTab === 'Pending HW';

  const scheduledList = schedules.filter((s: any) => s.status === 'Scheduled');
  const finishedList = schedules.filter((s: any) => s.status === 'Finished');

  const pendingHwList = schedules.filter((s: any) => {
    const hasHw = s.homework && s.homework.length > 0;
    if (!hasHw) return false;
    // Always check against DB-fetched homeworkSubmissions — accurate across app restarts
    const isSubmitted = homeworkSubmissions.some(
      (sub: any) => sub.scheduleId === s._id
    );
    return !isSubmitted;
  });

  // Group scheduled list by dateText
  const groupedScheduled: { [key: string]: any[] } = {};
  scheduledList.forEach(item => {
    if (!groupedScheduled[item.dateText]) {
      groupedScheduled[item.dateText] = [];
    }
    groupedScheduled[item.dateText].push(item);
  });

  // Group finished list by dateText
  const groupedFinished: { [key: string]: any[] } = {};
  finishedList.forEach(item => {
    if (!groupedFinished[item.dateText]) {
      groupedFinished[item.dateText] = [];
    }
    groupedFinished[item.dateText].push(item);
  });

  // Group pending HW list by dateText
  const groupedPendingHw: { [key: string]: any[] } = {};
  pendingHwList.forEach(item => {
    if (!groupedPendingHw[item.dateText]) {
      groupedPendingHw[item.dateText] = [];
    }
    groupedPendingHw[item.dateText].push(item);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View className="flex-row items-center space-x-3.5">
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
        <View className="px-5 pt-4 pb-5 border-b border-slate-55">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(21) }} className="text-slate-800 font-bold leading-tight">
            {activeCourseType === 'booster' ? 'Bridge Course' : 'Master Program'} - {activeCourseClass}
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-600 mt-1.5">
            {activeCourseType === 'booster' 
              ? 'Concept Booster Course - 5X Efficient Learning Methods by IITians' 
              : 'Long-Term Full Year Syllabus Program by Senior IITian Teachers'}
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-1">
            {activeCourseType === 'booster' 
              ? '6 Jul - 11 Jul' 
              : 'Full Year Academic Program (15 Jun - 6 Mar)'}
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
                fontFamily: isFinished ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                fontSize: getFontSize(13.5)
              }} 
              className={isFinished ? 'text-slate-800 font-bold' : 'text-slate-400'}
            >
              Finished
            </Text>
            {isFinished && <View className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900 rounded-t-full" />}
          </TouchableOpacity>

          {/* Pending HW Tab */}
          <TouchableOpacity 
            onPress={() => setActiveTab('Pending HW')} 
            className="flex-1 py-3.5 items-center justify-center relative"
          >
            <Text 
              style={{ 
                fontFamily: isPendingHw ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                fontSize: getFontSize(13.5)
              }} 
              className={isPendingHw ? 'text-slate-800 font-bold' : 'text-slate-400'}
            >
              Pending HW
            </Text>
            {isPendingHw && <View className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900 rounded-t-full" />}
          </TouchableOpacity>
        </View>

        {/* TAB DETAILS VIEW CONTENT */}
        <View className="bg-slate-50/50 flex-1 px-4 pt-4">
          {isScheduled ? (
            /* SCHEDULED LIST */
            <View className="space-y-6">
              {loading ? (
                <ActivityIndicator size="small" color="#00B6A6" style={{ marginTop: 20 }} />
              ) : Object.keys(groupedScheduled).length === 0 ? (
                <View className="items-center py-10">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs">No scheduled classes</Text>
                </View>
              ) : (
                Object.keys(groupedScheduled).map((date) => (
                  <View key={date} className="mb-4">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold mb-3 pl-1">
                      {date}
                    </Text>

                    {groupedScheduled[date].map((item: any) => (
                      <TouchableOpacity 
                        key={item._id}
                        onPress={() => {
                          setActiveClassSchedule(item);
                          navigateTo('CLASS_DETAILS');
                        }}
                        className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm flex-row justify-between active:opacity-95 mb-3"
                      >
                        <View className="flex-1 pr-3 justify-between">
                          <View>
                            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-850 font-bold leading-snug">
                              {item.title}
                            </Text>
                            <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">{item.subject}</Text>
                            </View>
                          </View>
                          
                          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-[#FF5E00] font-bold mt-4">
                            {item.time}
                          </Text>
                        </View>

                        <View className="items-end justify-between">
                          {item.teacherAvatar ? (
                            <Image 
                              source={{ uri: getAvatarUrl(item.teacherAvatar) || item.teacherAvatar }} 
                              className="w-14 h-14 rounded-full bg-slate-200"
                            />
                          ) : (
                            <View className="w-14 h-14 rounded-full bg-slate-200 items-center justify-center">
                              <Text>👩‍🏫</Text>
                            </View>
                          )}
                          <TouchableOpacity 
                            onPress={async (e) => {
                              e.stopPropagation();
                              showToast("Entering Live interactive Class...");
                              try {
                                await updateScheduleStatus(item._id, 'Finished');
                              } catch (err) {
                                console.error('Failed to update schedule status on Join Class:', err);
                              }
                            }}
                            className="bg-[#00B6A6] py-1 px-3.5 rounded-full active:bg-teal-650 mt-3"
                          >
                            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-white font-bold">Join Class</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </View>
          ) : isFinished ? (
            /* FINISHED LIST */
            <View className="space-y-4">
              {loading ? (
                <ActivityIndicator size="small" color="#00B6A6" style={{ marginTop: 20 }} />
              ) : Object.keys(groupedFinished).length === 0 ? (
                <View className="items-center py-10">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs">No finished classes</Text>
                </View>
              ) : (
                Object.keys(groupedFinished).map((date) => (
                  <View key={date} className="mb-4">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold pl-1 mb-2">
                      {date}
                    </Text>

                    {groupedFinished[date].map((item: any) => (
                      <TouchableOpacity 
                        key={item._id} 
                        onPress={() => {
                          setActiveClassSchedule(item);
                          navigateTo('CLASS_DETAILS');
                        }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3 active:opacity-95"
                      >
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold">
                          {item.title}
                        </Text>
                        
                        <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">{item.subject}</Text>
                        </View>

                        <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-slate-55">
                          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-505 text-xs font-medium">
                            {item.time}
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
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </View>
          ) : (
            /* PENDING HW LIST */
            <View className="space-y-4">
              {loading ? (
                <ActivityIndicator size="small" color="#00B6A6" style={{ marginTop: 20 }} />
              ) : Object.keys(groupedPendingHw).length === 0 ? (
                <View className="items-center py-14">
                  <Text style={{ fontSize: 40 }}>🎉</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-700 font-bold mt-3">All caught up!</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-400 mt-1 text-center px-6">No pending homework. Great work!</Text>
                </View>
              ) : (
                Object.keys(groupedPendingHw).map((date) => (
                  <View key={date} className="mb-4">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold pl-1 mb-2">
                      {date}
                    </Text>

                    {groupedPendingHw[date].map((item: any) => (
                      <TouchableOpacity
                        key={item._id}
                        onPress={() => {
                          setActiveClassSchedule(item);
                          navigateTo('CLASS_DETAILS');
                        }}
                        className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm mb-3 active:opacity-95"
                      >
                        {/* Pending badge */}
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="bg-orange-50 border border-orange-200 py-0.5 px-2.5 rounded-full self-start">
                            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-orange-500 font-bold">⏳ HW PENDING</Text>
                          </View>
                          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10) }} className="text-slate-400">
                            {item.homework?.length || 0} question{item.homework?.length !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-800 font-bold leading-snug">
                          {item.title}
                        </Text>

                        <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-[8.5px] uppercase font-bold">{item.subject}</Text>
                        </View>

                        <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-orange-50">
                          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-500">
                            {item.dateText} · {item.time}
                          </Text>
                          <View className="bg-orange-500 py-1.5 px-4 rounded-full">
                            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-white font-bold">Do HW →</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
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
