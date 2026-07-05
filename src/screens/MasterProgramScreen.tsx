import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions, 
  StatusBar,
  Animated,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

type TabType = 'Course' | 'Outline' | 'Ratings' | 'Details';

export const MasterProgramScreen: React.FC = () => {
  const { goBack, navigateTo, selectedClass } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('Course');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [teacherIndex, setTeacherIndex] = useState<number>(0);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Approximate section offsets for the scrollTo implementation
  const sectionOffsets: Record<TabType, number> = {
    Course: 0,
    Outline: 540,
    Ratings: 940,
    Details: 1530
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({
      y: sectionOffsets[tab],
      animated: true
    });
  };

  const handleScroll = (event: any) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    // Dynamically highlight tab based on scroll position
    if (yOffset < sectionOffsets.Outline - 50) {
      setActiveTab('Course');
    } else if (yOffset >= sectionOffsets.Outline - 50 && yOffset < sectionOffsets.Ratings - 50) {
      setActiveTab('Outline');
    } else if (yOffset >= sectionOffsets.Ratings - 50 && yOffset < sectionOffsets.Details - 50) {
      setActiveTab('Ratings');
    } else {
      setActiveTab('Details');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-50">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold }}
          className="text-slate-800 text-[17px] font-bold text-center flex-1"
        >
          Limited Time Offer
        </Text>
        
        <TouchableOpacity onPress={() => showToast("Share Link Copied!")} className="p-1">
          <Feather name="share-2" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* STICKY ROUTING TABS */}
      <View className="flex-row justify-around border-b border-slate-100 bg-white py-2 z-50 shadow-sm">
        {(['Course', 'Outline', 'Ratings', 'Details'] as TabType[]).map((tab) => {
          const isSelected = activeTab === tab;
          const hasPin = (tab === 'Outline' || tab === 'Details') && isSelected;
          
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => handleTabPress(tab)}
              className="flex-row items-center py-1.5 px-3 rounded-full"
            >
              {hasPin && (
                <Ionicons name="location-sharp" size={13} color="#00B6A6" className="mr-0.5" />
              )}
              <Text 
                style={{ 
                  fontFamily: isSelected ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                  color: isSelected ? '#00B6A6' : '#64748B'
                }}
                className="text-[12.5px]"
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MAIN PROMOPAGE SCROLLABLE CONTENT */}
      <ScrollView 
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-slate-50"
      >
        {/* SECTION 1: COURSE SECTION */}
        <View className="bg-white pb-6">
          {/* ORANGE HERO GRADIENT CONTAINER */}
          <View style={styles.heroContainer} className="p-5 overflow-hidden">
            {/* Oda 5.0 pill */}
            <View className="flex-row items-center mb-3">
              <View className="bg-white/20 border border-white/20 px-3 py-1 rounded-full">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[10px] font-bold">
                  Oda 5.0
                </Text>
              </View>
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-white text-[28px] font-bold tracking-tight leading-none mb-4"
            >
              2026 Master Program
            </Text>

            {/* Beige subjects card */}
            <View className="bg-[#FFFBF0] rounded-xl p-3 border border-[#FDE68A] shadow-sm mb-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#9A3412] text-xs font-bold uppercase tracking-wider">
                Full Subjects:
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#1E293B] text-[13.5px] font-bold mt-0.5">
                Maths, Science, English, MAT, CS
              </Text>
            </View>

            {/* Metrics horizontal bar */}
            <View className="flex-row justify-between items-center bg-black/10 py-2.5 px-4 rounded-xl mt-2">
              <Text className="text-white text-[11px] font-semibold">
                <Text className="text-yellow-300 font-bold">400+</Text> Courses
              </Text>
              <Text className="text-white text-[11px] font-semibold">
                <Text className="text-yellow-300 font-bold">200+</Text> Concepts
              </Text>
              <Text className="text-white text-[11px] font-semibold">
                <Text className="text-yellow-300 font-bold">5000+</Text> Quizzes
              </Text>
            </View>
          </View>

          {/* INTRO TEXTS */}
          <View className="px-5 mt-4">
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-800 text-[17px] font-bold leading-snug"
            >
              LIVE Interactive Full Syllabus Course for {selectedClass} (2026-27)
            </Text>

            <View className="flex-row items-center mt-2">
              <Feather name="clock" size={13} color="#64748B" />
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-xs ml-1">
                LIVE at 7:00 pm, Tomorrow
              </Text>
            </View>

            {/* Subject pill tags */}
            <View className="flex-row flex-wrap mt-3.5 gap-1.5">
              <View className="bg-teal-50 border border-teal-100 rounded-md px-2 py-0.5">
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-[#00B6A6] text-[10px] font-medium">
                  Maths & English & Science & MAT & CS
                </Text>
              </View>
            </View>

            {/* Teal Price */}
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-[#00B6A6] text-[25px] font-bold mt-4"
            >
              ₹31,999
            </Text>
          </View>

          <View className="w-full h-[1px] bg-slate-100 my-5" />

          {/* TEACHER CAROUSEL */}
          <View className="px-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold mb-3">
              Master Teacher (9)
            </Text>

            {/* Slider container */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                setTeacherIndex(index);
              }}
              contentContainerStyle={{ gap: 10 }}
            >
              {/* Card 1: Charutha */}
              <View style={styles.carouselCard} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row justify-between relative shadow-sm">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold">
                      Charutha
                    </Text>
                    <View className="bg-red-500 rounded px-1.5 py-0.5 ml-2">
                      <Text className="text-white text-[8px] font-bold">92.3% Liked</Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-xs mt-1">SST · Master Teacher</Text>
                  
                  <TouchableOpacity 
                    onPress={() => showToast("Loading Charutha biography...")}
                    className="bg-[#EF4444] py-1.5 px-3 rounded-full items-center justify-center mt-6 w-24"
                  >
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[10px] font-bold">
                      Learn More &gt;
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center mt-5">
                    <View className="flex-row mr-1.5">
                      {[1,2,3,4,5].map((s) => (
                        <Ionicons key={s} name="star" size={10} color="#EAB308" />
                      ))}
                    </View>
                    <Text className="text-slate-450 text-[9px]">RI**en just rated 5-star</Text>
                  </View>
                </View>

                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' }} 
                  className="w-24 h-28 rounded-xl bg-slate-200"
                />
              </View>

              {/* Card 2: Vikas Sir */}
              <View style={styles.carouselCard} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row justify-between relative shadow-sm">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold">
                      Vikas Sir
                    </Text>
                    <View className="bg-teal-500 rounded px-1.5 py-0.5 ml-2">
                      <Text className="text-white text-[8px] font-bold">99.7% Liked</Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-xs mt-1">Physics · NIT.S Expert</Text>
                  
                  <TouchableOpacity 
                    onPress={() => showToast("Loading Vikas Sir biography...")}
                    className="bg-[#EF4444] py-1.5 px-3 rounded-full items-center justify-center mt-6 w-24"
                  >
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[10px] font-bold">
                      Learn More &gt;
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center mt-5">
                    <View className="flex-row mr-1.5">
                      {[1,2,3,4,5].map((s) => (
                        <Ionicons key={s} name="star" size={10} color="#EAB308" />
                      ))}
                    </View>
                    <Text className="text-slate-450 text-[9px]">An**a just rated 5-star</Text>
                  </View>
                </View>

                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }} 
                  className="w-24 h-28 rounded-xl bg-slate-200"
                />
              </View>
            </ScrollView>

            {/* Slider Dots */}
            <View className="flex-row justify-center mt-3 gap-1.5">
              {[0, 1].map((dot) => (
                <View 
                  key={dot}
                  className={`w-2 h-2 rounded-full ${teacherIndex === dot ? 'bg-[#FF5E00]' : 'bg-slate-350'}`}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 2: COURSE OUTLINE SECTION */}
        <View className="bg-white py-6 px-5">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[18px] font-bold">
            Course Outline
          </Text>
          <Text style={{ fontFamily: Theme.fonts.poppinsRegular }} className="text-slate-450 text-xs mt-1">
            The course outline will increase gradually as the course continues
          </Text>

          {/* List items */}
          <View className="mt-5 space-y-4">
            {/* Outline 1 */}
            <View className="flex-row border-b border-slate-100 pb-3">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-300 text-[20px] font-bold w-8">
                1
              </Text>
              <View className="flex-1">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[13.5px] font-bold leading-snug">
                  Maths - Geometry | Points, Lines, Rays & Line Segments
                </Text>
                <Text className="text-slate-450 text-[11px] mt-1">
                  7:00 pm - 7:50 pm, 15 Jun Arham
                </Text>
              </View>
            </View>

            {/* Outline 2 */}
            <View className="flex-row border-b border-slate-100 pb-3">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-300 text-[20px] font-bold w-8">
                2
              </Text>
              <View className="flex-1">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[13.5px] font-bold leading-snug">
                  Maths - Geometry | Measurement of Line Segments | Curves
                </Text>
                <Text className="text-slate-450 text-[11px] mt-1">
                  7:00 pm - 7:50 pm, 16 Jun Arham
                </Text>
              </View>
            </View>

            {/* Outline 3 */}
            <View className="flex-row border-b border-slate-100 pb-3">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-300 text-[20px] font-bold w-8">
                3
              </Text>
              <View className="flex-1">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[13.5px] font-bold leading-snug">
                  CS - Operating System & File Management | Files and Folders
                </Text>
                <Text className="text-slate-450 text-[11px] mt-1">
                  8:15 pm - 9:00 pm, 16 Jun Sri Sahithi
                </Text>
              </View>
            </View>
          </View>

          {/* View More outline */}
          <TouchableOpacity 
            onPress={() => showToast("Expanding course outline...")}
            className="border border-slate-200 rounded-full py-2.5 items-center justify-center mt-5 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-600 text-xs font-bold">
              View More
            </Text>
          </TouchableOpacity>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 3: RATINGS SECTION */}
        <View className="bg-white py-6 px-5">
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[18px] font-bold">
              Ratings (2169812)
            </Text>
            {/* Rating count pill */}
            <View className="bg-[#00B6A6] px-2 py-0.5 rounded flex-row items-center">
              <Ionicons name="star" size={10} color="white" />
              <Text className="text-white text-[11px] font-bold ml-1">4.7</Text>
            </View>
          </View>

          {/* Horizontal scroll selection tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 gap-2">
            <View className="bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 mr-2">
              <Text className="text-slate-655 text-[10.5px]">Energetic Teaching(556133)</Text>
            </View>
            <View className="bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 mr-2">
              <Text className="text-slate-655 text-[10.5px]">Super Worthy(513807)</Text>
            </View>
            <View className="bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 mr-2">
              <Text className="text-slate-655 text-[10.5px]">Highly Recommended(496025)</Text>
            </View>
          </ScrollView>

          {/* Testimonial review card */}
          <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-slate-200 items-center justify-center mr-2">
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                </View>
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[12px] font-bold">
                    Not_Dumb_girl_Ananya
                  </Text>
                  <Text className="text-slate-400 text-[8.5px] mt-0.5">30 Jun, 2026</Text>
                </View>
              </View>

              <View className="flex-row">
                {[1,2,3,4,5].map((s) => (
                  <Ionicons key={s} name="star" size={10} color="#EAB308" className="mr-0.5" />
                ))}
              </View>
            </View>

            {/* Testimonial Tag Row */}
            <View className="flex-row mt-2 gap-1.5">
              {['Highly Recommended', 'Calm & Rigorous', 'Inspirational'].map((tg, idx) => (
                <View key={idx} className="bg-white border border-slate-150 px-2 py-0.5 rounded-full">
                  <Text className="text-slate-500 text-[8.5px]">{tg}</Text>
                </View>
              ))}
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsMedium }}
              className="text-slate-700 text-xs mt-3 leading-relaxed"
            >
              Very fun class. I have a mini game for you play. Keep scrolling and keep your finger on the dashboard.
            </Text>
            
            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-[#00B6A6] text-[10px]">Session: Robotics | Light it UP in Patterns!</Text>
              <View className="flex-row items-center">
                <Ionicons name="thumbs-up-outline" size={12} color="#00B6A6" />
                <Text className="text-[#00B6A6] text-[10px] ml-1">8</Text>
              </View>
            </View>
          </View>

          {/* View All button */}
          <TouchableOpacity 
            onPress={() => showToast("Opening ratings portal...")}
            className="border border-slate-200 rounded-full py-2.5 items-center justify-center mt-5 active:bg-slate-50"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-600 text-xs font-bold">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 4: DETAILS */}
        <View className="bg-white py-6">
          <View className="px-5 mb-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[18px] font-bold">
              Course Details
            </Text>
          </View>

          {/* Orange gradient details banner card */}
          <View style={styles.detailsHero} className="mx-5 p-5 rounded-2xl overflow-hidden mb-6">
            <View className="bg-white/20 border border-white/20 px-3 py-1 rounded-full w-20 mb-3">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[10px] font-bold text-center">
                Oda 5.0
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-xl font-bold mb-3">
              2026 Master Program
            </Text>
            <View className="bg-[#FFFBF0]/95 rounded-lg p-2.5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#9A3412] text-[11px] font-bold uppercase">
                Full Subjects:
              </Text>
              <Text className="text-[#1E293B] text-[12.5px] mt-0.5">
                Maths, Science, English, MAT, CS
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-4">
              <Text className="text-white text-[10.5px]">400+ Courses</Text>
              <Text className="text-white text-[10.5px]">200+ Concepts</Text>
              <Text className="text-white text-[10.5px]">5000+ Quizzes</Text>
            </View>
          </View>

          {/* IIT FACULTY BLOCK */}
          <View className="px-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[18px] font-bold text-center leading-tight">
              Turbocharged Faculty Than Ever
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-600 text-xs text-center mt-1">
              Brand-New IIT/NIT Star Experts
            </Text>

            {/* Vikas Sir profile showcase card */}
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mt-5 items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[20px] font-bold mt-1">
                Vikas Sir
              </Text>
              
              <View className="bg-orange-100 border border-orange-200 px-3 py-0.5 rounded-full mt-1.5">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[9.5px] font-bold uppercase tracking-wider">
                  NIT.S Expert
                </Text>
              </View>

              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' }} 
                className="w-48 h-52 bg-slate-200 rounded-2xl mt-4"
              />

              <View className="flex-row items-center mt-4 bg-white/80 py-1.5 px-4 rounded-full border border-slate-100">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-emerald-500 text-base font-bold">
                  99.7% 👍
                </Text>
              </View>
            </View>

            {/* Group Photo of 20+ IIT/NIT Teachers */}
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mt-6 items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[16px] font-bold">
                Superior Teaching Team
              </Text>
              
              {/* Group avatar stack mockup */}
              <View className="flex-row items-center justify-center my-4 space-x-[-12px]">
                {[1,2,3,4,5].map((i) => (
                  <View key={i} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm bg-slate-200">
                    <Ionicons name="person" size={24} color="#CBD5E1" className="mt-2 ml-2" />
                  </View>
                ))}
              </View>

              <View className="flex-row justify-center gap-2 mt-2">
                <View className="bg-purple-100 px-3 py-1 rounded-full">
                  <Text className="text-purple-700 text-[10px] font-bold">20+ IIT/NIT Teachers</Text>
                </View>
                <View className="bg-pink-100 px-3 py-1 rounded-full">
                  <Text className="text-pink-700 text-[10px] font-bold">Good Rate Avg. 98.6%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SEPARATOR */}
          <View className="w-full h-[1px] bg-slate-100 my-8" />

          {/* STEM EDUCATION SYSTEM */}
          <View className="px-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[18px] font-bold text-center leading-tight">
              Innovatively Enhanced Teaching System
            </Text>
            
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mt-5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold text-center">
                Futuristic STEM Philosophy
              </Text>
              
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-[11px] text-center mt-2 px-4 leading-relaxed">
                Cross-Disciplinary Education {"\n"} Cultivating Networked Cognitive Skills
              </Text>

              {/* Concentric Funnel Circles Graphic representing STEM */}
              <View className="w-full items-center justify-center py-6">
                <View className="w-56 h-36 items-center justify-center relative">
                  {/* STEM funnel layered loops */}
                  <View className="absolute w-44 h-10 rounded-full border-2 border-red-400 bg-red-50/20 top-2 items-center justify-center">
                    <Text className="text-red-600 text-[9px] font-bold uppercase tracking-wider">Science</Text>
                  </View>
                  <View className="absolute w-36 h-9 rounded-full border-2 border-orange-400 bg-orange-50/20 top-10 items-center justify-center">
                    <Text className="text-orange-600 text-[9px] font-bold uppercase tracking-wider">Technology</Text>
                  </View>
                  <View className="absolute w-28 h-8 rounded-full border-2 border-teal-400 bg-teal-50/20 top-18 items-center justify-center">
                    <Text className="text-teal-600 text-[9px] font-bold uppercase tracking-wider">Engineering</Text>
                  </View>
                  <View className="absolute w-20 h-7 rounded-full border-2 border-purple-400 bg-purple-50/20 top-26 items-center justify-center">
                    <Text className="text-purple-600 text-[9px] font-bold uppercase tracking-wider">Maths</Text>
                  </View>
                </View>
                
                {/* Arrow anchors mapping to subjects */}
                <View className="flex-row justify-around w-full mt-4">
                  {['Maths', 'English', 'Social Study', 'Science', 'CS', 'Mental Ability'].map((sub, idx) => (
                    <View key={idx} className="items-center w-[15%]">
                      <Feather name="arrow-up" size={10} color="#94A3B8" />
                      <Text className="text-slate-500 text-[8px] mt-0.5 text-center font-medium">{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Three customized badge labels */}
              <View className="flex-row justify-between mt-4 gap-2">
                <View className="bg-purple-50 p-2.5 rounded-xl items-center justify-center flex-1 border border-purple-100">
                  <Text className="text-purple-700 text-[9px] font-bold text-center">Critical Thinking</Text>
                </View>
                <View className="bg-teal-50 p-2.5 rounded-xl items-center justify-center flex-1 border border-teal-100">
                  <Text className="text-teal-700 text-[9px] font-bold text-center">Problem Solving</Text>
                </View>
                <View className="bg-amber-50 p-2.5 rounded-xl items-center justify-center flex-1 border border-amber-100">
                  <Text className="text-amber-700 text-[9px] font-bold text-center">Innovative Thinking</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CURRICULUM FRAMEWORK */}
          <View className="px-5 mt-6">
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold text-center">
                Pioneering Curriculum Framework
              </Text>

              {/* Pyramid Graphic with 5 layers */}
              <View className="items-center py-6 w-full">
                <View className="items-center relative w-full">
                  {/* Layer 1 - Peak */}
                  <View style={{ width: '40%', height: 16, backgroundColor: '#EF4444', borderTopLeftRadius: 6, borderTopRightRadius: 6, justifyContent: 'center', alignItems: 'center' }} className="mb-0.5">
                    <Text className="text-white text-[7.5px] font-bold">Practice-oriented & Driven</Text>
                  </View>
                  {/* Layer 2 */}
                  <View style={{ width: '53%', height: 16, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' }} className="mb-0.5">
                    <Text className="text-white text-[7.5px] font-bold">Exploratory Cultivation</Text>
                  </View>
                  {/* Layer 3 */}
                  <View style={{ width: '66%', height: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }} className="mb-0.5">
                    <Text className="text-white text-[7.5px] font-bold">Progressive Mastery</Text>
                  </View>
                  {/* Layer 4 */}
                  <View style={{ width: '79%', height: 16, backgroundColor: '#00B6A6', justifyContent: 'center', alignItems: 'center' }} className="mb-0.5">
                    <Text className="text-white text-[7.5px] font-bold">Modular Teaching</Text>
                  </View>
                  {/* Layer 5 */}
                  <View style={{ width: '92%', height: 16, backgroundColor: '#6366F1', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, justifyContent: 'center', alignItems: 'center' }}>
                    <Text className="text-white text-[7.5px] font-bold">Full Syllabus</Text>
                  </View>
                </View>
              </View>

              {/* Tag rows below pyramid */}
              <View className="space-y-2 mt-2">
                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded px-2 py-0.5 mr-2 w-20">
                    <Text className="text-purple-700 text-[10px] font-bold text-center">10-month</Text>
                  </View>
                  <Text className="text-slate-600 text-xs font-semibold">IIT faculty syllabus refined</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded px-2 py-0.5 mr-2 w-20">
                    <Text className="text-purple-700 text-[10px] font-bold text-center">6 rounds</Text>
                  </View>
                  <Text className="text-slate-600 text-xs font-semibold">group lesson practice</Text>
                </View>

                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded px-2 py-0.5 mr-2 w-20">
                    <Text className="text-purple-700 text-[10px] font-bold text-center">150%</Text>
                  </View>
                  <Text className="text-slate-600 text-xs font-semibold">knowledge coverage & expansion</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SEPARATOR */}
          <View className="w-full h-[1px] bg-slate-100 my-8" />

          {/* MODERN LEARNING EXPERIENCE (AI MODEL 2.0) */}
          <View className="px-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[18px] font-bold text-center leading-tight">
              Modern Learning Experience
            </Text>
            
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mt-5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold text-center">
                Next-Level AI Model 2.0
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-[10px] text-center mt-1">
                Trained daily with billion-level data
              </Text>

              {/* Graphic stack of AI blocks */}
              <View className="py-6 items-center">
                <View className="w-full items-center space-y-2">
                  <View className="bg-white border border-indigo-100 rounded-xl px-4 py-2 w-56 shadow-sm items-center">
                    <Text className="text-indigo-600 text-[11px] font-bold">AI dynamic assessment</Text>
                  </View>
                  <View className="bg-white border border-indigo-100 rounded-xl px-4 py-2 w-56 shadow-sm items-center">
                    <Text className="text-indigo-600 text-[11px] font-bold">AI personalized analysis</Text>
                  </View>
                  <View className="bg-white border border-indigo-100 rounded-xl px-4 py-2 w-56 shadow-sm items-center">
                    <Text className="text-indigo-600 text-[11px] font-bold">AI intelligent grading</Text>
                  </View>
                  <View className="bg-white border border-indigo-100 rounded-xl px-4 py-2 w-56 shadow-sm items-center">
                    <Text className="text-indigo-600 text-[11px] font-bold">AI capability prediction</Text>
                  </View>
                  <View className="bg-white border border-indigo-100 rounded-xl px-4 py-2 w-56 shadow-sm items-center">
                    <Text className="text-indigo-600 text-[11px] font-bold">AI question bank</Text>
                  </View>
                </View>
              </View>

              {/* Rising path metrics chart */}
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold text-center mt-3 uppercase tracking-wider">
                Efficiency Improvements
              </Text>
              
              <View className="py-4 items-center">
                <View className="w-full flex-row justify-around mt-2">
                  {[
                    { val: '27% ↑', lbl: 'Evaluate Accuracy' },
                    { val: '36% ↑', lbl: 'Processing Speed' },
                    { val: '41% ↑', lbl: 'Aspect Coverage' },
                    { val: '74% ↑', lbl: 'Teaching Efficiency' }
                  ].map((chart, idx) => (
                    <View key={idx} className="items-center w-[22%]">
                      <View className="bg-[#E0F2FE] border border-[#bae6fd] w-12 h-12 rounded-full items-center justify-center shadow-sm">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#0284c7] text-[10px] font-bold">
                          {chart.val}
                        </Text>
                      </View>
                      <Text className="text-slate-500 text-[7px] text-center mt-1 font-semibold leading-tight">
                        {chart.lbl}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="text-slate-400 text-[7.5px] italic text-center mt-4">
                  *Data Comparison September 2023
                </Text>
              </View>
            </View>
          </View>

          {/* INTERESTING & INNOVATIVE (STABLE STREAMING) */}
          <View className="px-5 mt-6">
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[16px] font-bold text-center">
                Interesting & Innovative
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-[10px] text-center mt-1 px-4 leading-snug">
                Most Stable Live Streaming for 100,000+ Simultaneous Students
              </Text>

              {/* Smartphone mock simulating "Class Space" */}
              <View className="bg-slate-900 rounded-2xl p-3 border border-slate-800 mt-5 w-full">
                <View className="bg-white rounded-xl p-3 h-48 justify-between">
                  <View className="flex-row items-center justify-between pb-1 border-b border-slate-100">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[9px] font-bold">
                      Class Space
                    </Text>
                    <Text className="text-slate-400 text-[7px]">Master Program Space</Text>
                  </View>

                  <View className="flex-1 justify-center">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-teal-600 text-[9.5px] font-bold text-center">
                      Diligent Students
                    </Text>
                    <Text className="text-slate-500 text-[8px] text-center mt-1 leading-snug">
                      Students attended free open session to improve ahead yesterday. Well done.
                    </Text>
                  </View>

                  {/* Student mock avatar strip */}
                  <View className="flex-row items-center justify-center space-x-1.5">
                    {[1,2,3,4].map((s) => (
                      <View key={s} className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200" />
                    ))}
                    <Text className="text-slate-400 text-[7px] ml-1">18+</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* PROFESSIONAL TUTORING */}
          <View className="px-5 mt-6">
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[16px] font-bold text-center leading-tight">
                Professional Tutoring By {"\n"} Mentor Teachers
              </Text>

              {/* Tutoring Triangle diagram */}
              <View className="py-6 items-center justify-center">
                <View className="w-52 h-32 relative">
                  {/* Parent Circle top left */}
                  <View className="absolute left-0 top-0 items-center">
                    <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center border border-indigo-200 shadow-sm">
                      <Ionicons name="people" size={18} color="#4F46E5" />
                    </View>
                    <View className="bg-indigo-600 rounded px-1.5 py-0.5 mt-1">
                      <Text className="text-white text-[7.5px] font-bold">Parent</Text>
                    </View>
                  </View>

                  {/* Student Circle top right */}
                  <View className="absolute right-0 top-0 items-center">
                    <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center border border-purple-200 shadow-sm">
                      <Ionicons name="school" size={18} color="#9333EA" />
                    </View>
                    <View className="bg-purple-600 rounded px-1.5 py-0.5 mt-1">
                      <Text className="text-white text-[7.5px] font-bold">Student</Text>
                    </View>
                  </View>

                  {/* Mentor Circle bottom center */}
                  <View className="absolute bottom-0 left-[76px] items-center">
                    <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center border border-pink-200 shadow-sm">
                      <Ionicons name="person-add" size={18} color="#DB2777" />
                    </View>
                    <View className="bg-pink-600 rounded px-1.5 py-0.5 mt-1">
                      <Text className="text-white text-[7.5px] font-bold">Mentor</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tutoring stats rows */}
              <View className="space-y-3 mt-2 px-1">
                <View className="flex-row">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold w-16">Daily</Text>
                  <Text className="text-slate-600 text-xs flex-1">Doubts Clear & Supervision</Text>
                </View>
                <View className="flex-row">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold w-16">Weekly</Text>
                  <Text className="text-slate-600 text-xs flex-1">Study Progress Contact</Text>
                </View>
                <View className="flex-row">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold w-16">Monthly</Text>
                  <Text className="text-slate-600 text-xs flex-1">Online Parent - Teacher Meeting</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SEPARATOR */}
          <View className="w-full h-[1px] bg-slate-100 my-8" />

          {/* TOP TEACHING RESULTS & Summit Award */}
          <View className="px-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[18px] font-bold text-center leading-tight">
              Top Teaching Results {"\n"} Top Student Reviews
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-center text-xs mt-1.5">
              Over 10 million students {"\n"}
              Average score increase of <Text className="text-[#FF5E00] font-bold">46.7%</Text>
            </Text>

            {/* Student grid reviews list */}
            <View className="flex-row justify-between mt-5 flex-wrap gap-2">
              {[
                { name: 'Aarav', pct: '+71%' },
                { name: 'Anaya', pct: '+37%' },
                { name: 'Rohan', pct: '+51%' }
              ].map((stud, idx) => (
                <View key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 items-center w-[30%]">
                  <View className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300" />
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[10.5px] font-bold mt-1.5">{stud.name}</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-xs font-bold mt-0.5">{stud.pct}</Text>
                </View>
              ))}
            </View>

            {/* Chat Bubble feedback */}
            <View className="mt-5 space-y-2">
              <View className="bg-slate-50 border border-slate-100 rounded-2xl p-3 self-start mr-8">
                <Text className="text-slate-600 text-[10.5px]">Oda is revolutionizing online learning!</Text>
              </View>
              <View className="bg-slate-50 border border-slate-100 rounded-2xl p-3 self-end ml-8">
                <Text className="text-slate-600 text-[10.5px]">Incredible courses! Oda makes learning fun!</Text>
              </View>
              <View className="bg-slate-50 border border-slate-100 rounded-2xl p-3 self-start mr-8">
                <Text className="text-slate-600 text-[10.5px]">Seriously, learning has never been easier!</Text>
              </View>
            </View>

            {/* Brand Summit Award display */}
            <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mt-6 items-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#FF5E00] text-[14.5px] font-bold text-center leading-tight">
                Won Emerging Brand Award at 2024 Brand Vision Summit
              </Text>
              
              <View style={styles.awardBox} className="mt-4 p-4 border border-blue-100 rounded-2xl w-full items-center justify-center overflow-hidden">
                <Ionicons name="trophy" size={54} color="#D97706" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold mt-2 text-center">
                  Brand Vision Summit 2024
                </Text>
                <Text className="text-slate-500 text-[9px] text-center mt-1">
                  Presented to Oda Class {"\n"} Emerging Brand - EdTech Platform
                </Text>
              </View>
            </View>
          </View>

          {/* VERIFIED TRUST */}
          <View className="px-5 mt-8 items-center">
            <View className="bg-[#FFFDF5] border border-[#FEF3C7] rounded-3xl p-6 items-center w-full">
              <Text className="text-slate-400 text-[10.5px] uppercase tracking-widest font-bold">Trusted by</Text>
              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold }}
                className="text-[#D97706] text-[34px] font-bold leading-none my-1"
              >
                20,103,026
              </Text>
              <Text className="text-slate-600 text-xs font-semibold text-center leading-snug">
                parents and students {"\n"} oda class
              </Text>
            </View>
          </View>

          {/* ICON BADGES */}
          <View className="flex-row justify-around px-5 mt-8 border-t border-slate-100 pt-6">
            <View className="items-center w-[30%]">
              <Ionicons name="play-circle-outline" size={24} color="#64748B" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-[10px] font-bold text-center mt-1">LIVE Course</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">Immersive course & replay</Text>
            </View>

            <View className="items-center w-[30%]">
              <Ionicons name="people-outline" size={24} color="#64748B" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-[10px] font-bold text-center mt-1">2-Teacher Mode</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">Dual mentors support</Text>
            </View>

            <View className="items-center w-[30%]">
              <Ionicons name="shield-checkmark-outline" size={24} color="#64748B" />
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-[10px] font-bold text-center mt-1">Quality Guaranteed</Text>
              <Text className="text-slate-400 text-[8px] text-center mt-0.5">Learn with IITian experts</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-24 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-white text-[11px] font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomStickyBar} className="absolute bottom-0 left-0 right-0 py-4 px-5 z-40 bg-[#FF5E00] items-center justify-center">
        <TouchableOpacity 
          onPress={() => navigateTo('ORDER_LOADING')}
          className="w-full items-center justify-center active:scale-[0.98]"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-base font-bold tracking-wide">
            Reserve Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    backgroundColor: '#EA580C', // Deep Orange
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  carouselCard: {
    width: width - 40,
    height: 154,
  },
  detailsHero: {
    backgroundColor: '#EA580C',
  },
  awardBox: {
    backgroundColor: '#F8FAFC',
    height: 140,
  },
  bottomStickyBar: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 10,
  }
});
