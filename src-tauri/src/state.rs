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

#[derive(Debug, Default)]
pub struct AppState {
    pub floating: FloatingRuntimeState,
}
