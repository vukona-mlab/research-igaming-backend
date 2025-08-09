const { firebaseDb } = require('../config/firebase');

// Helper Methods
const getDefaultQuestions = () => {
  return [
    {
      id: 'default_1',
      text: 'What type of issue are you experiencing?',
      type: 'single_choice',
      options: [
        { value: 'technical', label: 'Technical Issue' },
        { value: 'billing', label: 'Billing Question' },
        { value: 'product', label: 'Product Information' },
        { value: 'general', label: 'General Support' },
        { value: 'account', label: 'Account Issues' },
        { value: 'bug', label: 'Bug Report' }
      ],
      priority: 10,
      active: true,
      responses: {
        'technical': "I understand you're experiencing a technical issue. Let me gather more details to help you better.",
        'billing': "I can help with billing questions. Let me connect you with the right information.",
        'product': "I'd be happy to provide product information. What specifically would you like to know?",
        'general': "I'm here to help with your general inquiry. What can I assist you with?",
        'account': "I can help with account-related issues. What seems to be the problem?",
        'bug': "Thank you for reporting this issue. Let me gather some details to help resolve it."
      }
    },
    {
      id: 'default_2',
      text: 'How urgent is this issue for you?',
      type: 'single_choice',
      options: [
        { value: 'low', label: 'Low Priority - Can wait a few days' },
        { value: 'medium', label: 'Medium Priority - Need help within 24 hours' },
        { value: 'high', label: 'High Priority - Need immediate assistance' },
        { value: 'urgent', label: 'Urgent - Critical business impact' }
      ],
      priority: 8,
      active: true,
      responses: {
        'low': "Thanks for letting me know. I'll make sure you get help within a reasonable timeframe.",
        'medium': "I understand you need help within 24 hours. I'll prioritize your request appropriately.",
        'high': "I can see this is high priority for you. Let me escalate this to get you immediate assistance.",
        'urgent': "This sounds urgent! I'm connecting you with a support agent right away for immediate help."
      }
    },
    // TECHNICAL FOLLOW-UPS
    {
      id: 'technical_followup',
      text: 'What type of technical issue are you experiencing?',
      type: 'single_choice',
      options: [
        { value: 'login_issue', label: 'Login/Authentication Problems' },
        { value: 'performance_issue', label: 'Slow Performance or Loading Issues' },
        { value: 'feature_not_working', label: 'Feature Not Working as Expected' },
        { value: 'error_messages', label: 'Error Messages or Crashes' },
        { value: 'integration_issue', label: 'Integration or API Issues' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'technical',
      responses: {
        'login_issue': "Login issues can be frustrating. Let me help you get back into your account safely.",
        'performance_issue': "Performance issues can impact productivity. I'll help identify what might be causing the slowdown.",
        'feature_not_working': "I'll help troubleshoot why this feature isn't working as expected for you.",
        'error_messages': "Error messages can provide important clues. Let me help you interpret and resolve them.",
        'integration_issue': "Integration issues can be complex. I'll connect you with our technical team for specialized help."
      }
    },
    // BILLING FOLLOW-UPS
    {
      id: 'billing_followup',
      text: 'What specific billing question do you have?',
      type: 'single_choice',
      options: [
        { value: 'payment_failed', label: 'Payment Failed or Declined' },
        { value: 'invoice_question', label: 'Invoice or Receipt Question' },
        { value: 'subscription_issue', label: 'Subscription Management' },
        { value: 'refund_request', label: 'Refund Request' },
        { value: 'pricing_inquiry', label: 'Pricing Information' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'billing',
      responses: {
        'payment_failed': "I can help resolve payment issues. Let me check what might be causing this.",
        'invoice_question': "I'll help you with your invoice questions and get you the documentation you need.",
        'subscription_issue': "Let me help you manage your subscription and billing preferences.",
        'refund_request': "I'll guide you through our refund process and requirements.",
        'pricing_inquiry': "I'd be happy to explain our pricing plans and help you choose the right option."
      }
    },
    // PRODUCT FOLLOW-UPS
    {
      id: 'product_followup',
      text: 'What product information are you looking for?',
      type: 'single_choice',
      options: [
        { value: 'feature_request', label: 'Feature Request or Suggestion' },
        { value: 'how_to_use', label: 'How to Use a Feature' },
        { value: 'product_comparison', label: 'Product Comparison' },
        { value: 'compatibility_question', label: 'Compatibility Questions' },
        { value: 'product_demo', label: 'Product Demo or Trial' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'product',
      responses: {
        'feature_request': "I appreciate your feedback! Let me help document your feature suggestion.",
        'how_to_use': "I'll walk you through using this feature step by step.",
        'product_comparison': "I can help you compare our products to find the best fit for your needs.",
        'compatibility_question': "Let me check compatibility requirements and help ensure everything works together.",
        'product_demo': "I'd be happy to set up a demo or trial for you to explore our product."
      }
    },
    // ACCOUNT FOLLOW-UPS
    {
      id: 'account_followup',
      text: 'What specific account issue are you experiencing?',
      type: 'single_choice',
      options: [
        { value: 'login_problem', label: 'Cannot Log In' },
        { value: 'password_reset', label: 'Need Password Reset' },
        { value: 'account_locked', label: 'Account Locked' },
        { value: 'profile_update', label: 'Update Profile Information' },
        { value: 'security_concern', label: 'Security Concern' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'account',
      responses: {
        'login_problem': "Let's get you back into your account. I'll guide you through the login process.",
        'password_reset': "I can help you reset your password securely.",
        'account_locked': "I'll help you unlock your account.",
        'profile_update': "Let me help you update your profile information.",
        'security_concern': "Security is important. Let me connect you with our security team."
      }
    },
    // BUG FOLLOW-UPS
    {
      id: 'bug_followup',
      text: 'What type of bug are you experiencing?',
      type: 'single_choice',
      options: [
        { value: 'ui_glitch', label: 'Visual/Display Issues' },
        { value: 'functionality_broken', label: 'Feature Not Working' },
        { value: 'crash_report', label: 'App Crashes or Freezes' },
        { value: 'data_loss', label: 'Data Loss or Corruption' },
        { value: 'sync_problem', label: 'Synchronization Issues' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'bug',
      responses: {
        'ui_glitch': "Visual issues can be disruptive. Let me help identify and report this display problem.",
        'functionality_broken': "I'll help document this broken feature and get it escalated to our development team.",
        'crash_report': "Crashes are serious issues. Let me gather details to help our team fix this quickly.",
        'data_loss': "Data loss is concerning. Let me escalate this immediately and see what recovery options we have.",
        'sync_problem': "Sync issues can be frustrating. Let me help troubleshoot and restore proper synchronization."
      }
    },
    // GENERAL FOLLOW-UPS
    {
      id: 'general_followup',
      text: 'What kind of general support do you need?',
      type: 'single_choice',
      options: [
        { value: 'getting_started', label: 'Getting Started Help' },
        { value: 'best_practices', label: 'Best Practices Guidance' },
        { value: 'training_resources', label: 'Training or Learning Resources' },
        { value: 'contact_info', label: 'Contact Information' },
        { value: 'other_question', label: 'Other Question' }
      ],
      priority: 9,
      active: true,
      parentAnswer: 'general',
      responses: {
        'getting_started': "I'd love to help you get started! Let me guide you through the basics.",
        'best_practices': "I can share some best practices to help you get the most out of our product.",
        'training_resources': "Let me find the right training materials and resources for your needs.",
        'contact_info': "I can provide you with the right contact information for your specific needs.",
        'other_question': "I'm here to help with any questions you might have. Please feel free to ask!"
      }
    },
    // URGENCY FOLLOW-UPS
    {
      id: 'urgency_context',
      text: 'Can you tell me more about why this is urgent?',
      type: 'single_choice',
      options: [
        { value: 'business_critical', label: 'Business Critical - Affecting Operations' },
        { value: 'deadline_pressure', label: 'Time-Sensitive Deadline' },
        { value: 'customer_impact', label: 'Affecting Our Customers' },
        { value: 'security_issue', label: 'Potential Security Issue' },
        { value: 'revenue_impact', label: 'Revenue Impact' }
      ],
      priority: 8,
      active: true,
      parentAnswer: 'urgent',
      responses: {
        'business_critical': "I understand this is business critical. I'm escalating this immediately to our priority support team.",
        'deadline_pressure': "Time-sensitive issues require immediate attention. Let me get you connected with the right team.",
        'customer_impact': "Customer impact is our top priority. I'm routing this to our customer success team right away.",
        'security_issue': "Security issues are treated with utmost urgency. I'm connecting you with our security team immediately.",
        'revenue_impact': "Revenue-impacting issues get our highest priority. I'm escalating this to our executive support team."
      }
    },
    {
      id: 'personalized_followup',
      text: 'Before we continue, may I know your first name?',
      type: 'text_input',
      priority: 7,
      active: true,
      responses: {
        '*': "Nice to meet you, {name}! Let's continue."
      }
    },
    {
      id: 'feedback_question',
      text: 'How would you rate your experience so far?',
      type: 'single_choice',
      options: [
        { value: 'excellent', label: '⭐️⭐️⭐️⭐️⭐️ Excellent' },
        { value: 'good', label: '⭐️⭐️⭐️⭐️ Good' },
        { value: 'average', label: '⭐️⭐️⭐️ Average' },
        { value: 'poor', label: '⭐️⭐️ Poor' }
      ],
      priority: 5,
      active: true,
      responses: {
        'excellent': "That's wonderful to hear! 😊",
        'good': "Glad to know you're satisfied!",
        'average': "I'll try to improve your experience.",
        'poor': "I'm sorry to hear that. Let me help make it better."
      }
    }
  ];
};

// Role-based user context handler
const processUserContext = (userType, userId, userContext = {}) => {
  const baseContext = {
    userType,
    sessionId: userContext.sessionId || generateSessionId(),
    timestamp: new Date().toISOString(),
    ...userContext
  };

  if (userType === 'authenticated') {
    return {
      ...baseContext,
      userId,
      name: userContext.name || 'there',
      email: userContext.email || null,
      canAccessHistory: true,
      canSavePreferences: true
    };
  }

  return {
    ...baseContext,
    userId: null,
    guestId: userId || generateGuestId(),
    name: userContext.name || 'there',
    email: null,
    canAccessHistory: false,
    canSavePreferences: false
  };
};

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateGuestId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getRelevantQuestions = (allQuestions, userContext, previousAnswers = [], userHistory = []) => {
  let filteredQuestions = allQuestions.filter(q => q.active !== false);

  if (filteredQuestions.length === 0) {
    filteredQuestions = getDefaultQuestions();
  }

  const answeredQuestionIds = previousAnswers.map(a => a.questionId);
  filteredQuestions = filteredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

  if (previousAnswers.length > 0) {
    const lastAnswer = previousAnswers[previousAnswers.length - 1];
    const followUpQuestions = filteredQuestions.filter(q => 
      q.parentAnswer === (lastAnswer.value || lastAnswer.answer)
    );

    if (followUpQuestions.length > 0) {
      return followUpQuestions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
  }

  if (userContext.userType === 'authenticated' && userContext.categories && userContext.categories.length > 0) {
    const categoryFiltered = filteredQuestions.filter(q => 
      !q.targetCategories || 
      q.targetCategories.some(cat => userContext.categories.includes(cat))
    );
    if (categoryFiltered.length > 0) {
      filteredQuestions = categoryFiltered;
    }
  }

  if (filteredQuestions.length === 0) {
    const defaultQuestions = getDefaultQuestions();
    return [defaultQuestions[0]];
  }

  return filteredQuestions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

const generatePersonalizedGreeting = (userContext, userHistory = []) => {
  const name = userContext.name || 'there';
  const isFirstTime = !userHistory || userHistory.length === 0;
  const isGuest = userContext.userType === 'guest';
  
  const hour = new Date().getHours();
  let timeGreeting = "Hello";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 18) timeGreeting = "Good afternoon";
  else timeGreeting = "Good evening";

  const personalizedElements = [
    `I hope you're having a great day!`,
    `Lovely to connect with you!`,
    `Ready to assist you today!`,
    `How can I make your day better?`
  ];

  if (isGuest || isFirstTime) {
    return `${timeGreeting} ${name}! 👋 ${personalizedElements[Math.floor(Math.random() * personalizedElements.length)]}`;
  }
  
  const lastIssue = userHistory[0]?.issueCategory;
  if (lastIssue) {
    return `${timeGreeting} ${name}! I see you previously had a ${lastIssue} issue. How can I help you today?`;
  }
  
  return `${timeGreeting} ${name}! Great to see you again. ${personalizedElements[Math.floor(Math.random() * personalizedElements.length)]}`;
};

const analyzeConversation = (chatHistory = [], userAnswers = []) => {
  const answers = userAnswers.map(a => a.value || a.answer || a);
  
  let category = 'general';
  const categoryTriggers = {
    technical: ['technical', 'login_issue', 'performance_issue', 'feature_not_working', 'error_messages', 'integration_issue', 'api_error', 'system_down', 'connectivity_problem', 'slow_loading', 'timeout_error', 'server_error'],
    
    billing: ['billing', 'payment_failed', 'invoice_question', 'subscription_issue', 'refund_request', 'pricing_inquiry', 'payment_method', 'charge_dispute', 'upgrade_plan', 'downgrade_plan', 'billing_address', 'tax_question'],
    
    product: ['product', 'feature_request', 'how_to_use', 'product_feedback', 'functionality_question', 'product_demo', 'feature_missing', 'product_comparison', 'usage_limit', 'product_availability', 'compatibility_question', 'product_documentation'],
    
    account: ['account', 'login_problem', 'password_reset', 'account_locked', 'profile_update', 'security_concern', 'two_factor_auth', 'account_deletion', 'data_export', 'privacy_settings', 'account_recovery', 'email_change'],
    
    bug: ['bug', 'software_bug', 'ui_glitch', 'data_corruption', 'crash_report', 'unexpected_behavior', 'display_issue', 'functionality_broken', 'sync_problem', 'mobile_app_bug', 'browser_compatibility', 'data_loss']
};

  for (const [cat, triggers] of Object.entries(categoryTriggers)) {
    if (triggers.some(trigger => answers.includes(trigger))) {
      category = cat;
      break;
    }
  }

  let urgency = 'low';
  if (answers.includes('medium')) urgency = 'medium';
  if (answers.includes('high')) urgency = 'high';
  if (answers.includes('urgent')) urgency = 'urgent';

  const tags = [...new Set(answers.filter(a => a && typeof a === 'string'))];

  return {
    category,
    urgency,
    sentiment: determineSentiment(chatHistory),
    tags,
    suggestedResolution: getSuggestedResolution(category, urgency, answers),
    duration: chatHistory.length <= 3 ? 'quick' : 'extended',
    conversationQuality: analyzeConversationQuality(chatHistory)
  };
};

const analyzeConversationQuality = (chatHistory) => {
  const userMessages = chatHistory.filter(m => m.role === 'user');
  const botMessages = chatHistory.filter(m => m.role === 'bot');
  
  const metrics = {
    responseTimeAvg: calculateAverageResponseTime(chatHistory),
    messageLengthAvg: userMessages.reduce((sum, m) => sum + m.content.length, 0) / (userMessages.length || 1),
    questionCount: botMessages.filter(m => m.content.includes('?')).length,
    engagementScore: Math.min(10, Math.floor(userMessages.length / 2))
  };

  return metrics;
};

const calculateAverageResponseTime = (chatHistory) => {
  let total = 0;
  let count = 0;
  
  for (let i = 0; i < chatHistory.length - 1; i++) {
    if (chatHistory[i].role === 'user' && chatHistory[i+1].role === 'bot') {
      const timeDiff = new Date(chatHistory[i+1].timestamp) - new Date(chatHistory[i].timestamp);
      total += timeDiff;
      count++;
    }
  }
  
  return count > 0 ? Math.round(total / count / 1000) : 0;
};

const determineSentiment = (chatHistory = []) => {
  const userMessages = chatHistory.filter(msg => msg.type === 'user').map(msg => msg.content.toLowerCase());
  
  if (userMessages.some(msg => 
    msg.includes('frustrat') || msg.includes('angry') || msg.includes('upset'))) {
    return 'negative';
  }
  
  if (userMessages.some(msg => 
    msg.includes('thank') || msg.includes('appreciate') || msg.includes('happy'))) {
    return 'positive';
  }
  
  return 'neutral';
};

const getSuggestedResolution = (category, urgency, answers = []) => {
  const resolutions = {
    technical: {
      low: 'Technical documentation review and guided troubleshooting',
      medium: 'Priority technical support with diagnostics',
      high: 'Immediate escalation to technical team',
      urgent: 'Emergency technical response team engagement'
    },
    billing: {
      low: 'Billing documentation and self-service options',
      medium: 'Billing specialist consultation',
      high: 'Immediate billing specialist attention',
      urgent: 'Executive billing support escalation'
    },
    product: {
      low: 'Product documentation and tutorials',
      medium: 'Product specialist consultation',
      high: 'Immediate product specialist support',
      urgent: 'Product manager escalation'
    },
    account: {
      low: 'Account self-service options',
      medium: 'Account specialist review',
      high: 'Immediate account specialist attention',
      urgent: 'Security team escalation'
    },
    bug: {
      low: 'Bug report submission and tracking',
      medium: 'Development team review',
      high: 'Priority bug fix scheduling',
      urgent: 'Critical bug emergency response'
    },
    general: {
      low: 'General support resources',
      medium: 'Support agent consultation',
      high: 'Priority support routing',
      urgent: 'Immediate support escalation'
    }
  };

  return resolutions[category]?.[urgency] || 'Support agent assistance';
};

const updateUserChatbotProfile = async (userId, analysis) => {
  if (!userId) return;

  try {
    const profileRef = firebaseDb.collection('user_chatbot_profiles').doc(userId);
    const profileDoc = await profileRef.get();
    
    const updateData = {
      lastInteraction: new Date().toISOString(),
      lastCategory: analysis.category,
      lastUrgency: analysis.urgency,
      updatedAt: new Date().toISOString()
    };

    if (profileDoc.exists) {
      const existingProfile = profileDoc.data();
      updateData.totalSessions = (existingProfile.totalSessions || 0) + 1;
      updateData.commonCategories = updateCategoryFrequency(
        existingProfile.commonCategories || {}, 
        analysis.category
      );
      updateData.averageUrgency = calculateAverageUrgency(
        existingProfile.averageUrgency, 
        analysis.urgency,
        existingProfile.totalSessions || 0
      );
      
      await profileRef.update(updateData);
    } else {
      await profileRef.set({
        userId,
        firstInteraction: new Date().toISOString(),
        ...updateData,
        totalSessions: 1,
        commonCategories: { [analysis.category]: 1 },
        averageUrgency: urgencyToNumber(analysis.urgency)
      });
    }
  } catch (error) {
    console.error('Error updating user chatbot profile:', error);
  }
};

const updateCategoryFrequency = (categories, newCategory) => {
  return {
    ...categories,
    [newCategory]: (categories[newCategory] || 0) + 1
  };
};

const calculateAverageUrgency = (currentAverage, newUrgency, sessionCount) => {
  const currentValue = currentAverage || 2;
  const newValue = urgencyToNumber(newUrgency);
  return Math.round((currentValue * sessionCount + newValue) / (sessionCount + 1));
};

const urgencyToNumber = (urgency) => {
  const levels = { low: 1, medium: 2, high: 3, urgent: 4 };
  return levels[urgency] || 2;
};

const getCommonIssues = (userHistory = []) => {
  if (userHistory.length === 0) return [];
  
  const categoryCount = {};
  userHistory.forEach(session => {
    const cat = session.issueCategory;
    if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
};

const generateIntelligentResponse = async (userAnswer, questionData, userContext, userAnswers = [], chatHistory = []) => {
  const answerValue = userAnswer.value || userAnswer.answer || userAnswer;
  const answerText = userAnswer.text || userAnswer.label || answerValue;
  
  let responseText = questionData?.responses?.[answerValue] || 
    generateContextualResponse(answerValue, userContext);
  
  if (userContext.name && userContext.name !== 'there') {
    responseText = responseText.replace(/{name}/g, userContext.name);
  }
  
  const conversationalEnhancements = [
    "How does that sound?",
    "What do you think?",
    "Would that work for you?",
    "Does this make sense so far?",
    "I'm here to help with anything else!",
    "Feel free to share more details if helpful."
  ];
  
  if (Math.random() > 0.6 && !responseText.includes('?')) {
    responseText += " " + conversationalEnhancements[Math.floor(Math.random() * conversationalEnhancements.length)];
  }
  
  const sentiment = determineSentiment(chatHistory);
  if (sentiment === 'negative') {
    const empathyPhrases = [
      "I completely understand your frustration.",
      "I'd feel the same way in your position.",
      "That sounds really frustrating - let's fix this!",
      "I appreciate your patience as we work through this."
    ];
    responseText = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)] + " " + responseText;
  }
  
  const shouldEscalate = shouldEscalateConversation(answerValue, userAnswers, chatHistory, userContext);
  if (shouldEscalate) {
    responseText = generateEscalationResponse(userContext);
    return {
      text: responseText,
      confidence: 0.9,
      escalationRecommended: true,
      nextActions: [],
      followUpQuestions: []
    };
  }
  
  const followUpQuestions = generateFollowUpQuestions(answerValue, userAnswers);
  
  return {
    text: responseText,
    confidence: questionData?.responses?.[answerValue] ? 0.9 : 0.6,
    escalationRecommended: false,
    nextActions: followUpQuestions,
    followUpQuestions
  };
};

const getEscalationReason = (userAnswers) => {
  const lastAnswer = userAnswers[userAnswers.length - 1];
  const triggers = {
    'urgent': 'High urgency',
    'high': 'High priority',
    'account_locked': 'Account lockout',
    'security_concern': 'Security issue',
    'negative': 'User frustration'
  };

  return triggers[lastAnswer.value] || 'Complex issue requiring human intervention';
};

const shouldEscalateConversation = (currentAnswer, userAnswers = [], chatHistory = [], userContext) => {
  const escalationTriggers = [
    'urgent', 'high', 'account_locked', 'security_concern', 
    'integration_issue', 'login_problem'
  ];
  
  if (escalationTriggers.includes(currentAnswer)) return true;
  if (userAnswers.some(a => escalationTriggers.includes(a.value || a.answer))) return true;
  if (chatHistory.length > 5) return true;
  
  const sentiment = determineSentiment(chatHistory);
  if (sentiment === 'negative' && userAnswers.length > 2) return true;
  
  return false;
};

const generateEscalationResponse = (userContext) => {
  if (userContext.email) {
    return `I'm escalating this to our support team who will contact you at ${userContext.email} within the hour. Your reference number is ${userContext.sessionId || 'N/A'}.`;
  }
  
  if (userContext.userType === 'guest') {
    return "I'm connecting you with a support agent right away. Please hold while we transfer your chat. You may be asked to provide contact information for follow-up.";
  }
  
  return "I'm connecting you with a support agent right away. Please hold while we transfer your chat.";
};

const generateContextualResponse = (answerValue, userContext) => {
  const responses = {
    'technical': "I understand you're facing a technical challenge. Let me help you work through this.",
    'billing': "I can assist with your billing inquiry. Let me get the right information for you.",
    'product': "I'd be happy to provide product information. What would you like to know?",
    'general': "Thanks for reaching out! How can I help you today?",
    'account': "I can help with account-related matters. Let's get started.",
    'bug': "Thank you for reporting this. Let me gather details to help resolve it.",
    'low': "I understand this isn't urgent. I'll still make sure you get help.",
    'medium': "Got it - you need assistance within 24 hours. I'll prioritize this.",
    'high': "I see this is high priority. Let me get you the right support.",
    'urgent': "This sounds critical! I'll get you immediate attention.",
    'login_issue': "Let's get you back into your account. I'll guide you through.",
    'performance_issue': "Let's identify what might be causing performance issues.",
    'feature_not_working': "Let's troubleshoot why this feature isn't working.",
    'error_messages': "Error messages can be confusing. Let me help interpret them.",
    'integration_issue': "I'll connect you with our technical team for integration help.",
    'login_problem': "Let's solve your login problem together.",
    'password_reset': "I can help you reset your password securely.",
    'account_locked': "Let's get your account unlocked.",
    'profile_update': "I'll help you update your profile information.",
    'security_concern': "I'm connecting you with our security team for assistance."
  };
  
  return responses[answerValue] || responses['general'];
};

const generateFollowUpQuestions = (currentAnswer, userAnswers = []) => {
  const allQuestions = getDefaultQuestions();
  const followUps = allQuestions.filter(q => q.parentAnswer === currentAnswer);
  
  const answeredQuestionIds = userAnswers.map(a => a.questionId);
  return followUps
    .filter(q => !answeredQuestionIds.includes(q.id))
    .map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      type: q.type
    }));
};

const generateUserInsights = (sessions = []) => {
  if (sessions.length === 0) return null;
  
  const categories = sessions.map(s => s.issueCategory).filter(Boolean);
  const mostCommonCategory = categories.length > 0 ? 
    categories.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    ) : 'general';
  
  const escalationRate = sessions.filter(s => s.escalated).length / sessions.length;
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  
  return {
    mostCommonIssueType: mostCommonCategory,
    totalInteractions: sessions.length,
    escalationRate: Math.round(escalationRate * 100),
    averageSessionLength: Math.round(totalQuestions / sessions.length),
    lastInteractionDate: sessions[0]?.timestamp,
    preferredSupportCategory: mostCommonCategory
  };
};

const sendOverallChatToAdminHelper = async (chatData) => {
  try {
    const adminChatData = {
      sessionId: chatData.sessionId,
      userId: chatData.userId || null,
      guestId: chatData.guestId || null,
      userType: chatData.userType || 'guest',
      chatHistory: chatData.chatHistory,
      analysis: chatData.analysis || {},
      escalationReason: chatData.escalationReason || 'Automatic escalation',
      sentAt: new Date().toISOString(),
      status: 'unassigned',
      priority: chatData.analysis.urgency === 'urgent' ? 'high' : 'normal'
    };

    await firebaseDb.collection('admin_chatbot_inbox')
      .doc(chatData.sessionId)
      .set(adminChatData);
    
    return true;
  } catch (error) {
    console.error('Error sending to admin:', error);
    return false;
  }
};

const saveChatSessionHelper = async (data) => {
  try {
    const processedUserContext = processUserContext(
      data.userType, 
      data.userId, 
      { ...data.userContext, sessionId: data.sessionId }
    );
    
    const conversationAnalysis = analyzeConversation(data.chatHistory, data.userAnswers);
    
    const sessionData = {
      sessionId: data.sessionId,
      userType: data.userType,
      userId: data.userType === 'authenticated' ? data.userId : null,
      guestId: data.userType === 'guest' ? processedUserContext.guestId : null,
      chatHistory: data.chatHistory,
      userAnswers: data.userAnswers,
      userContext: processedUserContext,
      status: data.status,
      timestamp: new Date().toISOString(),
      issueCategory: conversationAnalysis.category,
      urgencyLevel: conversationAnalysis.urgency,
      sentiment: conversationAnalysis.sentiment,
      tags: conversationAnalysis.tags,
      suggestedResolution: conversationAnalysis.suggestedResolution,
      sessionDuration: conversationAnalysis.duration,
      questionCount: data.userAnswers.length,
      escalated: data.status === 'escalated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationQuality: conversationAnalysis.conversationQuality,
      userSatisfaction: data.userAnswers.find(a => a.questionId === 'feedback_question')?.value || null,
      resolutionStatus: data.status === 'resolved' ? 'resolved' : 'pending'
    };

    await firebaseDb.collection('chatbot_sessions')
      .doc(data.sessionId)
      .set(sessionData, { merge: true });

    if (data.userType === 'authenticated' && data.userId) {
      await updateUserChatbotProfile(data.userId, conversationAnalysis);
    }

    if (data.status === 'escalated') {
      await sendOverallChatToAdminHelper({
        sessionId: data.sessionId,
        userId: data.userId,
        guestId: data.userType === 'guest' ? processedUserContext.guestId : null,
        chatHistory: data.chatHistory,
        userType: data.userType,
        analysis: conversationAnalysis,
        escalationReason: getEscalationReason(data.userAnswers)
      });
    }

    return true;
  } catch (error) {
    console.error('Error in save helper:', error);
    return false;
  }
};

// CONTROLLER METHODS
const getQuestions = async (req, res) => {
  try {
    const { 
      userId, 
      userType, 
      sessionId, 
      previousAnswers = [], 
      userContext = {},
      chatHistory = []
    } = req.body;
    
    if (!userType || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'userType and sessionId are required'
      });
    }

    const processedUserContext = processUserContext(userType, userId, { ...userContext, sessionId });
    
    let userHistory = [];
    
    if (userType === 'authenticated' && userId) {
      try {
        const historySnapshot = await firebaseDb
          .collection('chatbot_sessions')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
        
        userHistory = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (historyError) {
        console.warn('Could not fetch user history:', historyError.message);
      }
    }

    let allQuestions = [];
    try {
      const questionsSnapshot = await firebaseDb
        .collection('chatbot_questions')
        .where('active', '==', true)
        .get();
      
      allQuestions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (questionsError) {
      console.warn('Using default questions:', questionsError.message);
    }

    if (allQuestions.length === 0) {
      allQuestions = getDefaultQuestions();
    }

    const relevantQuestions = getRelevantQuestions(
      allQuestions, 
      processedUserContext, 
      previousAnswers, 
      userHistory
    );

    const greeting = generatePersonalizedGreeting(processedUserContext, userHistory);

    res.status(200).json({
      success: true,
      questions: relevantQuestions,
      greeting,
      sessionContext: {
        userType: processedUserContext.userType,
        canAccessHistory: processedUserContext.canAccessHistory,
        totalSessions: userHistory.length,
        lastIssueType: userHistory[0]?.issueCategory || null,
        commonIssues: getCommonIssues(userHistory),
        unreadMessages: 0
      }
    });

  } catch (error) {
    console.error('Error in getQuestions:', error);
    
    const fallbackContext = processUserContext(req.body.userType || 'guest', req.body.userId);
    
    res.status(200).json({
      success: true,
      questions: getDefaultQuestions().slice(0, 1),
      greeting: generatePersonalizedGreeting(fallbackContext),
      sessionContext: {
        userType: fallbackContext.userType,
        canAccessHistory: fallbackContext.canAccessHistory,
        totalSessions: 0,
        lastIssueType: null,
        commonIssues: [],
        unreadMessages: 0
      }
    });
  }
};

const getResponse = async (req, res) => {
  try {
    const { 
      userId,
      userType,
      sessionId,
      questionId, 
      answer, 
      answerText,
      chatHistory = [], 
      userAnswers = [], 
      userContext = {} 
    } = req.body;

    if (!answer || !questionId || !userType) {
      return res.status(400).json({
        success: false,
        error: 'answer, questionId, and userType are required'
      });
    }

    const processedUserContext = processUserContext(userType, userId, { ...userContext, sessionId });

    const userAnswer = {
      questionId,
      value: answer,
      text: answerText || answer,
      label: answerText || answer,
      timestamp: new Date().toISOString()
    };

    let questionData = null;
    try {
      const questionDoc = await firebaseDb
        .collection('chatbot_questions')
        .doc(questionId)
        .get();
      
      if (questionDoc.exists) {
        questionData = { id: questionDoc.id, ...questionDoc.data() };
      }
    } catch (questionError) {
      console.warn('Using default question data:', questionError.message);
    }

    if (!questionData) {
      questionData = getDefaultQuestions().find(q => q.id === questionId) || {
        id: questionId,
        text: 'Question not found',
        responses: {}
      };
    }
    
    const response = await generateIntelligentResponse(
      userAnswer, 
      questionData, 
      processedUserContext, 
      userAnswers,
      chatHistory
    );

    if (userAnswers.length % 3 === 0) {
      await saveChatSessionHelper({
        sessionId,
        userType,
        userId,
        chatHistory: [...chatHistory, {
          role: 'user',
          content: userAnswer.text,
          timestamp: new Date().toISOString()
        }],
        userAnswers,
        userContext: processedUserContext,
        status: 'active'
      });
    }

    res.status(200).json({
      success: true,
      response: response.text,
      nextActions: response.nextActions,
      followUpQuestions: response.followUpQuestions,
      confidence: response.confidence,
      escalate: response.escalationRecommended,
      userType: processedUserContext.userType
    });

  } catch (error) {
    console.error('Error in getResponse:', error);
    res.status(200).json({
      success: true,
      response: "Thank you for your response. I'm having a technical issue but will still help.",
      nextActions: [],
      followUpQuestions: [],
      confidence: 0.5,
      escalate: true,
      userType: req.body.userType || 'guest'
    });
  }
};

const saveChatSession = async (req, res) => {
  try {
    const { 
      sessionId, 
      userType, 
      userId, 
      chatHistory = [], 
      userAnswers = [], 
      userContext = {},
      status = 'active' 
    } = req.body;

    if (!sessionId || !userType) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and userType are required'
      });
    }

    const success = await saveChatSessionHelper({
      sessionId,
      userType,
      userId,
      chatHistory,
      userAnswers,
      userContext,
      status
    });

    if (success) {
      res.status(200).json({
        success: true,
        sessionId,
        userType,
        message: 'Session saved successfully'
      });
    } else {
      throw new Error('Failed to save session');
    }

  } catch (error) {
    console.error('Error in saveChatSession:', error);
    res.status(200).json({ 
      success: true, 
      sessionId: req.body.sessionId,
      userType: req.body.userType || 'guest',
      warning: 'Session saved with limitations'
    });
  }
};

const getUserChatbotData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType = 'authenticated' } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (userType !== 'authenticated') {
      return res.status(403).json({
        success: false,
        error: 'User data access is only available for authenticated users'
      });
    }
    
    let profile = null;
    let sessions = [];

    try {
      const profileDoc = await firebaseDb
        .collection('user_chatbot_profiles')
        .doc(userId)
        .get();
      
      profile = profileDoc.exists ? profileDoc.data() : null;
    } catch (profileError) {
      console.warn('Could not fetch user profile:', profileError.message);
    }

    try {
      const sessionsSnapshot = await firebaseDb
        .collection('chatbot_sessions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      
      sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (sessionsError) {
      console.warn('Could not fetch user sessions:', sessionsError.message);
    }

    res.status(200).json({
      success: true,
      profile,
      recentSessions: sessions.slice(0, 10),
      allSessions: sessions,
      totalSessions: sessions.length,
      insights: generateUserInsights(sessions)
    });

  } catch (error) {
    console.error('Error in getUserChatbotData:', error);
    res.status(200).json({ 
      success: true, 
      profile: null,
      recentSessions: [],
      allSessions: [],
      totalSessions: 0,
      insights: null
    });
  }
};

const getGuestQuestions = async (req, res) => {
  try {
    const { 
      sessionId, 
      guestId,
      previousAnswers = [], 
      userContext = {},
      chatHistory = []
    } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required for guest users'
      });
    }

    const processedUserContext = processUserContext('guest', guestId, { ...userContext, sessionId });
    
    const allQuestions = getDefaultQuestions();
    const relevantQuestions = getRelevantQuestions(
      allQuestions, 
      processedUserContext, 
      previousAnswers, 
      []
    );

    const greeting = generatePersonalizedGreeting(processedUserContext, []);

    res.status(200).json({
      success: true,
      questions: relevantQuestions,
      greeting,
      sessionContext: {
        userType: 'guest',
        canAccessHistory: false,
        totalSessions: 0,
        lastIssueType: null,
        commonIssues: [],
        unreadMessages: 0
      }
    });

  } catch (error) {
    console.error('Error in getGuestQuestions:', error);
    
    const fallbackContext = processUserContext('guest', req.body.guestId);
    
    res.status(200).json({
      success: true,
      questions: getDefaultQuestions().slice(0, 1),
      greeting: generatePersonalizedGreeting(fallbackContext),
      sessionContext: {
        userType: 'guest',
        canAccessHistory: false,
        totalSessions: 0,
        lastIssueType: null,
        commonIssues: [],
        unreadMessages: 0
      }
    });
  }
};

