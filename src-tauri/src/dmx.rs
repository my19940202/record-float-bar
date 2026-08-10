use crate::db::OutlineContent;
use crate::state::DmxSettings;
use serde_json::{json, Value};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DmxError {
    #[error("{0}")]
    Message(String),
}

fn outline_response_schema() -> Value {
    json!({
      "type": "OBJECT",
      "required": ["title", "chapters"],
      "properties": {
        "title": { "type": "STRING" },
        "chapters": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "required": ["title", "points"],
            "properties": {
              "id": { "type": "STRING" },
              "title": { "type": "STRING" },
              "points": {
                "type": "ARRAY",
                "items": { "type": "STRING" }
              }
            }
          }
        }
      }
    })
}

fn system_prompt() -> &'static str {
    "你是一位资深技术分享教练，擅长把复杂主题整理成适合录屏讲解的结构化提纲。\n\
你必须严格遵守以下输出规则：\n\
1. 只能返回一个合法 JSON 对象。\n\
2. 不要输出 Markdown，不要使用 ```json 代码块。\n\
3. 不要输出任何解释、前言、后记、备注或道歉。\n\
4. chapters 数量控制在 5 到 8 个。\n\
5. 每个 chapter 必须包含 title 和 points。\n\
6. points 是 2 到 5 条短句，适合录制时快速扫读。\n\
7. 语言使用简体中文，语气清晰、口语化、适合技术分享录制。"
}

pub fn build_text_prompt(topic: &str, notes: Option<&str>) -> String {
    format!(
        "请根据以下信息生成视频讲解提纲。\n\n主题：{topic}\n补充信息：{notes}\n\n请输出适合 8-15 分钟技术分享的章节结构。",
        topic = topic,
        notes = notes.unwrap_or("无")
    )
}

pub fn build_file_prompt(
    file_name: &str,
    file_text: Option<&str>,
    extra_notes: Option<&str>,
) -> String {
    let mut sections = vec![format!(
        "请根据附件「{file_name}」的内容，生成适合录屏讲解的结构化提纲。"
    )];

    if let Some(notes) = extra_notes.filter(|value| !value.trim().is_empty()) {
        sections.push(format!("录制补充说明：{notes}"));
    }
    if let Some(text) = file_text.filter(|value| !value.trim().is_empty()) {
        sections.push("附件文本内容如下：".to_string());
        sections.push(text.to_string());
    }

    sections.join("\n\n")
}

fn log_dmx_debug(label: &str, content: &str) {
    eprintln!("[dmx-outline] {label}: {content}");
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
    let candidate = result.pointer("/candidates/0")?;
    let finish_reason = candidate
        .pointer("/finishReason")
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    log_dmx_debug("finishReason", finish_reason);

    if let Some(parts) = candidate.pointer("/content/parts").and_then(Value::as_array) {
        for (index, part) in parts.iter().enumerate() {
            if let Some(text) = part.get("text").and_then(Value::as_str) {
                if !text.trim().is_empty() {
                    log_dmx_debug("text part index", &index.to_string());
                    return Some(text.to_string());
                }
            }
        }
    }

    None
}

fn describe_empty_response(result: &Value) -> String {
    let prompt_feedback = result
        .pointer("/promptFeedback/blockReason")
        .and_then(Value::as_str)
        .map(|reason| format!("promptFeedback.blockReason={reason}"))
        .unwrap_or_default();

    let candidate_feedback = result
        .pointer("/candidates/0/finishReason")
        .and_then(Value::as_str)
        .map(|reason| format!("finishReason={reason}"))
        .unwrap_or_else(|| "finishReason=missing".to_string());

    let safety = result
        .pointer("/candidates/0/safetyRatings")
        .map(|value| value.to_string())
        .unwrap_or_default();

    format!(
        "模型未返回文本内容 ({candidate_feedback}{}. safetyRatings={safety})",
        if prompt_feedback.is_empty() {
            String::new()
        } else {
            format!(", {prompt_feedback}")
        }
    )
}

pub async fn generate_outline_from_dmx(
    settings: &DmxSettings,
    user_prompt: String,
    inline_parts: Vec<Value>,
) -> Result<OutlineContent, DmxError> {
    if settings.endpoint.trim().is_empty() || settings.api_key.trim().is_empty() {
        return Err(DmxError::Message(
            "请先在设置页配置 DMXAPI Endpoint 和 API Key".to_string(),
        ));
    }

    let mut parts = inline_parts;
    parts.push(json!({ "text": user_prompt }));

    let payload = json!({
      "model": "gemini-3-flash-preview",
      "contents": [{
        "role": "user",
        "parts": parts
      }],
      "systemInstruction": {
        "parts": [{ "text": system_prompt() }]
      },
      "generationConfig": {
        "temperature": 0.3,
        "maxOutputTokens": 8192,
        "response_mime_type": "application/json",
        "response_schema": outline_response_schema()
      }
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
        .map_err(|error| DmxError::Message(format!("DMXAPI 请求失败: {error}")))?;

    let status = response.status();
    let result: Value = response
        .json()
        .await
        .map_err(|error| DmxError::Message(format!("DMXAPI 响应解析失败: {error}")))?;

    log_dmx_response(status, &result);

    if !status.is_success() {
        let fallback = result.to_string();
        let message = result
            .pointer("/error/message")
            .and_then(Value::as_str)
            .unwrap_or(fallback.as_str());
        return Err(DmxError::Message(format!(
            "DMXAPI 请求失败 ({status}): {message}"
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
