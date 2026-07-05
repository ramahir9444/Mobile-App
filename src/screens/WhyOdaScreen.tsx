import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const FACULTY_LIST = [
  {
    name: 'Rishabh Sir',
    role: 'Senior Faculty',
    college: 'IIT JODHPUR',
    experience: '8+ Years of Teaching',
    stats: 'Mentored 2 Lakh+ Students',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Manish Sir',
    role: 'Senior Faculty',
    college: 'IIT DELHI',
    experience: '10+ Years of Teaching',
    stats: 'Mentored 3 Lakh+ Students',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Priyanka Mam',
    role: 'Senior Faculty',
    college: 'IIT BOMBAY',
    experience: '7+ Years of Teaching',
    stats: 'Mentored 1.5 Lakh+ Students',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
];

export const WhyOdaScreen: React.FC = () => {
  const { goBack } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER NAVIGATION */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-10">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold }}
          className="text-slate-800 text-[15px] font-bold text-center flex-1"
        >
          Oda Class - Best LIVE Learning App
        </Text>

        <TouchableOpacity onPress={() => showToast("Link Shared!")} className="p-1">
          <Feather name="share" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* SUB-HEADER ACTIONS */}
      <View className="flex-row items-center px-5 py-3.5 bg-slate-50 border-b border-slate-100 space-x-3">
        <TouchableOpacity 
          onPress={() => showToast("Navigating to enrollment...")}
          className="bg-[#FF6600] py-2 px-5 rounded-full active:scale-[0.98]"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-xs font-bold">
            Enroll Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => showToast("Opening details brochure...")}
          className="border border-[#00B6A6] py-2 px-5 rounded-full active:scale-[0.98]"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-xs font-bold">
            Learn More
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 bg-white"
      >
        {/* SECTION 1: ELITE FACULTY */}
        <View className="py-8 px-5">
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold }}
            className="text-slate-900 text-[23px] font-bold text-center leading-tight tracking-tight px-3"
          >
            Most Elite IIT/NIT Teaching Faculty
          </Text>
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsRegular }}
            className="text-slate-500 text-center text-xs mt-3 px-4 leading-relaxed"
          >
            Our educators aren't just teachers; they are academic leaders from India's most prestigious institutions.
          </Text>

          {/* 2X2 STATS GRID */}
          <View className="flex-row flex-wrap justify-between mt-6 gap-y-3.5">
            {[
              { val: '50+', label: 'IITians Team' },
              { val: '1%', label: 'Selection Rate' },
              { val: '10+ Years', label: 'Teaching Experience' },
              { val: '98%', label: 'Positive Rating' }
            ].map((stat, index) => (
              <View 
                key={index}
                style={styles.statBox}
                className="bg-[#F0FDFA] p-4 rounded-xl items-center justify-center"
              >
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold }}
                  className="text-[#00B6A6] text-[18.5px] font-bold"
                >
                  {stat.val}
                </Text>
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold }}
                  className="text-slate-700 text-[9px] font-bold text-center mt-1 uppercase tracking-wide"
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* TEACHER PROFILE HORIZONTAL SLIDER */}
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, paddingTop: 20 }}
            className="mt-6"
          >
            {FACULTY_LIST.map((teacher, idx) => (
              <View 
                key={idx}
                style={styles.teacherCard}
                className="bg-white border border-slate-100 rounded-2xl p-3.5 mr-4 shadow-sm"
              >
                <View className="relative">
                  <Image 
                    source={{ uri: teacher.image }} 
                    className="w-[150px] h-[150px] rounded-xl bg-slate-100"
                  />
                  {/* College Tag overlayed top right */}
                  <View className="absolute top-2 right-2 bg-[#00B6A6] py-0.5 px-2 rounded-md">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[8px] font-bold">
                      {teacher.college}
                    </Text>
                  </View>
                </View>

                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold }}
                  className="text-slate-800 text-[15px] font-bold mt-3"
                >
                  {teacher.name}
                </Text>
                
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsBold }}
                  className="text-[#00B6A6] text-[11px] font-bold mt-0.5"
                >
                  {teacher.role}
                </Text>

                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsMedium }}
                  className="text-slate-500 text-[11px] mt-2"
                >
                  {teacher.experience}
                </Text>
                <Text 
                  style={{ fontFamily: Theme.fonts.poppinsRegular }}
                  className="text-slate-400 text-[9.5px] mt-0.5"
                >
                  {teacher.stats}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 2: TRUSTED STUDENT METRICS */}
        <View className="py-8 px-5">
          <View className="items-center justify-center">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-400 text-[10.5px] font-bold tracking-widest uppercase">
              Trusted By <Text className="text-[#00B6A6] font-bold">10,000,000+</Text> Students across India
            </Text>
          </View>

          {/* Child Graphic card */}
          <View className="bg-slate-50 rounded-3xl p-5 mt-6 border border-slate-100 items-center overflow-hidden relative">
            {/* Soft decorative background circles */}
            <View className="absolute w-48 h-48 rounded-full bg-[#E0F2FE] -top-10 -right-10 opacity-60" />
            <View className="absolute w-36 h-36 rounded-full bg-[#F0FDF4] -bottom-10 -left-10 opacity-70" />

            <View className="relative z-10 w-full items-center">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' }} 
                className="w-48 h-48 rounded-2xl bg-slate-200"
              />

              {/* Floating badges */}
              <View className="absolute bottom-12 -left-2 bg-white py-1.5 px-3 rounded-full flex-row items-center shadow-sm border border-slate-100">
                <View className="w-4 h-4 bg-purple-500 rounded-full items-center justify-center mr-1.5">
                  <Text className="text-white text-[8px] font-bold">100</Text>
                </View>
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-[9.5px] font-semibold">Interactive</Text>
              </View>

              <View className="absolute top-8 -right-2 bg-white py-1.5 px-3 rounded-full flex-row items-center shadow-sm border border-slate-100">
                <Ionicons name="school" size={12} color="#10B981" className="mr-1.5" />
                <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-[9.5px] font-semibold">Immersive</Text>
              </View>
            </View>

            {/* Content Details */}
            <View className="w-full mt-6 items-start z-10">
              <View className="bg-[#FF6600] py-0.5 px-3 rounded-full mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[8.5px] font-bold uppercase tracking-wider">
                  Most Popular
                </Text>
              </View>

              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold }}
                className="text-slate-900 text-lg font-bold"
              >
                Concept Booster Course
              </Text>

              <Text 
                style={{ fontFamily: Theme.fonts.poppinsRegular }}
                className="text-slate-500 text-xs mt-2 leading-relaxed"
              >
                Master core concepts in 10 days with our IITian-designed curriculum to accelerate K-12 academic growth.
              </Text>

              {/* Checkboxes */}
              <View className="mt-4 space-y-2">
                {[
                  '10 Days Breakthrough',
                  'Top IIT Star Teachers',
                  'Maths & Science'
                ].map((item, idx) => (
                  <View key={idx} className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#00B6A6" className="mr-2" />
                    <Text 
                      style={{ fontFamily: Theme.fonts.poppinsMedium }}
                      className="text-slate-700 text-xs font-medium"
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 3: AI PLATFORM */}
        <View className="py-8 px-5">
          <View className="items-center">
            {/* Title with highlighted badge */}
            <View className="flex-row items-center flex-wrap justify-center">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-950 text-[19px] font-bold text-center">
                India{' '}
              </Text>
              <View className="bg-[#FF6600] py-0.5 px-3 rounded-full">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[15px] font-bold uppercase">
                  No.1
                </Text>
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-950 text-[19px] font-bold text-center">
                {' '}Premium <Text className="text-[#00B6A6]">K12</Text> Learning
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-950 text-[19px] font-bold text-center mt-0.5">
              Online Learning Platform
            </Text>

            {/* Supercharged outline pill */}
            <View className="border border-[#00B6A6]/40 rounded-full py-0.5 px-3.5 mt-3">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-[10px] font-bold">
                Supercharged with AI
              </Text>
            </View>
          </View>

          {/* Genie Poster Card */}
          <View className="bg-indigo-950 rounded-3xl overflow-hidden mt-6 shadow-md border border-indigo-900/50">
            <View className="p-5 items-center">
              {/* Virtual AI Agent simulation */}
              <View className="w-full h-44 rounded-2xl bg-indigo-900/40 items-center justify-center relative overflow-hidden">
                {/* Mesh lights */}
                <View className="absolute w-32 h-32 rounded-full bg-blue-500/20 -top-5 -left-5 blur-xl" />
                <View className="absolute w-32 h-32 rounded-full bg-purple-500/20 -bottom-5 -right-5 blur-xl" />
                
                {/* Avatar */}
                <View className="items-center z-10">
                  <View className="border-4 border-cyan-400/30 rounded-full p-2 bg-indigo-950">
                    <MaterialCommunityIcons name="face-recognition" size={56} color="#22D3EE" />
                  </View>
                  <View className="bg-cyan-500/20 border border-cyan-400/50 rounded-full px-2 py-0.5 mt-2">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-cyan-300 text-[8px] font-bold tracking-widest uppercase">
                      Oda Genie Active
                    </Text>
                  </View>
                </View>
              </View>

              <Text 
                style={{ fontFamily: Theme.fonts.poppinsBold }}
                className="text-white text-base font-bold text-center mt-5 leading-snug px-3"
              >
                India’s Smartest AI Agent. Knows Your Gaps. Solves Them Fast.
              </Text>
            </View>
          </View>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 4: IMMERSIVE EXPERIENCE */}
        <View className="py-8 px-5">
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold }}
            className="text-slate-900 text-[20px] font-bold text-center leading-tight tracking-tight"
          >
            Immersive & Interactive Learning Experience
          </Text>
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsRegular }}
            className="text-slate-500 text-center text-xs mt-2 px-4 leading-relaxed"
          >
            Supercharged with AI to provide a personalized journey for every student.
          </Text>

          {/* Interactive Quizzes card */}
          <View className="bg-slate-50 rounded-3xl p-4 mt-6 border border-slate-100">
            {/* Phone screen simulation */}
            <View className="w-full bg-[#1E293B] rounded-2xl p-3 border border-slate-800">
              <View className="flex-row items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-cyan-400 text-[10px] font-bold">
                  Vedic Maths Tricks
                </Text>
                <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  <Text className="text-emerald-400 text-[8px] font-bold">LIVE</Text>
                </View>
              </View>
              
              <Text className="text-white text-[9.5px] font-medium leading-relaxed">
                Sum of 10 Continuous Numbers:{"\n"}
                <Text className="text-slate-400">245 + 246 + 247 + 248 + 249 + 250 + 251 + 252 + 253 + 254</Text>
              </Text>

              <View className="bg-slate-800/80 p-2 rounded mt-2.5">
                <Text className="text-yellow-400 text-[8.5px] font-bold">Vedic Method:</Text>
                <Text className="text-slate-300 text-[8px] mt-0.5">1. Find 5th number from beginning (249)</Text>
                <Text className="text-slate-300 text-[8px]">2. Append '5' at the end = 2495</Text>
              </View>

              {/* Quiz buttons mock */}
              <View className="flex-row justify-between mt-3 gap-2">
                {['A: 2495', 'B: 2505', 'C: 2485', 'D: 2490'].map((opt, idx) => (
                  <View 
                    key={idx} 
                    className={`flex-1 items-center justify-center py-1.5 rounded-md ${
                      idx === 0 ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <Text className="text-white text-[8px] font-bold">{opt}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-800 text-[15px] font-bold mt-4 px-1"
            >
              Interactive Quizzes
            </Text>
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsRegular }}
              className="text-slate-500 text-[11px] mt-1.5 px-1 leading-relaxed"
            >
              Real-time online quizzes with multiple engaging interactive formats keep students focused and motivated.
            </Text>
          </View>

          {/* Abundant Rewards card */}
          <View className="bg-slate-50 rounded-3xl p-4 mt-6 border border-slate-100">
            {/* Gamified visual bar */}
            <View className="w-full bg-[#E0F2FE] rounded-2xl p-4 flex-row justify-around items-end h-28 relative overflow-hidden">
              {[
                { lvl: 'LV.1', name: 'Master', color: '#38BDF8' },
                { lvl: 'LV.2', name: 'Challenger', color: '#818CF8' },
                { lvl: 'LV.3', name: 'Epic', color: '#A78BFA' },
                { lvl: 'LV.4', name: 'Godlike', color: '#F472B6' },
                { lvl: 'LV.5', name: 'Legendary', color: '#F43F5E' }
              ].map((step, idx) => (
                <View key={idx} className="items-center z-10 flex-1">
                  <View 
                    style={{ 
                      height: 12 * (idx + 1) + 20, 
                      backgroundColor: step.color,
                      width: '80%',
                      borderRadius: 6,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    className="shadow-sm"
                  >
                    <MaterialCommunityIcons name="trophy-outline" size={12} color="white" />
                  </View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[7px] font-bold mt-1">
                    {step.name}
                  </Text>
                  <Text className="text-slate-400 text-[6.5px]">{step.lvl}</Text>
                </View>
              ))}
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-800 text-[15px] font-bold mt-4 px-1"
            >
              Abundant Rewards
            </Text>
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsRegular }}
              className="text-slate-500 text-[11px] mt-1.5 px-1 leading-relaxed"
            >
              Earn gold coins, unlock special digital badges, collect level achievements, and exchange for premium prizes!
            </Text>
          </View>

          {/* Professional Study Report card */}
          <View className="bg-slate-50 rounded-3xl p-4 mt-6 border border-slate-100">
            <View className="w-full bg-[#ECFDF5] rounded-2xl p-4 items-center justify-around flex-row h-28 relative overflow-hidden">
              <View className="bg-white p-2.5 rounded-lg border border-emerald-100 items-center justify-center shadow-sm w-[28%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#10B981] text-xs font-bold">SMART</Text>
                <Text className="text-[7px] text-slate-400 mt-0.5">Test Report</Text>
              </View>
              <View className="bg-white p-2.5 rounded-lg border border-emerald-100 items-center justify-center shadow-sm w-[35%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[10px] font-bold">Analysis</Text>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-amber-500 text-lg font-bold">S+</Text>
                <Text className="text-[6.5px] text-slate-450 mt-0.5">Grade score</Text>
              </View>
              <View className="bg-white p-2.5 rounded-lg border border-emerald-100 items-center justify-center shadow-sm w-[28%]">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-xs font-bold">186m</Text>
                <Text className="text-[7px] text-slate-400 mt-0.5">Study Duration</Text>
              </View>
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-800 text-[15px] font-bold mt-4 px-1"
            >
              Professional Study Report
            </Text>
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsRegular }}
              className="text-slate-500 text-[11px] mt-1.5 px-1 leading-relaxed"
            >
              Full-scale study reports — session, weekly, monthly — powered by Oda AI to identify gaps and guide improvement.
            </Text>
          </View>

          {/* Engaging Experiments card */}
          <View className="bg-slate-50 rounded-3xl p-4 mt-6 border border-slate-100">
            <View className="w-full h-32 rounded-2xl bg-slate-200 overflow-hidden relative">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&auto=format&fit=crop&q=80' }} 
                className="w-full h-full bg-slate-300"
              />
              <View className="absolute inset-0 bg-black/10" />
              <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded flex-row items-center">
                <Ionicons name="play" size={10} color="white" className="mr-1" />
                <Text className="text-white text-[8px] font-bold">LIVE Science Lab</Text>
              </View>
            </View>

            <Text 
              style={{ fontFamily: Theme.fonts.poppinsBold }}
              className="text-slate-800 text-[15px] font-bold mt-4 px-1"
            >
              Engaging Experiments
            </Text>
            <Text 
              style={{ fontFamily: Theme.fonts.poppinsRegular }}
              className="text-slate-500 text-[11px] mt-1.5 px-1 leading-relaxed"
            >
              Faster knowledge absorption with LIVE experiments that bring science to life.
            </Text>
          </View>
        </View>

        {/* ORANGE SEPARATOR */}
        <View className="h-2 bg-slate-50 border-y border-slate-100/50" />

        {/* SECTION 5: WIDELY PRAISED BY PARENTS & STUDENTS */}
        <View className="py-8 px-5">
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold }}
            className="text-slate-900 text-[21px] font-bold text-center leading-tight tracking-tight px-2"
          >
            Widely Praised by Parents & Students
          </Text>
          <Text 
            style={{ fontFamily: Theme.fonts.poppinsRegular }}
            className="text-slate-500 text-center text-xs mt-2 px-4 leading-relaxed"
          >
            Hear from our community of over 10 million families thriving with Oda Class.
          </Text>

          {/* Satisfactions grid */}
          <View className="flex-row justify-between mt-6 gap-3">
            <View style={styles.statBox} className="bg-[#F0FDFA] p-4 rounded-xl items-center justify-center flex-1">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-[18px] font-bold">
                98.6%
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-[8.5px] font-bold text-center mt-1 uppercase">
                Overall Satisfaction
              </Text>
            </View>

            <View style={styles.statBox} className="bg-[#F0FDFA] p-4 rounded-xl items-center justify-center flex-1">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-[18px] font-bold">
                4.5
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-[8.5px] font-bold text-center mt-1 uppercase">
                Play Store Rating
              </Text>
            </View>
          </View>

          {/* Testimonials Slider */}
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, paddingTop: 20 }}
            className="mt-6"
          >
            {/* Review 1 */}
            <View style={styles.testimonialCard} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mr-4 shadow-sm">
              <View className="flex-row items-center mb-2.5">
                <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-2">
                  <MaterialCommunityIcons name="rocket-launch" size={16} color="#FF6600" />
                </View>
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[11px] font-bold">
                    Parent of Grade 5
                  </Text>
                  <Text className="text-slate-400 text-[8.5px]">24 days ago</Text>
                </View>
              </View>
              <View className="flex-row mb-2">
                {[1,2,3,4,5].map((s) => (
                  <Ionicons key={s} name="star" size={11} color="#EAB308" className="mr-0.5" />
                ))}
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-[11.5px] leading-relaxed">
                "Oda Class is my secret to success 🚀 Our child's scores improved tremendously!"
              </Text>
            </View>

            {/* Review 2 */}
            <View style={styles.testimonialCard} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mr-4 shadow-sm">
              <View className="flex-row items-center mb-2.5">
                <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center mr-2">
                  <Ionicons name="person" size={14} color="#00B6A6" />
                </View>
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[11px] font-bold">
                    Parent of Grade 7
                  </Text>
                  <Text className="text-slate-400 text-[8.5px]">22 days ago</Text>
                </View>
              </View>
              <View className="flex-row mb-2">
                {[1,2,3,4,5].map((s) => (
                  <Ionicons key={s} name="star" size={11} color="#EAB308" className="mr-0.5" />
                ))}
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-[11.5px] leading-relaxed">
                "Improved learning initiative, no longer need parental supervision. Outstanding teachers!"
              </Text>
            </View>

            {/* Review 3 */}
            <View style={styles.testimonialCard} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mr-4 shadow-sm">
              <View className="flex-row items-center mb-2.5">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                  <Ionicons name="school" size={14} color="#3B82F6" />
                </View>
                <View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[11px] font-bold">
                    Student Ram
                  </Text>
                  <Text className="text-slate-400 text-[8.5px]">18 days ago</Text>
                </View>
              </View>
              <View className="flex-row mb-2">
                {[1,2,3,4,5].map((s) => (
                  <Ionicons key={s} name="star" size={11} color="#EAB308" className="mr-0.5" />
                ))}
              </View>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-[11.5px] leading-relaxed">
                "The interactive quizzes and Vedic tricks are amazing! Learning is so fun now."
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* PINE GREEN CTA BANNER */}
        <View style={styles.ctaBannerContainer} className="mx-5 mt-4 mb-16 p-8 rounded-3xl items-center overflow-hidden relative">
          <View className="absolute inset-0 bg-[#064E3B]" />
          <View className="absolute w-48 h-48 rounded-full bg-[#059669]/20 -top-12 -right-12 blur-md" />
          <View className="absolute w-36 h-36 rounded-full bg-[#10B981]/15 -bottom-10 -left-10 blur-md" />

          <Text 
            style={{ fontFamily: Theme.fonts.poppinsBold }}
            className="text-white text-xl font-bold text-center z-10 px-2"
          >
            Ready to supercharge your learning?
          </Text>

          <View className="w-full mt-7 z-10">
            <TouchableOpacity 
              onPress={goBack}
              className="bg-[#00B6A6] py-3.5 rounded-full items-center justify-center shadow-md active:scale-[0.98]"
            >
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[14px] font-bold tracking-wide">
                View Courses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => showToast("Opening app download portal...")}
              className="border border-white/40 bg-white/5 py-3.5 rounded-full items-center justify-center mt-3 active:scale-[0.98]"
            >
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[14px] font-bold tracking-wide">
                Download Apps
              </Text>
            </TouchableOpacity>
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

      {/* STICKY BOTTOM ACTION BAR - Anchored gradient mock */}
      <View style={styles.bottomStickyBar} className="absolute bottom-0 left-0 right-0 py-3.5 px-5 flex-row items-center justify-between z-40">
        <View className="flex-1 pr-3">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[13.5px] font-bold">
            6 Days Concept Booster Course
          </Text>
          
          <View className="flex-row items-center mt-1">
            <View className="bg-red-500 py-0.5 px-1.5 rounded mr-1.5">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[8px] font-bold uppercase">
                HOT
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-200 text-[10px] font-medium">
              500,000+ joined
            </Text>
          </View>
        </View>

        {/* Price & Action button */}
        <View className="flex-row items-center">
          <View className="items-end mr-3">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-lg font-bold">
              ₹29
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsRegular }} className="text-blue-200 text-[10.5px] line-through">
              ₹499
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => showToast("Enrolling in 6-Day Booster course!")}
            className="bg-white py-2 px-4 rounded-full shadow-sm active:scale-[0.97]"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-xs font-bold">
              Learn more
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  statBox: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E6FBF7',
  },
  teacherCard: {
    width: 178,
  },
  testimonialCard: {
    width: 250,
  },
  ctaBannerContainer: {
    height: 220,
  },
  bottomStickyBar: {
    backgroundColor: '#3B82F6', // Blue theme color representing the gradient
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  }
});
