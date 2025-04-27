// src/utils/translationService.js

/**
 * Comprehensive translation service for the application
 * Maintains all UI translations in a single place for easy maintenance
 */

// Translation dictionary for all UI elements
const translations = {
    english: {
      // General UI
      welcome: "Let's Learn Together!",
      intro: "Hi there! We're going to play some fun listening and speaking games. Ready to begin?",
      codeLabel: "Your special code:",
      codeHelp: "This code helps us keep track of your answers. You can write it down if you need to take a break and come back later!",
      startButton: "Let's Begin! 🎮",
      languageLabel: "Choose your language:",
      english: "English",
      chinese: "中文 (Chinese)",
      loading: "Loading our fun activities...",
      error: "Oops! Something went wrong",
      tryAgain: "Let's Try Again",
      
      // Assessment steps
      listen: "Instruction",
      practice: "Practice",
      answer: "Assessments",
      listenCarefully: "Listen carefully:",
      next: "Next",
      finish: "Finish",
      letsPractice: "Let's Practice",
      startActivities: "Start Activities",
      code: "Code:",
      of: "of",
      
      // Lookup flow
      newTest: "New Test",
      continueTest: "Continue Test",
      existingId: "Enter your existing code:",
      lookup: "Look Up",
      yourTests: "Your Tests",
      startNewIn: "Start New Test in",
      continueThis: "Continue This Test",
      testStarted: "Test Started",
      progress: "Progress",
      language: "Language",
      testNumber: "Test #",
      noTests: "No tests found for this participant ID",
      
      // Question display
      information: "Information",
      assessment: "Assessment",
      instructions: "Instructions:",
      
      // Audio player
      loadingAudio: "Loading audio...",
      errorLoadingAudio: "Error loading audio file. Please try refreshing the page.",
      tryAgainButton: "Try Again",
      play: "Play",
      pause: "Pause",
      restart: "Restart",
      
      // Audio recorder
      recordYourAnswer: "Record your answer",
      reviewYourRecording: "Review your recording",
      startRecording: "Start Recording",
      stopRecording: "Stop Recording",
      discard: "Discard",
      saveAndContinue: "Save & Continue",
      uploading: "Uploading...",
      
      // Errors
      microphoneError: "Microphone access denied. Please check your browser permissions.",
      uploadError: "Upload failed: ",
      unknownError: "Unknown error",
      
      // Completion page
      assessmentComplete: "Assessment Complete!",
      thankYou: "Thank you for completing the language assessment. Your responses have been recorded.",
      participantId: "Participant ID:",
      returnHome: "Return to Home"
    },
    
    chinese: {
      // General UI
      welcome: "一起来学习!",
      intro: "你好！我们将玩一些有趣的听力和口语游戏。准备好开始了吗？",
      codeLabel: "你的特别代码:",
      codeHelp: "这个代码帮助我们跟踪你的答案。如果你需要休息并稍后回来，可以把它写下来！",
      startButton: "开始吧! 🎮",
      languageLabel: "选择你的语言:",
      english: "English (英语)",
      chinese: "中文",
      loading: "正在加载有趣的活动...",
      error: "哎呀！出了点问题",
      tryAgain: "让我们再试一次",
      
      // Assessment steps
      listen: "指示",
      practice: "练习",
      answer: "正式测试",
      listenCarefully: "仔细听:",
      next: "下一个",
      finish: "完成",
      letsPractice: "让我们练习",
      startActivities: "开始活动",
      code: "代码:",
      of: "/",
      
      // Lookup flow
      newTest: "新测试",
      continueTest: "继续测试",
      existingId: "输入您的现有代码:",
      lookup: "查找",
      yourTests: "您的测试",
      startNewIn: "开始新的测试，使用",
      continueThis: "继续此测试",
      testStarted: "测试开始于",
      progress: "进度",
      language: "语言",
      testNumber: "测试 #",
      noTests: "找不到此参与者ID的测试",
      
      // Question display
      information: "信息",
      assessment: "正式测试",
      instructions: "指示:",
      
      // Audio player
      loadingAudio: "正在加载音频...",
      errorLoadingAudio: "加载音频文件出错。请刷新页面重试。",
      tryAgainButton: "重试",
      play: "播放",
      pause: "暂停",
      restart: "重新开始",
      
      // Audio recorder
      recordYourAnswer: "录制您的回答",
      reviewYourRecording: "检查您的录音",
      startRecording: "开始录音",
      stopRecording: "停止录音",
      discard: "重新录制",
      saveAndContinue: "保存并继续",
      uploading: "上传中...",
      
      // Errors
      microphoneError: "麦克风访问被拒绝。请检查您的浏览器权限。",
      uploadError: "上传失败: ",
      unknownError: "未知错误",
      
      // Completion page
      assessmentComplete: "评估完成!",
      thankYou: "感谢您完成语言评估。您的回答已被记录。",
      participantId: "参与者ID:",
      returnHome: "返回首页"
    }
  };
  
  /**
   * Get translation for a specific key
   * @param {string} key - The translation key
   * @param {string} language - The language to use (defaults to 'english')
   * @returns {string} - The translated text
   */
  const getTranslation = (key, language = 'english') => {
    // Ensure we have a valid language
    const validLanguage = translations[language] ? language : 'english';
    
    // Return the translation or the key if translation not found
    return translations[validLanguage][key] || key;
  };
  
  /**
   * Get all translations for a language
   * @param {string} language - The language to use (defaults to 'english')
   * @returns {object} - All translations for the language
   */
  const getAll = (language = 'english') => {
    const validLanguage = translations[language] ? language : 'english';
    return translations[validLanguage];
  };
  
  /**
   * Create a function that gets translations for a specific language
   * @param {string} language - The language to use
   * @returns {function} - A function that gets translations for the specified language
   */
  const createTranslator = (language) => {
    return (key) => getTranslation(key, language);
  };
  
  export { getTranslation, getAll, createTranslator };
  export default translations;