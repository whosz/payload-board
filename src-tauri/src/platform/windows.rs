#![cfg(windows)]

use std::path::PathBuf;
use super::{PlatformAdapter, InstalledApp};

pub struct WindowsAdapter;

impl PlatformAdapter for WindowsAdapter {
    fn suggested_name(&self, exe_path: &PathBuf) -> String {
        exe_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| titlecase(s))
            .unwrap_or_else(|| "Unknown".to_string())
    }

    fn graceful_close(&self, pid: u32) -> bool {
        // taskkill without /F sends WM_CLOSE to windowed processes
        std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string()])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    fn kill_tree(&self, pid: u32) -> bool {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        true
    }

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        let path_str = exe_path.to_string_lossy();
        let mut cmd = std::process::Command::new("explorer");
        if exe_path.is_dir() {
            cmd.arg(exe_path);
        } else {
            cmd.arg(format!("/select,{}", path_str));
        }
        cmd.spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn list_installed_apps(&self) -> Vec<InstalledApp> {
        let mut apps = list_registry_apps();
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
        apps
    }
}

fn list_registry_apps() -> Vec<InstalledApp> {
    use winreg::enums::*;
    use winreg::RegKey;

    const UNINSTALL_PATH: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";

    let mut apps: Vec<InstalledApp> = Vec::new();

    let roots = [
        (HKEY_LOCAL_MACHINE, false),
        (HKEY_CURRENT_USER, false),
        (HKEY_LOCAL_MACHINE, true), // 32-bit apps on 64-bit Windows
    ];

    for (hive, wow64) in roots {
        let hive_key = RegKey::predef(hive);
        let flags = if wow64 { KEY_READ | 0x0200 } else { KEY_READ };
        let Ok(uninstall) = hive_key.open_subkey_with_flags(UNINSTALL_PATH, flags) else {
            continue;
        };

        for subkey_name in uninstall.enum_keys().flatten() {
            let Ok(subkey) = uninstall.open_subkey(&subkey_name) else { continue };

            let name: String = match subkey.get_value("DisplayName") {
                Ok(v) => v,
                Err(_) => continue,
            };
            if name.trim().is_empty() { continue; }

            let icon_path: Option<String> = subkey
                .get_value::<String, _>("DisplayIcon")
                .ok()
                .map(|icon| {
                    let s = icon.trim().to_string();
                    if let Some(pos) = s.rfind(',') {
                        let suffix = &s[pos + 1..];
                        if suffix.chars().all(|c| c.is_ascii_digit() || c == '-') {
                            return s[..pos].trim_matches('"').to_string();
                        }
                    }
                    s.trim_matches('"').to_string()
                });

            // Steam games ("Steam App <id>"): their DisplayIcon may even point at steam.exe, so ask
            // Steam where the game really lives.
            if let Some(id) = subkey_name.strip_prefix("Steam App ") {
                let exe_path = steam_game_dir(id)
                    .and_then(|d| find_game_exe(&d, &name))
                    .map(|p| p.to_string_lossy().to_string());
                apps.push(InstalledApp { name, exe_path });
                continue;
            }

            let mut exe_path = icon_path
                .clone()
                .filter(|p| {
                    let lower = p.to_lowercase();
                    (lower.ends_with(".exe") || lower.ends_with(".bat"))
                        && std::path::Path::new(p).exists()
                });

            // Steam games (and others) point DisplayIcon at an .ico: look for the game's
            // exe in InstallLocation, or next to the icon.
            if exe_path.is_none() {
                let install_dir = subkey
                    .get_value::<String, _>("InstallLocation")
                    .ok()
                    .map(|d| PathBuf::from(d.trim().trim_matches('"')))
                    .filter(|d| d.is_dir())
                    .or_else(|| {
                        icon_path
                            .as_ref()
                            .and_then(|p| std::path::Path::new(p).parent().map(|d| d.to_path_buf()))
                            .filter(|d| d.is_dir())
                    });
                exe_path = install_dir
                    .and_then(|d| find_game_exe(&d, &name))
                    .map(|p| p.to_string_lossy().to_string());
            }

            apps.push(InstalledApp { name, exe_path });
        }
    }

    apps
}

/// Values of every `"key" "value"` line in a Steam VDF/ACF file (backslashes un-escaped).
fn vdf_values(text: &str, key: &str) -> Vec<String> {
    text.lines()
        .filter_map(|l| {
            let mut q = l.split('"').skip(1).step_by(2);
            if !q.next()?.eq_ignore_ascii_case(key) { return None; }
            Some(q.next()?.replace("\\\\", "\\"))
        })
        .collect()
}

/// Install folder of a Steam game, from `appmanifest_<id>.acf` in the Steam library folders.
fn steam_game_dir(app_id: &str) -> Option<PathBuf> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let steam: String = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(r"Software\Valve\Steam")
        .ok()?
        .get_value("SteamPath")
        .ok()?;
    let steam = PathBuf::from(steam);
    let mut libs = vec![steam.clone()];
    if let Ok(vdf) = std::fs::read_to_string(steam.join("steamapps").join("libraryfolders.vdf")) {
        libs.extend(vdf_values(&vdf, "path").into_iter().map(PathBuf::from));
    }
    libs.iter().find_map(|lib| {
        let apps = lib.join("steamapps");
        let acf = std::fs::read_to_string(apps.join(format!("appmanifest_{app_id}.acf"))).ok()?;
        let dir = apps.join("common").join(vdf_values(&acf, "installdir").into_iter().next()?);
        dir.is_dir().then_some(dir)
    })
}

/// Best-guess game executable in `dir` (top level + one sub-folder deep): skips installers,
/// crash reporters and redistributables, prefers a name matching the app, else the largest exe.
fn find_game_exe(dir: &std::path::Path, app_name: &str) -> Option<PathBuf> {
    const SKIP: [&str; 9] = ["unins", "crash", "redist", "setup", "install", "dxsetup", "helper", "report", "update"];
    let norm = |s: &str| s.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase();
    let want = norm(app_name);

    let mut exes: Vec<(PathBuf, u64)> = Vec::new();
    let mut dirs = vec![dir.to_path_buf()];
    if let Ok(rd) = std::fs::read_dir(dir) {
        dirs.extend(rd.flatten().map(|e| e.path()).filter(|p| p.is_dir()));
    }
    for d in dirs {
        let Ok(rd) = std::fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
            let is_exe = p.extension().map_or(false, |x| x.eq_ignore_ascii_case("exe"));
            if is_exe && !SKIP.iter().any(|s| stem.contains(s)) {
                exes.push((p, e.metadata().map(|m| m.len()).unwrap_or(0)));
            }
        }
    }
    let named = |p: &PathBuf| {
        let n = norm(p.file_stem().and_then(|s| s.to_str()).unwrap_or(""));
        !n.is_empty() && (want.contains(&n) || n.contains(&want))
    };
    exes.sort_by_key(|(p, size)| (!named(p), std::cmp::Reverse(*size)));
    exes.into_iter().next().map(|(p, _)| p)
}

fn titlecase(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}
