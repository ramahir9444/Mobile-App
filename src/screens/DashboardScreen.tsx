import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Dimensions, 
  StatusBar,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

const CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3',
  'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9',
  'Class 10', 'Class 11'
];

export const DashboardScreen: React.FC = () => {
  const { 
    navigateTo, 
    selectedClass, 
    setSelectedClass, 
    hasSeenPopup, 
    setHasSeenPopup, 
    isEnrolled, 
    setIsEnrolled,
    activeTab,
    setActiveTab
  } = useApp();
  const [isClassSheetVisible, setIsClassSheetVisible] = useState<boolean>(false);
  const [studyTab, setStudyTab] = useState<'Bridge' | 'All'>('Bridge');

  // Pop-up states (Show only once per app session using context)
  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(!hasSeenPopup);
  const popupScale = useState(new Animated.Value(0.85))[0];
  const popupFade = useState(new Animated.Value(0))[0];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPopupVisible) {
      Animated.parallel([
        Animated.spring(popupScale, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true
        }),
        Animated.timing(popupFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isPopupVisible]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setIsClassSheetVisible(false);
    showToast(`Selected ${className}`);
  };

  const closePopup = () => {
    Animated.parallel([
      Animated.timing(popupScale, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(popupFade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsPopupVisible(false);
      setHasSeenPopup(true); // Persist to session context
    });
  };

  const classNumber = parseInt(selectedClass.replace('Class ', '')) || 1;
  const isOlderClass = classNumber >= 8;

  const bannerText = isOlderClass 
    ? "Most Pioneer LIVE Learning Platform" 
    : "Best with 20 Million Users' Trust";

  // HOME SCREEN LAYOUT
  const renderHomeScreen = () => {
    return (
      <View style={{ flex: 1 }}>
        {/* TOP HEADER */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2 bg-[#F8FAFC]">
          <TouchableOpacity 
            onPress={() => setIsClassSheetVisible(true)}
            className="flex-row items-center py-1 rounded-lg"
          >
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(25) }}
              className="text-[#1E293B] font-bold mr-1.5"
            >
              {selectedClass}
            </Text>
            <Feather name="chevron-down" size={24} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 130 }}
          className="flex-1 bg-[#F8FAFC]"
        >
          {/* BRAND BANNER */}
          <TouchableOpacity 
            onPress={() => navigateTo('WHY_ODA')}
            style={styles.bannerContainer}
            className="mx-5 my-3 px-4 py-3.5 rounded-2xl flex-row items-center justify-between relative overflow-hidden"
          >
            <View style={styles.bannerGridOverlay} pointerEvents="none" />
            
            <View className="flex-1 z-10">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }}
                className="text-[#DF2C2C] font-bold tracking-wide"
              >
                Why Oda Class
              </Text>
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }}
                className="text-[#DF2C2C] font-semibold mt-0.5"
              >
                {bannerText}
              </Text>
            </View>
            <View className="flex-row items-center z-10 ml-2">
              <Feather name="chevrons-right" size={20} color="#FDA4AF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* 6-DAY HEAD START COURSE CARD */}
          <View className="mt-4 px-5 mb-5">
            <View className="mb-3">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(19) }}
                className="text-slate-900 font-bold tracking-tight"
              >
                6-Day Head Start Course
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }}
                  className="text-[#FF6600] font-bold"
                >
                  IIT/NIT Premium BootCamp
                </Text>
                <Text className="ml-1 text-[12px]">🔥</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => navigateTo('BOOSTER_DETAILS')}
              style={styles.courseCard} 
              className="bg-white rounded-2xl overflow-hidden active:opacity-95"
            >
              {/* Top Beige Container */}
              <View className="bg-[#FAF2EE] px-4 py-4 flex-row justify-between items-center relative">
                <View className="flex-1 z-10 pr-2">
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
                    className="text-[#7C2D12] font-bold leading-tight"
                  >
                    Maximize Your Child's{"\n"}Potential 100%
                  </Text>
                </View>

                {/* Teacher Avatars */}
                <View className="flex-row items-center space-x-[-12px] z-10">
                  <View className="border-[2.5px] border-white rounded-full overflow-hidden shadow-sm">
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' }} 
                      className="w-12 h-12 bg-slate-200"
                    />
                  </View>
                  <View className="border-[2.5px] border-white rounded-full overflow-hidden shadow-sm">
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }} 
                      className="w-12 h-12 bg-slate-200"
                    />
                  </View>
                </View>
              </View>

              {/* Three sub-badges */}
              <View className="flex-row flex-wrap items-center mt-3 px-4 gap-1.5">
                <View className="bg-[#F8FAFC] py-0.5 px-2 rounded-full border border-slate-200 flex-row items-center">
                  <Text className="text-[10px] mr-1">🎓</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9) }} className="text-[#475569] font-medium">IIT/NIT</Text>
                </View>
                <View className="bg-[#F8FAFC] py-0.5 px-2 rounded-full border border-slate-200 flex-row items-center">
                  <Text className="text-[10px] mr-1">⭐</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9) }} className="text-[#475569] font-medium">98% Good Rate</Text>
                </View>
                <View className="bg-[#F8FAFC] py-0.5 px-2 rounded-full border border-slate-200 flex-row items-center">
                  <Text className="text-[10px] mr-1">🏆</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9) }} className="text-[#475569] font-medium">5+ Years Teaching</Text>
                </View>
              </View>

              {/* Course Title and details */}
              <View className="p-4 pt-3">
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
                  className="text-slate-800 font-bold leading-snug"
                >
                  Concept Booster Course - 5X Efficient Learning Methods by IITians
                </Text>

                {/* Subject Boxes */}
                <View className="flex-row flex-wrap items-center mt-2.5 gap-1.5">
                  {['Maths', 'Science', 'English'].map((sub, idx) => (
                    <View key={idx} className="border border-slate-200 rounded-md px-2 py-0.5 bg-slate-50">
                      <Text 
                        style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(10) }}
                        className="text-slate-500"
                      >
                        {sub}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="w-full h-[1px] bg-slate-100 my-3.5" />

                {/* Pricing & CTA Row */}
                <View className="flex-row items-center justify-between flex-wrap gap-2">
                  <View>
                    <View className="flex-row items-baseline flex-wrap">
                      <Text 
                        style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }}
                        className="text-[#FF5E00] font-bold"
                      >
                        ₹149
                      </Text>
                      <Text 
                        style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(12) }}
                        className="text-slate-400 line-through ml-2"
                      >
                        ₹999
                      </Text>
                      <Text 
                        style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11) }}
                        className="text-[#FF5E00] font-bold ml-2"
                      >
                        Today Only
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#FF5E00] py-2 px-6 rounded-full shadow-sm">
                    <Text 
                      style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }}
                      className="text-white font-bold"
                    >
                      Enroll
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* MASTER PROGRAM SECTION */}
          <View className="px-5 mb-5">
            <View className="mb-3">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(19) }}
                className="text-slate-900 font-bold"
              >
                Master Program
              </Text>
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }}
                className="text-[#00B6A6] font-semibold"
              >
                Long-term Comprehensive Intensive 🎯
              </Text>
            </View>

            {/* Master Program Card */}
            <TouchableOpacity 
              onPress={() => navigateTo('MASTER_PROGRAM')}
              style={styles.courseCard} 
              className="bg-white rounded-2xl p-4 active:opacity-95"
            >
              <View className="flex-row justify-between items-center flex-wrap gap-2">
                {/* Left Column content */}
                <View className="flex-1 min-w-[200px]">
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
                    className="text-slate-800 font-bold leading-snug"
                  >
                    LIVE Interactive Full Syllabus Course for {selectedClass} (2026-27)
                  </Text>

                  {/* Fire bullet points */}
                  <View className="mt-3.5 space-y-2">
                    {[
                      'Full Academic Year',
                      'Full Syllabus',
                      'Full Subjects'
                    ].map((bullet, idx) => (
                      <View key={idx} className="flex-row items-center">
                        <Text className="text-[12px] mr-2">🔥</Text>
                        <Text 
                          style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }}
                          className="text-slate-655 font-medium"
                        >
                          {bullet}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Right Column illustration */}
                <View className="items-center justify-center">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }} 
                    className="w-16 h-16 rounded-xl bg-slate-100"
                  />
                </View>
              </View>

              <View className="w-full h-[1px] bg-slate-100 my-3.5" />

              {/* Bottom pricing row */}
              <View className="flex-row items-center justify-between flex-wrap gap-2">
                <View>
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(24) }}
                    className="text-[#00B6A6] font-bold"
                  >
                    ₹31,999
                  </Text>
                </View>

                <View className="bg-[#00B6A6] py-2 px-6 rounded-full shadow-sm">
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }}
                    className="text-white font-bold"
                  >
                    Enroll
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* BOTTOM METRICS */}
          <View className="items-center justify-center mt-6 px-8 opacity-40">
            <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(10) }} className="text-center text-slate-400">
              © Oda Class. Trusted by 20+ Million Parents
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  // MY STUDY SCREEN LAYOUT
  const renderMyStudyScreen = () => {
    const isBridgeActive = studyTab === 'Bridge';

    return (
      <View className="flex-1 bg-white">
        {/* HEADER / NAVIGATION BAR */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-slate-100 bg-[#F8FAFC]">
          {/* Sub-tabs row */}
          <View className="flex-row items-center space-x-6">
            {/* Bridge Tab */}
            <TouchableOpacity 
              onPress={() => setStudyTab('Bridge')} 
              className="items-center"
            >
              <View className={`w-10 h-10 rounded-full border-[2px] items-center justify-center mb-1 ${
                isBridgeActive ? 'border-[#00B6A6] bg-[#E0F7F6]' : 'border-slate-200 bg-white'
              }`}>
                <MaterialCommunityIcons 
                  name="play-circle" 
                  size={20} 
                  color={isBridgeActive ? '#00B6A6' : '#64748B'} 
                />
              </View>
              <Text 
                style={{ 
                  fontFamily: isBridgeActive ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                  fontSize: getFontSize(11)
                }} 
                className={isBridgeActive ? 'text-slate-800 font-bold' : 'text-slate-400'}
              >
                Bridge Course
              </Text>
              {isBridgeActive && <View className="w-10 h-[2.5px] bg-slate-900 rounded-full mt-1.5" />}
            </TouchableOpacity>

            {/* All Courses Tab */}
            <TouchableOpacity 
              onPress={() => setStudyTab('All')} 
              className="items-center"
            >
              <View className={`w-10 h-10 rounded-full border-[2px] items-center justify-center mb-1 ${
                !isBridgeActive ? 'border-[#00B6A6] bg-[#E0F7F6]' : 'border-slate-200 bg-white'
              }`}>
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }}
                  className={!isBridgeActive ? 'text-[#00B6A6] font-bold' : 'text-slate-500'}
                >
                  All
                </Text>
              </View>
              <Text 
                style={{ 
                  fontFamily: !isBridgeActive ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                  fontSize: getFontSize(11)
                }} 
                className={!isBridgeActive ? 'text-slate-800 font-bold' : 'text-slate-400'}
              >
                All Courses
              </Text>
              {!isBridgeActive && <View className="w-10 h-[2.5px] bg-slate-900 rounded-full mt-1.5" />}
            </TouchableOpacity>
          </View>

          {/* Far right download icon */}
          <TouchableOpacity onPress={() => showToast("Opening downloads...")} className="p-2">
            <Feather name="download" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {!isEnrolled ? (
          /* EMPTY STATE (NOT ENROLLED) */
          <View className="flex-1 bg-white items-center justify-between p-6">
            <View className="w-full mt-4">
              <TouchableOpacity 
                onPress={() => navigateTo('BOOSTER_DETAILS')}
                className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
              >
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-800 font-bold">
                  Attended Open Sessions
                </Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-[#00B6A6] font-bold uppercase tracking-wider">
                  View &gt;
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ambient center watermark */}
            <View className="items-center justify-center opacity-30 mt-[-80]">
              <MaterialCommunityIcons name="book-open-page-variant" size={60} color="#94A3B8" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-300 font-bold mt-2">
                Oda Class
              </Text>
            </View>

            {/* Toggle helper button for user testing */}
            <TouchableOpacity 
              onPress={() => {
                setIsEnrolled(true);
                showToast("Simulator: Enrolled State Activated!");
              }}
              className="bg-slate-100 border border-slate-200 py-2.5 px-6 rounded-full"
            >
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-500 font-bold">
                🛠 Toggle Mock Enrollment (Demo/Test)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ENROLLED VIEW */
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            className="flex-1 bg-slate-50/50 px-4 pt-4"
          >
            {isBridgeActive ? (
              /* BRIDGE COURSE TAB */
              <View className="space-y-4">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16) }} className="text-slate-800 font-bold mb-2">
                  Upcoming
                </Text>

                {/* Card 1: Welcome Test */}
                <TouchableOpacity 
                  onPress={() => navigateTo('TEST_INTRO')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16) }} className="text-slate-800 font-bold">
                    Welcome Test
                  </Text>
                  
                  <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-slate-500 uppercase tracking-wider font-bold">Test</Text>
                  </View>

                  <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-slate-50">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-orange-500 font-bold">
                      30 minutes
                    </Text>
                    <View className="bg-[#E0F7F6] py-1 px-4 rounded-full">
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-[#00B6A6] font-bold">Enter</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Card 2: Beyond Zero (Today's Class) */}
                <TouchableOpacity 
                  onPress={() => navigateTo('CLASS_DETAILS')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold leading-snug">
                        Beyond Zero : The World of Integers with Ninja Mam!
                      </Text>
                      <View className="bg-slate-100 py-0.5 px-2 rounded self-start mt-2">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-slate-500 uppercase font-bold">Maths</Text>
                      </View>
                    </View>

                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' }} 
                      className="w-14 h-14 rounded-full bg-slate-100 border border-slate-100"
                    />
                  </View>

                  <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-slate-50">
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-500 font-medium">
                      8:10 pm - 9:10 pm, 6 Jul
                    </Text>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        showToast("Entering Live interactive Class...");
                      }}
                      className="bg-[#00B6A6] py-1 px-4 rounded-full active:bg-teal-650"
                    >
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-white font-bold">Join Class</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Course Schedule Button */}
                <TouchableOpacity 
                  onPress={() => navigateTo('COURSE_DETAILS')}
                  className="bg-slate-100 py-2.5 px-6 rounded-full self-center mt-6"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-600 font-bold">
                    Course Schedule &gt;
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ALL COURSES TAB */
              <View className="space-y-4">
                {/* Concept Booster card */}
                <TouchableOpacity 
                  onPress={() => navigateTo('COURSE_DETAILS')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15) }} className="text-slate-800 font-bold leading-snug">
                    Concept Booster Course - 5X Efficient Learning Methods by IITians
                  </Text>
                  
                  <View className="flex-row items-center mt-3 gap-2">
                    <View className="bg-slate-100 py-0.5 px-2 rounded">
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-slate-500 uppercase tracking-wider font-bold">Bridge Course</Text>
                    </View>
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-400 font-medium">6 Jul - 11 Jul</Text>
                  </View>

                  {/* Teacher circle roster row */}
                  <View className="flex-row items-center mt-5 pt-3 border-t border-slate-50 space-x-2">
                    {['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'].map((av, id) => (
                      <Image 
                        key={id}
                        source={{ uri: av }} 
                        className="w-7 h-7 rounded-full bg-slate-200 border border-white shadow-sm"
                      />
                    ))}
                  </View>
                </TouchableOpacity>

                {/* Completed Courses Dropdown toggle */}
                <TouchableOpacity 
                  onPress={() => showToast("Completed courses list opened")}
                  className="py-3 items-center justify-center flex-row self-center mt-6"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-500 font-bold mr-1">
                    Completed Courses
                  </Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  // GENIE SCREEN LAYOUT
  const renderGenieScreen = () => {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <MaterialCommunityIcons name="star-shooting" size={72} color="#00B6A6" />
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold mt-4">
          Oda Genie Solver
        </Text>
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-400 text-center mt-2 px-6 leading-relaxed">
          Take a photo of any maths or science homework problem to get instant IITian step-by-step assistance.
        </Text>
      </View>
    );
  };

  // ME PROFILE SCREEN LAYOUT
  const renderMeScreen = () => {
    return (
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* USER PROFILE HEADER */}
        <TouchableOpacity 
          onPress={() => navigateTo('PROFILE')}
          className="flex-row items-center justify-between px-5 pt-6 pb-6 bg-white border-b border-slate-100"
        >
          <View className="flex-row items-center">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }} 
              className="w-16 h-16 rounded-full bg-slate-200 border-2 border-[#E0F7F6]"
            />
            <View className="ml-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }} className="text-slate-800 font-bold">
                Ram
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-450 mt-0.5">
                Class: {selectedClass} | Student ID: 26394
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* WIDGETS BOXES GRID */}
        <View className="p-5 flex-row justify-between">
          {/* Box 1: Orders */}
          <TouchableOpacity 
            onPress={() => navigateTo('BOOSTER_DETAILS')} 
            style={styles.meWidgetCard}
            className="w-[47%] bg-white rounded-2xl p-4.5 items-center justify-center relative"
          >
            <View className="absolute top-2 right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }} className="text-white font-bold">1</Text>
            </View>
            <MaterialCommunityIcons name="wallet-giftcard" size={26} color="#FF6600" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold mt-2">
              My Orders
            </Text>
          </TouchableOpacity>

          {/* Box 2: Report */}
          <TouchableOpacity 
            onPress={() => navigateTo('REPORT_PERIOD_SELECT')} 
            style={styles.meWidgetCard}
            className="w-[47%] bg-white rounded-2xl p-4.5 items-center justify-center"
          >
            <MaterialCommunityIcons name="file-chart" size={26} color="#00B6A6" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold mt-2">
              Study Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* MENU OPTIONS LIST */}
        <View className="mx-5 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {[
            { label: 'Help & Feedback', icon: 'help-circle-outline' },
            { label: 'Settings', icon: 'cog-outline' }
          ].map((item, idx) => (
            <TouchableOpacity 
              key={idx}
              onPress={() => showToast(item.label)}
              className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 active:bg-slate-50"
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name={item.icon as any} size={20} color="#64748B" className="mr-3" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13.5) }} className="text-slate-700 font-medium">
                  {item.label}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return renderHomeScreen();
      case 'My Study':
        return renderMyStudyScreen();
      case 'Genie':
        return renderGenieScreen();
      case 'Me':
        return renderMeScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* RENDER CURRENT TAB */}
      {renderActiveScreen()}

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-20 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-white font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}



      {/* CLASS SELECTOR SHEET */}
      <Modal
        visible={isClassSheetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsClassSheetVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setIsClassSheetVisible(false)}
            style={{ flex: 1 }}
          />
          <View style={styles.sheetContent}>
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(18) }}
                className="text-slate-800 font-bold"
              >
                Choose Your Class (2026-27)
              </Text>
              <TouchableOpacity onPress={() => setIsClassSheetVisible(false)} className="p-1">
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {CLASSES_LIST.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <TouchableOpacity
                    key={cls}
                    onPress={() => handleClassSelect(cls)}
                    style={{
                      width: '31%',
                      backgroundColor: isSelected ? '#00B6A6' : '#F1F5F9',
                      marginVertical: 6,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? '#00B6A6' : 'transparent',
                    }}
                    className="active:opacity-80"
                  >
                    <Text 
                      style={{ 
                        fontFamily: isSelected ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                        color: isSelected ? 'white' : '#475569',
                        fontSize: getFontSize(13)
                      }}
                      className="font-semibold text-center"
                    >
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ width: '31%' }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* FLOATING ACTION ENROLL BADGE */}
      <TouchableOpacity 
        onPress={() => navigateTo('BOOSTER_DETAILS')}
        style={styles.floatingBadge}
        className="absolute bottom-[82] right-4 bg-white py-1.5 px-3 rounded-full flex-row items-center shadow-md border border-orange-500/20 active:scale-[0.96] z-40"
      >
        <Ionicons name="time-outline" size={18} color="#FF6600" className="mr-1" />
        <View>
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8.5) }}
            className="text-[#7C2D12] font-bold leading-tight"
          >
            Concept Booster Course
          </Text>
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }}
            className="text-[#FF6600] font-bold uppercase tracking-wider leading-none"
          >
            ENROLL
          </Text>
        </View>
      </TouchableOpacity>

      {/* POP-UP OVERLAY (1-WEEK BOOSTER PLAN - FULLY RESPONSIVE) */}
      <Modal
        visible={isPopupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.popupCard, 
              { 
                transform: [{ scale: popupScale }],
                opacity: popupFade
              }
            ]}
          >
            {/* Real Brand Blue Sky Gradient */}
            <View style={styles.popupBg} className="p-5 items-center justify-between h-full relative">
              {/* Close Button at top-right corner of card */}
              <TouchableOpacity 
                onPress={closePopup} 
                className="absolute top-3.5 right-3.5 p-1 bg-white/20 rounded-full z-50 active:bg-white/30"
              >
                <Feather name="x" size={18} color="white" />
              </TouchableOpacity>

              {/* Ambient stars */}
              <View className="absolute top-4 left-4 opacity-30"><Feather name="star" size={12} color="white" /></View>
              <View className="absolute top-12 right-12 opacity-20"><Feather name="star" size={15} color="white" /></View>

              <View className="items-center mt-2">
                {/* Yellow Badge */}
                <View className="bg-[#FEF08A] py-1 px-3 rounded-full mb-2.5">
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }}
                    className="text-[#854D0E] font-bold uppercase tracking-wider"
                  >
                    1-Week Booster Plan
                  </Text>
                </View>

                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }}
                  className="text-white font-bold text-center leading-snug tracking-tight"
                >
                  LIVE DEMO CLASS
                </Text>
                
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }}
                  className="text-blue-150 text-center px-2 mt-1 leading-relaxed"
                >
                  Learn with top IITian teachers!
                </Text>
              </View>

              {/* Features list (Compact for smaller viewports) */}
              <View className="w-full my-3 bg-white/10 rounded-xl p-3 border border-white/15">
                {[
                  '1-on-1 Teacher Support',
                  'Complete Study Material',
                  'Score Boost Guarantee'
                ].map((benefit, idx) => (
                  <View key={idx} className="flex-row items-center my-1">
                    <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color="#FEF08A" />
                    <Text 
                      style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }}
                      className="text-white ml-2"
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button: Book your seat */}
              <TouchableOpacity 
                onPress={() => {
                  closePopup();
                  navigateTo('BOOSTER_DETAILS');
                }}
                style={styles.bookButton}
                className="w-full py-3 px-4 rounded-full flex-row items-center justify-center active:scale-[0.98] shadow-md relative"
              >
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15) }}
                  className="text-white font-bold tracking-wide mr-2 text-center"
                >
                  Book your seat
                </Text>
                <Text className="text-base absolute right-8">👉</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFF5F5', 
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  bannerGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    borderWidth: 1.5,
    borderColor: '#E11D48',
    borderRadius: 16,
  },
  courseCard: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  meWidgetCard: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBar: {
    height: 65,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingBadge: {
    height: 44,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCard: {
    width: width * 0.82,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
    overflow: 'hidden',
  },
  popupBg: {
    flex: 1,
    paddingVertical: 20,
  },
  bookButton: {
    backgroundColor: '#FF6600', 
  }
});