const getGuestResponse = async (req, res) => {
  try {
    const { 
      sessionId,
      guestId,
      questionId, 
      answer, 
      answerText,
      chatHistory = [], 
      userAnswers = [], 
      userContext = {} 
    } = req.body;

    if (!answer || !questionId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'answer, questionId, and sessionId are required for guest users'
      });
    }

    const processedUserContext = processUserContext('guest', guestId, { ...userContext, sessionId });

    const userAnswer = {
      questionId,
      value: answer,
      text: answerText || answer,
      label: answerText || answer,
      timestamp: new Date().toISOString()
    };

    const questionData = getDefaultQuestions().find(q => q.id === questionId) || {
      id: questionId,
      text: 'Question not found',
      responses: {}
    };
    
    const response = await generateIntelligentResponse(
      userAnswer, 
      questionData, 
      processedUserContext, 
      userAnswers,
      chatHistory
    );

    res.status(200).json({
      success: true,
      response: response.text,
      nextActions: response.nextActions,
      followUpQuestions: response.followUpQuestions,
      confidence: response.confidence,
      escalate: response.escalationRecommended,
      userType: 'guest'
    });

  } catch (error) {
    console.error('Error in getGuestResponse:', error);
    res.status(200).json({
      success: true,
      response: "Thank you for your response. I'm having a technical issue but will still help you.",
      nextActions: [],
      followUpQuestions: [],
      confidence: 0.5,
      escalate: true,
      userType: 'guest'
    });
  }
};

