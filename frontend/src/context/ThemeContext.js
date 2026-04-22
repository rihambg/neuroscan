// NeuroScan - Theme & Language Context
import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Translations ─────────────────────────────────
const TRANSLATIONS = {
  en: {
    // Nav
    dashboard: 'Dashboard', patients: 'My Patients', requests: 'Requests',
    profile: 'Profile', myScans: 'My Scans', reports: 'Reports', findDoctor: 'Find a Doctor',
    overview: 'Overview', logout: 'Sign out',
    // Common
    save: 'Save changes', cancel: 'Cancel', back: 'Back', search: 'Search',
    loading: 'Loading…', saving: 'Saving…', uploading: 'Uploading…',
    viewAll: 'View all', submit: 'Submit', confirm: 'Confirm',
    // Auth
    signIn: 'Sign in', signUp: 'Create account', email: 'Email address',
    password: 'Password', confirmPassword: 'Confirm password', role: 'I am a…',
    doctor: 'Doctor', patient: 'Patient', welcomeBack: 'Welcome back',
    // Dashboard
    totalPatients: 'Total Patients', totalScans: 'Total Scans',
    pendingReview: 'Pending Review', newRequests: 'New Requests',
    awaitingReview: 'Awaiting Review', recentActivity: 'Recent Activity',
    noScans: 'No scans uploaded yet', noPending: 'All scans reviewed — great work!',
    assignedDoctor: 'My Doctor', noDoctorAssigned: 'No doctor assigned yet',
    findDoctorCta: 'Find a doctor',
    // MRI
    uploadScan: 'Upload a New Scan', scanHistory: 'My Scan History',
    dragDrop: 'Drag & drop your MRI file', orClick: 'or click to select',
    uploadBtn: 'Upload scan', scanDate: 'Scan date', notes: 'Notes (optional)',
    // Status
    pending: 'Pending', processing: 'Processing', analyzed: 'Analyzed',
    reviewed: 'Reviewed', completed: 'Completed', cancelled: 'Cancelled',
    // Notifications
    notifications: 'Notifications', markAllRead: 'Mark all read', noNotifs: 'No notifications yet',
    // Requests
    connectionRequests: 'Connection Requests', accept: 'Accept', decline: 'Decline',
    requestSent: 'Request sent', requestPending: 'Request pending', connected: 'Connected',
    requestConsultation: 'Request consultation',
    // Errors
    invalidCredentials: 'Invalid email or password',
    fillAllFields: 'Please fill in all fields',
    passwordMismatch: 'Passwords do not match',
    // Settings
    settings: 'Settings', darkMode: 'Dark mode', language: 'Language',
    theme: 'Appearance',
  },
  fr: {
    dashboard: 'Tableau de bord', patients: 'Mes patients', requests: 'Demandes',
    profile: 'Profil', myScans: 'Mes scanners', reports: 'Rapports', findDoctor: 'Trouver un médecin',
    overview: 'Vue d\'ensemble', logout: 'Se déconnecter',
    save: 'Enregistrer', cancel: 'Annuler', back: 'Retour', search: 'Rechercher',
    loading: 'Chargement…', saving: 'Enregistrement…', uploading: 'Envoi en cours…',
    viewAll: 'Voir tout', submit: 'Soumettre', confirm: 'Confirmer',
    signIn: 'Se connecter', signUp: 'Créer un compte', email: 'Adresse e-mail',
    password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe', role: 'Je suis…',
    doctor: 'Médecin', patient: 'Patient', welcomeBack: 'Bon retour',
    totalPatients: 'Total patients', totalScans: 'Total scanners',
    pendingReview: 'En attente', newRequests: 'Nouvelles demandes',
    awaitingReview: 'En attente de révision', recentActivity: 'Activité récente',
    noScans: 'Aucun scanner téléchargé', noPending: 'Tous les scanners révisés !',
    assignedDoctor: 'Mon médecin', noDoctorAssigned: 'Aucun médecin assigné',
    findDoctorCta: 'Trouver un médecin',
    uploadScan: 'Nouveau scanner', scanHistory: 'Historique',
    dragDrop: 'Glissez-déposez votre fichier IRM', orClick: 'ou cliquez pour sélectionner',
    uploadBtn: 'Envoyer le scanner', scanDate: 'Date du scanner', notes: 'Notes (optionnel)',
    pending: 'En attente', processing: 'En cours', analyzed: 'Analysé',
    reviewed: 'Révisé', completed: 'Complété', cancelled: 'Annulé',
    notifications: 'Notifications', markAllRead: 'Tout marquer comme lu', noNotifs: 'Aucune notification',
    connectionRequests: 'Demandes de connexion', accept: 'Accepter', decline: 'Refuser',
    requestSent: 'Demande envoyée', requestPending: 'Demande en attente', connected: 'Connecté',
    requestConsultation: 'Demander une consultation',
    invalidCredentials: 'Email ou mot de passe invalide',
    fillAllFields: 'Veuillez remplir tous les champs',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    settings: 'Paramètres', darkMode: 'Mode sombre', language: 'Langue', theme: 'Apparence',
  },
  ar: {
    dashboard: 'لوحة التحكم', patients: 'مرضاي', requests: 'الطلبات',
    profile: 'الملف الشخصي', myScans: 'فحوصاتي', reports: 'التقارير', findDoctor: 'ابحث عن طبيب',
    overview: 'نظرة عامة', logout: 'تسجيل الخروج',
    save: 'حفظ التغييرات', cancel: 'إلغاء', back: 'رجوع', search: 'بحث',
    loading: 'جاري التحميل…', saving: 'جاري الحفظ…', uploading: 'جاري الرفع…',
    viewAll: 'عرض الكل', submit: 'إرسال', confirm: 'تأكيد',
    signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', email: 'البريد الإلكتروني',
    password: 'كلمة المرور', confirmPassword: 'تأكيد كلمة المرور', role: 'أنا…',
    doctor: 'طبيب', patient: 'مريض', welcomeBack: 'مرحباً بعودتك',
    totalPatients: 'إجمالي المرضى', totalScans: 'إجمالي الفحوصات',
    pendingReview: 'قيد المراجعة', newRequests: 'طلبات جديدة',
    awaitingReview: 'في انتظار المراجعة', recentActivity: 'النشاط الأخير',
    noScans: 'لم يتم رفع أي فحوصات بعد', noPending: 'تمت مراجعة جميع الفحوصات!',
    assignedDoctor: 'طبيبي', noDoctorAssigned: 'لم يتم تعيين طبيب بعد',
    findDoctorCta: 'ابحث عن طبيب',
    uploadScan: 'رفع فحص جديد', scanHistory: 'سجل الفحوصات',
    dragDrop: 'اسحب وأفلت ملف التصوير بالرنين المغناطيسي', orClick: 'أو انقر للاختيار',
    uploadBtn: 'رفع الفحص', scanDate: 'تاريخ الفحص', notes: 'ملاحظات (اختياري)',
    pending: 'قيد الانتظار', processing: 'جاري المعالجة', analyzed: 'تم التحليل',
    reviewed: 'تمت المراجعة', completed: 'مكتمل', cancelled: 'ملغي',
    notifications: 'الإشعارات', markAllRead: 'تحديد الكل كمقروء', noNotifs: 'لا توجد إشعارات',
    connectionRequests: 'طلبات الاتصال', accept: 'قبول', decline: 'رفض',
    requestSent: 'تم إرسال الطلب', requestPending: 'الطلب قيد الانتظار', connected: 'متصل',
    requestConsultation: 'طلب استشارة',
    invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
    fillAllFields: 'يرجى ملء جميع الحقول',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    settings: 'الإعدادات', darkMode: 'الوضع الداكن', language: 'اللغة', theme: 'المظهر',
  }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme]       = useState(() => localStorage.getItem('ns_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('ns_lang')  || 'en');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('ns_theme', theme);
    localStorage.setItem('ns_lang', language);
  }, [theme, language]);

  const t = (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
