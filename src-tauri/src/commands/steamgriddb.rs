use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use crate::store::SETTINGS_FILE;

#[derive(Debug, Serialize, Deserialize)]
pub struct SgdbGame {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SgdbGrid {
    pub id: u64,
    pub url: String,
    pub thumb: String,
}

#[derive(Deserialize)]
struct SgdbResponse<T> {
    success: bool,
    data: Option<T>,
    errors: Option<Vec<String>>,
}

fn get_api_key<R: tauri::Runtime>(app: &AppHandle<R>) -> Result<String, String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    store
        .get("sgdb_api_key")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| "SteamGridDB API key not configured".to_string())
}

fn encode_path(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

#[tauri::command]
pub async fn sgdb_search<R: tauri::Runtime>(
    app: AppHandle<R>,
    query: String,
) -> Result<Vec<SgdbGame>, String> {
    let key = get_api_key(&app)?;
    let url = format!(
        "https://www.steamgriddb.com/api/v2/search/autocomplete/{}",
        encode_path(&query)
    );
    let resp: SgdbResponse<Vec<SgdbGame>> = reqwest::Client::new()
        .get(&url)
        .header("Authorization", format!("Bearer {}", key))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if resp.success {
        Ok(resp.data.unwrap_or_default())
    } else {
        Err(resp.errors.unwrap_or_default().join(", "))
    }
}

#[tauri::command]
pub async fn sgdb_grids<R: tauri::Runtime>(
    app: AppHandle<R>,
    game_id: u64,
) -> Result<Vec<SgdbGrid>, String> {
    let key = get_api_key(&app)?;
    let url = format!(
        "https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=460x215",
        game_id
    );
    let resp: SgdbResponse<Vec<SgdbGrid>> = reqwest::Client::new()
        .get(&url)
        .header("Authorization", format!("Bearer {}", key))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if resp.success {
        Ok(resp.data.unwrap_or_default())
    } else {
        Err(resp.errors.unwrap_or_default().join(", "))
    }
}
