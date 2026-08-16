use crate::db::OutlineContent;
use crate::state::DmxSettings;
use serde_json::{json, Value};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DmxError {
    #[error("{0}")]
    Message(String),
}

const DEEPSEEK_MODEL: &str = "deepseek-v4-flash";

fn system_prompt() -> &'static str {
    "你是一位资深自媒体视频策划，擅长把任意主题整理成适合视频创作者录制的结构化提纲。\n\
你不限制行业：知识科普、产品演示、生活方式、商业分析、教程、观点表达、娱乐内容都可以处理。\n\
提纲要服务于真实视频制作：开场有钩子，章节推进清晰，内容有信息密度，方便提升观众留存。\n\
你必须严格遵守以下输出规则：\n\
1. 只能返回一个合法 JSON 对象。\n\
2. 不要输出 Markdown，不要使用 ```json 代码块。\n\
3. 不要输出任何解释、前言、后记、备注或道歉。\n\
4. chapters 数量控制在 3 到 8 个。\n\
5. 每个 chapter 必须包含 title 和 points。\n\
6. points 是 2 到 5 条短句，适合录制时快速扫读和口播发挥。\n\
7. 语言使用简体中文，表达清晰、口语化、适合自媒体视频录制。\n\
8. JSON 格式必须是 {\"title\":\"...\",\"chapters\":[{\"title\":\"...\",\"points\":[\"...\"]}]}。"
}

pub fn build_text_prompt(topic: &str, notes: Option<&str>) -> String {
    format!(
        "请根据以下信息生成自媒体视频讲解提纲。\n\n主题：{topic}\n补充信息：{notes}\n\n请输出适合 8-15 分钟视频录制的章节结构，兼顾开场吸引、内容推进和观众留存。",
        topic = topic,
        notes = notes.unwrap_or("无")
    )
}

fn log_dmx_debug(label: &str, content: &str) {
    eprintln!("[deepseek-outline] {label}: {content}");
}

fn log_dmx_response(status: reqwest::StatusCode, result: &Value) {
    log_dmx_debug("HTTP status", &status.to_string());
    if let Ok(pretty) = serde_json::to_string_pretty(result) {
        let preview = if pretty.len() > 4000 {
            format!("{}...(truncated)", &pretty[..4000])
        } else {
            pretty
        };
        log_dmx_debug("response body", &preview);
    }
}

fn extract_json_object(text: &str) -> String {
    if let Some(captures) = text.split("```json").nth(1) {
        if let Some(body) = captures.split("```").next() {
            return body.trim().to_string();
        }
    }
    if let Some(start) = text.find('{') {
        if let Some(end) = text.rfind('}') {
            if end > start {
                return text[start..=end].to_string();
            }
        }
    }
    text.trim().to_string()
}

fn extract_model_text(result: &Value) -> Option<String> {
    let choice = result.pointer("/choices/0")?;
    let finish_reason = choice
        .pointer("/finish_reason")
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    log_dmx_debug("finish_reason", finish_reason);

    let content = choice.pointer("/message/content").and_then(Value::as_str)?;
    if !content.trim().is_empty() {
        return Some(content.to_string());
    }

    None
}

fn describe_empty_response(result: &Value) -> String {
    let finish_reason = result
        .pointer("/choices/0/finish_reason")
        .and_then(Value::as_str)
        .map(|reason| format!("finish_reason={reason}"))
        .unwrap_or_else(|| "finish_reason=missing".to_string());

    format!("模型未返回文本内容 ({finish_reason})")
}

pub async fn generate_outline_from_dmx(
    settings: &DmxSettings,
    user_prompt: String,
) -> Result<OutlineContent, DmxError> {
    if settings.endpoint.trim().is_empty() || settings.api_key.trim().is_empty() {
        return Err(DmxError::Message(
            "请先在设置页配置 DeepSeek API Endpoint 和 API Key".to_string(),
        ));
    }

    let payload = json!({
      "model": DEEPSEEK_MODEL,
      "messages": [
        { "role": "system", "content": system_prompt() },
        { "role": "user", "content": user_prompt }
      ],
      "stream": false,
      "temperature": 0.3,
      "response_format": { "type": "json_object" }
    });

    log_dmx_debug("endpoint", settings.endpoint.trim());
    log_dmx_debug(
        "user prompt preview",
        &user_prompt.chars().take(120).collect::<String>(),
    );

    let client = reqwest::Client::new();
    let response = client
        .post(settings.endpoint.trim())
        .header("Authorization", format!("Bearer {}", settings.api_key.trim()))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|error| DmxError::Message(format!("DeepSeek API 请求失败: {error}")))?;

    let status = response.status();
    let result: Value = response
        .json()
        .await
        .map_err(|error| DmxError::Message(format!("DeepSeek API 响应解析失败: {error}")))?;

    log_dmx_response(status, &result);

    if !status.is_success() {
        let fallback = result.to_string();
        let message = result
            .pointer("/error/message")
            .and_then(Value::as_str)
            .unwrap_or(fallback.as_str());
        return Err(DmxError::Message(format!(
            "DeepSeek API 请求失败 ({status}): {message}"
        )));
    }

    let raw_text = extract_model_text(&result).unwrap_or_default();

    if raw_text.is_empty() {
        return Err(DmxError::Message(describe_empty_response(&result)));
    }

    log_dmx_debug(
        "model text preview",
        &raw_text.chars().take(800).collect::<String>(),
    );

    let json_str = extract_json_object(&raw_text);
    let parsed: OutlineContent = serde_json::from_str(&json_str).map_err(|error| {
        let preview = json_str.chars().take(800).collect::<String>();
        DmxError::Message(format!(
            "模型返回内容不是合法 JSON: {error}. preview={preview}"
        ))
    })?;

    let normalized = crate::db::normalize_outline(parsed);
    log_dmx_debug(
        "parsed outline",
        &format!(
            "title={}, chapters={}",
            normalized.title,
            normalized.chapters.len()
        ),
    );

    Ok(normalized)
}
