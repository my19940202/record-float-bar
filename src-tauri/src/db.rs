use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineChapter {
    #[serde(default)]
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub points: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineContent {
    pub title: String,
    pub chapters: Vec<OutlineChapter>,
}

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create outlines table",
        sql: "CREATE TABLE IF NOT EXISTS outlines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source_name TEXT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        kind: MigrationKind::Up,
    }]
}

pub fn normalize_outline(raw: OutlineContent) -> OutlineContent {
    let mut chapters = raw.chapters;
    for chapter in &mut chapters {
        if chapter.id.is_empty() {
            chapter.id = uuid::Uuid::new_v4().to_string();
        }
        if chapter.points.is_empty() {
            chapter.points = vec!["补充讲解要点".to_string()];
        }
    }
    OutlineContent {
        title: if raw.title.trim().is_empty() {
            chapters
                .first()
                .map(|item| item.title.clone())
                .unwrap_or_else(|| "未命名提纲".to_string())
        } else {
            raw.title
        },
        chapters,
    }
}
