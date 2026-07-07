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
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getAvatarUrl, getHomepageConfig, HomepageConfig } from '../services/api';


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
    setActiveTab,
    user
  } = useApp();
  const [isClassSheetVisible, setIsClassSheetVisible] = useState<boolean>(false);
  const [studyTab, setStudyTab] = useState<'Bridge' | 'All'>('Bridge');

  const [homeConfig, setHomeConfig] = useState<HomepageConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setHomeConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load homepage config for selected class:', err);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, [selectedClass]);

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

  // SUB-RENDERERS FOR DYNAMIC HOMEPAGE
  const renderWhyOdaBanner = () => {
    const isOlderClass = (parseInt(selectedClass.replace('Class ', '')) || 1) >= 8;
    const bannerText = homeConfig?.bannerText || (
      isOlderClass 
        ? "Most Pioneer LIVE Learning Platform" 
        : "Best with 20 Million Users' Trust"
    );
    const enrollmentType = user.enrollmentType || 'none';
    const titleText = enrollmentType === 'demo' ? 'Why Demo Class' : 'Why Oda Class';

    return (
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
            {titleText}
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
    );
  };

  const renderUpcomingClassCard = () => {
    const classNum = parseInt(selectedClass.replace('Class ', '')) || 1;
    const defaultUpcomingTitle = classNum <= 5 
      ? 'Fun with Numbers & Shapes - Lesson 1' 
      : classNum <= 8 
        ? 'Linear Equations & Algebraic Identities' 
        : 'IIT/JEE Foundation: Quadratic Functions';

    const upcoming = homeConfig?.upcomingClass || {
      title: defaultUpcomingTitle,
      subject: classNum <= 5 ? 'Maths' : 'Mathematics',
      time: 'Today, 6:00 PM',
      teacherName: 'Sonia Verma',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'
    };

    return (
      <View style={styles.upcomingContainer} className="mx-5 my-3 p-4 bg-white rounded-2xl relative overflow-hidden shadow-sm">
        <View style={styles.upcomingGlow} />
        
        <View className="flex-row items-center justify-between mb-3 z-10">
          <View className="flex-row items-center bg-[#E0F7F6] px-2.5 py-0.5 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-[#00B6A6] mr-1.5" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-[#00B6A6] font-bold uppercase tracking-wider">
              Upcoming Live Class
            </Text>
          </View>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-400 font-medium">
            {upcoming.time}
          </Text>
        </View>

        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15) }} className="text-slate-850 font-bold leading-snug mb-3.5 z-10">
          {upcoming.title}
        </Text>

        <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-slate-100/60 z-10">
          <View className="flex-row items-center">
            <Image 
              source={{ uri: upcoming.teacherAvatar }} 
              className="w-9 h-9 rounded-full bg-slate-200 mr-2.5 border border-slate-100"
            />
            <View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-700 font-bold leading-tight">
                {upcoming.teacherName}
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10) }} className="text-slate-400 font-medium mt-0.5">
                {upcoming.subject} Expert
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => navigateTo('CLASS_DETAILS')}
            style={styles.joinBtn}
            className="px-5 py-2 rounded-full bg-[#00B6A6] active:opacity-90 shadow-sm"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-white font-bold">
              Join
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBoosterCourseCard = () => {
    const booster = homeConfig?.boosterCourse || {
      title: 'Concept Booster Course - 5X Efficient Learning Methods by IITians',
      subjects: ['Maths', 'Science', 'English'],
      price: 149,
      originalPrice: 999
    };

    const teacherAvatars = homeConfig?.teachers || [
      { avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120' },
      { avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }
    ];

    return (
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
          <View className="bg-[#FAF2EE] px-4 py-4 flex-row justify-between items-center relative">
            <View className="flex-1 z-10 pr-2">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
                className="text-[#7C2D12] font-bold leading-tight"
              >
                Maximize Your Child's{"\n"}Potential 100%
              </Text>
            </View>

            <View className="flex-row items-center space-x-[-12px] z-10">
              {teacherAvatars.slice(0, 2).map((t, idx) => (
                <View key={idx} className="border-[2.5px] border-white rounded-full overflow-hidden shadow-sm">
                  <Image 
                    source={{ uri: t.avatar }} 
                    className="w-12 h-12 bg-slate-200"
                  />
                </View>
              ))}
            </View>
          </View>

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

          <View className="p-4 pt-3">
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
              className="text-slate-800 font-bold leading-snug"
            >
              {booster.title}
            </Text>

            <View className="flex-row flex-wrap items-center mt-2.5 gap-1.5">
              {(booster.subjects || ['Maths', 'Science', 'English']).map((sub, idx) => (
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

            <View className="flex-row items-center justify-between flex-wrap gap-2">
              <View>
                <View className="flex-row items-baseline flex-wrap">
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }}
                    className="text-[#FF5E00] font-bold"
                  >
                    ₹{booster.price}
                  </Text>
                  <Text 
                    style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(12) }}
                    className="text-slate-400 line-through ml-2"
                  >
                    ₹{booster.originalPrice}
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
    );
  };

  const renderMasterProgramCard = () => {
    const master = homeConfig?.masterProgram || {
      title: `LIVE Interactive Full Syllabus Course for ${selectedClass} (2026-27)`,
      bullets: [
        'Full Academic Year Preparation',
        'Complete CBSE/ICSE Board Syllabus covered',
        'All Core Subjects: Maths, Science, SST & English'
      ],
      price: 31999
    };

    return (
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

        <TouchableOpacity 
          onPress={() => navigateTo('MASTER_PROGRAM')}
          style={styles.courseCard} 
          className="bg-white rounded-2xl p-4 active:opacity-95"
        >
          <View className="flex-row justify-between items-center flex-wrap gap-2">
            <View className="flex-1 min-w-[200px]">
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }}
                className="text-slate-800 font-bold leading-snug"
              >
                {master.title}
              </Text>

              <View className="mt-3.5 space-y-2">
                {(master.bullets || []).map((bullet, idx) => (
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

            <View className="items-center justify-center">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }} 
                className="w-16 h-16 rounded-xl bg-slate-100"
              />
            </View>
          </View>

          <View className="w-full h-[1px] bg-slate-100 my-3.5" />

          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <View>
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(24) }}
                className="text-[#00B6A6] font-bold"
              >
                ₹{master.price.toLocaleString('en-IN')}
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
    );
  };

  const renderBottomMetrics = () => {
    return (
      <View className="items-center justify-center mt-6 px-8 opacity-40">
        <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(10) }} className="text-center text-slate-400">
          © Oda Class. Trusted by 20+ Million Parents
        </Text>
      </View>
    );
  };

  // HOME SCREEN LAYOUT
  const renderHomeScreen = () => {
    const enrollmentType = user.enrollmentType || 'none';

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

        {isConfigLoading && !homeConfig ? (
          <View className="flex-1 items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#00B6A6" />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 130 }}
            className="flex-1 bg-[#F8FAFC]"
          >
            {/* 1. BRAND BANNER (TOP FOR GUESTS & DEMO STUDENTS) */}
            {enrollmentType !== 'master' && renderWhyOdaBanner()}

            {/* 2. UPCOMING CLASS (TOP FOR MASTER, SUB-TOP FOR DEMO STUDENTS) */}
            {enrollmentType !== 'none' && renderUpcomingClassCard()}

            {/* 3. 6-DAY HEAD START COURSE CARD (GUEST & DEMO ONLY) */}
            {enrollmentType !== 'master' && renderBoosterCourseCard()}

            {/* 4. MASTER PROGRAM SECTION (ALL) */}
            {renderMasterProgramCard()}

            {/* 5. BRAND BANNER AT BOTTOM (FOR MASTER PROGRAM STUDENTS ONLY) */}
            {enrollmentType === 'master' && (
              <View className="mt-4 border-t border-slate-100 pt-2">
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15) }}
                  className="text-slate-600 font-bold mx-5 mt-3 mb-1"
                >
                  About Our Academy
                </Text>
                {renderWhyOdaBanner()}
              </View>
            )}

            {/* 6. BOTTOM METRICS */}
            {renderBottomMetrics()}
          </ScrollView>
        )}
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
  // ME PROFILE SCREEN LAYOUT
  const renderMeScreen = () => {
    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-[#FCFCFC]" 
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* USER PROFILE HEADER */}
        <View className="flex-row items-center justify-between px-6 pt-10 pb-4 bg-[#FCFCFC]">
          <TouchableOpacity 
            onPress={() => navigateTo('PROFILE')}
            className="flex-row items-center flex-1 active:opacity-80"
          >
            {/* Avatar cap */}
            <View className="w-15 h-15 rounded-full bg-[#E0F7F6] items-center justify-center border border-[#B2DFDB] overflow-hidden relative">
              {user.avatar ? (
                <Image source={{ uri: getAvatarUrl(user.avatar) || undefined }} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="school" size={30} color="#00B6A6" />
              )}
            </View>
            
            <View className="ml-4">
              <View className="flex-row items-center">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-slate-800 font-bold">
                  {user.name}
                </Text>
                {/* Red dot */}
                <View className="w-2.5 h-2.5 rounded-full bg-[#FF5E00] ml-1.5 self-center mt-1" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13.5) }} className="text-slate-400 mt-1">
                {selectedClass}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Top Right Rocket Badge */}
          <TouchableOpacity 
            onPress={() => showToast("Oda Rocket launcher...")}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
            className="w-10 h-10 rounded-full border border-slate-100 bg-white items-center justify-center"
          >
            <Ionicons name="rocket-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* TWO GRID BOXES (ON GREY BACKGROUND) */}
        <View className="px-5 py-4 flex-row justify-between bg-[#F4F6F9]">
          {/* Oda Mall */}
          <TouchableOpacity 
            onPress={() => showToast("Oda Mall clicked")}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 2,
            }}
            className="w-[48%] bg-white rounded-2xl p-4 flex-row items-center border border-slate-100/50"
          >
            <View className="w-10 h-10 rounded-full bg-[#FFE885] items-center justify-center mr-3 border border-[#FCD34D]/60">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: 8.5 }} className="text-[#A15C0F] font-bold uppercase">oda</Text>
            </View>
            <View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-850 font-bold">
                Oda Mall
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-400 mt-0.5">
                0 in total
              </Text>
            </View>
          </TouchableOpacity>

          {/* Coupons */}
          <TouchableOpacity 
            onPress={() => showToast("Coupons clicked")}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 2,
            }}
            className="w-[48%] bg-white rounded-2xl p-4 flex-row items-center border border-slate-100/50"
          >
            <View className="w-10 h-10 rounded-full bg-[#FFF7ED] items-center justify-center mr-3 border border-[#FFE3D3]/60">
              <MaterialCommunityIcons name="wallet" size={20} color="#F97316" />
            </View>
            <View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-850 font-bold">
                Coupons
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-400 mt-0.5">
                0 available
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* LIST OPTIONS (ON SOLID WHITE BACKGROUND) */}
        <View className="bg-white px-6 pt-2 flex-1">
          {[
            { label: 'My Orders', icon: 'file-text', type: 'Feather', onPress: () => navigateTo('MY_ORDERS') },
            { label: 'FAQs', icon: 'help-circle', type: 'Feather', onPress: () => navigateTo('FAQ') },
            { label: 'Share App', icon: 'share', type: 'Feather', onPress: () => showToast('Link Copied!') },
            { label: 'About Oda Class', icon: 'book-open', type: 'Feather', onPress: () => navigateTo('ABOUT_ODA') },
            { label: 'Add Widgets to Home Screen', icon: 'grid', type: 'Feather', hasBadge: true, onPress: () => showToast('Add widget settings...') },
            { label: 'Rate Us', icon: 'star', type: 'Feather', onPress: () => showToast('Rate us on Play Store!') },
            { label: 'Network Diagnosis', icon: 'tool', type: 'Feather', onPress: () => showToast('Checking network status...') }
          ].map((item, idx) => {
            let IconComponent: any = Feather;
            if (item.type === 'Ionicons') IconComponent = Ionicons;
            if (item.type === 'MaterialCommunityIcons') IconComponent = MaterialCommunityIcons;

            return (
              <TouchableOpacity 
                key={idx}
                onPress={item.onPress}
                className="flex-row items-center justify-between py-4 border-b border-slate-100/60 active:bg-slate-50"
              >
                <View className="flex-row items-center">
                  <IconComponent name={item.icon} size={20} color="#64748B" className="mr-4" />
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(14.5) }} className="text-slate-700 font-medium">
                    {item.label}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {item.hasBadge && (
                    <View className="w-2.5 h-2.5 rounded-full bg-[#FF5E00] mr-2" />
                  )}
                  <Feather name="chevron-right" size={16} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            );
          })}
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
      {activeTab === 'Home' && (
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
      )}

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
  },
  upcomingContainer: {
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    shadowColor: '#00B6A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  upcomingGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#CCFBF1',
    opacity: 0.45,
  },
  joinBtn: {
    shadowColor: '#00B6A6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  }
});