const saveGuestChatSession = async (req, res) => {
  try {
    const { 
      sessionId, 
      guestId,
      chatHistory = [], 
      userAnswers = [], 
      userContext = {},
      status = 'active' 
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required for guest users'
      });
    }

    const processedUserContext = processUserContext('guest', guestId, { ...userContext, sessionId });
    const conversationAnalysis = analyzeConversation(chatHistory, userAnswers);
    
    const sessionData = {
      sessionId,
      userType: 'guest',
      userId: null,
      guestId: processedUserContext.guestId,
      chatHistory,
      userAnswers,
      userContext: processedUserContext,
      status,
      timestamp: new Date().toISOString(),
      issueCategory: conversationAnalysis.category,
      urgencyLevel: conversationAnalysis.urgency,
      sentiment: conversationAnalysis.sentiment,
      tags: conversationAnalysis.tags,
      suggestedResolution: conversationAnalysis.suggestedResolution,
      sessionDuration: conversationAnalysis.duration,
      questionCount: userAnswers.length,
      escalated: status === 'escalated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationQuality: conversationAnalysis.conversationQuality,
      userSatisfaction: userAnswers.find(a => a.questionId === 'feedback_question')?.value || null
    };

    try {
      await firebaseDb
        .collection('guest_chatbot_sessions')
        .doc(sessionId)
        .set(sessionData, { merge: true });
    } catch (firebaseError) {
      console.warn('Could not save guest session to Firebase:', firebaseError.message);
    }

    if (status === 'escalated') {
      await sendOverallChatToAdminHelper({
        sessionId,
        userId: null,
        guestId: processedUserContext.guestId,
        chatHistory,
        userType: 'guest',
        analysis: conversationAnalysis,
        escalationReason: getEscalationReason(userAnswers)
      });
    }

    res.status(200).json({
      success: true,
      sessionId,
      userType: 'guest',
      analysis: conversationAnalysis
    });

  } catch (error) {
    console.error('Error in saveGuestChatSession:', error);
    res.status(200).json({ 
      success: true, 
      sessionId: req.body.sessionId,
      userType: 'guest',
      warning: 'Guest session saved with limitations'
    });
  }
};

