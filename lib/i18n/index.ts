// i18n Infrastructure for multi-language support
// Supports: English, Hindi, Odia (extensible for more languages)

export type Language = 'en' | 'hi' | 'or';

export interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.features': string;
  'nav.pricing': string;
  'nav.about': string;
  'nav.contact': string;
  
  // Hero Section
  'hero.title': string;
  'hero.subtitle': string;
  'hero.cta.primary': string;
  'hero.cta.secondary': string;
  
  // Statistics
  'stats.jobsSecured': string;
  'stats.usersActive': string;
  'stats.rating': string;
  
  // Features
  'features.title': string;
  'features.subtitle': string;
  'feature.assessment.title': string;
  'feature.assessment.description': string;
  'feature.mockInterview.title': string;
  'feature.mockInterview.description': string;
  'feature.jobHunter.title': string;
  'feature.jobHunter.description': string;
  'feature.resumeBuilder.title': string;
  'feature.resumeBuilder.description': string;
  'feature.questionBank.title': string;
  'feature.questionBank.description': string;
  'feature.analytics.title': string;
  'feature.analytics.description': string;
  
  // Why Choose Us
  'whyChoose.title': string;
  'whyChoose.subtitle': string;
  'whyChoose.aiPowered.title': string;
  'whyChoose.aiPowered.description': string;
  'whyChoose.realTime.title': string;
  'whyChoose.realTime.description': string;
  'whyChoose.comprehensive.title': string;
  'whyChoose.comprehensive.description': string;
  'whyChoose.expert.title': string;
  'whyChoose.expert.description': string;
  
  // How It Works
  'howItWorks.title': string;
  'howItWorks.subtitle': string;
  'howItWorks.step1.title': string;
  'howItWorks.step1.description': string;
  'howItWorks.step2.title': string;
  'howItWorks.step2.description': string;
  'howItWorks.step3.title': string;
  'howItWorks.step3.description': string;
  'howItWorks.step4.title': string;
  'howItWorks.step4.description': string;
  
  // Testimonials
  'testimonials.title': string;
  'testimonials.subtitle': string;
  
  // Partners
  'partners.title': string;
  'partners.subtitle': string;
  'partners.label': string;
  'partners.cta.title': string;
  'partners.cta.description': string;
  'partners.cta.button': string;
  
  // FAQ
  'faq.title': string;
  'faq.subtitle': string;
  'faq.askQuestion': string;
  
  // Problem Solution
  'problemSolution.badge': string;
  'problemSolution.title': string;
  'problemSolution.subtitle': string;
  'problemSolution.tabProblems': string;
  'problemSolution.tabSolutions': string;
  'problemSolution.cta.primary': string;
  'problemSolution.cta.secondary': string;
  
  'problem.unprepared.title': string;
  'problem.unprepared.description': string;
  'problem.unprepared.point1': string;
  'problem.unprepared.point2': string;
  'problem.unprepared.point3': string;
  'problem.unprepared.point4': string;
  
  'problem.time.title': string;
  'problem.time.description': string;
  'problem.time.point1': string;
  'problem.time.point2': string;
  'problem.time.point3': string;
  'problem.time.point4': string;
  
  'problem.feedback.title': string;
  'problem.feedback.description': string;
  'problem.feedback.point1': string;
  'problem.feedback.point2': string;
  'problem.feedback.point3': string;
  'problem.feedback.point4': string;
  
  'problem.outdated.title': string;
  'problem.outdated.description': string;
  'problem.outdated.point1': string;
  'problem.outdated.point2': string;
  'problem.outdated.point3': string;
  'problem.outdated.point4': string;
  
  'solution.aiPractice.title': string;
  'solution.aiPractice.description': string;
  'solution.aiPractice.benefit1': string;
  'solution.aiPractice.benefit2': string;
  'solution.aiPractice.benefit3': string;
  'solution.aiPractice.benefit4': string;
  
  'solution.instantFeedback.title': string;
  'solution.instantFeedback.description': string;
  'solution.instantFeedback.benefit1': string;
  'solution.instantFeedback.benefit2': string;
  'solution.instantFeedback.benefit3': string;
  'solution.instantFeedback.benefit4': string;
  
  'solution.comprehensive.title': string;
  'solution.comprehensive.description': string;
  'solution.comprehensive.benefit1': string;
  'solution.comprehensive.benefit2': string;
  'solution.comprehensive.benefit3': string;
  'solution.comprehensive.benefit4': string;
  
  'solution.smartPrep.title': string;
  'solution.smartPrep.description': string;
  'solution.smartPrep.benefit1': string;
  'solution.smartPrep.benefit2': string;
  'solution.smartPrep.benefit3': string;
  'solution.smartPrep.benefit4': string;
  
  // Pricing
  'pricing.title': string;
  'pricing.subtitle': string;
  'pricing.badge': string;
  'pricing.billing': string;
  'pricing.cta': string;
  'pricing.basic.name': string;
  'pricing.basic.price': string;
  'pricing.basic.feature1': string;
  'pricing.basic.feature2': string;
  'pricing.basic.feature3': string;
  'pricing.basic.feature4': string;
  'pricing.basic.feature5': string;
  'pricing.business.name': string;
  'pricing.business.price': string;
  'pricing.business.feature1': string;
  'pricing.business.feature2': string;
  'pricing.business.feature3': string;
  'pricing.business.feature4': string;
  'pricing.business.feature5': string;
  'pricing.enterprise.name': string;
  'pricing.enterprise.price': string;
  'pricing.enterprise.feature1': string;
  'pricing.enterprise.feature2': string;
  'pricing.enterprise.feature3': string;
  'pricing.enterprise.feature4': string;
  'pricing.enterprise.feature5': string;
  
  // Footer
  'footer.tagline': string;
  'footer.copyright': string;
  'footer.product': string;
  'footer.company': string;
  'footer.support': string;
  'footer.legal': string;
  
  // Auth
  'auth.login.title': string;
  'auth.login.subtitle': string;
  'auth.login.email': string;
  'auth.login.password': string;
  'auth.login.submit': string;
  'auth.login.forgotPassword': string;
  'auth.login.noAccount': string;
  'auth.login.createAccount': string;
  'auth.register.title': string;
  'auth.register.subtitle': string;
  'auth.register.firstName': string;
  'auth.register.lastName': string;
  'auth.register.email': string;
  'auth.register.password': string;
  'auth.register.confirmPassword': string;
  'auth.register.phone': string;
  'auth.register.agreeTerms': string;
  'auth.register.submit': string;
  'auth.register.haveAccount': string;
  'auth.register.signIn': string;
  
  // Common
  'common.learnMore': string;
  'common.getStarted': string;
  'common.signUp': string;
  'common.login': string;
  'common.logout': string;
  'common.dashboard': string;
  'common.profile': string;
  'common.settings': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;
}

export type Translations = Record<Language, TranslationKeys>;

