//! Translations for the few messages produced in Rust (system notifications and shortcut feedback).
//! The English text is the key, like on the frontend. The frontend sends its language via `set_language`.
use std::sync::atomic::{AtomicU8, Ordering};

/// 0 = English, 1 = pl, 2 = de, 3 = es, 4 = fr
static LANG: AtomicU8 = AtomicU8::new(0);

/// (english, [pl, de, es, fr])
const TABLE: &[(&str, [&str; 4])] = &[
    ("{name} crashed", ["{name} uległa awarii", "{name} ist abgestürzt", "{name} falló", "{name} a planté"]),
    ("Restarting it (attempt {n})", ["Uruchamiam ponownie (próba {n})", "Wird neu gestartet (Versuch {n})", "Reiniciando (intento {n})", "Redémarrage (tentative {n})"]),
    ("{name} keeps crashing", ["{name} wciąż ulega awarii", "{name} stürzt immer wieder ab", "{name} sigue fallando", "{name} plante en boucle"]),
    ("Gave up after {max} restarts", ["Poddano się po {max} restartach", "Nach {max} Neustarts aufgegeben", "Se renunció tras {max} reinicios", "Abandon après {max} redémarrages"]),
    ("Open Payload Board to restart it", ["Otwórz Payload Board, aby uruchomić ją ponownie", "Öffne Payload Board, um sie neu zu starten", "Abre Payload Board para reiniciarla", "Ouvrez Payload Board pour la redémarrer"]),
    ("No active profile", ["Brak aktywnego profilu", "Kein aktives Profil", "Ningún perfil activo", "Aucun profil actif"]),
    ("Sequence started", ["Sekwencja uruchomiona", "Sequenz gestartet", "Secuencia iniciada", "Séquence lancée"]),
    ("Press again within 2 s to end the session", ["Naciśnij ponownie w ciągu 2 s, aby zakończyć sesję", "Innerhalb von 2 s erneut drücken, um die Sitzung zu beenden", "Pulsa de nuevo en 2 s para terminar la sesión", "Appuyez à nouveau dans les 2 s pour terminer la session"]),
    ("Ending session…", ["Kończenie sesji…", "Sitzung wird beendet …", "Terminando sesión…", "Fin de la session…"]),
    ("A sequence is already running for this profile", ["Dla tego profilu sekwencja już trwa", "Für dieses Profil läuft bereits eine Sequenz", "Ya hay una secuencia en curso para este perfil", "Une séquence est déjà en cours pour ce profil"]),
    ("Profile not found", ["Nie znaleziono profilu", "Profil nicht gefunden", "Perfil no encontrado", "Profil introuvable"]),
];

pub fn set(code: &str) {
    let id = match code { "pl" => 1, "de" => 2, "es" => 3, "fr" => 4, _ => 0 };
    LANG.store(id, Ordering::Relaxed);
}

/// Translated text for the current language (the English text when there is no entry).
pub fn tr(text: &str) -> String {
    let lang = LANG.load(Ordering::Relaxed);
    if lang == 0 {
        return text.to_string();
    }
    TABLE.iter().find(|(k, _)| *k == text).map_or_else(|| text.to_string(), |(_, v)| v[lang as usize - 1].to_string())
}

/// `tr` plus `{placeholder}` substitution.
pub fn fmt(text: &str, args: &[(&str, &str)]) -> String {
    args.iter().fold(tr(text), |s, (k, v)| s.replace(&format!("{{{k}}}"), v))
}

#[tauri::command]
pub fn set_language(code: String) {
    set(&code);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn placeholders(s: &str) -> Vec<String> {
        let mut v: Vec<String> = s.split('{').skip(1).filter_map(|p| p.split('}').next()).map(String::from).collect();
        v.sort();
        v
    }

    #[test]
    fn every_entry_is_complete_and_keeps_its_placeholders() {
        for (key, tr) in TABLE {
            for t in tr {
                assert!(!t.is_empty(), "empty translation for {key}");
                assert_eq!(placeholders(t), placeholders(key), "placeholders differ: {key} -> {t}");
            }
        }
    }

    #[test]
    fn fmt_substitutes_and_falls_back_to_english() {
        set("de");
        assert_eq!(fmt("{name} crashed", &[("name", "Discord")]), "Discord ist abgestürzt");
        assert_eq!(tr("not in the table"), "not in the table");
        set("en");
        assert_eq!(fmt("{name} crashed", &[("name", "Discord")]), "Discord crashed");
    }
}
