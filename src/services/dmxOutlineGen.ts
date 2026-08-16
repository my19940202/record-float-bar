import type { OutlineContent } from '@/types/outline';
import { normalizeOutlineContent } from '@/types/outline';

export const DEEPSEEK_OUTLINE_MODEL = 'deepseek-v4-flash';

export function buildSystemPrompt() {
  return `你是一位资深自媒体视频策划，擅长把任意主题整理成适合视频创作者录制的结构化提纲。
你不限制行业：知识科普、产品演示、生活方式、商业分析、教程、观点表达、娱乐内容都可以处理。
提纲要服务于真实视频制作：开场有钩子，章节推进清晰，内容有信息密度，方便提升观众留存。

你必须严格遵守以下输出规则：
1. 只能返回一个合法 JSON 对象。
2. 不要输出 Markdown，不要使用 \`\`\`json 代码块。
3. 不要输出任何解释、前言、后记、备注或道歉。
4. chapters 数量控制在 3 到 8 个。
5. 每个 chapter 必须包含 title 和 points。
6. points 是 2 到 5 条短句，适合录制时快速扫读和口播发挥。
7. 语言使用简体中文，表达清晰、口语化、适合自媒体视频录制。
8. JSON 格式必须是 {"title":"...","chapters":[{"title":"...","points":["..."]}]}。`;
}

export function buildTextUserPrompt(topic: string, notes?: string) {
  return `请根据以下信息生成自媒体视频讲解提纲。

主题：${topic}
补充信息：${notes?.trim() || '无'}

请输出适合 8-15 分钟视频录制的章节结构，兼顾开场吸引、内容推进和观众留存。`;
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

export function buildDmxPayload(input: {
  systemPrompt: string;
  userPrompt: string;
}) {
  return {
    model: DEEPSEEK_OUTLINE_MODEL,
    messages: [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: input.userPrompt },
    ],
    stream: false,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  };
}
