import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getAvatarUrl } from '../services/api';

const { width } = Dimensions.get('window');

const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

// ==========================================
// 1. CLASS DETAILS SCREEN
// ==========================================
export const ClassDetailsScreen: React.FC = () => {
  const { navigateTo, goBack, setSelectedReportPeriod, activeClassSchedule } = useApp();
  const [activeSection, setActiveSection] = useState<'Materials' | 'Report' | 'Homework'>('Homework');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const classMaterials = activeClassSchedule?.materials?.length > 0 ? activeClassSchedule.materials : [
    { title: '[Lecture-Notes] Integers Core.pdf', size: '1.4 MB' },
    { title: '[Workbook] Absolute Value Exercises.pdf', size: '0.8 MB' }
  ];

  const hasHomework = activeClassSchedule ? (activeClassSchedule.homework && activeClassSchedule.homework.length > 0) : true;
  const homeworkQuestions = activeClassSchedule?.homework?.length > 0 ? activeClassSchedule.homework : [
    { text: 'Which number is smaller than -5?', options: { A: '-4', B: '-6', C: '0', D: '-1' } },
    { text: 'What is the absolute value of -15?', options: { A: '15', B: '-15', C: '0', D: '1' } },
    { text: 'Calculate: (-3) x (-4) + (-5).', options: { A: '17', B: '7', C: '-7', D: '-17' } }
  ];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleDownload = (fileName: string) => {
    if (downloadingFile) return;
    setDownloadingFile(fileName);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingFile(null);
            showToast(`Downloaded ${fileName}! 📁`);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Temporary function helper to redirect to study report
  const viewDailyReport = () => {
    setSelectedReportPeriod('Daily');
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
          Class Details
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 bg-white"
      >
        {/* OUTSIDE DETAILS CONTAINER CARD */}
        <View className="p-5 border-b border-slate-100 bg-slate-50/30">
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold leading-snug">
                  {activeClassSchedule?.title || "Beyond Zero : The World of Integers with Ninja Mam!"}
                </Text>
                <View className="bg-slate-100 py-0.5 px-2.5 rounded self-start mt-2.5">
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }} className="text-slate-500 font-bold">
                    {activeClassSchedule?.subject || "Maths"}
                  </Text>
                </View>
              </View>

              <Image 
                source={{ uri: getAvatarUrl(activeClassSchedule?.teacherAvatar) || activeClassSchedule?.teacherAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' }} 
                className="w-14 h-14 rounded-full bg-slate-100 border border-slate-100"
              />
            </View>

            <View className="flex-row justify-between items-center mt-5 pt-3.5 border-t border-slate-50">
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-500 font-medium">
                {activeClassSchedule ? `${activeClassSchedule.time}, ${activeClassSchedule.dateText}` : "8:10 pm - 9:10 pm, 6 Jul"}
              </Text>
              
              <TouchableOpacity 
                onPress={() => showToast(activeClassSchedule?.status === 'Finished' ? "Opening replay recording..." : "Entering Live interactive Class...")}
                className="bg-[#00B6A6] py-1 px-4.5 rounded-full"
              >
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-white font-bold">
                  {activeClassSchedule?.status === 'Finished' ? 'Watch Replay' : 'Join Class'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SUB-SECTIONS NAVIGATION TABS */}
        <View className="flex-row border-b border-slate-100 bg-white">
          {(['Materials', 'Report', 'Homework'] as const).map((sec) => {
            const isActive = activeSection === sec;
            return (
              <TouchableOpacity 
                key={sec}
                onPress={() => setActiveSection(sec)} 
                className="flex-1 py-3.5 items-center justify-center relative"
              >
                <Text 
                  style={{ 
                    fontFamily: isActive ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                    fontSize: getFontSize(13)
                  }} 
                  className={isActive ? 'text-slate-805 font-bold' : 'text-slate-400'}
                >
                  {sec}
                </Text>
                {isActive && <View className="absolute bottom-0 left-6 right-6 h-[2.5px] bg-[#00B6A6] rounded-t-full" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DETAILS SECTION VIEWS */}
        <View className="px-5 pt-5">
          {activeSection === 'Materials' && (
            /* MATERIALS LIST */
            <View className="space-y-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold mb-1 pl-1">
                Class Lecture Handouts
              </Text>
              {classMaterials.map((file: any, idx: number) => {
                const isThisDownloading = downloadingFile === file.title;
                return (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => handleDownload(file.title)}
                    className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-4 flex-row items-center justify-between active:bg-[#E0F7F6]/30"
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" className="mr-3" />
                      <View className="flex-1">
                        <Text numberOfLines={1} style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-slate-700 font-bold">
                          {file.title}
                        </Text>
                        {isThisDownloading ? (
                          <View className="flex-row items-center mt-1">
                            <View className="flex-1 h-[3px] bg-slate-205 rounded-full overflow-hidden mr-3">
                              <View className="h-full bg-teal-500" style={{ width: `${downloadProgress}%` }} />
                            </View>
                            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10) }} className="text-teal-650 font-bold">
                              {downloadProgress}%
                            </Text>
                          </View>
                        ) : (
                          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-0.5">
                            {file.size}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Feather name="download" size={18} color="#64748B" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeSection === 'Report' && (
            /* REPORTS LOG WITH ACCURACY, ATTENDANCE & INSIGHTS PREVIEW */
            <View className="space-y-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold mb-1 pl-1">
                Live Class Engagement Report
              </Text>
              
              <View className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4.5 shadow-sm">
                {/* 1. Quiz & Homework Accuracy metrics row */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 bg-[#F8FAFC] border border-slate-100 py-3 px-2 rounded-xl items-center mr-1.5">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(17) }} className="text-[#00B6A6] font-bold">
                      85%
                    </Text>
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-slate-400 mt-0.5 uppercase tracking-wider font-bold">
                      Quiz Accuracy
                    </Text>
                  </View>

                  <View className="flex-1 bg-[#F8FAFC] border border-slate-100 py-3 px-2 rounded-xl items-center ml-1.5">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(17) }} className="text-indigo-650 font-bold">
                      90%
                    </Text>
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-slate-400 mt-0.5 uppercase tracking-wider font-bold text-center">
                      Homework Acc.
                    </Text>
                  </View>
                </View>

                {/* 2. Class Minutes Attended */}
                <View className="flex-row justify-between items-center py-2 border-b border-slate-50">
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-500 font-medium">Class Attendance</Text>
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-orange-500 font-bold">
                    58 / 60 mins
                  </Text>
                </View>

                {/* 3. AI Insights Preview */}
                <View className="bg-[#EFF6FF] border border-blue-50/60 p-4 rounded-xl">
                  <View className="flex-row items-center mb-1.5">
                    <MaterialCommunityIcons name="robot-outline" size={16} color="#2563EB" className="mr-1.5" />
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-blue-700 font-bold uppercase tracking-wide">
                      AI Insights
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-650 leading-relaxed font-medium">
                    Steady progress in homework tasks, high engagement shown in quiz answering. Keep up the active participation!
                  </Text>
                </View>

                {/* 4. Action Button - Redirects to Daily Report */}
                <TouchableOpacity 
                  onPress={viewDailyReport}
                  className="bg-[#00B6A6] py-2.5 rounded-xl active:bg-teal-650 flex-row items-center justify-center mt-2 shadow-sm"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12.5) }} className="text-white font-bold mr-1">
                    View Full Report
                  </Text>
                  <Feather name="arrow-right" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeSection === 'Homework' && (
            /* HOMEWORK STATUS */
            <View className="space-y-4">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold mb-1 pl-1">
                Assigned Homework
              </Text>

              {!hasHomework ? (
                <View className="bg-white border border-slate-100 rounded-2xl p-6 items-center shadow-sm">
                  <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#CBD5E1" />
                  <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs mt-2">No homework assigned for this lecture</Text>
                </View>
              ) : (
                /* Homework Card */
                <View className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 pr-3">
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(15.5) }} className="text-slate-800 font-bold">
                        {activeClassSchedule?.title ? `${activeClassSchedule.subject} Homework` : "Integers & Negative Numbers Homework"}
                      </Text>
                      <View className="bg-orange-50 border border-orange-100 py-0.5 px-2.5 rounded self-start mt-2">
                        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9.5) }} className="text-orange-600 font-bold">Pending Submission</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="clipboard-text-play-outline" size={32} color="#FF6600" />
                  </View>

                  <View className="flex-row justify-between items-center mt-6 pt-4 border-t border-slate-55">
                    <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12) }} className="text-slate-400">
                      Questions: {homeworkQuestions.length} | Limit: {homeworkQuestions.length * 3} mins
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => navigateTo('HOMEWORK_QUIZ')}
                      className="bg-[#00B6A6] py-1.5 px-5 rounded-full shadow-sm active:bg-teal-650"
                    >
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-white font-bold">Start Homework</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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

// ==========================================
// 2. HOMEWORK QUIZ SCREEN
// ==========================================
export const HomeworkQuizScreen: React.FC = () => {
  const { navigateTo, goBack, activeClassSchedule } = useApp();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const questions = activeClassSchedule?.homework?.length > 0 ? activeClassSchedule.homework : [
    { text: 'Which number is smaller than -5?', options: { A: '-4', B: '-6', C: '0', D: '-1' } },
    { text: 'What is the absolute value of -15?', options: { A: '15', B: '-15', C: '0', D: '1' } },
    { text: 'Calculate: (-3) x (-4) + (-5).', options: { A: '17', B: '7', C: '-7', D: '-17' } }
  ];

  const handleNext = () => {
    if (currentIdx === questions.length - 1) {
      navigateTo('HOMEWORK_REPORT');
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  const activeQ = questions[currentIdx];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="px-4 py-3 border-b border-slate-100 bg-white relative">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={goBack} className="p-1">
            <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
            Class Homework
          </Text>
        </View>

        {/* Progress bar */}
        <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
          <View 
            className="h-[3px] bg-[#00B6A6]" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </View>
      </View>

      {/* TIMINGS ROW */}
      <View className="flex-row justify-between items-center px-5 py-3 border-b border-slate-50">
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16) }} className="text-slate-800 font-bold">
          {currentIdx + 1}/{questions.length}
        </Text>

        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={17} color="#475569" className="mr-1" />
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-650 font-medium">
            {formatTimer()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 bg-white">
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(14.5) }} className="text-slate-700 leading-relaxed mb-8">
          <Text className="text-slate-400 font-normal">(Marks: 1) </Text>
          {activeQ.text}
        </Text>

        {/* OPTIONS */}
        <View className="space-y-4.5">
          {Object.entries(activeQ.options).map(([optKey, optVal]) => {
            const isSelected = selectedOption === optKey;
            return (
              <TouchableOpacity
                key={optKey}
                onPress={() => setSelectedOption(optKey)}
                className="flex-row items-center py-2.5 active:opacity-75"
              >
                <View className={`w-8 h-8 rounded-full border items-center justify-center mr-4 ${
                  isSelected ? 'border-[#00B6A6] bg-[#E0F7F6]' : 'border-slate-300 bg-white'
                }`}>
                  <Text style={{ 
                    fontFamily: Theme.fonts.poppinsBold, 
                    fontSize: getFontSize(12),
                    color: isSelected ? '#00B6A6' : '#64748B'
                  }}>
                    {optKey}
                  </Text>
                </View>

                <Text style={{ 
                  fontFamily: isSelected ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                  fontSize: getFontSize(14),
                  color: isSelected ? '#1E293B' : '#475569'
                }}>
                  {optVal as string}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="flex-row items-center justify-between px-5 py-4 border-t border-slate-100 bg-white">
        <TouchableOpacity className="p-2 opacity-30">
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#00B6A6" />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity 
            onPress={handlePrev}
            disabled={currentIdx === 0}
            className={`border border-[#00B6A6] py-2 px-6 rounded-full flex-row items-center ${
              currentIdx === 0 ? 'opacity-40' : 'active:bg-teal-50/50'
            }`}
          >
            <Feather name="chevron-left" size={14} color="#00B6A6" className="mr-1" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-[#00B6A6] font-bold">
              PREV
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleNext}
            className="bg-[#00B6A6] border border-[#00B6A6] py-2 px-6 rounded-full flex-row items-center active:bg-teal-650"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-white font-bold">
              {currentIdx === questions.length - 1 ? 'SUBMIT HW' : 'NEXT'}
            </Text>
            {currentIdx !== questions.length - 1 && (
              <Feather name="chevron-right" size={14} color="#FFFFFF" className="ml-1" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 3. HOMEWORK REPORT SCREEN
// ==========================================
export const HomeworkReportScreen: React.FC = () => {
  const { goBackTo } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => goBackTo('CLASS_DETAILS')} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          Homework Report
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-white px-5 pt-5"
      >
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1 pr-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(20) }} className="text-slate-805 font-bold leading-tight">
              Homework: Beyond Zero
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-400 mt-1">
              Submitted: Just now, 6 Jul
            </Text>
          </View>

          <View className="items-center">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80' }} 
              className="w-13 h-13 rounded-full bg-slate-100 border-2 border-teal-100 shadow-sm"
            />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-650 font-bold mt-1">
              Ram
            </Text>
          </View>
        </View>

        {/* SCORE CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-row divide-x divide-slate-100 mb-6">
          <View className="flex-1 items-center justify-center py-2">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-4.5xl font-bold leading-none">
              A
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-2">
              Grade
            </Text>
          </View>

          <View className="flex-1 items-center justify-center py-2">
            <View className="flex-row items-baseline">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-3.5xl font-bold">
                3
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-400 text-lg font-bold">
                /3
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-2">
              Scores
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(10.5) }} className="text-slate-400 mt-0.5">
              Accuracy: 100%
            </Text>
          </View>
        </View>

        {/* ANSWERS SHEET */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-8">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold mb-5">
            Answer Details
          </Text>

          <View className="flex-row gap-3.5 justify-start">
            {[1, 2, 3].map((num) => (
              <View 
                key={num} 
                className="w-14 h-14 rounded-xl border border-slate-150 items-center justify-center bg-white"
              >
                <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(12) }} className="text-slate-700 font-bold">
                  Q{num}
                </Text>
                <Feather name="check" size={12} color="#10B981" />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => goBackTo('CLASS_DETAILS')}
          className="w-full bg-[#00B6A6] py-3 rounded-xl active:bg-teal-650"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13) }} className="text-white text-center font-bold">
            Back to Class Details
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
