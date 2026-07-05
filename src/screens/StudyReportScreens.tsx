import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StyleSheet, 
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

// ==========================================
// 1. REPORT PERIOD SELECT SCREEN
// ==========================================
export const ReportPeriodSelectScreen: React.FC = () => {
  const { navigateTo, goBack, setSelectedReportPeriod } = useApp();

  const periods = [
    { name: 'Daily', desc: 'Detailed view of your learning activity today', icon: 'calendar-clock' },
    { name: 'Weekly', desc: 'Detailed view of your learning activity this week', icon: 'calendar-today' },
    { name: 'Monthly', desc: 'Comprehensive recap of the past 30 days', icon: 'calendar-month' },
    { name: 'Quarterly', desc: 'Summary of performance metrics per term', icon: 'calendar-range' },
    { name: 'Yearly', desc: 'Annual benchmark report of learning progress', icon: 'calendar-star' }
  ];

  const handlePeriodSelect = (period: string) => {
    setSelectedReportPeriod(period);
    navigateTo('STUDY_REPORT');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          Select Report Period
        </Text>
      </View>

      <ScrollView className="flex-1 bg-white px-5 pt-6">
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold text-center mb-2">
          Study Performance Reports
        </Text>
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-400 text-center mb-8">
          Choose a timeframe to analyze your interactive quiz results, attendance durations, and learning stats.
        </Text>

        <View className="space-y-4">
          {periods.map((p) => (
            <TouchableOpacity 
              key={p.name}
              onPress={() => handlePeriodSelect(p.name)}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between active:bg-[#E0F7F6]/50 active:border-[#00B6A6]/30 shadow-sm"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-12 h-12 rounded-xl bg-white border border-slate-100 items-center justify-center mr-4">
                  <MaterialCommunityIcons name={p.icon as any} size={24} color="#00B6A6" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold">
                    {p.name} Report
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-0.5" numberOfLines={1}>
                    {p.desc}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 2. STUDY REPORT SCREEN (Detailed View)
// ==========================================
export const StudyReportScreen: React.FC = () => {
  const { goBack, selectedReportPeriod } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          {selectedReportPeriod} Study Report
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        className="flex-1"
      >
        {/* HERO BANNER SECTION - Styled like screenshot gradient top */}
        <View className="bg-white px-5 pt-6 pb-6 border-b border-slate-100">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              {/* Grand gradient title label */}
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsBold, 
                  fontSize: getFontSize(24),
                  color: '#4F46E5' // Rich Indigo/Purple color representing screenshot gradient
                }} 
                className="font-bold leading-tight"
              >
                {selectedReportPeriod} Study Report
              </Text>
              
              {/* Student info avatar row */}
              <View className="flex-row items-center mt-4">
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80' }} 
                  className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 mr-3"
                />
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold">
                    Ram
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-450 mt-0.5">
                    6 Jul - 4 Jul
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* OVERALL PROGRESS SECTION */}
        <View className="px-5 mt-6">
          {/* Header title with custom colored underline decoration */}
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-805 font-bold leading-none">
              Overall Progress
            </Text>
            {/* Horizontal custom colored line */}
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-green-500" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          {/* RADAR CHART CONTAINER */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-center">
            {/* Vector Pentagon Layout Mock */}
            <View className="w-48 h-48 items-center justify-center relative my-4">
              {/* Circular axis backgrounds (3 concentric circles representing radar levels) */}
              <View className="w-44 h-44 rounded-full border border-slate-100 absolute items-center justify-center" />
              <View className="w-32 h-32 rounded-full border border-slate-100 absolute items-center justify-center" />
              <View className="w-20 h-20 rounded-full border border-slate-100 absolute items-center justify-center" />
              
              {/* Axes lines intersecting */}
              <View className="w-[1px] h-44 bg-slate-100 absolute" />
              <View className="w-44 h-[1px] bg-slate-100 absolute" />

              {/* Pentagon core layout labels */}
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }} className="text-slate-500 absolute top-[-10] text-center font-bold">
                Topic-Solving Skills
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }} className="text-slate-500 absolute right-[-45] w-20 text-left font-bold">
                Hard-level{"\n"}Solving Skills
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }} className="text-slate-500 absolute bottom-[-10] w-24 text-center font-bold">
                Knowledge{"\n"}Consolidation Ability
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }} className="text-slate-500 absolute left-[-45] w-20 text-right font-bold">
                Learning{"\n"}Enthusiasm
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }} className="text-slate-500 absolute left-[-45] top-12 w-20 text-right font-bold">
                Learning{"\n"}Engagement
              </Text>

              {/* Custom Polygon plot inside radar */}
              <View className="w-8 h-8 rounded-full bg-[#00B6A6]/20 border-2 border-[#00B6A6] items-center justify-center absolute">
                {/* My Performance Dot */}
                <View className="w-2 h-2 rounded-full bg-[#00B6A6]" />
              </View>
            </View>

            {/* Radar chart legends */}
            <View className="flex-row items-center justify-center mt-4 space-x-5">
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-400 font-medium">
                  Class Average Data
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-400 font-medium">
                  My Performance
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FEEDBACK LIST SECTION */}
        <View className="px-5 mt-5 space-y-3.5">
          {/* Card 1 */}
          <View className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4.5 flex-row items-center shadow-sm">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Feather name="thumbs-up" size={17} color="#2563EB" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              Consistent improvement evident in quiz and homework accuracy.
            </Text>
          </View>

          {/* Card 2 */}
          <View className="bg-[#ECFDF5] border border-green-100 rounded-2xl p-4.5 flex-row items-center shadow-sm">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
              <Feather name="trending-up" size={17} color="#059669" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              Strong potential shown with steady engagement and participation.
            </Text>
          </View>
        </View>

        {/* ACCURACY & ATTENDANCE DETAILS SECTION */}
        <View className="px-5 mt-6">
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-805 font-bold leading-none">
              Accuracy & Class Status
            </Text>
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-[#00B6A6]" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
            {/* 1. Quiz Accuracy & Homework Accuracy */}
            <View className="flex-row justify-between items-center">
              {/* Quiz Accuracy circular indicator */}
              <View className="flex-1 items-center bg-[#F8FAFC] py-3.5 px-4 rounded-xl border border-slate-100 mr-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(20) }} className="text-[#00B6A6] font-bold">
                  85%
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  Quiz Accuracy
                </Text>
              </View>

              {/* Homework Accuracy circular indicator */}
              <View className="flex-1 items-center bg-[#F8FAFC] py-3.5 px-4 rounded-xl border border-slate-100 ml-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(20) }} className="text-indigo-650 font-bold">
                  90%
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-slate-400 font-bold mt-1 uppercase tracking-wider text-center">
                  Homework Acc.
                </Text>
              </View>
            </View>

            {/* 2. Minutes Attended Progress Bar */}
            <View className="bg-[#F8FAFC] p-4.5 rounded-xl border border-slate-100">
              <View className="flex-row justify-between items-baseline mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-700 font-bold">
                  Class Minutes Attended
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">
                  120 <Text className="text-slate-400 font-normal">/ 180 mins</Text>
                </Text>
              </View>
              {/* Progress Line */}
              <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-teal-500 rounded-full" style={{ width: '66%' }} />
              </View>
            </View>

            {/* 3. Lecture Attended Progress Bar */}
            <View className="bg-[#F8FAFC] p-4.5 rounded-xl border border-slate-100">
              <View className="flex-row justify-between items-baseline mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-700 font-bold">
                  Lectures Attended
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">
                  2 <Text className="text-slate-400 font-normal">/ 3 lectures</Text>
                </Text>
              </View>
              {/* Progress Line */}
              <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-indigo-500 rounded-full" style={{ width: '66%' }} />
              </View>
            </View>
          </View>
        </View>

        {/* STUDY OUTCOMES SECTION */}
        <View className="px-5 mt-7">
          {/* Header title with custom colored underline decoration */}
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-805 font-bold leading-none">
              Study Outcomes
            </Text>
            {/* Horizontal custom colored line */}
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-green-500" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          {/* Outocmes Grid Row */}
          <View className="flex-row gap-3.5 mb-4">
            {/* Strong topics */}
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-green-550 font-bold">
                  0
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-400 font-bold">
                Strong Topics
              </Text>
            </View>

            {/* Weak topics */}
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-orange-550 font-bold">
                  0
                </Text>
                <Ionicons name="warning" size={18} color="#F59E0B" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-400 font-bold">
                Weak Topics
              </Text>
            </View>
          </View>

          {/* Study Attendance card */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-700 font-bold">
              Total Study Attendance
            </Text>
            <View className="flex-row items-baseline mt-2">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(28) }} className="text-orange-500 font-bold">
                0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-400 font-medium ml-1">
                mins
              </Text>
            </View>
          </View>
        </View>

        {/* STUDY ATTITUDE SECTION */}
        <View className="px-5 mt-4">
          {/* Header title with custom colored underline decoration */}
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-805 font-bold leading-none">
              Study Attitude
            </Text>
            {/* Horizontal custom colored line */}
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-green-500" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          {/* Grid of 4 items */}
          <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-6">
            {/* 1. Total Coins */}
            <View className="w-[48%] bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm items-center">
              <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mb-2">
                <Ionicons name="logo-yen" size={17} color="#EAB308" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold">
                x0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Total Coins
              </Text>
            </View>

            {/* 2. Badge Winner */}
            <View className="w-[48%] bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm items-center">
              <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mb-2">
                <Ionicons name="ribbon-outline" size={18} color="#FF6600" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold">
                x0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Badge Winner
              </Text>
            </View>

            {/* 3. Teacher Praised */}
            <View className="w-[48%] bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm items-center">
              <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mb-2">
                <Feather name="thumbs-up" size={17} color="#EAB308" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold">
                x0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Teacher Praised
              </Text>
            </View>

            {/* 4. Interaction Times */}
            <View className="w-[48%] bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm items-center">
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mb-2">
                <Feather name="message-square" size={16} color="#D97706" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold">
                x0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Interaction Times
              </Text>
            </View>
          </View>

          {/* Feedback card below grid */}
          <View className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4.5 flex-row items-center shadow-sm mb-8">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Feather name="thumbs-up" size={17} color="#2563EB" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              Stay engaged in the course to ensure you grasp all critical information.
            </Text>
          </View>

          {/* Footer watermarks */}
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 text-center italic mt-2">
            Better Teacher, Better Future
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-300 text-center mt-3 tracking-widest uppercase">
            — oda class —
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
