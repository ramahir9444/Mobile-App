import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ActivityIndicator, 
  StatusBar,
  Alert
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

const showToast = (msg: string) => Alert.alert("Oda Class", msg);

// ==========================================
// 1. TEST INTRO SCREEN
// ==========================================
export const TestIntroScreen: React.FC = () => {
  const { navigateTo, goBack } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          Welcome Test
        </Text>
      </View>

      <View className="flex-1 bg-white px-6 items-center justify-start pt-10">
        {/* Teal write icon in circle */}
        <View className="w-24 h-24 rounded-full bg-slate-50 items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <MaterialCommunityIcons name="border-color" size={38} color="#00B6A6" />
        </View>

        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(19) }} className="text-[#00B6A6] font-bold text-center mb-10">
          Time to test
        </Text>

        <TouchableOpacity 
          onPress={() => navigateTo('TEST_QUIZ')}
          className="w-full bg-[#00B6A6] py-3.5 rounded-xl active:bg-teal-600 mb-10 shadow-sm"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-white text-center font-bold">
            Start test
          </Text>
        </TouchableOpacity>

        {/* Test rules container */}
        <View className="w-full align-start">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold mb-4">
            Test Notification
          </Text>

          {[
            '1. Test duration: 30 minutes',
            "2. Test report will be released after mentor's review is completed.",
            "3. If you didn't participate in the test. You can practice it by yourself after the test finished"
          ].map((item, idx) => (
            <Text 
              key={idx} 
              style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} 
              className="text-slate-500 leading-relaxed mb-3.5"
            >
              {item}
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 2. TEST QUIZ SCREEN
// ==========================================
export const TestQuizScreen: React.FC = () => {
  const { navigateTo, goBack } = useApp();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(4); // Default to question 5 (index 4)
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(1788); // 29:48 in seconds

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Mock Questions Data
  const questions = [
    { text: 'Solve for x: 3x + 5 = 20.', options: { A: '5', B: '4', C: '6', D: '3' } },
    { text: 'Which is a prime number?', options: { A: '4', B: '9', C: '15', D: '17' } },
    { text: 'Find the area of a rectangle with length 10 and width 5.', options: { A: '50', B: '15', C: '30', D: '25' } },
    { text: 'What is 15% of 200?', options: { A: '35', B: '30', C: '25', D: '40' } },
    { text: 'Two numbers are in the ratio 2 : 7. If the second number is 378, find the first.', options: { A: '105', B: '180', C: '108', D: '165' } },
    { text: 'Calculate the average of 10, 20, and 30.', options: { A: '15', B: '20', C: '25', D: '30' } },
    { text: 'If a triangle has angles 50° and 60°, what is the third angle?', options: { A: '70°', B: '80°', C: '90°', D: '60°' } },
    { text: 'Solve: 12 x 11 - 10.', options: { A: '122', B: '132', C: '120', D: '112' } },
    { text: 'Convert 4/5 into a percentage.', options: { A: '85%', B: '75%', C: '80%', D: '90%' } },
    { text: 'What is the square root of 225?', options: { A: '15', B: '25', C: '12', D: '20' } }
  ];

  const handleNext = () => {
    if (currentQuestionIdx === questions.length - 1) {
      // Last question - Submit Test
      navigateTo('TEST_REPORT');
    } else {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  const activeQuestion = questions[currentQuestionIdx];

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
            Welcome Test
          </Text>
        </View>

        {/* Progress horizontal indicator line */}
        <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
          <View 
            className="h-[3px] bg-[#00B6A6]" 
            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
          />
        </View>
      </View>

      {/* METRICS ROW (Progress Fraction & Timer) */}
      <View className="flex-row justify-between items-center px-5 py-3 border-b border-slate-50">
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16) }} className="text-slate-800 font-bold">
          {currentQuestionIdx + 1}/{questions.length}
        </Text>

        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={17} color="#475569" className="mr-1" />
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13) }} className="text-slate-650 font-medium">
            {formatTimer()}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 bg-white">
        {/* QUESTION TEXT */}
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(14) }} className="text-slate-700 leading-relaxed mb-8">
          <Text className="text-slate-400 font-normal">(Marks: 1) </Text>
          {activeQuestion.text}
        </Text>

        {/* OPTIONS LIST */}
        <View className="space-y-4.5">
          {Object.entries(activeQuestion.options).map(([optKey, optVal]) => {
            const isSelected = selectedOption === optKey;
            return (
              <TouchableOpacity
                key={optKey}
                onPress={() => setSelectedOption(optKey)}
                className="flex-row items-center py-2.5 active:opacity-75"
              >
                {/* Circle badge */}
                <View className={`w-8 h-8 rounded-full border items-center justify-center mr-4 ${
                  isSelected ? 'border-[#00B6A6] bg-[#E0F7F6]' : 'border-slate-350 bg-white'
                }`}>
                  <Text style={{ 
                    fontFamily: Theme.fonts.poppinsBold, 
                    fontSize: getFontSize(12),
                    color: isSelected ? '#00B6A6' : '#64748B'
                  }}>
                    {optKey}
                  </Text>
                </View>

                {/* Option text */}
                <Text style={{ 
                  fontFamily: isSelected ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium,
                  fontSize: getFontSize(14),
                  color: isSelected ? '#1E293B' : '#475569'
                }}>
                  {optVal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* STICKY FOOTER */}
      <View className="flex-row items-center justify-between px-5 py-4 border-t border-slate-100 bg-white">
        <TouchableOpacity onPress={() => showToast("Opening workspace scratchpad...")} className="p-2">
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#00B6A6" />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          {/* Previous Button */}
          <TouchableOpacity 
            onPress={handlePrev}
            disabled={currentQuestionIdx === 0}
            className={`border border-[#00B6A6] py-2 px-6 rounded-full flex-row items-center ${
              currentQuestionIdx === 0 ? 'opacity-40' : 'active:bg-teal-50/50'
            }`}
          >
            <Feather name="chevron-left" size={14} color="#00B6A6" className="mr-1" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-[#00B6A6] font-bold">
              PREV
            </Text>
          </TouchableOpacity>

          {/* Next / Submit Button */}
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-[#00B6A6] border border-[#00B6A6] py-2 px-6 rounded-full flex-row items-center active:bg-teal-600"
          >
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-white font-bold">
              {currentQuestionIdx === questions.length - 1 ? 'SUBMIT TEST' : 'NEXT'}
            </Text>
            {currentQuestionIdx !== questions.length - 1 && (
              <Feather name="chevron-right" size={14} color="#FFFFFF" className="ml-1" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 3. TEST REPORT SCREEN
// ==========================================
export const TestReportScreen: React.FC = () => {
  const { navigateTo, goBack, goBackTo } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => goBackTo('DASHBOARD')} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          Test Report
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-white px-5 pt-5"
      >
        {/* TITLE & STUDENT AVATAR ROW */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1 pr-4">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(21) }} className="text-slate-800 font-bold leading-tight">
              Welcome Test
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-400 mt-1">
              16:00-19:00, 06 Jul
            </Text>
          </View>

          {/* Student Profile Avatar */}
          <View className="items-center">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80' }} 
              className="w-13 h-13 rounded-full bg-slate-100 border-2 border-teal-100 shadow-sm"
            />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-600 font-bold mt-1">
              Ram
            </Text>
          </View>
        </View>

        {/* GRADE CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-row divide-x divide-slate-100 mb-6">
          {/* Left Column (Grade) */}
          <View className="flex-1 items-center justify-center py-2">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-850 text-4.5xl font-bold leading-none">
              D
            </Text>
            <View className="flex-row items-center mt-2.5">
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mr-1">
                Grade
              </Text>
              <Feather name="info" size={11} color="#94A3B8" />
            </View>
          </View>

          {/* Right Column (Scores) */}
          <View className="flex-1 items-center justify-center py-2">
            <View className="flex-row items-baseline">
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-850 text-3.5xl font-bold">
                1
              </Text>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-400 text-lg font-bold">
                /10
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 font-medium mt-2">
              Scores
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(10.5) }} className="text-slate-400 mt-0.5">
              Class average: 4
            </Text>
          </View>
        </View>

        {/* ANSWER SHEET GRID */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-8">
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(13.5) }} className="text-slate-800 font-bold">
              Answer Sheet
            </Text>
            <TouchableOpacity onPress={() => showToast("Opening answer analysis report...")}>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(12.5) }} className="text-slate-400 font-medium">
                Answer analysis &gt;
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid structure (5 columns, 2 rows) */}
          <View className="flex-row flex-wrap gap-2.5 justify-between">
            {[
              { id: 1, type: 'wrong' },
              { id: 2, type: 'correct' },
              { id: 3, type: 'wrong' },
              { id: 4, type: 'wrong' },
              { id: 5, type: 'wrong' },
              { id: 6, type: 'skipped' },
              { id: 7, type: 'skipped' },
              { id: 8, type: 'skipped' },
              { id: 9, type: 'skipped' },
              { id: 10, type: 'skipped' }
            ].map((ans) => {
              let renderIcon = null;
              if (ans.type === 'correct') {
                renderIcon = <Feather name="check" size={10} color="#10B981" />;
              } else if (ans.type === 'wrong') {
                renderIcon = <Feather name="x" size={10} color="#EF4444" />;
              } else {
                renderIcon = <MaterialCommunityIcons name="slash-forward" size={10} color="#64748B" />;
              }

              return (
                <View 
                  key={ans.id} 
                  className="w-[18%] aspect-square rounded-lg border border-slate-200 items-center justify-center bg-white"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(11.5) }} className="text-slate-700 font-bold mb-0.5">
                    {ans.id}
                  </Text>
                  {renderIcon}
                </View>
              );
            })}
          </View>
        </View>

        {/* Ambient footer messages */}
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 text-center leading-relaxed">
          One step at a time A better student every time
        </Text>
        <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(10.5) }} className="text-slate-300 text-center mt-3 tracking-widest uppercase">
          — oda class —
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 4. MATERIALS MODULES SCREEN
// ==========================================
export const MaterialsModulesScreen: React.FC = () => {
  const { navigateTo, goBack, activeCourseClass, activeCourseType } = useApp();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/materials`);
        const json = await res.json();
        if (json.success && json.data) {
          const filtered = json.data.filter((m: any) => 
            m.gradeClass === activeCourseClass && 
            m.courseType === activeCourseType
          );
          setMaterials(filtered);
        }
      } catch (err) {
        console.error('Failed to load materials in student app:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [activeCourseClass, activeCourseType]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(16.5) }} className="text-slate-800 font-bold text-center flex-1 mr-8">
          Course Materials
        </Text>
      </View>

      <View className="flex-1 bg-white px-5 pt-5">
        {/* Module Row */}
        <TouchableOpacity 
          onPress={() => navigateTo('MATERIALS_FILES')}
          className="flex-row items-center py-4 border-b border-slate-50 active:bg-slate-50/50"
        >
          {/* Orange notebook icon with notification dot */}
          <View className="relative mr-4">
            <MaterialCommunityIcons name="book-open-outline" size={32} color="#FF6600" />
            <View className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white absolute -top-0.5 -right-0.5" />
          </View>

          <View className="flex-1">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(14.5) }} className="text-slate-800 font-bold">
              E-Module
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-0.5">
              Total {loading ? '...' : materials.length} files
            </Text>
          </View>

          <Feather name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 5. MATERIALS FILES SCREEN
// ==========================================
export const MaterialsFilesScreen: React.FC = () => {
  const { goBack, activeCourseClass, activeCourseType } = useApp();
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/materials`);
        const json = await res.json();
        if (json.success && json.data) {
          const filtered = json.data.filter((m: any) => 
            m.gradeClass === activeCourseClass && 
            m.courseType === activeCourseType
          );
          setMaterials(filtered);
        }
      } catch (err) {
        console.error('Failed to load materials in student files screen:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [activeCourseClass, activeCourseType]);

  const handleDownload = (fileName: string) => {
    if (downloadingFile) return; // Wait for active download
    setDownloadingFile(fileName);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingFile(null);
            showToast(`Successfully downloaded ${fileName}! 📁`);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
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
          Course Materials
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-white px-5 pt-4"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#00B6A6" style={{ marginTop: 20 }} />
        ) : materials.length === 0 ? (
          <View className="items-center py-10">
            <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs">No study materials available</Text>
          </View>
        ) : (
          materials.map((pdf, idx) => {
            const isThisDownloading = downloadingFile === pdf.fileName;

            return (
              <TouchableOpacity 
                key={pdf._id || idx}
                onPress={() => handleDownload(pdf.fileName)}
                className="flex-row items-center py-3.5 border-b border-slate-50 active:bg-slate-50/50"
              >
                {/* PDF Badge Icon with red dot */}
                <View className="relative mr-4">
                  <View className="w-10 h-10 rounded-lg bg-red-50 items-center justify-center border border-red-100">
                    <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(9) }} className="text-red-500 font-bold">
                      PDF
                    </Text>
                  </View>
                </View>

                {/* PDF Title & Size */}
                <View className="flex-1 pr-3">
                  <Text 
                    numberOfLines={1} 
                    style={{ fontFamily: Theme.fonts.poppinsMedium, fontSize: getFontSize(13.5) }} 
                    className="text-slate-800 font-medium"
                  >
                    {pdf.fileName}
                  </Text>
                  
                  {isThisDownloading ? (
                    /* Progress loading bar */
                    <View className="flex-row items-center mt-1">
                      <View className="flex-1 h-[3.5px] bg-slate-100 rounded-full overflow-hidden mr-3">
                        <View className="h-full bg-teal-500" style={{ width: `${downloadProgress}%` }} />
                      </View>
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold, fontSize: getFontSize(10.5) }} className="text-teal-600 font-bold">
                        {downloadProgress}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: getFontSize(11.5) }} className="text-slate-400 mt-0.5">
                      Size: {pdf.fileSize}
                    </Text>
                  )}
                </View>

                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })
        )}
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
