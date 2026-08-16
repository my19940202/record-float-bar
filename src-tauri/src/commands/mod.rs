use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;

use crate::db::OutlineContent;
use crate::dmx::{self, DmxError};
use crate::state::{AppState, DmxSettings, FloatingSettings};

const STORE_PATH: &str = "settings.json";
const DEFAULT_ENDPOINT: &str = "https://api.deepseek.com/chat/completions";
const LEGACY_DEFAULT_ENDPOINT: &str =
    "https://www.dmxapi.cn/v1beta/models/gemini-3-flash-preview:generateContent";
const DEFAULT_FLOATING_SETTINGS: &str = "floatingSettings";

#[derive(Debug, Deserialize)]
#[serde(tag = "mode")]
pub enum GenerateOutlinePayload {
    #[serde(rename = "text")]
    Text {
        topic: String,
        notes: Option<String>,
    },
    #[serde(rename = "file")]
    File,
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
        .or_else(|| std::env::var("DEEPSEEK_API_URL").ok())
        .or_else(|| std::env::var("DMXAPI_GEMINI_ENDPOINT").ok())
        .unwrap_or_else(|| DEFAULT_ENDPOINT.to_string());
    let endpoint = if endpoint.trim() == LEGACY_DEFAULT_ENDPOINT {
        DEFAULT_ENDPOINT.to_string()
    } else {
        endpoint
    };
    let api_key = store
        .get("apiKey")
        .and_then(|value| value.as_str().map(str::to_string))
        .or_else(|| std::env::var("DEEPSEEK_API_KEY").ok())
        .or_else(|| std::env::var("DMXAPI_API_KEY").ok())
        .unwrap_or_default();

    Ok(DmxSettings { endpoint, api_key })
}

fn load_floating_settings(app: &AppHandle) -> Result<FloatingSettings, String> {
    let store = app.store(STORE_PATH).map_err(|error| error.to_string())?;
    match store.get(DEFAULT_FLOATING_SETTINGS) {
        Some(value) => serde_json::from_value(value).map_err(|error| error.to_string()),
        None => Ok(FloatingSettings::default()),
    }
}

#[tauri::command]
pub async fn get_floating_settings(app: AppHandle) -> Result<FloatingSettings, String> {
    load_floating_settings(&app)
}

#[tauri::command]
pub async fn save_floating_settings(
    app: AppHandle,
    settings: FloatingSettings,
) -> Result<(), String> {
    let mut normalized = settings;
    normalized.theme = if normalized.theme == "dark" { "dark" } else { "light" }.to_string();
    normalized.layout = if normalized.layout == "horizontal" { "horizontal" } else { "vertical" }.to_string();
    if !matches!(
        normalized.background.as_str(),
        "cream" | "white" | "lavender" | "blue" | "pink" | "slate"
    ) {
        normalized.background = "cream".to_string();
    }
    normalized.font_size = normalized.font_size.clamp(12, 32);
    normalized.opacity = normalized.opacity.clamp(0.35, 1.0);
    normalized.blur = normalized.blur.min(40);
    let store = app.store(STORE_PATH).map_err(|error| error.to_string())?;
    store.set(DEFAULT_FLOATING_SETTINGS, serde_json::to_value(normalized).map_err(|error| error.to_string())?);
    store.save().map_err(|error| error.to_string())
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
    let user_prompt = match payload {
        GenerateOutlinePayload::Text { topic, notes } => {
            if topic.trim().is_empty() {
                return Err("请填写主题".to_string());
            }
            dmx::build_text_prompt(topic.trim(), notes.as_deref())
        }
        GenerateOutlinePayload::File => {
            return Err("DeepSeek 官方 API 暂不支持文件上传，请使用文字输入生成提纲".to_string())
        },
    };

    dmx::generate_outline_from_dmx(&settings, user_prompt)
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
        runtime.floating.view_state = "collapsed".to_string();
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
        window
            .set_resizable(false)
            .map_err(|error| error.to_string())?;
        window
            .set_shadow(false)
            .map_err(|error| error.to_string())?;
        window
            .emit("floating-outline-selected", json!({ "id": id }))
            .map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(&app, "floating", url)
        .title("DemoCue Floating")
        .inner_size(320.0, 120.0)
        .decorations(false)
        .shadow(false)
        .always_on_top(true)
        .resizable(false)
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

pub fn emit_floating_navigation(app: &AppHandle, direction: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("floating") {
        let payload = serde_json::json!({
          "direction": direction
        });
        window
            .emit("floating-navigation-requested", payload)
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}
