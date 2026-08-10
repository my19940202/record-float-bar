mod commands;
mod db;
mod dmx;
mod state;

use std::sync::Mutex;
use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:outline.db", db::migrations())
                .build(),
        )
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::get_dmx_settings,
            commands::save_dmx_settings,
            commands::generate_outline,
            commands::show_floating_outline,
            commands::hide_floating_outline,
            commands::set_floating_chapter_index,
            commands::get_floating_state,
            commands::set_floating_view_state,
            commands::next_floating_chapter,
            commands::prev_floating_chapter,
        ])
        .setup(|app| {
            let shortcut_up = Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT),
                Code::ArrowUp,
            );
            let shortcut_down = Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT),
                Code::ArrowDown,
            );

            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(shortcut_up, {
                let app_handle = app_handle.clone();
                move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let _ = commands::prev_floating_chapter_internal(&app_handle);
                    }
                }
            })?;

            app.global_shortcut().on_shortcut(shortcut_down, {
                move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let _ = commands::next_floating_chapter_internal(&app_handle);
                    }
                }
            })?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::WindowEvent { label, event, .. } = event {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    if label == "floating" {
                        api.prevent_close();
                        if let Some(window) = app_handle.get_webview_window("floating") {
                            let _ = window.hide();
                        }
                    }
                }
            }
        });
}
