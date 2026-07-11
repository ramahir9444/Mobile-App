import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { API_BASE } from '../services/api';

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
  const { goBack, selectedReportPeriod, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Check if welcome test was completed within last 30 days
  const welcomeTestResult = user?.welcomeTestResult;
  const showWelcomeTestCard = user?.welcomeTestStatus === 'completed' && welcomeTestResult?.submittedAt
    ? (new Date().getTime() - new Date(welcomeTestResult.submittedAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/students/${user.phone}/analytics?period=${selectedReportPeriod}`);
        const json = await res.json();
        if (active && json.success) {
          setAnalytics(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch study analytics:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { active = false; };
  }, [selectedReportPeriod, user?.phone]);

  const getDateRangeText = () => {
    switch (selectedReportPeriod) {
      case 'Daily': return 'Today';
      case 'Weekly': return 'Past 7 Days';
      case 'Monthly': return 'Past 30 Days';
      case 'Quarterly': return 'Past 90 Days';
      case 'Yearly': return 'Past 365 Days';
      default: return 'Past 30 Days';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
          <TouchableOpacity onPress={goBack} className="p-1">
            <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
            {selectedReportPeriod} Study Report
          </Text>
        </View>
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#00B6A6" />
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13.5) }} className="text-slate-500 mt-3">
            Generating your study performance report...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const data = analytics || {
    attendancePercentage: 100,
    learningTimeMinutes: 30,
    expectedLearningMinutes: 45,
    lecturesAttended: 1,
    totalExpectedLectures: 1,
    quizAccuracy: 80,
    homeworkAccuracy: 85,
    totalCoins: 1000,
    badgeWinnerCount: 1,
    badges: ['Curious Learner'],
    teacherPraisedCount: 0,
    interactionTimes: 2,
    strongTopics: ['Fractions'],
    weakTopics: ['Equations'],
    aiLearningScore: 82,
    consistencyLevel: 'Consistent'
  };

  // Calculate coordinates for the radar dot based on AI learning score
  const scoreRatio = Math.max(0.2, Math.min(1, data.aiLearningScore / 100));
  const dotOffset = 88 * scoreRatio; // 88px is the outer circle radius (half of w-44)

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
        {/* HERO BANNER SECTION */}
        <View className="bg-white px-5 pt-6 pb-6 border-b border-slate-100">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsBold, 
                  fontSize: getFontSize(24),
                  color: '#4F46E5'
                }} 
                className="font-bold leading-tight"
              >
                {selectedReportPeriod} Study Report
              </Text>
              
              <View className="flex-row items-center mt-4">
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80' }} 
                  className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 mr-3"
                />
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold">
                    {user?.name || 'Student'}
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-0.5">
                    {getDateRangeText()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* OVERALL PROGRESS SECTION */}
        <View className="px-5 mt-6">
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold leading-none">
              Overall Progress
            </Text>
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-green-500" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          {/* RADAR CHART CONTAINER */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-center">
            <View className="w-48 h-48 items-center justify-center relative my-4">
              <View className="w-44 h-44 rounded-full border border-slate-100 absolute items-center justify-center" />
              <View className="w-32 h-32 rounded-full border border-slate-100 absolute items-center justify-center" />
              <View className="w-20 h-20 rounded-full border border-slate-100 absolute items-center justify-center" />
              
              <View className="w-[1px] h-44 bg-slate-100 absolute" />
              <View className="w-44 h-[1px] bg-slate-100 absolute" />

              {/* Pentagon core layout labels */}
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-500 absolute top-[-10] text-center font-bold">
                Topic-Solving ({data.quizAccuracy}%)
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-500 absolute right-[-45] w-20 text-left font-bold">
                AI Index ({data.aiLearningScore}%)
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-500 absolute bottom-[-10] w-24 text-center font-bold">
                Homework ({data.homeworkAccuracy}%)
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-500 absolute left-[-45] top-12 w-20 text-right font-bold">
                Enthusiasm ({Math.min(100, data.interactionTimes * 10)}%)
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-500 absolute left-[-45] bottom-12 w-20 text-right font-bold">
                Engagement ({data.attendancePercentage}%)
              </Text>

              {/* Dynamic Positioned Dot based on AI Learning Score */}
              <View 
                style={{ 
                  transform: [{ translateY: -dotOffset * 0.4 }, { translateX: dotOffset * 0.4 }],
                  zIndex: 10
                }}
                className="w-8 h-8 rounded-full bg-[#00B6A6]/20 border-2 border-[#00B6A6] items-center justify-center absolute"
              >
                <View className="w-2 h-2 rounded-full bg-[#00B6A6]" />
              </View>
            </View>

            <View className="flex-row items-center justify-center mt-4 space-x-5">
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-400 font-medium">
                  Class Average (75%)
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#00B6A6] mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-400 font-medium">
                  My Performance
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FEEDBACK LIST SECTION */}
        <View className="px-5 mt-5 space-y-3.5">
          <View className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4.5 flex-row items-center shadow-sm">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Feather name="thumbs-up" size={17} color="#2563EB" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              {data.aiLearningScore >= 85 
                ? 'Outstanding learning efficiency! You are grasping concepts exceptionally well.' 
                : 'Consistent improvement is evident in your study and homework analytics.'}
            </Text>
          </View>

          <View className="bg-[#ECFDF5] border border-green-100 rounded-2xl p-4.5 flex-row items-center shadow-sm">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
              <Feather name="trending-up" size={17} color="#059669" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              Learning Consistency: <Text className="font-bold text-[#059669]">{data.consistencyLevel}</Text> · {data.interactionTimes} interactive actions recorded.
            </Text>
          </View>
        </View>

        {/* ACCURACY & ATTENDANCE DETAILS SECTION */}
        <View className="px-5 mt-6">
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold leading-none">
              Accuracy & Class Status
            </Text>
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-[#00B6A6]" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
            {/* Quiz & Homework Accuracy Indicators */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 items-center bg-[#F8FAFC] py-3.5 px-4 rounded-xl border border-slate-100 mr-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(20) }} className="text-[#00B6A6] font-bold">
                  {data.quizAccuracy}%
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  Quiz Accuracy
                </Text>
              </View>

              <View className="flex-1 items-center bg-[#F8FAFC] py-3.5 px-4 rounded-xl border border-slate-100 ml-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(20) }} className="text-indigo-650 font-bold">
                  {data.homeworkAccuracy}%
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }} className="text-slate-400 font-bold mt-1 uppercase tracking-wider text-center">
                  Homework Acc.
                </Text>
              </View>
            </View>

            {/* Class Minutes Attended */}
            <View className="bg-[#F8FAFC] p-4.5 rounded-xl border border-slate-100">
              <View className="flex-row justify-between items-baseline mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-700 font-bold">
                  Class Minutes Attended
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">
                  {data.learningTimeMinutes} <Text className="text-slate-400 font-normal">/ {data.expectedLearningMinutes} mins</Text>
                </Text>
              </View>
              <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-teal-500 rounded-full" style={{ width: `${data.attendancePercentage}%` }} />
              </View>
            </View>

            {/* Lectures Attended */}
            <View className="bg-[#F8FAFC] p-4.5 rounded-xl border border-slate-100">
              <View className="flex-row justify-between items-baseline mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-700 font-bold">
                  Lectures Attended
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">
                  {data.lecturesAttended} <Text className="text-slate-400 font-normal">/ {data.totalExpectedLectures} lectures</Text>
                </Text>
              </View>
              <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.round((data.lecturesAttended / data.totalExpectedLectures) * 100) || 0}%` }} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* STUDY OUTCOMES SECTION */}
        <View className="px-5 mt-7">
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold leading-none">
              Study Outcomes
            </Text>
            <View className="flex-row h-1 w-28 rounded-full overflow-hidden mt-1.5">
              <View className="w-1/2 bg-green-500" />
              <View className="w-1/2 bg-orange-400" />
            </View>
          </View>

          <View className="flex-row gap-3.5 mb-4">
            {/* Strong Topics */}
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm justify-between">
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-green-550 font-bold">
                    {data.strongTopics.length}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-500 font-bold mb-2">
                  Strong Topics
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1">
                {data.strongTopics.map((topic: string, i: number) => (
                  <View key={i} className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-emerald-700 font-bold">{topic}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Weak Topics */}
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm justify-between">
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-orange-550 font-bold">
                    {data.weakTopics.length}
                  </Text>
                  <Ionicons name="warning" size={18} color="#F59E0B" />
                </View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-500 font-bold mb-2">
                  Weak Topics
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1">
                {data.weakTopics.map((topic: string, i: number) => (
                  <View key={i} className="bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-amber-700 font-bold">{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Study Attendance card */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-700 font-bold">
              Total Study Attendance
            </Text>
            <View className="flex-row items-baseline mt-2">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(28) }} className="text-[#00B6A6] font-bold">
                {data.learningTimeMinutes}
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-450 font-medium ml-1">
                mins
              </Text>
            </View>
          </View>
        </View>

        {/* STUDY ATTITUDE SECTION */}
        <View className="px-5 mt-4">
          <View className="items-start mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold leading-none">
              Study Attitude
            </Text>
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
                x{data.totalCoins}
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
                x{data.badgeWinnerCount}
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Badge Winner
              </Text>
            </View>

            {/* 3. Teacher Praised */}
            <View className="w-[48%] bg-white rounded-2xl p-4.5 border border-slate-100 shadow-sm items-center">
              <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mb-2">
                <Feather name="award" size={17} color="#6366F1" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold">
                x{data.teacherPraisedCount}
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
                x{data.interactionTimes}
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-0.5">
                Interaction Times
              </Text>
            </View>
          </View>

          {/* Badges won listing card */}
          {data.badges && data.badges.length > 0 && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5), color: '#334155' }} className="font-bold mb-3">
                🏆 Earned Badges
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {data.badges.map((badge: string, i: number) => (
                  <View key={i} className="flex-row items-center bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <Ionicons name="ribbon" size={13} color="#EAB308" style={{ marginRight: 4 }} />
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11), color: '#B45309' }}>
                      {badge}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Feedback card below grid */}
          <View className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4.5 flex-row items-center shadow-sm mb-8">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Feather name="smile" size={17} color="#2563EB" />
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-700 leading-normal flex-1 font-medium">
              {data.aiLearningScore >= 80
                ? 'Your active learning attitude and classroom interactions demonstrate excellent engagement.'
                : 'Raise your hand and join the stage in future live classes to interact directly with the teacher!'}
            </Text>
          </View>

          {/* Welcome Test Result Card */}
          {showWelcomeTestCard && (
            <View style={{ marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#A7F3D0' }}>
              <View style={{ backgroundColor: '#ECFDF5', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Feather name="award" size={17} color="#059669" />
                  </View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14), color: '#065F46' }}>
                    Welcome Test Result
                  </Text>
                </View>
                <View style={{ backgroundColor: '#D1FAE5', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 }}>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10), color: '#059669' }}>COMPLETED</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(32), color: '#059669' }}>
                    {welcomeTestResult?.score ?? 0}
                    <Text style={{ fontSize: getFontSize(18), color: '#9CA3AF' }}>/10</Text>
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11), color: '#6B7280' }}>Score</Text>
                </View>
                <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(32), color: '#1E293B' }}>
                    {(() => {
                      const s = welcomeTestResult?.score ?? 0;
                      if (s >= 9) return 'A';
                      if (s >= 8) return 'B';
                      if (s >= 6) return 'C';
                      if (s >= 4) return 'D';
                      return 'E';
                    })()}
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11), color: '#6B7280' }}>Grade</Text>
                </View>
                <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11), color: '#6B7280' }}>
                    {welcomeTestResult?.submittedAt
                      ? new Date(welcomeTestResult.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                      : '--'}
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10), color: '#9CA3AF', marginTop: 2 }}>Submitted</Text>
                </View>
              </View>
            </View>
          )}

          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 text-center italic mt-2">
            Better Teacher, Better Future
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-300 text-center mt-3 tracking-widest uppercase">
            — ODA CLASS —
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
