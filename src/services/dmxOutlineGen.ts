import type { OutlineContent } from '@/types/outline';
import { normalizeOutlineContent } from '@/types/outline';

export const OUTLINE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  required: ['title', 'chapters'],
  properties: {
    title: { type: 'STRING' },
    chapters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['title', 'points'],
        properties: {
          id: { type: 'STRING' },
          title: { type: 'STRING' },
          points: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
      },
    },
  },
} as const;

export function buildSystemPrompt() {
  return `你是一位资深技术分享教练，擅长把复杂主题整理成适合录屏讲解的结构化提纲。

你必须严格遵守以下输出规则：
1. 只能返回一个合法 JSON 对象。
2. 不要输出 Markdown，不要使用 \`\`\`json 代码块。
3. 不要输出任何解释、前言、后记、备注或道歉。
4. chapters 数量控制在 5 到 8 个。
5. 每个 chapter 必须包含 title 和 points。
6. points 是 2 到 5 条短句，适合录制时快速扫读。
7. 语言使用简体中文，语气清晰、口语化、适合技术分享录制。`;
}

export function buildTextUserPrompt(topic: string, notes?: string) {
  return `请根据以下信息生成视频讲解提纲。

主题：${topic}
补充信息：${notes?.trim() || '无'}

请输出适合 8-15 分钟技术分享的章节结构。`;
}

export function buildFileUserPrompt(input: {
  fileName: string;
  fileText?: string;
  extraNotes?: string;
}) {
  const sections = [
    `请根据附件「${input.fileName}」的内容，生成适合录屏讲解的结构化提纲。`,
    input.extraNotes?.trim()
      ? `录制补充说明：${input.extraNotes.trim()}`
      : null,
  ].filter(Boolean);

  if (input.fileText?.trim()) {
    sections.push('附件文本内容如下：', input.fileText.trim());
  }

  return sections.join('\n\n');
}

export function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export function parseOutlineResult(text: string): OutlineContent {
  const jsonStr = extractJsonObject(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('模型返回内容不是合法 JSON');
  }
  return normalizeOutlineContent(parsed);
}

export interface DmxRequestPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export function buildDmxPayload(input: {
  systemPrompt: string;
  userPrompt: string;
  parts?: DmxRequestPart[];
}) {
  const userParts: DmxRequestPart[] = input.parts?.length
    ? [...input.parts, { text: input.userPrompt }]
    : [{ text: input.userPrompt }];

  return {
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: userParts,
      },
    ],
    systemInstruction: {
      parts: [{ text: input.systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      response_mime_type: 'application/json',
      response_schema: OUTLINE_RESPONSE_SCHEMA,
    },
  };
}
