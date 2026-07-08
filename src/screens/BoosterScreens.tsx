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
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { createOrder, updateOrderStatus, getHomepageConfig, HomepageConfig, BoosterConfig, getAvatarUrl } from '../services/api';



const { width } = Dimensions.get('window');

// Responsive fonts helper
const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

// ==========================================
// 1. BOOSTER DETAILS SCREEN
// ==========================================
export const BoosterDetailsScreen: React.FC = () => {
  const { navigateTo, goBack, selectedClass } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomepageConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setHomeConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load config for booster details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [selectedClass]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const booster: BoosterConfig = homeConfig?.boosterCourse ?? {
    headerTitle: '6-Day Head Start Course',
    headerSubtitle: 'IIT/NIT Premium BootCamp',
    cardTitle: "Maximize Your Child's Potential 100%",
    title: 'Concept Booster Course - 5X Efficient Learning Methods by IITians',
    subjects: ['Maths', 'Science', 'English'],
    heroChipText: 'Active Enrollment Period Open',
    parentsBadgeText: "🏆 10,000,000+ Parents' Choice",
    bullets: ['Maths & Science & Olympiads', '50+ Core Concepts', '50+ Solving Skills', 'IIT/NIT Teachers'],
    reviewSectionTitle: 'Highly Rated by Parents & Students',
    review1Name: 'Kabir', review1Date: '16 May 2026', review1Text: 'It is really good...',
    review1Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
    review2Name: 'Aadhya', review2Date: '11 May 2026', review2Text: "It's very good learning app...",
    review2Avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
    score100Title: 'Score 100% and Become Topper',
    subjectsLine: 'Maths & Science (All core concepts)',
    grid1Badge: 'Secret of 83%', grid1Title: 'Higher Score',
    grid2Title: '50+ Core Concepts', grid2Subtitle: 'Most asked concepts and topics',
    grid3Title: '50+ Solving Skills', grid3Subtitle: 'Summarized by IIT/NIT teachers',
    grid4Title: '300+ Quizzes', grid4Subtitle: 'Practice to master concepts',
    liveSectionTitle: 'Immersive & Interactive LIVE Course',
    trustMetric1Title: 'LIVE Course', trustMetric1Subtitle: 'Immersive Replay',
    trustMetric2Title: '1 on 1 Service', trustMetric2Subtitle: 'Mentor Support',
    trustMetric3Title: 'Quality Guaranteed', trustMetric3Subtitle: 'Best Educators',
    heroBannerImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80',
    teacherCardImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    teacher1Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    teacher2Avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    teacher3Avatar: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=100&auto=format&fit=crop&q=80',
    price: 149,
    originalPrice: 999
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white z-50">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(17) }}
          className="text-slate-800 font-bold text-center flex-1 mr-6"
        >
          {booster.headerTitle || 'Limited Time Offer'}
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-slate-50"
      >
        {/* HERO SECTION BANNER */}
        <View style={styles.detailsHero} className="py-7 px-5 relative overflow-hidden">
          {/* Subtle background circles */}
          <View className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-white/5" />
          <View className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/5" />

          {/* Heading info */}
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-white font-bold tracking-tight leading-tight uppercase">
            {booster.title || 'CONCEPT BOOSTER COURSE'}
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-[#FFE0B2] mt-1.5">
            {booster.cardTitle || 'Unlock Potential to Score 100%'}
          </Text>

          {/* Notification Alert Chip */}
          <View className="bg-black/15 py-1.5 px-3.5 rounded-full self-start mt-4 flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10) }} className="text-white font-medium">
              {booster.heroChipText || 'Active Enrollment Period Open'}
            </Text>
          </View>

          {/* Bullet metrics */}
          <View className="mt-6 space-y-3.5">
            {(booster.bullets || [
              'Maths & Science & Olympiads',
              '50+ Core Concepts',
              '50+ Solving Skills',
              'IIT/NIT Teachers'
            ]).map((blt: string, idx: number) => (
              <View key={idx} className="flex-row items-center">
                <Ionicons name="caret-forward-circle" size={14} color="#FFE0B2" className="mr-2" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-white font-bold">
                  {blt}
                </Text>
              </View>
            ))}
          </View>

          {/* Parents Choice badge */}
          <View className="mt-8 border-t border-white/20 pt-4 items-center justify-center">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-[#FFE0B2] font-bold text-center uppercase tracking-widest">
              {booster.parentsBadgeText || "🏆 10,000,000+ Parents' Choice"}
            </Text>
          </View>
        </View>

        {/* HIGHLY RATED BY PARENTS & STUDENTS */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          {/* Header Banner */}
          <View style={styles.sectionHeaderBadge} className="py-2.5 px-4 rounded-xl mb-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold text-center uppercase tracking-wider">
              {booster.reviewSectionTitle || 'Highly Rated by Parents & Students'}
            </Text>
          </View>

          {/* Review items */}
          <View className="space-y-4">
            {/* Review 1 */}
            <View className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Image 
                    source={{ uri: getAvatarUrl(booster.review1Avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80' }} 
                    className="w-8 h-8 rounded-full bg-slate-200 mr-2"
                  />
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold">{booster.review1Name || 'Kabir'}</Text>
                </View>
                <View className="flex-row">
                  {[1,2,3,4,5].map((s) => <Ionicons key={s} name="star" size={12} color="#EAB308" className="mr-0.5" />)}
                </View>
              </View>
              <Text className="text-slate-400 text-[9.5px]">{booster.review1Date || '16 May 2026'}</Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-650 mt-2.5 leading-relaxed">
                {booster.review1Text || 'It is really good because you have the best teacher and they explain really nicely and energetic!!! Best Choice ever to join Oda!!'}
              </Text>
            </View>

            {/* Review 2 */}
            <View className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Image 
                    source={{ uri: getAvatarUrl(booster.review2Avatar) || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80' }} 
                    className="w-8 h-8 rounded-full bg-slate-200 mr-2"
                  />
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold">{booster.review2Name || 'Aadhya'}</Text>
                </View>
                <View className="flex-row">
                  {[1,2,3,4,5].map((s) => <Ionicons key={s} name="star" size={12} color="#EAB308" className="mr-0.5" />)}
                </View>
              </View>
              <Text className="text-slate-400 text-[9.5px]">{booster.review2Date || '11 May 2026'}</Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-650 mt-2.5 leading-relaxed">
                {booster.review2Text || "It's very good learning app for children.. the teacher inspired our children and topics are also too good ...."}
              </Text>
            </View>
          </View>
        </View>

        {/* SCORE 100% AND BECOME TOPPER */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View style={styles.sectionHeaderBadge} className="py-2.5 px-4 rounded-xl mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold text-center uppercase tracking-wider">
              {booster.score100Title || 'Score 100% and Become Topper'}
            </Text>
          </View>

          {/* Subjects and indicators */}
          <View className="flex-row justify-center items-center py-2 mb-4 flex-wrap">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-[#FF5E00] font-bold text-center">
              {booster.subjectsLine || 'Maths & Science (All core concepts)'}
            </Text>
          </View>

          {/* Grid Layout */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {/* Box 1 */}
            <View className="w-[48%] bg-orange-50/50 border border-orange-100 rounded-2xl p-3.5 relative overflow-hidden h-[96px] justify-between">
              <View className="flex-row justify-between items-center">
                <View className="bg-orange-500 rounded-lg px-2 py-0.5 shadow-sm">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-white font-bold">{booster.grid1Badge || 'Secret of 83%'}</Text>
                </View>
                <FontAwesome5 name="chart-line" size={14} color="#EA580C" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-slate-800 font-bold mt-1.5">
                {booster.grid1Title || 'Higher Score'}
              </Text>
            </View>

            {/* Box 2 */}
            <View className="w-[48%] bg-[#F8FAFC] border border-slate-100 rounded-2xl p-3.5 h-[96px] justify-between">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">{booster.grid2Title || '50+ Core Concepts'}</Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-slate-400 font-medium">{booster.grid2Subtitle || 'Most asked concepts and topics'}</Text>
            </View>

            {/* Box 3 */}
            <View className="w-[48%] bg-[#F8FAFC] border border-slate-100 rounded-2xl p-3.5 h-[96px] justify-between">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">{booster.grid3Title || '50+ Solving Skills'}</Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-slate-400 font-medium">{booster.grid3Subtitle || 'Summarized by IIT/NIT teachers'}</Text>
            </View>

            {/* Box 4 */}
            <View className="w-[48%] bg-[#F8FAFC] border border-slate-100 rounded-2xl p-3.5 h-[96px] justify-between">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-800 font-bold">{booster.grid4Title || '300+ Quizzes'}</Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-slate-400 font-medium">{booster.grid4Subtitle || 'Practice to master concepts'}</Text>
            </View>
          </View>
        </View>

        {/* LEARN WITH IIT/NIT TEACHERS */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View style={styles.sectionHeaderBadge} className="py-2.5 px-4 rounded-xl mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold text-center uppercase tracking-wider">
              Learn With IIT/NIT Teachers
            </Text>
          </View>

          {/* Composite layout representing teacher team banner */}
          <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 items-center overflow-hidden">
            <Image 
              source={{ uri: getAvatarUrl(booster.heroBannerImage) || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80' }} 
              className="w-full h-40 rounded-xl bg-slate-200"
            />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-500 font-bold text-center mt-3">
              Learn from India's Premier Educators and Subject Matter Experts
            </Text>
          </View>
        </View>

        {/* ADVANCED DUAL-TEACHER MODULE */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View style={styles.sectionHeaderBadge} className="py-2.5 px-4 rounded-xl mb-6">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold text-center uppercase tracking-wider">
              Advanced Dual-Teacher Module
            </Text>
          </View>

          {/* Interactive Relationship diagram */}
          <View className="relative h-[190px] w-full justify-between items-center">
            {/* Top row: Master and Mentor */}
            <View className="w-full flex-row justify-between px-2">
              {/* Master Teacher Card */}
              <View className="border border-orange-200 rounded-2xl bg-orange-50/20 p-2 items-center w-[40%]">
                <Image 
                  source={{ uri: getAvatarUrl(booster.teacher1Avatar) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }} 
                  className="w-12 h-12 rounded-full bg-slate-200"
                />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 font-bold mt-1.5">
                  Master Teacher
                </Text>
              </View>

              {/* Mentor Teacher Card */}
              <View className="border border-orange-200 rounded-2xl bg-orange-50/20 p-2 items-center w-[40%]">
                <Image 
                  source={{ uri: getAvatarUrl(booster.teacher2Avatar) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }} 
                  className="w-12 h-12 rounded-full bg-slate-200"
                />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 font-bold mt-1.5">
                  Mentor Teacher
                </Text>
              </View>
            </View>

            {/* Student Bottom Card */}
            <View className="border border-orange-300 rounded-2xl bg-orange-50/40 p-2 items-center w-[45%]">
              <Image 
                source={{ uri: getAvatarUrl(booster.teacher3Avatar) || 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=100&auto=format&fit=crop&q=80' }} 
                className="w-12 h-12 rounded-full bg-slate-200"
              />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-[#FF5E00] font-bold mt-1.5">
                Student
              </Text>
            </View>

            {/* Visual Vector lines connecting them */}
            <View className="absolute inset-0 items-center justify-center -z-10 mt-6">
              <View className="w-[70%] h-[60px] border-b-[2px] border-l-[2px] border-r-[2px] border-orange-300 rounded-b-2xl border-dashed" />
            </View>
          </View>

          {/* Workflow Schedule Timelines */}
          <View className="mt-8 border-t border-slate-100 pt-6 space-y-4">
            {/* Step 1 */}
            <View className="flex-row justify-between items-center">
              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Prepare Courseware</Text>
              </View>
              
              {/* Timeline dot */}
              <View className="w-5 h-5 rounded-full border border-orange-400 items-center justify-center bg-white">
                <View className="w-2.5 h-2.5 rounded-full bg-[#FF5E00]" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }} />
              </View>

              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Live Class Remind</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View className="flex-row justify-between items-center">
              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Interactive Teaching</Text>
              </View>
              
              {/* Timeline dot */}
              <View className="w-5 h-5 rounded-full border border-orange-400 items-center justify-center bg-white">
                <View className="w-3.5 h-1.5 bg-[#FF5E00] rounded-t-full" />
              </View>

              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Follow Performance</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View className="flex-row justify-between items-center">
              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Homework &amp; Test</Text>
              </View>
              
              {/* Timeline dot */}
              <View className="w-5 h-5 rounded-full bg-[#FF5E00] items-center justify-center" />

              <View className="bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-lg w-[42%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-800 text-center font-bold">Solve Doubt 1on1</Text>
              </View>
            </View>
          </View>
        </View>

        {/* IMMERSIVE & INTERACTIVE LIVE COURSE */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View style={styles.sectionHeaderBadge} className="py-2.5 px-4 rounded-xl mb-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold text-center uppercase tracking-wider">
              {booster.liveSectionTitle || 'Immersive & Interactive LIVE Course'}
            </Text>
          </View>

          {/* Quick pills */}
          <View className="flex-row justify-center space-x-3 mb-4">
            <View className="bg-red-50 border border-red-100 rounded-full py-1 px-4 flex-row items-center">
              <Feather name="video" size={12} color="#EF4444" className="mr-1.5" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }} className="text-red-700 font-bold">Live Session</Text>
            </View>
            <View className="bg-orange-50 border border-orange-100 rounded-full py-1 px-4 flex-row items-center">
              <Ionicons name="sync-circle-outline" size={13} color="#FF5E00" className="mr-1.5" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }} className="text-[#FF5E00] font-bold">Unlimited Replay</Text>
            </View>
          </View>

          {/* Mock Classroom Streaming Stream */}
          <View className="border border-slate-200 rounded-2xl bg-slate-905 overflow-hidden relative">
            {/* Top mini-bar */}
            <View className="bg-slate-800 px-3.5 py-1.5 border-b border-slate-750 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="book-outline" size={11} color="#38BDF8" className="mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-[#38BDF8] font-bold uppercase tracking-wider">Courseware</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="camera" size={10} color="#F1F5F9" className="mr-1" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-slate-300 font-bold">Teacher's LIVE video</Text>
              </View>
            </View>

            {/* Simulated Live landscape screen */}
            <View className="p-3.5 flex-row h-44 justify-between bg-slate-950">
              {/* Question Screen */}
              <View className="w-[62%] bg-white rounded-xl p-3 border border-slate-100 justify-between">
                <View>
                  <View className="bg-blue-600 rounded px-1.5 py-0.5 self-start mb-1">
                    <Text className="text-white text-[7.5px] font-bold">test</Text>
                  </View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-slate-805 leading-tight">
                    Q5. 83, 73, 93, 63, __, 93, 43... What number should fill in the blank?
                  </Text>
                </View>
                
                <View className="flex-row justify-between mt-1 items-center">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-slate-400">A. 53   B. 58   C. 52   D. 49</Text>
                  <View className="bg-blue-600 px-2.5 py-0.5 rounded shadow-sm">
                    <Text className="text-white text-[8px] font-bold">submit</Text>
                  </View>
                </View>
              </View>

              {/* Teacher and comment frame */}
              <View className="w-[34%] justify-between">
                {/* Teacher Video Box */}
                <View className="h-[75px] bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
                  <Image 
                    source={{ uri: getAvatarUrl(booster.teacherCardImage) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }} 
                    className="w-full h-full bg-slate-600"
                  />
                  <View className="absolute bottom-1 left-1 bg-black/40 px-1 rounded">
                    <Text className="text-white text-[7px]">{booster.teacher1Name || 'vikas'}</Text>
                  </View>
                </View>

                {/* Comment feeds */}
                <View className="h-[60px] bg-black/25 p-1.5 rounded-lg justify-end">
                  <Text className="text-white text-[8px] leading-tight"><Text className="text-cyan-300 font-bold">Arjun:</Text> Hi!</Text>
                  <Text className="text-white text-[8px] leading-tight mt-0.5"><Text className="text-cyan-300 font-bold">Rahul:</Text> Morning, vikas</Text>
                </View>
              </View>
            </View>

            {/* Mic Overlay */}
            <View className="bg-[#38BDF8] py-1.5 px-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="mic" size={13} color="white" className="mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-white font-bold">12 students Mic</Text>
              </View>
              
              <View className="flex-row space-x-1.5">
                <View className="bg-white/20 py-0.5 px-2 rounded-full">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(8) }} className="text-white font-medium">Apply for Mic</Text>
                </View>
                <View className="bg-white/20 py-0.5 px-2 rounded-full">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(8) }} className="text-white font-medium">Real-time discussion</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick trust metrics row */}
          <View className="flex-row justify-between mt-6 pt-5 border-t border-slate-105">
            <View className="items-center w-[30%]">
              <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
                <Ionicons name="play-circle" size={18} color="#FF5E00" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-slate-800 font-bold text-center mt-1.5">{booster.trustMetric1Title || 'LIVE Course'}</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">{booster.trustMetric1Subtitle || 'Immersive Replay'}</Text>
            </View>

            <View className="items-center w-[30%]">
              <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
                <Ionicons name="people" size={16} color="#FF5E00" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-slate-800 font-bold text-center mt-1.5">{booster.trustMetric2Title || '1 on 1 Service'}</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">{booster.trustMetric2Subtitle || 'Mentor Support'}</Text>
            </View>

            <View className="items-center w-[30%]">
              <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
                <Ionicons name="shield-checkmark" size={16} color="#FF5E00" />
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-slate-800 font-bold text-center mt-1.5">{booster.trustMetric3Title || 'Quality Guaranteed'}</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">{booster.trustMetric3Subtitle || 'Best Educators'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-24 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-white font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomStickyBar} className="absolute bottom-0 left-0 right-0 py-4.5 px-5 z-40 bg-white border-t border-slate-100 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-baseline">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-[#FF5E00] font-bold">
              ₹{booster.price}
            </Text>
            <Text className="text-slate-400 text-[12px] line-through ml-2">₹{booster.originalPrice}</Text>
          </View>
          <Text className="text-slate-400 text-[9px]">Include taxes</Text>
        </View>

        <TouchableOpacity 
          onPress={() => navigateTo('BOOSTER_SELECT_CLASS')}
          style={styles.enrollButton}
          className="py-3 px-8 rounded-full shadow-sm active:scale-[0.98]"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-white font-bold">
            Reserve Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 2. BOOSTER SELECT CLASS SCREEN
// ==========================================
export const BoosterSelectClassScreen: React.FC = () => {
  const { navigateTo, goBack, selectedClass, setSelectedClass, setIsEnrolled, authPhone } = useApp();
  const [paySheetVisible, setPaySheetVisible] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paySuccess, setPaySuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomepageConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);

  // Fetch configs dynamically upon selectedClass changes
  useEffect(() => {
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setHomeConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load class configuration:', err);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, [selectedClass]);

  const boosterPrice = homeConfig?.boosterCourse?.price ?? 49;
  const boosterOriginalPrice = homeConfig?.boosterCourse?.originalPrice ?? 499;
  const discount = Math.max(0, boosterOriginalPrice - boosterPrice);

  // Create pending order when payment modal opens
  useEffect(() => {
    async function createPendingBoosterOrder() {
      if (paySheetVisible && authPhone) {
        try {
          const res = await createOrder({
            studentPhone: authPhone,
            courseTitle: `Concept Booster Course – 5X Efficient Learning Methods by IITians`,
            classInfo: `${selectedClass} | 6 Jul – 11 Jul`,
            amount: String(boosterPrice),
            couponDiscount: String(discount),
            status: 'pending',
          });
          if (res.success && res.data && res.data._id) {
            setCurrentOrderId(res.data._id);
          }
        } catch (err) {
          console.error('Failed to create pending booster order:', err);
        }
      }
    }
    createPendingBoosterOrder();
  }, [paySheetVisible, authPhone, selectedClass, boosterPrice, discount]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleClassPress = (clsNum: number) => {
    const clsName = `Class ${clsNum}`;
    setSelectedClass(clsName);
    showToast(`Selected ${clsName}`);
  };

  const triggerBoosterPayment = async () => {
    setIsProcessing(true);
    try {
      if (currentOrderId) {
        await updateOrderStatus(currentOrderId, 'paid');
      } else if (authPhone) {
        await createOrder({
          studentPhone: authPhone,
          courseTitle: `Concept Booster Course – 5X Efficient Learning Methods by IITians`,
          classInfo: `${selectedClass} | 6 Jul – 11 Jul`,
          amount: String(boosterPrice),
          couponDiscount: String(discount),
          status: 'paid',
        });
      }
    } catch (err) {
      console.error('Failed to save order to database:', err);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setPaySuccess(true);
      setTimeout(() => {
        setPaySheetVisible(false);
        setPaySuccess(false);
        setIsEnrolled(true);
        showToast(`Successfully enrolled in Concept Booster Course for ${selectedClass}! 🚀`);
        setTimeout(() => {
          navigateTo('DASHBOARD');
        }, 1200);
      }, 1500);
    }, 2250);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#FF5E00" />

      {/* TOP HEADER */}
      <View className="bg-[#FF5E00] px-4 py-3.5 flex-row items-center justify-between">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-white font-bold text-center flex-1 mr-6 uppercase tracking-wider">
          oda class | MOST INNOVATIVE ED-TECH
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 bg-white"
      >
        <View className="px-5 pt-5">
          {/* Main Title */}
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(17.5) }} className="text-slate-800 font-bold leading-snug">
            Concept Booster Course - 5X Efficient Learning Methods by IITians
          </Text>

          <View className="flex-row items-center mt-3 mb-5">
            <Feather name="clock" size={13} color="#64748B" />
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-500 ml-1.5">
              Course Schedule: 6 Jul - 11 Jul
            </Text>
          </View>

          {/* Grid Label */}
          <View className="flex-row items-center mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-700 font-bold">
              Choose Class to Boost Score (2026-27)
            </Text>
            <Text className="ml-1 text-xs">🔥</Text>
          </View>

          {/* Class Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
              const clsName = `Class ${num}`;
              const isSelected = selectedClass === clsName;
              const isSoldOut = num >= 10;

              if (isSoldOut) {
                return (
                  <View 
                    key={num} 
                    style={styles.soldOutButton}
                    className="w-[23%] py-2.5 rounded-xl border border-slate-200 items-center justify-center bg-slate-50"
                  >
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-slate-400 font-medium text-center">
                      Class {num}
                    </Text>
                    <Text className="text-slate-400 text-[7px] text-center mt-0.5 uppercase">(sold out)</Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity 
                  key={num}
                  onPress={() => handleClassPress(num)}
                  style={[
                    styles.classButton,
                    isSelected && styles.classButtonSelected
                  ]}
                  className="w-[23%] py-3.5 rounded-xl border border-orange-200 items-center justify-center active:scale-[0.96]"
                >
                  <Text 
                    style={{ 
                      fontFamily: Theme.fonts.poppinsBold,
                      color: isSelected ? '#FFFFFF' : '#FF5E00',
                      fontSize: getFontSize(12)
                    }} 
                    className="font-bold text-center leading-none"
                  >
                    Class {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Extra Materials banner */}
          <View className="bg-orange-50/45 border border-orange-100 rounded-3xl p-4.5 flex-row items-center justify-between mt-3">
            <View className="flex-1 pr-3">
              <View className="bg-[#FF5E00] px-2 py-0.5 rounded self-start mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(8) }} className="text-white font-bold">MATHS &amp; SCIENCE</Text>
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14) }} className="text-slate-800 font-bold">
                Extra Materials
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-[#FF5E00] font-medium mt-1">* Collect after enrolled</Text>
            </View>

            {/* Simulated Books visual */}
            <View className="w-20 h-16 bg-white border border-slate-100 rounded-xl items-center justify-center shadow-sm">
              <Ionicons name="book" size={24} color="#FF5E00" />
            </View>
          </View>

          {/* Trusted indicators */}
          <View className="items-center justify-center mt-8 py-4 border-t border-slate-100">
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(9.5) }} className="text-slate-400 uppercase tracking-widest">Trusted by 10,000,000+ Students</Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-slate-450 mt-1">
              Only Today Be the <Text className="text-orange-600 font-bold">1913261th</Text> Student
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-24 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11) }} className="text-white font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}

      {/* STICKY BOTTOM FEES & CHECKOUT */}
      <View style={styles.bottomStickyBar} className="absolute bottom-0 left-0 right-0 py-4.5 px-5 z-40 bg-[#FFF7ED] flex-row items-center justify-between border-t border-orange-100">
        <View>
          <View className="flex-row items-baseline">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(22) }} className="text-[#FF5E00] font-bold">
              ₹{boosterPrice}
            </Text>
            <Text className="text-slate-400 text-[12px] line-through ml-2">₹{boosterOriginalPrice}</Text>
          </View>
          <Text className="text-slate-400 text-[9.5px]">Include taxes</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setPaySheetVisible(true)}
          style={styles.enrollButton}
          className="py-3 px-10 rounded-full active:scale-[0.98] shadow-sm"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15.5) }} className="text-white font-bold">
            Enroll Now
          </Text>
        </TouchableOpacity>
      </View>
 
      {/* SECURE PAYMENT MODAL */}
      <Modal
        visible={paySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaySheetVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end z-50">
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => !isProcessing && setPaySheetVisible(false)} 
          />
          
          <View className="bg-white rounded-t-3xl p-6 min-h-[350px] shadow-2xl relative">
            {/* Header */}
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold">
                  Oda Class Secure Payment
                </Text>
                <Text className="text-slate-450 text-[10px] mt-0.5">Powered by Razorpay / Gateway</Text>
              </View>
              <View className="items-end">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-lg font-bold">
                  ₹{boosterPrice}.00
                </Text>
              </View>
            </View>

            {isProcessing ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#FF5E00" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-650 text-sm font-bold mt-4 text-center">
                  Processing payment security block...
                </Text>
                <Text className="text-slate-400 text-xs mt-1 text-center">Do not close the screen</Text>
              </View>
            ) : paySuccess ? (
              <View className="flex-1 items-center justify-center py-12">
                <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                  <Feather name="check" size={32} color="#10B981" />
                </View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold text-center">
                  Payment Successful!
                </Text>
                <Text className="text-slate-400 text-xs mt-1 text-center">Course seat reserved successfully.</Text>
              </View>
            ) : (
              <View className="py-4">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-xs uppercase tracking-wider mb-3">
                  Select payment mode
                </Text>

                {/* Options */}
                <View className="space-y-3">
                  <TouchableOpacity 
                    onPress={triggerBoosterPayment}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="google-play" size={20} color="#3B82F6" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">GPay / Google Pay</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={triggerBoosterPayment}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="wallet-outline" size={20} color="#7C3AED" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">PhonePe</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={triggerBoosterPayment}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="credit-card-outline" size={20} color="#EF4444" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">Credit / Debit Card</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={triggerBoosterPayment}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="qrcode-scan" size={20} color="#059669" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">UPI ID or QR Scan</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                {/* Cancel button */}
                <TouchableOpacity 
                  onPress={() => setPaySheetVisible(false)}
                  className="bg-slate-100 py-3 rounded-full mt-6 items-center"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-600 text-xs font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  detailsHero: {
    backgroundColor: '#FF5E00',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  sectionHeaderBadge: {
    backgroundColor: '#FF9800',
  },
  classButton: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFE3D3',
  },
  classButtonSelected: {
    backgroundColor: '#FF5E00',
    borderColor: '#EA580C',
  },
  soldOutButton: {
    backgroundColor: '#F1F5F9',
  },
  enrollButton: {
    backgroundColor: '#FF5E00',
  },
  bottomStickyBar: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  }
});