const sendOverallChatToAdmin = async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      guestId,
      chatHistory,
      userType,
      analysis
    } = req.body;

    if (!sessionId || !chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId and chatHistory are required.'
      });
    }

    const adminChatData = {
      sessionId,
      userId: userId || null,
      guestId: guestId || null,
      userType: userType || (userId ? 'user' : 'guest'),
      chatHistory,
      analysis: analysis || null,
      sentAt: new Date().toISOString(),
      status: 'pending',
      adminResponse: null
    };

    await firebaseDb
      .collection('admin_chatbot_inbox')
      .doc(sessionId)
      .set(adminChatData, { merge: true });

    res.status(200).json({
      success: true,
      message: 'Chat sent to admin successfully.',
      sessionId
    });
  } catch (error) {
    console.error('Error sending chat to admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send chat to admin.',
      error: error.message
    });
  }
};

const getChatsSentToAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    let query = firebaseDb.collection('admin_chatbot_inbox');
    if (status) {
      query = query.where('status', '==', status);
    }
    const snapshot = await query.orderBy('sentAt', 'desc').get();

    const chats = [];
    snapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching admin chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin chats.',
      error: error.message
    });
  }
};

module.exports = {
  getQuestions,
  getResponse,
  saveChatSession,
  getUserChatbotData,
  getGuestQuestions,
  getGuestResponse,
  saveGuestChatSession,
  sendOverallChatToAdmin,
  getChatsSentToAdmin
};