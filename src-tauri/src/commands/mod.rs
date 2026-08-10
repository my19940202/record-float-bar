use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;

use crate::db::OutlineContent;
use crate::dmx::{self, DmxError};
use crate::state::{AppState, DmxSettings, FloatingRuntimeState};

const STORE_PATH: &str = "settings.json";
const DEFAULT_ENDPOINT: &str =
    "https://www.dmxapi.cn/v1beta/models/gemini-3-flash-preview:generateContent";

#[derive(Debug, Deserialize)]
#[serde(tag = "mode")]
pub enum GenerateOutlinePayload {
    #[serde(rename = "text")]
    Text {
        topic: String,
        notes: Option<String>,
    },
    #[serde(rename = "file", rename_all = "camelCase")]
    File {
        file_name: String,
        mime_type: String,
        file_base64: Option<String>,
        file_text: Option<String>,
        extra_notes: Option<String>,
    },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FloatingStateResponse {
    outline_id: Option<i64>,
    chapter_index: usize,
    view_state: String,
}

fn load_settings(app: &AppHandle) -> Result<DmxSettings, String> {
    let store = app.store(STORE_PATH).map_err(|error| error.to_string())?;
    let endpoint = store
        .get("endpoint")
        .and_then(|value| value.as_str().map(str::to_string))
        .or_else(|| std::env::var("DMXAPI_GEMINI_ENDPOINT").ok())
        .unwrap_or_else(|| DEFAULT_ENDPOINT.to_string());
    let api_key = store
        .get("apiKey")
        .and_then(|value| value.as_str().map(str::to_string))
        .or_else(|| std::env::var("DMXAPI_API_KEY").ok())
        .unwrap_or_default();

    Ok(DmxSettings { endpoint, api_key })
}

#[tauri::command]
pub async fn get_dmx_settings(app: AppHandle) -> Result<DmxSettings, String> {
    let settings = load_settings(&app)?;
    Ok(DmxSettings {
        endpoint: settings.endpoint,
        api_key: settings.api_key,
    })
}

#[tauri::command]
pub async fn save_dmx_settings(app: AppHandle, settings: DmxSettings) -> Result<(), String> {
    if settings.endpoint.trim().is_empty() || settings.api_key.trim().is_empty() {
        return Err("Endpoint 和 API Key 不能为空".to_string());
    }
    let store = app.store(STORE_PATH).map_err(|error| error.to_string())?;
    store.set("endpoint", settings.endpoint.trim());
    store.set("apiKey", settings.api_key.trim());
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn generate_outline(
    app: AppHandle,
    payload: GenerateOutlinePayload,
) -> Result<OutlineContent, String> {
    let settings = load_settings(&app)?;
    let (user_prompt, inline_parts) = match payload {
        GenerateOutlinePayload::Text { topic, notes } => {
            if topic.trim().is_empty() {
                return Err("请填写主题".to_string());
            }
            (
                dmx::build_text_prompt(topic.trim(), notes.as_deref()),
                vec![],
            )
        }
        GenerateOutlinePayload::File {
            file_name,
            mime_type,
            file_base64,
            file_text,
            extra_notes,
        } => {
            let mut parts = vec![];
            if mime_type == "application/pdf" {
                let base64 = file_base64.filter(|value| !value.is_empty()).ok_or_else(|| {
                    "PDF 文件内容无效".to_string()
                })?;
                parts.push(json!({
                  "inline_data": {
                    "mime_type": "application/pdf",
                    "data": base64
                  }
                }));
            }
            (
                dmx::build_file_prompt(
                    &file_name,
                    file_text.as_deref(),
                    extra_notes.as_deref(),
                ),
                parts,
            )
        }
    };

    dmx::generate_outline_from_dmx(&settings, user_prompt, inline_parts)
        .await
        .map_err(|error: DmxError| error.to_string())
}

#[tauri::command]
pub async fn show_floating_outline(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    id: i64,
) -> Result<(), String> {
    {
        let mut runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
        runtime.floating.outline_id = Some(id);
        runtime.floating.chapter_index = 0;
        runtime.floating.view_state = "chapters".to_string();
    }

    let url = if cfg!(debug_assertions) {
        WebviewUrl::External(
            url::Url::parse(&format!("http://localhost:1420/floating.html?id={id}"))
                .map_err(|error| error.to_string())?,
        )
    } else {
        WebviewUrl::App(format!("floating.html?id={id}").into())
    };

    if let Some(window) = app.get_webview_window("floating") {
        if cfg!(debug_assertions) {
            window
                .eval(&format!(
                    "window.location.replace('http://localhost:1420/floating.html?id={id}')"
                ))
                .map_err(|error| error.to_string())?;
        }
        window.show().map_err(|error| error.to_string())?;
        window
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(&app, "floating", url)
        .title("Outline Floating")
        .inner_size(320.0, 640.0)
        .decorations(false)
        .always_on_top(true)
        .resizable(true)
        .skip_taskbar(true)
        .build()
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn hide_floating_outline(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("floating") {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_floating_chapter_index(
    state: State<'_, Mutex<AppState>>,
    index: usize,
) -> Result<(), String> {
    let mut runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
    runtime.floating.chapter_index = index;
    Ok(())
}

#[tauri::command]
pub async fn get_floating_state(
    state: State<'_, Mutex<AppState>>,
) -> Result<FloatingStateResponse, String> {
    let runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
    Ok(FloatingStateResponse {
        outline_id: runtime.floating.outline_id,
        chapter_index: runtime.floating.chapter_index,
        view_state: runtime.floating.view_state.clone(),
    })
}

#[tauri::command]
pub async fn set_floating_view_state(
    state: State<'_, Mutex<AppState>>,
    view_state: String,
) -> Result<(), String> {
    let mut runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
    runtime.floating.view_state = view_state;
    Ok(())
}

#[tauri::command]
pub async fn next_floating_chapter(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    next_floating_chapter_internal_with_state(&app, state.inner())
}

#[tauri::command]
pub async fn prev_floating_chapter(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    prev_floating_chapter_internal_with_state(&app, state.inner())
}

pub fn next_floating_chapter_internal(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<AppState>>();
    next_floating_chapter_internal_with_state(app, state.inner())
}

pub fn prev_floating_chapter_internal(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<AppState>>();
    prev_floating_chapter_internal_with_state(app, state.inner())
}

fn next_floating_chapter_internal_with_state(
    app: &AppHandle,
    state: &Mutex<AppState>,
) -> Result<(), String> {
    let mut runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
    runtime.floating.chapter_index = runtime.floating.chapter_index.saturating_add(1);
    runtime.floating.view_state = "detail".to_string();
    emit_chapter_change(app, &runtime.floating);
    Ok(())
}

fn prev_floating_chapter_internal_with_state(
    app: &AppHandle,
    state: &Mutex<AppState>,
) -> Result<(), String> {
    let mut runtime = state.lock().map_err(|_| "状态锁失败".to_string())?;
    runtime.floating.chapter_index = runtime.floating.chapter_index.saturating_sub(1);
    runtime.floating.view_state = "detail".to_string();
    emit_chapter_change(app, &runtime.floating);
    Ok(())
}

fn emit_chapter_change(app: &AppHandle, runtime: &FloatingRuntimeState) {
    if let Some(window) = app.get_webview_window("floating") {
        let payload = serde_json::json!({
          "chapterIndex": runtime.chapter_index,
          "viewState": runtime.view_state
        });
        let _ = window.emit("floating-chapter-changed", payload);
    }
}
