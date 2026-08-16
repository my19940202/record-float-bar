import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type Language = 'zh' | 'en';

const LANGUAGE_STORAGE_KEY = 'democue.language';

export const messages = {
  zh: {
    app: {
      brand: 'DemoCue',
      tagline: 'AI guide bar',
    },
    nav: {
      home: '首页',
      create: '创建提纲',
      settings: '设置',
    },
    home: {
      eyebrow: 'AI-assisted recording',
      title: '我的提纲',
      description: '生成结构化章节，录制时用悬浮窗快速扫读，减少反复重录。',
      newOutline: '新建提纲',
      loading: '加载中...',
      emptyTitle: '还没有提纲',
      emptyDescription: '输入主题或上传 PDF / Markdown / TXT，让 AI 生成录制提纲。',
      startCreate: '开始创建',
      chapters: '个章节',
      fileSource: '文件',
      attachment: '附件',
      textSource: '文字输入',
      show: '展示',
      edit: '编辑',
    },
    create: {
      eyebrow: 'Create guide',
      title: '创建提纲',
      description: '支持纯文字输入，或上传 PDF / Markdown / TXT 让 AI 提炼讲解章节。',
      textTab: '文字输入',
      fileTab: '文件上传',
      topic: '主题',
      topicPlaceholder: '例如：我的 Cursor AI 开发流程',
      notes: '补充信息',
      notesPlaceholder: '面向程序员，预计 10 分钟，重点讲工作流和踩坑',
      uploadTitle: '拖拽或点击上传文件',
      uploadDescription: '支持 PDF / MD / TXT，最大 10MB',
      extraNotes: '录制补充说明（可选）',
      extraNotesPlaceholder: '例如：面向新手，重点讲前 3 章',
      generating: '生成中...',
      generate: 'Generate',
      missingTopic: '请填写主题',
      missingFile: '请上传 PDF / Markdown / TXT 文件',
      fileTooLarge: '文件大小不能超过 10MB',
      unsupportedFile: '仅支持 PDF、Markdown、TXT',
      generateError: '生成失败',
    },
    edit: {
      eyebrow: 'Refine outline',
      title: '编辑提纲',
      description: '调整章节标题和讲解重点，保存后可一键展示悬浮窗。',
      show: '展示',
      saving: '保存中...',
      save: '保存',
      loading: '加载中...',
      notFound: '未找到提纲',
      loadError: '加载失败',
      saveError: '保存失败',
      outlineTitle: '提纲标题',
      source: '来源',
      file: '文件',
      textInput: '文字输入',
      newChapter: '新章节',
      defaultPoint: '补充讲解要点',
      addChapter: '添加章节',
    },
    chapter: {
      dragChapter: '拖拽调整章节 {index} 的顺序',
      dragTitle: '拖拽调整顺序',
      untitled: '未命名章节',
      deleteChapter: '删除章节 {index}',
      chapterTitle: '章节标题',
      points: '讲解重点',
      pointLabel: '讲解重点 {index}',
      deletePoint: '删除讲解重点 {index}',
      newPoint: '新的讲解重点',
      addPoint: '添加重点',
    },
    settings: {
      eyebrow: 'Local configuration',
      title: '设置',
      description: '配置 DMXAPI Gemini 中转站。密钥保存在本地，不会进入前端 bundle。',
      language: 'English',
      cardTitle: 'DMXAPI',
      cardDescription: '默认 endpoint 为 Gemini generateContent 接口。',
      endpoint: 'Endpoint',
      apiKey: 'API Key',
      loading: '加载中...',
      saved: '设置已保存',
      readError: '读取设置失败',
      saveError: '保存失败',
      saving: '保存中...',
      save: '保存设置',
    },
  },
  en: {
    app: {
      brand: 'DemoCue',
      tagline: 'AI guide bar',
    },
    nav: {
      home: 'Home',
      create: 'Create',
      settings: 'Settings',
    },
    home: {
      eyebrow: 'AI-assisted recording',
      title: 'My outlines',
      description:
        'Generate structured chapters and scan them in a floating window while recording, reducing repeated takes.',
      newOutline: 'New outline',
      loading: 'Loading...',
      emptyTitle: 'No outlines yet',
      emptyDescription:
        'Enter a topic or upload PDF / Markdown / TXT to let AI generate a recording outline.',
      startCreate: 'Start creating',
      chapters: 'chapters',
      fileSource: 'File',
      attachment: 'attachment',
      textSource: 'Text input',
      show: 'Show',
      edit: 'Edit',
    },
    create: {
      eyebrow: 'Create guide',
      title: 'Create outline',
      description:
        'Use text input or upload PDF / Markdown / TXT so AI can extract recording chapters.',
      textTab: 'Text',
      fileTab: 'File upload',
      topic: 'Topic',
      topicPlaceholder: 'Example: My Cursor AI development workflow',
      notes: 'Additional notes',
      notesPlaceholder:
        'For developers, about 10 minutes, focused on workflow and pitfalls',
      uploadTitle: 'Drag or click to upload',
      uploadDescription: 'PDF / MD / TXT, up to 10MB',
      extraNotes: 'Recording notes (optional)',
      extraNotesPlaceholder: 'Example: for beginners, focus on the first 3 chapters',
      generating: 'Generating...',
      generate: 'Generate',
      missingTopic: 'Please enter a topic',
      missingFile: 'Please upload a PDF / Markdown / TXT file',
      fileTooLarge: 'File size must be under 10MB',
      unsupportedFile: 'Only PDF, Markdown, and TXT are supported',
      generateError: 'Generation failed',
    },
    edit: {
      eyebrow: 'Refine outline',
      title: 'Edit outline',
      description:
        'Adjust chapter titles and talking points, then open the floating window after saving.',
      show: 'Show',
      saving: 'Saving...',
      save: 'Save',
      loading: 'Loading...',
      notFound: 'Outline not found',
      loadError: 'Failed to load',
      saveError: 'Failed to save',
      outlineTitle: 'Outline title',
      source: 'Source',
      file: 'File',
      textInput: 'Text input',
      newChapter: 'New chapter',
      defaultPoint: 'Add talking points',
      addChapter: 'Add chapter',
    },
    chapter: {
      dragChapter: 'Drag to reorder chapter {index}',
      dragTitle: 'Drag to reorder',
      untitled: 'Untitled chapter',
      deleteChapter: 'Delete chapter {index}',
      chapterTitle: 'Chapter title',
      points: 'Talking points',
      pointLabel: 'Talking point {index}',
      deletePoint: 'Delete talking point {index}',
      newPoint: 'New talking point',
      addPoint: 'Add point',
    },
    settings: {
      eyebrow: 'Local configuration',
      title: 'Settings',
      description:
        'Configure the DMXAPI Gemini relay. The key is stored locally and is never bundled into the frontend.',
      language: '中文',
      cardTitle: 'DMXAPI',
      cardDescription: 'The default endpoint uses the Gemini generateContent API.',
      endpoint: 'Endpoint',
      apiKey: 'API Key',
      loading: 'Loading...',
      saved: 'Settings saved',
      readError: 'Failed to read settings',
      saveError: 'Failed to save settings',
      saving: 'Saving...',
      save: 'Save settings',
    },
  },
} as const;

interface I18nContextValue {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  t: (typeof messages)[Language];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'zh';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'zh' || stored === 'en') return stored;
  return 'zh';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: messages[language],
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
