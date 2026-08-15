use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DmxSettings {
    pub endpoint: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FloatingRuntimeState {
    pub outline_id: Option<i64>,
    pub chapter_index: usize,
    pub view_state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FloatingSettings {
    pub theme: String,
    pub layout: String,
    pub font_size: u32,
    pub opacity: f32,
    pub blur: u32,
}

impl Default for FloatingSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            layout: "vertical".to_string(),
            font_size: 16,
            opacity: 0.85,
            blur: 24,
        }
    }
}

#[derive(Debug, Default)]
pub struct AppState {
    pub floating: FloatingRuntimeState,
}
