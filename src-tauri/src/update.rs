//! "Is there a newer release?" — one anonymous request to GitHub's public API; the user then
//! downloads from the releases page themselves (no auto-install, so no signing keys needed).
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

const LATEST: &str = "https://api.github.com/repos/whosz/payload-board/releases/latest";

#[derive(Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub url: String,
}

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    html_url: String,
}

fn parse(v: &str) -> Option<Vec<u64>> {
    v.trim_start_matches('v').split('-').next()?.split('.').map(|p| p.parse().ok()).collect()
}

fn is_newer(latest: &str, current: &str) -> bool {
    matches!((parse(latest), parse(current)), (Some(l), Some(c)) if l > c)
}

/// Returns the latest published release when it is newer than the running app.
#[tauri::command]
pub async fn check_for_update<R: tauri::Runtime>(app: AppHandle<R>) -> Result<Option<UpdateInfo>, String> {
    let release: Release = reqwest::Client::builder()
        .user_agent("payload-board")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?
        .get(LATEST)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(is_newer(&release.tag_name, &app.package_info().version.to_string()).then(|| UpdateInfo {
        version: release.tag_name.trim_start_matches('v').to_string(),
        url: release.html_url,
    }))
}

#[cfg(test)]
mod tests {
    use super::is_newer;

    #[test]
    fn compares_versions_numerically() {
        assert!(is_newer("v0.6.0", "0.5.4"));
        assert!(is_newer("0.5.10", "0.5.9"));
        assert!(!is_newer("v0.5.4", "0.5.4"));
        assert!(!is_newer("v0.5.3", "0.5.4"));
        assert!(!is_newer("nightly", "0.5.4"));
    }
}