const translations: Translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    
    // Hero Section
    'hero.title': 'The World Won\'t Wait. Be Ready with Solviq AI',
    'hero.subtitle': 'You\'ve got potential. Solviq AI makes sure the world sees it — by pushing you through real simulations, decoding your strengths, and building your personalized skill path.',
    'hero.cta.primary': 'Get Started',
    'hero.cta.secondary': 'View Demo',
    
    // Statistics
    'stats.jobsSecured': 'START YOUR JOURNEY',
    'stats.usersActive': 'AI-POWERED INTERVIEW PREP',
    'stats.rating': 'TRUSTED BY STUDENTS',
    
    // Features
    'features.title': 'Powerful Features to Help You Succeed',
    'features.subtitle': 'Everything you need to crush your interviews and land that dream offer — powered by AI brilliance',
    'feature.assessment.title': '💬 AI Interview Copilot',
    'feature.assessment.description': 'Your real-time interview wingman. Solviq listens, analyzes, and helps you answer like a pro — boosting your confidence with every response.',
    'feature.mockInterview.title': '🎯 Mock Interview Engine',
    'feature.mockInterview.description': 'Practice, but make it real. Experience recruiter-style interviews, get instant feedback, and level up your answers — fast.',
    'feature.jobHunter.title': '🤖 AI Job Hunter',
    'feature.jobHunter.description': 'Don\'t chase jobs. Let AI do it for you. Solviq scans, matches, and applies to the top opportunities 100× faster — while you focus on being your best self.',
    'feature.resumeBuilder.title': '🧾 AI Resume Builder',
    'feature.resumeBuilder.description': 'Craft a stunning, ATS-ready resume in one click. No writing skills. No templates. Just your story — perfectly optimized by AI.',
    'feature.questionBank.title': '💼 Interview Question Bank',
    'feature.questionBank.description': 'Get access to the questions real recruiters ask. Practice top company-specific questions and learn how to answer them like a pro.',
    'feature.analytics.title': 'Performance Analytics',
    'feature.analytics.description': 'Your growth, decoded by data. Solviq tracks every simulation, highlights strengths, and pinpoints what to fix next — so you\'re always getting better.',
    
    // Why Choose Us
    'whyChoose.title': 'Why Choose Solviq AI',
    'whyChoose.subtitle': 'Because the world doesn\'t need another learning app — it needs an Engine that Understands You',
    'whyChoose.aiPowered.title': '🧠 The Solviq Engine',
    'whyChoose.aiPowered.description': 'Not a tool. Not a portal. A next-gen AI Employability Engine built to measure, decode, and define your career readiness. Solviq doesn\'t ask how much you\'ve learned — it tells you how fit you are for the role you want.',
    'whyChoose.realTime.title': '⚡ Powered by Multi-Agent Intelligence',
    'whyChoose.realTime.description': 'Four autonomous AI systems working as one cohesive engine: Resume Intelligence, Simulation Engine, Analytical Core, and Application Engine — creating a continuous cycle of assessment, evolution, and opportunity.',
    'whyChoose.comprehensive.title': '🚀 AI at the Core, Insight at the Surface',
    'whyChoose.comprehensive.description': 'Built on advanced LLM frameworks and behavioral analytics, Solviq runs deep data evaluations to understand not just what you know — but how ready you are. It\'s employability, quantified.',
    'whyChoose.expert.title': '🔍 Designed Like a Machine, Built for Humans',
    'whyChoose.expert.description': 'Real-time performance calibration, adaptive role-based testing, AI-driven skill diagnostics, and readiness scoring that evolves with you. Solviq doesn\'t just test you — it reads you.',
    
    // How It Works
    'howItWorks.title': 'How Solviq Works',
    'howItWorks.subtitle': 'Four simple steps to decode your interview readiness',
    'howItWorks.step1.title': '🧾 Resume Intelligence',
    'howItWorks.step1.description': 'Upload your resume — or let Solviq build one for you in seconds. The engine parses your profile, identifies your core strengths, and maps you to the most suitable job roles automatically.',
    'howItWorks.step2.title': '🎯 Simulation Engine',
    'howItWorks.step2.description': 'Enter a real-time virtual hiring environment. Solviq replicates aptitude, technical, and HR rounds — scoring you with AI precision to mirror an actual placement process.',
    'howItWorks.step3.title': '📊 Readiness Analytics',
    'howItWorks.step3.description': 'Once you\'re tested, the engine breaks down your performance into role-specific readiness metrics. It doesn\'t just show marks — it tells how fit you are for the job you want.',
    'howItWorks.step4.title': '🚀 Auto-Application Engine',
    'howItWorks.step4.description': 'When your readiness level hits the benchmark, Solviq activates its AI Job Agent. It scans live openings, matches your profile, and auto-applies — turning readiness into real opportunity.',
    
    // Testimonials
    'testimonials.title': 'What Our Users Say',
    'testimonials.subtitle': 'Join thousands of successful candidates who trusted Solviq',
    
    // Partners
    'partners.title': 'Trusted by Leading Companies',
    'partners.subtitle': 'Our platform is recognized by top organizations worldwide',
    'partners.label': 'In collaboration with:',
    'partners.cta.title': 'Kick Start Your Career',
    'partners.cta.description': 'Whether you\'re a freelancer, a team, or a growing agency— our tools adapt to your workflow. Design faster. Deliver better.',
    'partners.cta.button': 'Get Started',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Life is short why spent to design from scratch, Use finalui templates and its dummy text like lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'faq.askQuestion': 'Ask question',
    
    // Problem Solution
    'problemSolution.badge': 'Transform Your Interview Preparation',
    'problemSolution.title': 'From Interview Anxiety to',
    'problemSolution.subtitle': 'We understand the challenges you face. Here\'s how Solviq AI solves them.',
    'problemSolution.tabProblems': 'Common Problems',
    'problemSolution.tabSolutions': 'Our Solutions',
    'problemSolution.cta.primary': 'Start Your Free Trial',
    'problemSolution.cta.secondary': 'See How It Works',
    
    'problem.unprepared.title': 'Feeling Unprepared',
    'problem.unprepared.description': 'Walking into interviews without proper practice and confidence',
    'problem.unprepared.point1': 'Don\'t know what questions to expect',
    'problem.unprepared.point2': 'Lack of real interview experience',
    'problem.unprepared.point3': 'Nervous about behavioral questions',
    'problem.unprepared.point4': 'Unsure how to present yourself',
    
    'problem.time.title': 'Limited Time to Practice',
    'problem.time.description': 'Struggling to find time for comprehensive interview preparation',
    'problem.time.point1': 'Busy schedule with limited prep time',
    'problem.time.point2': 'No access to mock interviewers',
    'problem.time.point3': 'Can\'t afford expensive coaching',
    'problem.time.point4': 'Need flexible practice options',
    
    'problem.feedback.title': 'No Quality Feedback',
    'problem.feedback.description': 'Practicing without knowing what you\'re doing wrong',
    'problem.feedback.point1': 'No one to review your answers',
    'problem.feedback.point2': 'Don\'t know your weak areas',
    'problem.feedback.point3': 'Repeating the same mistakes',
    'problem.feedback.point4': 'Can\'t track improvement',
    
    'problem.outdated.title': 'Outdated Resources',
    'problem.outdated.description': 'Using generic prep materials that don\'t match real interviews',
    'problem.outdated.point1': 'Questions don\'t match actual interviews',
    'problem.outdated.point2': 'No company-specific preparation',
    'problem.outdated.point3': 'Generic advice that doesn\'t help',
    'problem.outdated.point4': 'Resources not updated regularly',
    
    'solution.aiPractice.title': 'AI-Powered Mock Interviews',
    'solution.aiPractice.description': 'Practice with realistic AI interviews anytime, anywhere',
    'solution.aiPractice.benefit1': 'Unlimited practice sessions 24/7',
    'solution.aiPractice.benefit2': 'Realistic interview simulations',
    'solution.aiPractice.benefit3': 'Company-specific question patterns',
    'solution.aiPractice.benefit4': 'Voice and video interview support',
    
    'solution.instantFeedback.title': 'Instant AI Feedback',
    'solution.instantFeedback.description': 'Get detailed analysis and improvement suggestions immediately',
    'solution.instantFeedback.benefit1': 'Real-time performance analysis',
    'solution.instantFeedback.benefit2': 'Personalized improvement tips',
    'solution.instantFeedback.benefit3': 'Track progress over time',
    'solution.instantFeedback.benefit4': 'Identify and fix weak areas',
    
    'solution.comprehensive.title': 'Comprehensive Question Bank',
    'solution.comprehensive.description': '10,000+ real interview questions from top companies',
    'solution.comprehensive.benefit1': 'Technical & behavioral questions',
    'solution.comprehensive.benefit2': 'Company-specific questions',
    'solution.comprehensive.benefit3': 'Regularly updated database',
    'solution.comprehensive.benefit4': 'Industry-specific content',
    
    'solution.smartPrep.title': 'Smart Preparation Plan',
    'solution.smartPrep.description': 'AI creates personalized study plans based on your needs',
    'solution.smartPrep.benefit1': 'Customized learning paths',
    'solution.smartPrep.benefit2': 'Focus on your weak areas',
    'solution.smartPrep.benefit3': 'Time-efficient preparation',
    'solution.smartPrep.benefit4': 'Adaptive difficulty levels',
    
    // Pricing
    'pricing.title': 'Choose the Plan That\'s Right for You',
    'pricing.subtitle': 'Giving you access to essential features and over 1,000 creative tools. Upgrade to the Pro Plan to unlock powerful AI capabilities, cloud syncing, and a whole new level of creative freedom.',
    'pricing.badge': 'Best Value',
    'pricing.billing': 'Billed annually.',
    'pricing.cta': 'Get started',
    'pricing.basic.name': 'Basic plan',
    'pricing.basic.price': '$10/month',
    'pricing.basic.feature1': 'Flexible Plans',
    'pricing.basic.feature2': 'Scalability',
    'pricing.basic.feature3': '24/7 Email Support',
    'pricing.basic.feature4': '200 Recording',
    'pricing.basic.feature5': '30 Days Backup',
    'pricing.business.name': 'Business plan',
    'pricing.business.price': '$20/month',
    'pricing.business.feature1': 'Access to all basic features',
    'pricing.business.feature2': 'Basic reporting and analytics',
    'pricing.business.feature3': 'Up to 10 individual users',
    'pricing.business.feature4': '20GB individual data each user',
    'pricing.business.feature5': 'Basic chat and email support',
    'pricing.enterprise.name': 'Enterprise plan',
    'pricing.enterprise.price': '$40/month',
    'pricing.enterprise.feature1': 'Access to all basic features',
    'pricing.enterprise.feature2': 'Basic reporting and analytics',
    'pricing.enterprise.feature3': 'Up to 10 individual users',
    'pricing.enterprise.feature4': '20GB individual data each user',
    'pricing.enterprise.feature5': 'Basic chat and email support',
    
    // Footer
    'footer.tagline': 'The Engine That Defines Readiness',
    'footer.copyright': '© 2025 Solviq AI. All rights reserved.',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    
    // Auth
    'auth.login.title': 'Welcome back',
    'auth.login.subtitle': 'Login to your account to continue your journey',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Login',
    'auth.login.forgotPassword': 'Forgot password?',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.createAccount': 'Create account',
    'auth.register.title': 'Create your account',
    'auth.register.subtitle': 'Start your journey to interview success',
    'auth.register.firstName': 'First name',
    'auth.register.lastName': 'Last name',
    'auth.register.email': 'Email',
    'auth.register.password': 'Password',
    'auth.register.confirmPassword': 'Confirm password',
    'auth.register.phone': 'Phone number',
    'auth.register.agreeTerms': 'I agree to the Terms & Conditions',
    'auth.register.submit': 'Create account',
    'auth.register.haveAccount': 'Already have an account?',
    'auth.register.signIn': 'Sign in',
    
    // Common
    'common.learnMore': 'Learn More',
    'common.getStarted': 'Get Started',
    'common.signUp': 'Sign Up',
    'common.login': 'Login',
    'common.logout': 'Logout',
    'common.dashboard': 'Dashboard',
    'common.profile': 'Profile',
    'common.settings': 'Settings',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.features': 'विशेषताएं',
    'nav.pricing': 'मूल्य निर्धारण',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क करें',
    
    // Hero Section
    'hero.title': 'दुनिया इंतजार नहीं करेगी। Solviq AI के साथ तैयार रहें',
    'hero.subtitle': 'आपमें क्षमता है। Solviq AI यह सुनिश्चित करता है कि दुनिया इसे देखे — वास्तविक सिमुलेशन के माध्यम से आपको आगे बढ़ाकर, आपकी ताकत का विश्लेषण करके, और आपका व्यक्तिगत कौशल मार्ग बनाकर।',
    'hero.cta.primary': 'शुरू करें',
    'hero.cta.secondary': 'डेमो देखें',
    
    // Statistics
    'stats.jobsSecured': 'अपनी यात्रा शुरू करें',
    'stats.usersActive': 'AI-संचालित इंटरव्यू तैयारी',
    'stats.rating': 'छात्रों द्वारा विश्वसनीय',
    
    // Features
    'features.title': 'सफलता के लिए शक्तिशाली विशेषताएं',
    'features.subtitle': 'आपके इंटरव्यू को पार करने और वह सपनों की नौकरी पाने के लिए आवश्यक सब कुछ — AI ब्रिलिएंस द्वारा संचालित',
    'feature.assessment.title': '💬 AI इंटरव्यू कोपायलट',
    'feature.assessment.description': 'आपका रियल-टाइम इंटरव्यू विंगमैन। Solviq सुनता है, विश्लेषण करता है, और आपको एक प्रो की तरह जवाब देने में मदद करता है — हर जवाब के साथ आपका आत्मविश्वास बढ़ाकर।',
    'feature.mockInterview.title': '🎯 मॉक इंटरव्यू इंजन',
    'feature.mockInterview.description': 'अभ्यास करें, लेकिन इसे वास्तविक बनाएं। रिक्रूटर-स्टाइल इंटरव्यू का अनुभव करें, तत्काल फीडबैक पाएं, और अपने जवाबों को तेजी से बेहतर बनाएं।',
    'feature.jobHunter.title': '🤖 AI जॉब हंटर',
    'feature.jobHunter.description': 'नौकरियों का पीछा न करें। AI को यह करने दें। Solviq स्कैन करता है, मैच करता है, और शीर्ष अवसरों के लिए 100× तेजी से आवेदन करता है — जबकि आप अपना सर्वश्रेष्ठ बनने पर ध्यान देते हैं।',
    'feature.resumeBuilder.title': '🧾 AI रिज्यूमे बिल्डर',
    'feature.resumeBuilder.description': 'एक क्लिक में एक शानदार, ATS-तैयार रिज्यूमे बनाएं। कोई लेखन कौशल नहीं। कोई टेम्पलेट नहीं। बस आपकी कहानी — AI द्वारा पूरी तरह से अनुकूलित।',
    'feature.questionBank.title': '💼 इंटरव्यू प्रश्न बैंक',
    'feature.questionBank.description': 'वास्तविक रिक्रूटरों द्वारा पूछे जाने वाले प्रश्नों तक पहुंच प्राप्त करें। शीर्ष कंपनी-विशिष्ट प्रश्नों का अभ्यास करें और उन्हें एक प्रो की तरह जवाब देना सीखें।',
    'feature.analytics.title': 'प्रदर्शन विश्लेषण',
    'feature.analytics.description': 'आपकी वृद्धि, डेटा द्वारा डिकोड। Solviq हर सिमुलेशन को ट्रैक करता है, ताकत को उजागर करता है, और बताता है कि अगला क्या ठीक करना है — ताकि आप हमेशा बेहतर होते रहें।',
    
    // Why Choose Us
    'whyChoose.title': 'Solviq AI क्यों चुनें',
    'whyChoose.subtitle': 'क्योंकि दुनिया को किसी और लर्निंग ऐप की जरूरत नहीं — इसकी जरूरत एक इंजन की है जो आपको समझता है',
    'whyChoose.aiPowered.title': '🧠 The Solviq Engine',
    'whyChoose.aiPowered.description': 'एक उपकरण नहीं। एक पोर्टल नहीं। एक नेक्स्ट-जेन AI रोजगार योग्यता इंजन बनाया गया है आपकी करियर तत्परता को मापने, डिकोड करने और परिभाषित करने के लिए। Solviq यह नहीं पूछता कि आपने कितना सीखा है — यह बताता है कि आप जिस भूमिका चाहते हैं उसके लिए कितने फिट हैं।',
    'whyChoose.realTime.title': '⚡ Powered by Multi-Agent Intelligence',
    'whyChoose.realTime.description': 'चार स्वायत्त AI सिस्टम एक सामंजस्यपूर्ण इंजन के रूप में काम कर रहे हैं: रिज्यूम इंटेलिजेंस, सिमुलेशन इंजन, एनालिटिकल कोर, और एप्लिकेशन इंजन — मूल्यांकन, विकास और अवसर का एक निरंतर चक्र बनाते हुए।',
    'whyChoose.comprehensive.title': '🚀 AI at the Core, Insight at the Surface',
    'whyChoose.comprehensive.description': 'उन्नत LLM फ्रेमवर्क और व्यवहारिक एनालिटिक्स पर बनाया गया, Solviq गहरे डेटा मूल्यांकन चलाता है यह समझने के लिए कि न केवल आप क्या जानते हैं — बल्कि आप कितने तैयार हैं। यह रोजगार योग्यता है, मात्रात्मक रूप से।',
    'whyChoose.expert.title': '🔍 Designed Like a Machine, Built for Humans',
    'whyChoose.expert.description': 'रियल-टाइम प्रदर्शन कैलिब्रेशन, अनुकूली भूमिका-आधारित परीक्षण, AI-संचालित कौशल निदान, और तत्परता स्कोरिंग जो आपके साथ विकसित होती है। Solviq आपका परीक्षण नहीं करता — यह आपको पढ़ता है।',
    
    // How It Works
    'howItWorks.title': 'Solviq कैसे काम करता है',
    'howItWorks.subtitle': 'आपकी इंटरव्यू तत्परता को डिकोड करने के लिए चार सरल कदम',
    'howItWorks.step1.title': '🧾 रिज्यूम इंटेलिजेंस',
    'howItWorks.step1.description': 'अपना रिज्यूम अपलोड करें — या Solviq को सेकंड में आपके लिए एक बनाने दें। इंजन आपकी प्रोफाइल को पार्स करता है, आपकी मुख्य ताकत को पहचानता है, और आपको स्वचालित रूप से सबसे उपयुक्त नौकरी भूमिकाओं से मैप करता है।',
    'howItWorks.step2.title': '🎯 सिमुलेशन इंजन',
    'howItWorks.step2.description': 'एक रियल-टाइम वर्चुअल हायरिंग वातावरण में प्रवेश करें। Solviq योग्यता, तकनीकी, और HR राउंड को दोहराता है — आपको AI सटीकता के साथ स्कोर करता है एक वास्तविक प्लेसमेंट प्रक्रिया को प्रतिबिंबित करने के लिए।',
    'howItWorks.step3.title': '📊 तत्परता विश्लेषण',
    'howItWorks.step3.description': 'एक बार जब आपका परीक्षण हो जाता है, तो इंजन आपके प्रदर्शन को भूमिका-विशिष्ट तत्परता मैट्रिक्स में तोड़ता है। यह केवल अंक नहीं दिखाता — यह बताता है कि आप जिस नौकरी चाहते हैं उसके लिए आप कितने फिट हैं।',
    'howItWorks.step4.title': '🚀 ऑटो-एप्लिकेशन इंजन',
    'howItWorks.step4.description': 'जब आपका तत्परता स्तर बेंचमार्क को हिट करता है, तो Solviq अपने AI जॉब एजेंट को सक्रिय करता है। यह लाइव खुली नौकरियों को स्कैन करता है, आपकी प्रोफाइल से मैच करता है, और स्वचालित रूप से आवेदन करता है — तत्परता को वास्तविक अवसर में बदलते हुए।',
    
    // Testimonials
    'testimonials.title': 'हमारे उपयोगकर्ता क्या कहते हैं',
    'testimonials.subtitle': 'हजारों सफल उम्मीदवारों में शामिल हों जिन्होंने Solviq पर भरोसा किया',
    
    // Partners
    'partners.title': 'अग्रणी कंपनियों द्वारा विश्वसनीय',
    'partners.subtitle': 'हमारा प्लेटफॉर्म दुनिया भर के शीर्ष संगठनों द्वारा मान्यता प्राप्त है',
    'partners.label': 'सहयोग में:',
    'partners.cta.title': 'अपने करियर की शुरुआत करें',
    'partners.cta.description': 'चाहे आप एक फ्रीलांसर हों, एक टीम हों, या एक बढ़ती एजेंसी— हमारे उपकरण आपके वर्कफ़्लो के अनुकूल होते हैं। तेज़ी से डिज़ाइन करें। बेहतर डिलीवर करें।',
    'partners.cta.button': 'शुरू करें',
    
    // FAQ
    'faq.title': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.subtitle': 'जीवन छोटा है, शुरुआत से डिज़ाइन करने में समय क्यों बिताएं, finalui टेम्प्लेट्स का उपयोग करें और इसके डमी टेक्स्ट जैसे lorem ipsum dolor sit amet, consectetur adipiscing elit।',
    'faq.askQuestion': 'प्रश्न पूछें',
    
    // Problem Solution
    'problemSolution.badge': 'अपनी इंटरव्यू तैयारी में क्रांति लाएं',
    'problemSolution.title': 'इंटरव्यू की चिंता से',
    'problemSolution.subtitle': 'हम आपकी चुनौतियों को समझते हैं। यहाँ बताया गया है कि Solviq AI उन्हें कैसे हल करता है।',
    'problemSolution.tabProblems': 'आम समस्याएं',
    'problemSolution.tabSolutions': 'हमारे समाधान',
    'problemSolution.cta.primary': 'अपना मुफ्त ट्रायल शुरू करें',
    'problemSolution.cta.secondary': 'यह कैसे काम करता है देखें',
    
    'problem.unprepared.title': 'अपर्याप्त तैयारी महसूस करना',
    'problem.unprepared.description': 'उचित अभ्यास और आत्मविश्वास के बिना इंटरव्यू में जाना',
    'problem.unprepared.point1': 'पता नहीं कि किन सवालों की उम्मीद करें',
    'problem.unprepared.point2': 'वास्तविक इंटरव्यू अनुभव की कमी',
    'problem.unprepared.point3': 'व्यवहारिक प्रश्नों के बारे में घबराहट',
    'problem.unprepared.point4': 'खुद को कैसे पेश करें यह अनिश्चित',
    
    'problem.time.title': 'अभ्यास के लिए सीमित समय',
    'problem.time.description': 'व्यापक इंटरव्यू तैयारी के लिए समय खोजने में संघर्ष',
    'problem.time.point1': 'सीमित तैयारी समय के साथ व्यस्त कार्यक्रम',
    'problem.time.point2': 'मॉक इंटरव्यूअर तक पहुंच नहीं',
    'problem.time.point3': 'महंगी कोचिंग का खर्च नहीं उठा सकते',
    'problem.time.point4': 'लचीले अभ्यास विकल्प की आवश्यकता',
    
    'problem.feedback.title': 'गुणवत्तापूर्ण फीडबैक नहीं',
    'problem.feedback.description': 'यह जाने बिना अभ्यास करना कि आप क्या गलत कर रहे हैं',
    'problem.feedback.point1': 'आपके उत्तरों की समीक्षा करने वाला कोई नहीं',
    'problem.feedback.point2': 'अपने कमजोर क्षेत्रों को नहीं जानते',
    'problem.feedback.point3': 'वही गलतियाँ दोहराना',
    'problem.feedback.point4': 'सुधार को ट्रैक नहीं कर सकते',
    
    'problem.outdated.title': 'पुराने संसाधन',
    'problem.outdated.description': 'सामान्य तैयारी सामग्री का उपयोग जो वास्तविक इंटरव्यू से मेल नहीं खाती',
    'problem.outdated.point1': 'प्रश्न वास्तविक इंटरव्यू से मेल नहीं खाते',
    'problem.outdated.point2': 'कोई कंपनी-विशिष्ट तैयारी नहीं',
    'problem.outdated.point3': 'सामान्य सलाह जो मदद नहीं करती',
    'problem.outdated.point4': 'संसाधन नियमित रूप से अपडेट नहीं होते',
    
    'solution.aiPractice.title': 'AI-संचालित मॉक इंटरव्यू',
    'solution.aiPractice.description': 'कभी भी, कहीं भी यथार्थवादी AI इंटरव्यू के साथ अभ्यास करें',
    'solution.aiPractice.benefit1': '24/7 असीमित अभ्यास सत्र',
    'solution.aiPractice.benefit2': 'यथार्थवादी इंटरव्यू सिमुलेशन',
    'solution.aiPractice.benefit3': 'कंपनी-विशिष्ट प्रश्न पैटर्न',
    'solution.aiPractice.benefit4': 'वॉयस और वीडियो इंटरव्यू समर्थन',
    
    'solution.instantFeedback.title': 'तत्काल AI फीडबैक',
    'solution.instantFeedback.description': 'तुरंत विस्तृत विश्लेषण और सुधार सुझाव प्राप्त करें',
    'solution.instantFeedback.benefit1': 'रियल-टाइम प्रदर्शन विश्लेषण',
    'solution.instantFeedback.benefit2': 'व्यक्तिगत सुधार टिप्स',
    'solution.instantFeedback.benefit3': 'समय के साथ प्रगति ट्रैक करें',
    'solution.instantFeedback.benefit4': 'कमजोर क्षेत्रों की पहचान और सुधार करें',
    
    'solution.comprehensive.title': 'व्यापक प्रश्न बैंक',
    'solution.comprehensive.description': 'शीर्ष कंपनियों से 10,000+ वास्तविक इंटरव्यू प्रश्न',
    'solution.comprehensive.benefit1': 'तकनीकी और व्यवहारिक प्रश्न',
    'solution.comprehensive.benefit2': 'कंपनी-विशिष्ट प्रश्न',
    'solution.comprehensive.benefit3': 'नियमित रूप से अपडेट किया गया डेटाबेस',
    'solution.comprehensive.benefit4': 'उद्योग-विशिष्ट सामग्री',
    
    'solution.smartPrep.title': 'स्मार्ट तैयारी योजना',
    'solution.smartPrep.description': 'AI आपकी आवश्यकताओं के आधार पर व्यक्तिगत अध्ययन योजना बनाता है',
    'solution.smartPrep.benefit1': 'अनुकूलित सीखने के मार्ग',
    'solution.smartPrep.benefit2': 'अपने कमजोर क्षेत्रों पर ध्यान दें',
    'solution.smartPrep.benefit3': 'समय-कुशल तैयारी',
    'solution.smartPrep.benefit4': 'अनुकूली कठिनाई स्तर',
    
    // Pricing
    'pricing.title': 'अपने लिए सही योजना चुनें',
    'pricing.subtitle': 'आपको आवश्यक सुविधाओं और 1,000 से अधिक रचनात्मक उपकरणों तक पहुंच प्रदान करना। शक्तिशाली AI क्षमताओं, क्लाउड सिंकिंग और रचनात्मक स्वतंत्रता के एक नए स्तर को अनलॉक करने के लिए Pro Plan में अपग्रेड करें।',
    'pricing.badge': 'सर्वोत्तम मूल्य',
    'pricing.billing': 'वार्षिक बिल किया गया।',
    'pricing.cta': 'शुरू करें',
    'pricing.basic.name': 'बेसिक योजना',
    'pricing.basic.price': '$10/महीना',
    'pricing.basic.feature1': 'लचीली योजनाएं',
    'pricing.basic.feature2': 'मापनीयता',
    'pricing.basic.feature3': '24/7 ईमेल सपोर्ट',
    'pricing.basic.feature4': '200 रिकॉर्डिंग',
    'pricing.basic.feature5': '30 दिन बैकअप',
    'pricing.business.name': 'व्यवसाय योजना',
    'pricing.business.price': '$20/महीना',
    'pricing.business.feature1': 'सभी बेसिक सुविधाओं तक पहुंच',
    'pricing.business.feature2': 'बेसिक रिपोर्टिंग और एनालिटिक्स',
    'pricing.business.feature3': '10 व्यक्तिगत उपयोगकर्ता तक',
    'pricing.business.feature4': 'प्रत्येक उपयोगकर्ता के लिए 20GB व्यक्तिगत डेटा',
    'pricing.business.feature5': 'बेसिक चैट और ईमेल सपोर्ट',
    'pricing.enterprise.name': 'एंटरप्राइज योजना',
    'pricing.enterprise.price': '$40/महीना',
    'pricing.enterprise.feature1': 'सभी बेसिक सुविधाओं तक पहुंच',
    'pricing.enterprise.feature2': 'बेसिक रिपोर्टिंग और एनालिटिक्स',
    'pricing.enterprise.feature3': '10 व्यक्तिगत उपयोगकर्ता तक',
    'pricing.enterprise.feature4': 'प्रत्येक उपयोगकर्ता के लिए 20GB व्यक्तिगत डेटा',
    'pricing.enterprise.feature5': 'बेसिक चैट और ईमेल सपोर्ट',
    
    // Footer
    'footer.tagline': 'वह इंजन जो तत्परता को परिभाषित करता है',
    'footer.copyright': '© 2025 Solviq AI। सर्वाधिकार सुरक्षित।',
    'footer.product': 'उत्पाद',
    'footer.company': 'कंपनी',
    'footer.support': 'समर्थन',
    'footer.legal': 'कानूनी',
    
    // Auth
    'auth.login.title': 'वापसी पर स्वागत है',
    'auth.login.subtitle': 'अपनी यात्रा जारी रखने के लिए अपने खाते में लॉगिन करें',
    'auth.login.email': 'ईमेल',
    'auth.login.password': 'पासवर्ड',
    'auth.login.submit': 'लॉगिन',
    'auth.login.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.login.noAccount': 'खाता नहीं है?',
    'auth.login.createAccount': 'खाता बनाएं',
    'auth.register.title': 'अपना खाता बनाएं',
    'auth.register.subtitle': 'इंटरव्यू सफलता की अपनी यात्रा शुरू करें',
    'auth.register.firstName': 'पहला नाम',
    'auth.register.lastName': 'अंतिम नाम',
    'auth.register.email': 'ईमेल',
    'auth.register.password': 'पासवर्ड',
    'auth.register.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.register.phone': 'फ़ोन नंबर',
    'auth.register.agreeTerms': 'मैं नियम और शर्तों से सहमत हूं',
    'auth.register.submit': 'खाता बनाएं',
    'auth.register.haveAccount': 'पहले से खाता है?',
    'auth.register.signIn': 'साइन इन करें',
    
    // Common
    'common.learnMore': 'और जानें',
    'common.getStarted': 'शुरू करें',
    'common.signUp': 'साइन अप',
    'common.login': 'लॉग इन',
    'common.logout': 'लॉग आउट',
    'common.dashboard': 'डैशबोर्ड',
    'common.profile': 'प्रोफाइल',
    'common.settings': 'सेटिंग्स',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
  },
  or: {
    // Navigation
    'nav.home': 'ମୂଳପୃଷ୍ଠା',
    'nav.features': 'ବୈଶିଷ୍ଟ୍ୟ',
    'nav.pricing': 'ମୂଲ୍ୟ',
    'nav.about': 'ଆମ ବିଷୟରେ',
    'nav.contact': 'ଯୋଗାଯୋଗ',
    
    // Hero Section
    'hero.title': 'ପୃଥିବୀ ଅପେକ୍ଷା କରିବ ନାହିଁ। Solviq AI ସହିତ ପ୍ରସ୍ତୁତ ରୁହନ୍ତୁ',
    'hero.subtitle': 'ଆପଣଙ୍କ ମଧ୍ୟରେ କ୍ଷମତା ଅଛି। Solviq AI ନିଶ୍ଚିତ କରେ ଯେ ପୃଥିବୀ ଏହାକୁ ଦେଖିବ — ବାସ୍ତବ ସିମୁଲେସନ୍ ମାଧ୍ୟମରେ ଆପଣଙ୍କୁ ଆଗକୁ ଯାଏ, ଆପଣଙ୍କର ଶକ୍ତିର ବିଶ୍ଳେଷଣ କରେ, ଏବଂ ଆପଣଙ୍କର ବ୍ୟକ୍ତିଗତ ଦକ୍ଷତା ପଥ ଗଠନ କରେ।',
    'hero.cta.primary': 'ଆରମ୍ଭ କରନ୍ତୁ',
    'hero.cta.secondary': 'ଡେମୋ ଦେଖନ୍ତୁ',
    
    // Statistics
    'stats.jobsSecured': 'ଆପଣଙ୍କର ଯାତ୍ରା ଆରମ୍ଭ କରନ୍ତୁ',
    'stats.usersActive': 'AI-ଚାଳିତ ସାକ୍ଷାତକାର ପ୍ରସ୍ତୁତି',
    'stats.rating': 'ଛାତ୍ରମାନଙ୍କ ଦ୍ୱାରା ବିଶ୍ୱସ୍ତ',
    
    // Features
    'features.title': 'ସଫଳତା ପାଇଁ ଶକ୍ତିଶାଳୀ ବୈଶିଷ୍ଟ୍ୟ',
    'features.subtitle': 'ଆପଣଙ୍କର ସାକ୍ଷାତକାରକୁ ଉତ୍କୃଷ୍ଟ କରିବା ଏବଂ ସେହି ସ୍ୱପ୍ନର ଚାକିରି ପାଇବା ପାଇଁ ଆବଶ୍ୟକ ସବୁକିଛି — AI ବିଲ୍ୟାନ୍ସ୍ ଦ୍ୱାରା ଚାଳିତ',
    'feature.assessment.title': '💬 AI ସାକ୍ଷାତକାର କୋପାଇଲଟ୍',
    'feature.assessment.description': 'ଆପଣଙ୍କର ରିଅଲ୍-ଟାଇମ୍ ସାକ୍ଷାତକାର ବାହୁବଳୀ। Solviq ଶୁଣେ, ବିଶ୍ଳେଷଣ କରେ, ଏବଂ ଆପଣଙ୍କୁ ଏକ ପ୍ରୋ ଭଳି ଉତ୍ତର ଦେବାରେ ସାହାଯ୍ୟ କରେ — ପ୍ରତ୍ୟେକ ଉତ୍ତର ସହିତ ଆପଣଙ୍କ ଆତ୍ମବିଶ୍ୱାସକୁ ବୃଦ୍ଧି କରାଇ।',
    'feature.mockInterview.title': '🎯 ମକ୍ ସାକ୍ଷାତକାର ଇଞ୍ଜିନ୍',
    'feature.mockInterview.description': 'ଅଭ୍ୟାସ କରନ୍ତୁ, କିନ୍ତୁ ଏହାକୁ ବାସ୍ତବ କରନ୍ତୁ। ରିକ୍ରୁଟର୍-ଷ୍ଟାଇଲ୍ ସାକ୍ଷାତକାରର ଅନୁଭବ କରନ୍ତୁ, ତୁରନ୍ତ ଫିଡବ୍ୟାକ୍ ପାଆନ୍ତୁ, ଏବଂ ଆପଣଙ୍କର ଉତ୍ତରଗୁଡିକୁ ଶୀଘ୍ର ଉନ୍ନତ କରନ୍ତୁ।',
    'feature.jobHunter.title': '🤖 AI ଜବ୍ ହଣ୍ଟର୍',
    'feature.jobHunter.description': 'ଚାକିରି ମଧ୍ୟରେ ଦୌଡ଼ନ୍ତୁ ନାହିଁ। AI କୁ ଏହା କରିବାକୁ ଦିଅନ୍ତୁ। Solviq ସ୍କାନ୍ କରେ, ମେଳ କରେ, ଏବଂ ଶୀର୍ଷ ସୁଯୋଗଗୁଡିକ ପାଇଁ 100× ଦ୍ରୁତରେ ଆବେଦନ କରେ — ଯେତେବେଳେ ଆପଣ ଆପଣଙ୍କର ସର୍ବୋତ୍ତମ ସ୍ୱୟଂ ବନିବା ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତି।',
    'feature.resumeBuilder.title': '🧾 AI ରିଜ୍ୟୁମ୍ ବିଲ୍ଡର୍',
    'feature.resumeBuilder.description': 'ଗୋଟିଏ କ୍ଲିକରେ ଏକ ଚମତ୍କାର, ATS-ପ୍ରସ୍ତୁତ ରିଜ୍ୟୁମ୍ ତିଆରି କରନ୍ତୁ। କୌଣସି ଲେଖିବା କୌଶଳ ନାହିଁ। କୌଣସି ଟେମ୍ପଲେଟ୍ ନାହିଁ। କେବଳ ଆପଣଙ୍କର କଥା — AI ଦ୍ୱାରା ସିଦ୍ଧାନ୍ତପୂର୍ବକ ଅନୁକୂଳିତ।',
    'feature.questionBank.title': '💼 ସାକ୍ଷାତକାର ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍',
    'feature.questionBank.description': 'ବାସ୍ତବ ରିକ୍ରୁଟର୍ ମାନଙ୍କଦ୍ୱାରା ପଚରାଯାଉଥିବା ପ୍ରଶ୍ନଗୁଡିକ ପାଇବାକୁ ପାଆନ୍ତୁ। ଶୀର୍ଷ କମ୍ପାନୀ-ବିଶେଷ ପ୍ରଶ୍ନଗୁଡିକର ଅଭ୍ୟାସ କରନ୍ତୁ ଏବଂ ତାହାକୁ ଏକ ପ୍ରୋ ଭଳି କିପରି ଉତ୍ତର ଦେବେ ଶିଖନ୍ତୁ।',
    'feature.analytics.title': 'କାର୍ଯ୍ୟଦକ୍ଷତା ବିଶ୍ଳେଷଣ',
    'feature.analytics.description': 'ଆପଣଙ୍କର ବୃଦ୍ଧି, ଡାଟା ଦ୍ୱାରା ଡିକୋଡ୍। Solviq ପ୍ରତ୍ୟେକ ସିମୁଲେସନ୍ ଟ୍ରାକ୍ କରେ, ଶକ୍ତିଗୁଡିକ ଉଜାଗର କରେ, ଏବଂ କହେ ଯେ ପରବର୍ତ୍ତୀ କ&apos;ଣ ଠିକ କରିବେ — ଯାହା ଫଳରେ ଆପଣ ସର୍ବଦା ଉନ୍ନତ ହେଉଥାଆନ୍ତି।',
    
    // Why Choose Us
    'whyChoose.title': 'Solviq AI କାହିଁକି ବାଛନ୍ତୁ',
    'whyChoose.subtitle': 'କାରଣ ପୃଥିବୀକୁ ଆଉ ଏକ ଶିକ୍ଷଣ ଏପ୍ ଦରକାର ନାହିଁ — ଏହାକୁ ଏକ ଇଞ୍ଜିନ୍ ଦରକାର ଯାହା ଆପଣଙ୍କୁ ବୁଝେ',
    'whyChoose.aiPowered.title': '🧠 The Solviq Engine',
    'whyChoose.aiPowered.description': 'ଏକ ଉପକରଣ ନୁହେଁ। ଏକ ପୋର୍ଟାଲ୍ ନୁହେଁ। ଏକ ନେକ୍ସ୍ଟ-ଜେନ୍ AI ନିଯୁକ୍ତିଯୋଗ୍ୟତା ଇଞ୍ଜିନ୍ ଗଠନ କରାଯାଇଛି ଆପଣଙ୍କର ବୃତ୍ତି ପ୍ରସ୍ତୁତିକୁ ମାପିବା, ଡିକୋଡ୍ କରିବା ଏବଂ ପରିଭାଷିତ କରିବା ପାଇଁ। Solviq ପଚାରେ ନାହିଁ ଯେ ଆପଣ କେତେ ସିଖିଲେ — ଏହା କହେ ଯେ ଆପଣ ଯେଉଁ ଭୂମିକା ଚାହାନ୍ତି ସେଥିପାଇଁ ଆପଣ କେତେ ପାଇକ।',
    'whyChoose.realTime.title': '⚡ ମଲ୍ଟି-ଏଜେଣ୍ଟ୍ ବୁଦ୍ଧିମତା ଦ୍ୱାରା ଚାଳିତ',
    'whyChoose.realTime.description': 'ଚାରୋଟି ସ୍ୱାୟତ୍ତ AI ସିଷ୍ଟମ୍ ଗୋଟିଏ ସୁସଂଗଠିତ ଇଞ୍ଜିନ୍ ଭାବରେ କାମ କରୁଛି: ରିଜ୍ୟୁମ୍ ବୁଦ୍ଧିମତା, ସିମୁଲେସନ୍ ଇଞ୍ଜିନ୍, ବିଶ୍ଳେଷଣାତ୍ମକ କୋର୍, ଏବଂ ଆବେଦନ ଇଞ୍ଜିନ୍ — ମୂଲ୍ୟାଙ୍କନ, ବିକାଶ ଏବଂ ସୁଯୋଗର ଏକ ନିରନ୍ତର ଚକ୍ର ସୃଷ୍ଟି କରୁଛି।',
    'whyChoose.comprehensive.title': '🚀 କୋର୍ ରେ AI, ପୃଷ୍ଠା ପରେ ଅନ୍ତର୍ଦୃଷ୍ଟି',
    'whyChoose.comprehensive.description': 'ଉନ୍ନତ LLM ଫ୍ରେମ୍ୱର୍କ୍ ଏବଂ ଆଚରଣାତ୍ମକ ବିଶ୍ଳେଷଣ ଉପରେ ଗଠିତ, Solviq ଗଭୀର ଡାଟା ମୂଲ୍ୟାଙ୍କନ ଚଲାଏ ଏହା ବୁଝିବା ପାଇଁ ଯେ କେବଳ ଆପଣ କ&apos;ଣ ଜାଣନ୍ତି ନାହିଁ — କିନ୍ତୁ ଆପଣ କେତେ ପ୍ରସ୍ତୁତ। ଏହା ନିଯୁକ୍ତିଯୋଗ୍ୟତା, ମାତ୍ରାତ୍ମକ ଭାବରେ।',
    'whyChoose.expert.title': '🔍 ଏକ ମେସିନ୍ ଭଳି ରୂପରେଖ, ମଣିଷଙ୍କ ପାଇଁ ନିର୍ମିତ',
    'whyChoose.expert.description': 'ରିଅଲ୍-ଟାଇମ୍ କାର୍ଯ୍ୟଦକ୍ଷତା କ୍ୟାଲିବ୍ରେସନ୍, ଅନୁକୂଳ ଭୂମିକା-ଆଧାରିତ ପରୀକ୍ଷା, AI-ଚାଳିତ ଦକ୍ଷତା ନିଦାନ, ଏବଂ ପ୍ରସ୍ତୁତି ସ୍କୋରିଙ୍ଗ ଯାହା ଆପଣଙ୍କ ସହିତ ବିକଶିତ ହୁଏ। Solviq କେବଳ ଆପଣଙ୍କୁ ପରୀକ୍ଷା କରେ ନାହିଁ — ଏହା ଆପଣଙ୍କୁ ପଢ଼େ।',
    
    // How It Works
    'howItWorks.title': 'Solviq କିପରି କାମ କରେ',
    'howItWorks.subtitle': 'ଆପଣଙ୍କର ସାକ୍ଷାତକାର ପ୍ରସ୍ତୁତିକୁ ଡିକୋଡ୍ କରିବା ପାଇଁ ଚାରୋଟି ସରଳ ପଦକ୍ଷେପ',
    'howItWorks.step1.title': '🧾 ରିଜ୍ୟୁମ୍ ବୁଦ୍ଧିମତା',
    'howItWorks.step1.description': 'ଆପଣଙ୍କର ରିଜ୍ୟୁମ୍ ଅପଲୋଡ୍ କରନ୍ତୁ — ବା Solviq କୁ ମାତ୍ର କିଛି ସେକେଣ୍ଡରେ ଆପଣଙ୍କ ପାଇଁ ଗୋଟିଏ ଗଠନ କରିବାକୁ ଦିଅନ୍ତୁ। ଇଞ୍ଜିନ୍ ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍ ପାର୍ସ୍ କରେ, ଆପଣଙ୍କର ମୂଳ୍ୟାଧାର ଶକ୍ତି ଚିହ୍ନଟ କରେ, ଏବଂ ଆପଣଙ୍କୁ ସ୍ୱୟଂଚାଳିତ ଭାବରେ ସବୁଠାରୁ ଉପଯୁକ୍ତ ଚାକିରି ଭୂମିକାଗୁଡିକ ସହିତ ମାନଚିତ୍ର କରେ।',
    'howItWorks.step2.title': '🎯 ସିମୁଲେସନ୍ ଇଞ୍ଜିନ୍',
    'howItWorks.step2.description': 'ଏକ ରିଅଲ୍-ଟାଇମ୍ ଭର୍ଚୁଆଲ୍ ନିଯୁକ୍ତି ପରିବେଶରେ ପ୍ରବେଶ କରନ୍ତୁ। Solviq ଯୋଗ୍ୟତା, ଟେକନିକାଲ୍, ଏବଂ HR ରାଉଣ୍ଡ୍ ଗୁଡିକୁ ପୁନରାବୃତ୍ତି କରେ — ଆପଣଙ୍କୁ AI ସନ୍ତୁଳିତ ସହିତ ସ୍କୋର୍ କରେ ଏକ ବାସ୍ତବ ପ୍ଲେସମେଣ୍ଟ୍ ପ୍ରକ୍ରିୟାକୁ ପ୍ରତିଫଳିତ କରିବା ପାଇଁ।',
    'howItWorks.step3.title': '📊 ପ୍ରସ୍ତୁତି ବିଶ୍ଳେଷଣ',
    'howItWorks.step3.description': 'ଥରେ ଆପଣଙ୍କର ପରୀକ୍ଷା ହେଲେ, ଇଞ୍ଜିନ୍ ଆପଣଙ୍କର କାର୍ଯ୍ୟଦକ୍ଷତାକୁ ଭୂମିକା-ବିଶେଷ ପ୍ରସ୍ତୁତି ମେଟ୍ରିକ୍ସରେ ଭାଙ୍ଗିଦିଏ। ଏହା କେବଳ ମାର୍କ୍ ଦେଖାଏ ନାହିଁ — ଏହା କହେ ଯେ ଆପଣ ଯେଉଁ ଚାକିରି ଚାହାନ୍ତି ସେଥିପାଇଁ ଆପଣ କେତେ ପାଇକ।',
    'howItWorks.step4.title': '🚀 ଅଟୋ-ଆବେଦନ ଇଞ୍ଜିନ୍',
    'howItWorks.step4.description': 'ଯେତେବେଳେ ଆପଣଙ୍କର ପ୍ରସ୍ତୁତି ସ୍ତର ବେଞ୍ଚମାର୍କ୍ ରେ ଆଘାତ କରେ, Solviq ଏହାର AI ଜବ୍ ଏଜେଣ୍ଟ୍ କୁ ସକ୍ରିୟ କରେ। ଏହା ଲାଇଭ୍ ଖୋଲା ଚାକିରିଗୁଡିକୁ ସ୍କାନ୍ କରେ, ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍ ସହିତ ମେଳ କରେ, ଏବଂ ଅଟୋ-ଆବେଦନ କରେ — ପ୍ରସ୍ତୁତିକୁ ବାସ୍ତବ ସୁଯୋଗରେ ପରିଣତ କରେ।',
    
    // Testimonials
    'testimonials.title': 'ଆମର ଉପଭୋକ୍ତାମାନେ କଣ କୁହନ୍ତି',
    'testimonials.subtitle': 'ହଜାରେ ସଫଳ ପ୍ରାର୍ଥୀଙ୍କ ସହିତ ଯୋଗ ଦିଅନ୍ତୁ ଯେଉଁମାନେ Solviq ଉପରେ ବିଶ୍ୱାସ କରିଥିଲେ',
    
    // Partners
    'partners.title': 'ଅଗ୍ରଣୀ କମ୍ପାନୀଗୁଡିକ ଦ୍ୱାରା ବିଶ୍ୱାସିତ',
    'partners.subtitle': 'ଆମର ପ୍ଲାଟଫର୍ମ ବିଶ୍ୱବ୍ୟାପୀ ଶୀର୍ଷ ସଂଗଠନଗୁଡିକ ଦ୍ୱାରା ସ୍ୱୀକୃତିପ୍ରାପ୍ତ',
    'partners.label': 'ସହଯୋଗରେ:',
    'partners.cta.title': 'ଆପଣଙ୍କର କ୍ୟାରିଅର୍ ଆରମ୍ଭ କରନ୍ତୁ',
    'partners.cta.description': 'ଆପଣ ଏକ ଫ୍ରିଲାନ୍ସର୍, ଏକ ଦଳ, କିମ୍ବା ଏକ ବୃଦ୍ଧିପ୍ରାପ୍ତ ଏଜେନ୍ସି ହୋଇଥାନ୍ତୁ— ଆମର ସାଧନଗୁଡ଼ିକ ଆପଣଙ୍କର କାର୍ଯ୍ୟପ୍ରଣାଳୀ ସହିତ ଅନୁକୂଳ ହୋଇଥାଏ। ଶୀଘ୍ର ଡିଜାଇନ୍ କରନ୍ତୁ। ଉନ୍ନତ ବିତରଣ କରନ୍ତୁ।',
    'partners.cta.button': 'ଆରମ୍ଭ କରନ୍ତୁ',
    
    // FAQ
    'faq.title': 'ବାରମ୍ବାର ପଚରାଯାଉଥିବା ପ୍ରଶ୍ନ',
    'faq.subtitle': 'ଜୀବନ ଛୋଟ, ଶୂନ୍ୟରୁ ଡିଜାଇନ୍ କରିବାରେ ସମୟ କାହିଁକି ବିତାଇବେ, finalui ଟେମ୍ପଲେଟ୍ ବ୍ୟବହାର କରନ୍ତୁ ଏବଂ ଏହାର ଡମି ଟେକ୍ସ୍ଟ୍ ଯେପରି lorem ipsum dolor sit amet, consectetur adipiscing elit।',
    'faq.askQuestion': 'ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ',
    
    // Problem Solution
    'problemSolution.badge': 'ଆପଣଙ୍କର ସାକ୍ଷାତକାର ପ୍ରସ୍ତୁତିରେ ପରିବର୍ତ୍ତନ ଆଣନ୍ତୁ',
    'problemSolution.title': 'ସାକ୍ଷାତକାର ଚିନ୍ତାଜନକ ଅବସ୍ଥାରୁ',
    'problemSolution.subtitle': 'ଆମେ ଆପଣଙ୍କର ସମ୍ମୁଖୀନ ଉପସ୍ଥିତ ଅସୁବିଧା ସବୁକୁ ବୁଝୁଛୁ। ଏଠାରେ Solviq AI ସେମାନଙ୍କୁ କିପରି ସମାଧାନ କରେ।',
    'problemSolution.tabProblems': 'ସାଧାରଣ ସମସ୍ୟା',
    'problemSolution.tabSolutions': 'ଆମର ସମାଧାନ',
    'problemSolution.cta.primary': 'ଆପଣଙ୍କର ମାଗଣା ଟ୍ରାଇଆଲ୍ ଆରମ୍ଭ କରନ୍ତୁ',
    'problemSolution.cta.secondary': 'ଏହା କିପରି କାମ କରେ ଦେଖନ୍ତୁ',
    
    'problem.unprepared.title': 'ଅପ୍ରସ୍ତୁତ ଅନୁଭବ କରିବା',
    'problem.unprepared.description': 'ଉପଯୁକ୍ତ ଅଭ୍ୟାସ ଏବଂ ଆତ୍ମବିଶ୍ୱାସ ବିନା ସାକ୍ଷାତକାରରେ ପ୍ରବେଶ କରିବା',
    'problem.unprepared.point1': 'କେଉଁ ପ୍ରଶ୍ନଗୁଡିକ ଆଶା କରିବେ ଜାଣିନାହାଁନ୍ତି',
    'problem.unprepared.point2': 'ବାସ୍ତବ ସାକ୍ଷାତକାର ଅନୁଭବର ଅଭାବ',
    'problem.unprepared.point3': 'ଆଚରଣାତ୍ମକ ପ୍ରଶ୍ନଗୁଡିକ ଉପରେ ଉଦ୍ବିଗ୍ନତା',
    'problem.unprepared.point4': 'ଆପଣଙ୍କୁ କିପରି ଉପସ୍ଥାପନା କରିବେ ଅନିଶ୍ଚିତ',
    
    'problem.time.title': 'ଅଭ୍ୟାସ ପାଇଁ ସୀମିତ ସମୟ',
    'problem.time.description': 'ବ୍ୟାପକ ସାକ୍ଷାତକାର ପ୍ରସ୍ତୁତି ପାଇଁ ସମୟ ଖୋଜିବାରେ ସଂଘର୍ଷ',
    'problem.time.point1': 'ସୀମିତ ପ୍ରସ୍ତୁତି ସମୟ ସହିତ ବ୍ୟସ୍ତ ସାର୍ଣ୍ଣିକାଳିକ',
    'problem.time.point2': 'ମକ୍ ସାକ୍ଷାତକାରକର୍ତ୍ତାମାନଙ୍କ ପ୍ରବେଶ ନାହିଁ',
    'problem.time.point3': 'ମହଙ୍ଗା କୋଚିଂର ମୂଲ୍ୟ ଦେଇ ପାରିବେ ନାହିଁ',
    'problem.time.point4': 'ନମନୀୟ ଅଭ୍ୟାସ ବିକଳ୍ପ ଆବଶ୍ୟକ',
    
    'problem.feedback.title': 'ଗୁଣାତ୍ମକ ଫିଡବ୍ୟାକ୍ ନାହିଁ',
    'problem.feedback.description': 'ଆପଣ କ&apos;ଣ ଭୁଲ୍ କରୁଛନ୍ତି ଜାଣିବା ବିନା ଅଭ୍ୟାସ କରିବା',
    'problem.feedback.point1': 'ଆପଣଙ୍କର ଉତ୍ତରଗୁଡିକ ସମୀକ୍ଷା କରିବାକୁ କେହି ନାହିଁ',
    'problem.feedback.point2': 'ଆପଣଙ୍କର ଦୁର୍ବଳ କ୍ଷେତ୍ର ଜାଣନ୍ତି ନାହିଁ',
    'problem.feedback.point3': 'ସମାନ ଭୁଲ୍ ପୁନରାବୃତ୍ତି କରିବା',
    'problem.feedback.point4': 'ଉନ୍ନତିକୁ ଟ୍ରାକ୍ କରିପାରନ୍ତି ନାହିଁ',
    
    'problem.outdated.title': 'ପୁରୁଣା ସମ୍ବଳ',
    'problem.outdated.description': 'ବାସ୍ତବ ସାକ୍ଷାତକାର ସହିତ ମେଳ ନ କରୁଥିବା ସାଧାରଣ ପ୍ରସ୍ତୁତି ସାମଗ୍ରୀ ବ୍ୟବହାର କରିବା',
    'problem.outdated.point1': 'ପ୍ରଶ୍ନଗୁଡିକ ବାସ୍ତବ ସାକ୍ଷାତକାର ସହିତ ମେଳ କରେ ନାହିଁ',
    'problem.outdated.point2': 'କମ୍ପାନୀ-ବିଶେଷ ପ୍ରସ୍ତୁତି ନାହିଁ',
    'problem.outdated.point3': 'ସାହାଯ୍ୟ କରିବାକୁ ନ ଥିବା ସାଧାରଣ ଉପଦେଶ',
    'problem.outdated.point4': 'ନିୟମିତ ଅପଡେଟ୍ ହୋଇନଥିବା ସମ୍ବଳ',
    
    'solution.aiPractice.title': 'AI-ଚାଳିତ ମକ୍ ସାକ୍ଷାତକାର',
    'solution.aiPractice.description': 'ଯେଉଁଠାରେ ଯେଉଁଭଳେ ବିଶ୍ୱସ୍ତ AI ସାକ୍ଷାତକାର ସହିତ ଅଭ୍ୟାସ କରନ୍ତୁ',
    'solution.aiPractice.benefit1': '24/7 ଅସୀମିତ ଅଭ୍ୟାସ ସେସନ୍',
    'solution.aiPractice.benefit2': 'ବିଶ୍ୱସ୍ତ ସାକ୍ଷାତକାର ସିମ୍ୟୁଲେସନ୍',
    'solution.aiPractice.benefit3': 'କମ୍ପାନୀ-ବିଶେଷ ପ୍ରଶ୍ନ ପ୍ୟାଟର୍ନ୍',
    'solution.aiPractice.benefit4': 'ଭଏସ୍ ଏବଂ ଭିଡିଓ ସାକ୍ଷାତକାର ସମର୍ଥନ',
    
    'solution.instantFeedback.title': 'ତୁରନ୍ତ AI ଫିଡବ୍ୟାକ୍',
    'solution.instantFeedback.description': 'ତୁରନ୍ତ ବିସ୍ତୃତ ବିଶ୍ଳେଷଣ ଏବଂ ଉନ୍ନତି ସୁପାରିଶ ପାଆନ୍ତୁ',
    'solution.instantFeedback.benefit1': 'ରିଅଲ୍-ଟାଇମ୍ କାର୍ଯ୍ୟଦକ୍ଷତା ବିଶ୍ଳେଷଣ',
    'solution.instantFeedback.benefit2': 'ବ୍ୟକ୍ତିଗତ ଉନ୍ନତି ଟିପ୍',
    'solution.instantFeedback.benefit3': 'ସମୟ ଉପରେ ଅଗ୍ରଗତି ଟ୍ରାକ୍ କରନ୍ତୁ',
    'solution.instantFeedback.benefit4': 'ଦୁର୍ବଳ କ୍ଷେତ୍ର ଚିହ୍ନଟ କରନ୍ତୁ ଏବଂ ସଠିକ୍ କରନ୍ତୁ',
    
    'solution.comprehensive.title': 'ବ୍ୟାପକ ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍',
    'solution.comprehensive.description': 'ଶୀର୍ଷ କମ୍ପାନୀଗୁଡ଼ିକରୁ 10,000+ ବାସ୍ତବ ସାକ୍ଷାତକାର ପ୍ରଶ୍ନ',
    'solution.comprehensive.benefit1': 'ଟେକନିକାଲ୍ ଏବଂ ଆଚରଣାତ୍ମକ ପ୍ରଶ୍ନ',
    'solution.comprehensive.benefit2': 'କମ୍ପାନୀ-ବିଶେଷ ପ୍ରଶ୍ନ',
    'solution.comprehensive.benefit3': 'ନିୟମିତ ଅପଡେଟ୍ ହୋଇଥିବା ଡାଟାବେସ୍',
    'solution.comprehensive.benefit4': 'ଉଦ୍ୟୋଗ-ବିଶେଷ ସାମଗ୍ରୀ',
    
    'solution.smartPrep.title': 'ସ୍ମାର୍ଟ ପ୍ରସ୍ତୁତି ଯୋଜନା',
    'solution.smartPrep.description': 'AI ଆପଣଙ୍କର ଆବଶ୍ୟକତା ଅନୁଯାୟୀ ବ୍ୟକ୍ତିଗତ ଅଧ୍ୟୟନ ଯୋଜନା ସୃଷ୍ଟି କରେ',
    'solution.smartPrep.benefit1': 'କଷ୍ଟମାଇଜ୍ ଶିଖଣା ପଥ',
    'solution.smartPrep.benefit2': 'ଆପଣଙ୍କର ଦୁର୍ବଳ କ୍ଷେତ୍ର ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ',
    'solution.smartPrep.benefit3': 'ସମୟ-ଅସୁବିଧାକର ପ୍ରସ୍ତୁତି',
    'solution.smartPrep.benefit4': 'ଅନୁକୂଳ କଠିନତା ସ୍ତର',
    
    // Pricing
    'pricing.title': 'ଆପଣଙ୍କ ପାଇଁ ସଠିକ୍ ଯୋଜନା ବାଛନ୍ତୁ',
    'pricing.subtitle': 'ଆପଣଙ୍କୁ ମୌଳିକ ସୁବିଧା ଏବଂ 1,000ରୁ ଅଧିକ ସୃଜନାତ୍ମକ ସାଧନର ପ୍ରବେଶ ଦେଉଛି। ଶକ୍ତିଶାଳୀ AI କ୍ଷମତା, କ୍ଲାଉଡ୍ ସିଙ୍କିଂ, ଏବଂ ସୃଜନାତ୍ମକ ସ୍ୱାଧୀନତାର ଏକ ନୂତନ ସ୍ତର ଅନଲକ୍ କରିବା ପାଇଁ Pro Planକୁ ଅପଗ୍ରେଡ୍ କରନ୍ତୁ।',
    'pricing.badge': 'ସର୍ବୋତ୍ତମ ମୂଲ୍ୟ',
    'pricing.billing': 'ବାର୍ଷିକ ବିଲ୍ କରାଯାଇଛି।',
    'pricing.cta': 'ଆରମ୍ଭ କରନ୍ତୁ',
    'pricing.basic.name': 'ମୌଳିକ ଯୋଜନା',
    'pricing.basic.price': '$10/ମାସ',
    'pricing.basic.feature1': 'ନମନୀୟ ଯୋଜନା',
    'pricing.basic.feature2': 'ମାପନୀୟତା',
    'pricing.basic.feature3': '24/7 ଇମେଲ୍ ସହାୟତା',
    'pricing.basic.feature4': '200 ରେକର୍ଡିଂ',
    'pricing.basic.feature5': '30 ଦିନ ବ୍ୟାକଅପ୍',
    'pricing.business.name': 'ବ୍ୟବସାୟ ଯୋଜନା',
    'pricing.business.price': '$20/ମାସ',
    'pricing.business.feature1': 'ସମସ୍ତ ମୌଳିକ ସୁବିଧାର ପ୍ରବେଶ',
    'pricing.business.feature2': 'ମୌଳିକ ରିପୋର୍ଟିଂ ଏବଂ ବିଶ୍ଳେଷଣ',
    'pricing.business.feature3': '10 ବ୍ୟକ୍ତିଗତ ବ୍ୟବହାରକାରୀ ପର୍ଯ୍ୟନ୍ତ',
    'pricing.business.feature4': 'ପ୍ରତ୍ୟେକ ବ୍ୟବହାରକାରୀ ପାଇଁ 20GB ବ୍ୟକ୍ତିଗତ ଡାଟା',
    'pricing.business.feature5': 'ମୌଳିକ ଚାଟ୍ ଏବଂ ଇମେଲ୍ ସହାୟତା',
    'pricing.enterprise.name': 'ଏଣ୍ଟରପ୍ରାଇଜ୍ ଯୋଜନା',
    'pricing.enterprise.price': '$40/ମାସ',
    'pricing.enterprise.feature1': 'ସମସ୍ତ ମୌଳିକ ସୁବିଧାର ପ୍ରବେଶ',
    'pricing.enterprise.feature2': 'ମୌଳିକ ରିପୋର୍ଟିଂ ଏବଂ ବିଶ୍ଳେଷଣ',
    'pricing.enterprise.feature3': '10 ବ୍ୟକ୍ତିଗତ ବ୍ୟବହାରକାରୀ ପର୍ଯ୍ୟନ୍ତ',
    'pricing.enterprise.feature4': 'ପ୍ରତ୍ୟେକ ବ୍ୟବହାରକାରୀ ପାଇଁ 20GB ବ୍ୟକ୍ତିଗତ ଡାଟା',
    'pricing.enterprise.feature5': 'ମୌଳିକ ଚାଟ୍ ଏବଂ ଇମେଲ୍ ସହାୟତା',
    
    // Footer
    'footer.tagline': 'ସେହି ଇଞ୍ଜିନ୍ ଯାହା ପ୍ରସ୍ତୁତିକୁ ପରିଭାଷିତ କରେ',
    'footer.copyright': '© 2025 Solviq AI। ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।',
    'footer.product': 'ଉତ୍ପାଦ',
    'footer.company': 'କମ୍ପାନୀ',
    'footer.support': 'ସମର୍ଥନ',
    'footer.legal': 'ଆଇନଗତ',
    
    // Auth
    'auth.login.title': 'ପୁଣି ସ୍ୱାଗତ',
    'auth.login.subtitle': 'ଆପଣଙ୍କର ଯାତ୍ରା ଜାରି ରଖିବା ପାଇଁ ଆପଣଙ୍କର ଖାତାରେ ଲଗଇନ୍ କରନ୍ତୁ',
    'auth.login.email': 'ଇମେଲ୍',
    'auth.login.password': 'ପାସୱାର୍ଡ',
    'auth.login.submit': 'ଲଗଇନ୍',
    'auth.login.forgotPassword': 'ପାସୱାର୍ଡ ଭୁଲି ଯାଇଛନ୍ତି?',
    'auth.login.noAccount': 'ଖାତା ନାହିଁ?',
    'auth.login.createAccount': 'ଖାତା ତିଆରି କରନ୍ତୁ',
    'auth.register.title': 'ଆପଣଙ୍କର ଖାତା ତିଆରି କରନ୍ତୁ',
    'auth.register.subtitle': 'ସାକ୍ଷାତକାର ସଫଳତାର ଆପଣଙ୍କର ଯାତ୍ରା ଆରମ୍ଭ କରନ୍ତୁ',
    'auth.register.firstName': 'ପ୍ରଥମ ନାମ',
    'auth.register.lastName': 'ଶେଷ ନାମ',
    'auth.register.email': 'ଇମେଲ୍',
    'auth.register.password': 'ପାସୱାର୍ଡ',
    'auth.register.confirmPassword': 'ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ',
    'auth.register.phone': 'ଫୋନ୍ ନମ୍ବର',
    'auth.register.agreeTerms': 'ମୁଁ ନିୟମ ଏବଂ ଶର୍ତ୍ତଗୁଡିକରେ ସହମତ',
    'auth.register.submit': 'ଖାତା ତିଆରି କରନ୍ତୁ',
    'auth.register.haveAccount': 'ପୂର୍ବରୁ ଖାତା ଅଛି?',
    'auth.register.signIn': 'ସାଇନ୍ ଇନ୍ କରନ୍ତୁ',
    
    // Common
    'common.learnMore': 'ଅଧିକ ଜାଣନ୍ତୁ',
    'common.getStarted': 'ଆରମ୍ଭ କରନ୍ତୁ',
    'common.signUp': 'ସାଇନ୍ ଅପ୍',
    'common.login': 'ଲଗଇନ୍',
    'common.logout': 'ଲଗଆଉଟ୍',
    'common.dashboard': 'ଡ୍ୟାସବୋର୍ଡ',
    'common.profile': 'ପ୍ରୋଫାଇଲ୍',
    'common.settings': 'ସେଟିଂସ୍',
    'common.loading': 'ଲୋଡ୍ ହେଉଛି...',
    'common.error': 'ତ୍ରୁଟି',
    'common.success': 'ସଫଳତା',
  },
};

export default translations;

