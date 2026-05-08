# Payload Board — plan dla Claude Code

> Robocza nazwa: **Payload Board**. Profil = `payload` (zestaw apek przygotowany do odpalenia), apka = `board` (panel dowodzenia, na którym widzisz status każdego payloadu w czasie rzeczywistym). Bundle ID: `com.matt.payload-board`.

Aplikacja desktopowa **cross-platform (Windows / macOS / Linux)** do zarządzania zestawami aplikacji (profilami) — uruchamianie sekwencyjne, monitoring zasobów, wyłączanie jednym przyciskiem. Estetyka „dark cockpit / command & control".

> Pierwotny use case (gaming: Steam + iRacing + SimHub + Fanatec) jest Windows-only przez ekosystem simów. Architektura jest jednak platform-agnostic — na macOS/Linux ta sama apka obsłuży „dev session", „design session", „streaming session" itp.

---

## 1. Cel i zakres MVP

Jedna aplikacja, która zastępuje rytuał „klik–klik–klik–klik" przed sesją. Użytkownik:

1. Tworzy nazwany profil (np. `iRacing`, `Praca`, `Stream`).
2. Dodaje do profilu aplikacje — ze ścieżki binarki lub z listy zainstalowanych.
3. Konfiguruje dla każdej: kolejność, opóźnienie startu, argumenty CLI, zachowanie (czekaj na proces / pal i zapomnij).
4. Klika **RUN SEQUENCE** → aplikacje startują w kolejności.
5. Widzi dashboard z CPU/RAM/statusem każdego procesu w czasie rzeczywistym.
6. Może na pojedynczym procesie zrobić: stop / restart / otwórz folder / zabij wymuszenie.
7. Klika **END SESSION** → wszystko z profilu jest zamykane (graceful → po timeoucie kill).
8. Profili może być dowolnie wiele, przełączanie z lewego paska.

---

## 2. Stack technologiczny — rekomendacja

**Tauri 2.x + React + TypeScript + Tailwind + shadcn/ui + FontAwesome 6 Free**

Uzasadnienie:
- **Tauri 2** — natywnie cross-platform (Win/macOS/Linux z jednego kodu), Rust backend ma dostęp do platformowych API (procesy, ikony, autostart, tray), binarka 10–20 MB, niski narzut RAM (sensowne dla apki, która sama monitoruje RAM).
- **React + TS** — komponenty + bezpieczne kontrakty IPC.
- **Tailwind** z **całkowicie nadpisaną paletą** (sekcja 6).
- **shadcn/ui** — biblioteka komponentów oparta na Radix UI, kopiowana do projektu jako kod (nie zewnętrzna paczka). Daje accessibility, focus states, keyboard nav, animacje state'ów — czyli wszystko, co bolałoby ręcznie. Z domyślnym wyglądem shadcn (zaokrąglony, miękki) zrywamy całkowicie przez override CSS variables — sekcja 6.
- **FontAwesome 6 Free** — używamy wariantów `solid` (większość ikon akcji) i `regular` (limited, ale dla wybranych ikon outline'owych). Free Solid jest naturalnie cięższy niż Sharp Light z Pro, więc kompensujemy to designem: małe rozmiary (12 px), kolorowanie w `--text-muted` w spoczynku, akcent dopiero na hover/active. Sekcja 6 opisuje to dokładnie. Pakiety: `@fortawesome/free-solid-svg-icons` + `@fortawesome/free-regular-svg-icons`.
- **Vite** — domyślny bundler Tauri.

Kluczowe crate'y Rust (cross-platform first):
- `sysinfo` — monitoring CPU/RAM per PID na wszystkich trzech platformach.
- `tauri-plugin-shell` — uruchamianie procesów z argumentami.
- `tauri-plugin-store` — persistencja JSON.
- `tauri-plugin-autostart` — autostart na Win/macOS/Linux (jednolite API).
- `tauri-plugin-dialog` — file picker.
- **Per-platforma** (warunkowe deps w `Cargo.toml`):
  - Windows: `windows` (windows-rs) — `SHGetFileInfoW`, czytanie rejestru.
  - macOS: `cocoa`, `objc` — `NSWorkspace iconForFile`, scan `/Applications`.
  - Linux: `freedesktop_entry_parser` — parsing `.desktop`, `xdg` — ścieżki ikonek z motywu.

Frontendowo:
- **shadcn/ui** komponenty używane: `Dialog`, `Select`, `Switch`, `Tabs`, `Tooltip`, `Sonner` (toasty), `Button`, `Input`, `ContextMenu`, `ScrollArea`, `Resizable`, `Slider`. Wszystkie z `--radius: 0` i podmienionymi tokenami kolorów.
- **uPlot** lub **Lightweight Charts** do sparklines (uPlot mniejszy i ostrzejszy).
- **`@fortawesome/react-fontawesome`** + `@fortawesome/free-solid-svg-icons` + `@fortawesome/free-regular-svg-icons`.

Alternatywy odrzucone:
- **Electron** — za ciężki dla apki-monitora; ironicznie zżerałby zasoby, które ma raportować.
- **WPF / WinUI / .NET MAUI** — Windows-only, eliminuje wymóg cross-platform.
- **Flutter Desktop** — niby działa, ale natywna integracja z OS-em słabsza niż Tauri, a custom design w Flutterze pod taką estetykę = bój z Materialem.

---

## 3. Architektura

```
Frontend (React + TS + shadcn/ui, w WebView Tauri)
  - Profile list / Dashboard / Editors

           |  Tauri IPC (invoke / emit)

Backend (Rust) — core platform-agnostic
  - ProfileStore (JSON, app data dir)
  - ProcessManager (spawn, kill, status)
  - ResourceMonitor (sysinfo loop, 1Hz emit do frontu)
  - Sequencer (uruchamianie wg kolejności + delay)
  - IconCache

           |  wywołuje przez trait

  PlatformAdapter (trait):
    - extract_icon(path) -> PNG
    - list_installed_apps() -> Vec
    - graceful_close(pid)
    - kill_tree(pid)

  impl WindowsAdapter   #[cfg(windows)]
  impl MacOsAdapter     #[cfg(target_os = "macos")]
  impl LinuxAdapter     #[cfg(target_os = "linux")]
```

IPC commands wystawiane przez Rust (platform-agnostic z perspektywy frontu):
- `list_profiles()` / `save_profile(profile)` / `delete_profile(id)`
- `pick_executable()` → otwiera dialog, zwraca `{path, suggested_name, icon_path}`
- `list_installed_apps()` → odpalany w danej platformie inną metodą, ale zwraca jednolity shape
- `start_sequence(profile_id)` / `stop_sequence(profile_id)`
- `start_app(entry_id)` / `stop_app(entry_id, force: bool)` / `restart_app(entry_id)`
- `open_path(entry_id)` → reveal in Finder/Explorer/file manager (przez `tauri-plugin-shell`)
- `stop_all(profile_id)` — graceful → kill po timeoucie

Event streaming (Rust → frontend, ~1 Hz):
- `metrics_tick` → array `{ entry_id, pid, status, cpu_pct, ram_mb, uptime_s, history: [...] }`
- `sequence_progress` → `{ profile_id, current_index, total, phase: 'launching'|'waiting'|'done' }`

---

## 4. Model danych

```ts
type Profile = {
  id: string;
  name: string;
  color_accent?: string;
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
};

type AppEntry = {
  id: string;
  name: string;
  // UWAGA: na Win to .exe, na macOS może być .app bundle lub binarka,
  // na Linux dowolna ścieżka wykonywalna lub `.desktop` Exec=
  executable_path: string;
  args: string[];
  working_dir?: string;
  launch_delay_ms: number;
  wait_strategy: 'fire_and_forget' | 'wait_for_window' | 'wait_seconds';
  wait_seconds?: number;
  icon_cache_path?: string;
  enabled: boolean;
  order: number;
  requires_elevation?: boolean;  // Windows: admin; macOS: sudo; Linux: pkexec
};
```

Persistencja przez `tauri-plugin-store` w platformowym `app_data_dir`:
- Windows: `%APPDATA%\com.matt.payload-board\`
- macOS: `~/Library/Application Support/com.matt.payload-board/`
- Linux: `~/.config/com.matt.payload-board/` (lub `$XDG_CONFIG_HOME`)

---

## 5. Funkcjonalności — fazy

### Faza 0 — Setup
- `npm create tauri-app@latest` z templatem React-TS-Vite.
- Inicjalizacja Tailwind: `npx tailwindcss init -p`. Custom konfiguracja z paletą z sekcji 6 (czyścimy domyślne kolory).
- Inicjalizacja shadcn: `npx shadcn@latest init` — wybór: TypeScript, default style, slate base (i tak nadpiszemy), CSS variables: yes.
- Override `globals.css` tak, żeby zmienne shadcn (`--background`, `--foreground`, `--primary`, `--radius` itd.) wskazywały na nasze tokeny (sekcja 6).
- Instalacja FontAwesome (free):
  ```
  npm i @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome
  npm i @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons
  ```
- Konfiguracja Cargo z conditional compilation:
  ```toml
  [target.'cfg(windows)'.dependencies]
  windows = { version = "...", features = ["Win32_UI_Shell", "Win32_System_Registry"] }

  [target.'cfg(target_os = "macos")'.dependencies]
  cocoa = "..."
  objc = "..."

  [target.'cfg(target_os = "linux")'.dependencies]
  freedesktop_entry_parser = "..."
  ```
- Stworzenie `platform/mod.rs` z traitem `PlatformAdapter` i trzema implementacjami.

### Faza 1 — MVP scaffold
- Sidebar profili + main area, layout dwukolumnowy z `Resizable` z shadcn.
- CRUD profili z `Dialog` z shadcn.
- Dodawanie app entry przez file picker (`tauri-plugin-dialog`).
- Dashboard z kafelkami pokazującymi tylko nazwy.
- IPC: `list_profiles`, `save_profile`, `pick_executable`.
- **Test cross-platform**: `npm run tauri dev` ma się odpalić na Win, macOS i Linux; sidebar i dashboard się renderują, profile się zapisują.

### Faza 2 — Process control
- `start_app`, `stop_app`, `restart_app`, `open_path` — implementacje w `PlatformAdapter`.
- Status ikona (RUNNING / STOPPED / CRASHED).
- Wyciąganie ikony z binarki — per platforma (sekcja 7).
- `stop_all` z gracefulem → kill po timeoucie.

### Faza 3 — Sekwencer
- `start_sequence` z respektowaniem `order`, `launch_delay_ms`, `wait_strategy`.
- Pasek progresu sekwencji u góry dashboardu.
- Anulowanie w trakcie sekwencji.
- Toast (shadcn `Sonner`) przy zakończeniu / błędzie.

### Faza 4 — Monitoring
- `sysinfo` loop 1 Hz → emit metryk do frontu.
- W każdym kafelku: liczbowe CPU% / RAM MB + sparkline 60s (uPlot).
- W stopce: sumaryczne CPU/RAM wszystkich procesów z profilu, wolny RAM systemu, obciążenie CPU systemu.

### Faza 5 — UX polish
- Pełen design system (sekcja 6) — wszystkie shadcn komponenty mają zaokrąglenia 0, kolory z naszych tokenów, ikony z FA Free w 12 px / `--text-muted`.
- Animacje wyłącznie funkcjonalne: pulsujący wskaźnik LIVE, miganie przy crashu.
- Hotkeys: `Ctrl/Cmd+R` start sekwencji, `Ctrl/Cmd+Q` end session, `1..9` przełączanie profili.

### Faza 6 — Nice-to-have
- Lista zainstalowanych apek — per platforma (sekcja 7).
- System tray (Tauri tray API — cross-platform).
- Autostart (`tauri-plugin-autostart` — cross-platform).
- Eksport/import profili (JSON).
- Logi sesji.
- "Wykryj już działające" — przy starcie sekwencji sprawdź czy proces nie up; pomiń.

---

## 6. Design system — translacja briefu na tokeny

### Paleta — CSS custom properties, nadpisują domyślne shadcn

```css
:root {
  /* === Nasze tokeny === */
  --bg-base:        #0A0A0B;
  --bg-surface:     #111113;
  --bg-elevated:    #161618;
  --bg-hover:       #1C1C1F;

  --border-subtle:  #1F1F22;
  --border-default: #2A2A2F;
  --border-strong:  #3A3A40;

  --text-primary:   #E8E8EA;
  --text-secondary: #8A8A90;
  --text-muted:     #54545A;
  --text-disabled:  #38383C;

  --accent-laser:   #FFE600;
  --accent-data:    #FFFFFF;
  --status-live:    #00E5FF;
  --status-warn:    #FF7A00;
  --status-crit:    #FF2D55;
  --status-info:    #B864FF;

  /* === Mapowanie shadcn -> nasze tokeny === */
  /* shadcn używa formatu HSL bez jednostek: "H S% L%" */
  --background:        220 5% 4%;       /* = bg-base */
  --foreground:        240 4% 91%;      /* = text-primary */
  --card:              240 4% 7%;       /* = bg-elevated */
  --card-foreground:   240 4% 91%;
  --popover:           240 4% 7%;
  --popover-foreground:240 4% 91%;
  --primary:           54 100% 50%;     /* = accent-laser, do wyróżnień */
  --primary-foreground:0 0% 4%;         /* czarny tekst na żółtym CTA */
  --secondary:         240 5% 11%;      /* = bg-hover */
  --secondary-foreground:240 4% 91%;
  --muted:             240 5% 11%;
  --muted-foreground:  240 4% 56%;      /* = text-secondary */
  --accent:            187 100% 50%;    /* = status-live */
  --accent-foreground: 220 5% 4%;
  --destructive:       348 100% 59%;    /* = status-crit */
  --destructive-foreground:240 4% 91%;
  --border:            240 6% 13%;      /* = border-default */
  --input:             240 6% 13%;
  --ring:              54 100% 50%;     /* = accent-laser dla focus */
  --radius:            0px;             /* KLUCZOWE — wszystko płaskie */
}
```

### Override shadcn na poziomie komponentów
- shadcn generuje komponenty do `src/components/ui/`. **Edytujemy je bezpośrednio** żeby usunąć resztki domyślnych klas:
  - W każdym komponencie: zamień `rounded-md`, `rounded-sm`, `rounded` na nic albo na `rounded-none`.
  - W `Button` zamień `shadow-*` na nic.
  - W `Dialog` zamień zaokrąglenia overlay-a i contentu, usuń `shadow-lg`.
  - Stwórz wariant `cockpit` w `Button` z monospace, uppercase, `tracking-wider`, kolorystyką akcentu.

### Typografia
- **Dane / liczby / ścieżki:** `JetBrains Mono` (400, 500). Wszystkie wartości CPU/RAM, PID, uptime, ścieżki — monospace.
- **Etykiety / nagłówki / nazwy apek:** `Inter` (500/600) lub `Geist Sans`.
- Skala ostra: 11 / 12 / 14 / 18 / 24 px.
- `letter-spacing: 0.04em` dla nagłówków uppercase typu `PROFILE`, `LIVE`, `RAM USAGE`.

### Ikonografia — FontAwesome 6 Free
Free FA daje nam tylko **Solid** (pełne, wypełnione kształty), **Regular** (ograniczona biblioteka outline'owa) i **Brands**. Sharp / Light / Thin są tylko w Pro. Free Solid jest naturalnie cięższy niż chciałby brief — dlatego stosujemy strategię „małe i wyciszone", żeby ikony nie dominowały warstwy danych.

- Pakiety: `@fortawesome/free-solid-svg-icons` + `@fortawesome/free-regular-svg-icons`.
- Reguły renderowania w spoczynku:
  ```css
  .fa-icon {
    color: var(--text-muted);     /* nie text-secondary — chcemy je jeszcze ciszej */
    width: 12px;                   /* mniej niż 14, żeby Solid nie krzyczał */
    height: 12px;
  }
  .fa-icon-action:hover { color: var(--text-primary); }
  .fa-icon-active { color: var(--accent-laser); }
  .fa-icon-crit   { color: var(--status-crit); }
  ```
- Mapowanie do akcji (wszystkie z `free-solid` o ile nie zaznaczono inaczej):
  - Start: `faPlay`
  - Stop: `faStop`
  - Restart: `faRotateRight`
  - Open path: `faFolderOpen`
  - Force kill: `faXmark` (klasa `.fa-icon-crit`)
  - Settings/edit: `faSliders`
  - Add: `faPlus`
  - Sequence run (CTA): `faPlay` w większym rozmiarze
  - End session (CTA): `faPowerOff` na czerwonym tle
  - Status RUNNING: `faCircle` z `free-solid`, fill `--status-live`, 6 px
  - Status STOPPED: `faCircle` z `free-regular` (outline), 6 px, kolor `--text-muted`
  - Status CRASHED: `faTriangleExclamation`, 8 px, fill `--status-crit`, animacja pulse
- Strategia kompensowania ciężaru Solid:
  - **Mniejsze rozmiary** — domyślnie 12 px (a nie 14–16 jak w typowych UI).
  - **Niższy kontrast w spoczynku** — `--text-muted` zamiast `--text-secondary`.
  - **Akcent tylko na akcję** — kolor pojawia się dopiero przy hover/focus, lub gdy element jest aktywny (proces RUNNING, sekwencja w trakcie).
  - **Brak ikon dekoracyjnych** — ikona pojawia się tylko gdy ma funkcję (przycisk, status). Żadnych „ikonek przy nagłówku sekcji" itp.
- Mapowanie ikon trzymaj w jednym pliku `src/components/icons/index.ts` — łatwo zamienić na Pro Sharp Light, gdyby projekt później dostał licencję Pro (zmiana importów w jednym miejscu).

### Kształty i przestrzeń
- `border-radius: 0` GLOBALNIE — przez `--radius: 0px` w shadcn + ręczny override w komponentach.
- **Brak `box-shadow`.** Głębia przez warstwy tła (`bg-base` < `bg-surface` < `bg-elevated`).
- Grid 4 px. Wszystkie odstępy to wielokrotności 4.
- Kafelki: stałe wymiary `260 × 120 px`, `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`.
- Sidebar: stała szerokość `220 px`, prawa krawędź 1 px `--border-subtle`.

### Stany i sygnały
- Status LED w kafelku: kropka 6 px po lewej.
  - RUNNING: `--status-live` z `box-shadow: 0 0 8px var(--status-live)` (jedyny dozwolony shadow w apce).
  - STOPPED: outline, kolor `--text-muted`.
  - CRASHED: `--status-crit`, animacja `pulse 1s infinite`.
- CPU > 80%: liczba zmienia kolor na `--status-warn`. > 95% → `--status-crit`.
- Sparkline: `--status-live` → `--status-warn` → `--status-crit` w zależności od progu.
- **END SESSION**: prawy górny róg, tło `--status-crit`, tekst `#0A0A0B`, monospace, uppercase, `tracking-widest`.

### Layout główny

```
SIDEBAR (220px)  |  TOP BAR
                 |  PROFILE: iRacing    [RUN SEQ] [END SESSION]
- Praca          | -------------------------------------------------
- iRacing        |  [Steam tile]  [SimHub tile]  [DX Light tile]
- Flight         |  CPU 12%       CPU  3%        STOPPED
- Stream         |  RAM 480MB     RAM 220MB
                 |  [sparkline]   [sparkline]
+ NEW            |  ▶ ■ ↻ folder  ▶ ■ ↻ folder   ▶ ■ ↻ folder
                 | -------------------------------------------------
                 |  TOTAL  CPU 47% | RAM 8.2GB / 32GB | 5 alive
```

### Co STANOWCZO wyrzucamy
- Gradienty (poza fillem pod wykresem).
- Cienie pod elementami (poza glow LED).
- Glassmorphism, blury, transparency.
- Zaokrąglenia (`--radius: 0px`).
- Emoji w UI — wszystkie ikony przez FontAwesome.
- Domyślne style shadcn (rounded, shadows) — nadpisane.
- Domyślne kolory Tailwinda — purgujemy w configu, używamy tylko naszych tokenów.

---

## 7. Specyfika platform — co się różni między Win/macOS/Linux

### 7.1 Wyciąganie ikony z binarki
- **Windows**: `SHGetFileInfoW` z `SHGFI_ICON | SHGFI_LARGEICON`, konwersja HICON → PNG przez `image` crate.
- **macOS**: `[NSWorkspace iconForFile:]` na `.app` bundle → NSImage → PNG. Dla zwykłych binarek bierzemy generic-binary icon.
- **Linux**: dla `.desktop` plików — pole `Icon=` wskazuje nazwę z motywu, szukamy w `/usr/share/icons/<theme>/` i `~/.icons/`. Dla zwykłej binarki — fallback na ikonę systemową „application-x-executable".

### 7.2 Lista zainstalowanych aplikacji
- **Windows**: rejestr `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*` + HKCU + WOW6432Node. Filtruj po `DisplayName` + `DisplayIcon`/`InstallLocation`.
- **macOS**: scan `/Applications/*.app` i `~/Applications/*.app`. Metadata przez `mdls` lub czytanie `Info.plist`.
- **Linux**: parsuj `.desktop` z `/usr/share/applications/`, `/var/lib/flatpak/exports/share/applications/`, `~/.local/share/applications/`. Crate `freedesktop_entry_parser`.

### 7.3 Graceful shutdown procesu z GUI
- **Windows**: `EnumWindows` + `GetWindowThreadProcessId` → znajdź okna głównego procesu → `WM_CLOSE`. Po 5 s timeout → `TerminateProcess`.
- **macOS**: `NSRunningApplication runningApplicationWithProcessIdentifier:` → `terminate` (graceful) → po 5 s `forceTerminate`. Alternatywnie AppleScript `tell application "X" to quit`.
- **Linux**: `kill -SIGTERM <pid>` na cały process group. Po 5 s `SIGKILL`. Dla Wayland/X11 apek — opcjonalnie `xdotool` lub D-Bus `org.gtk.Application.Quit` (overkill na MVP).

### 7.4 Tree-kill
- **Windows**: `taskkill /F /T /PID <pid>` jako fallback, lub `JobObject` ustawiony przy spawn — child processy umierają razem z jobem.
- **Unix (macOS/Linux)**: spawnuj z `setsid` żeby utworzyć process group, potem `kill -TERM -<pgid>` (negatywny PID = grupa).

### 7.5 Adoptowanie PIDu (Steam-problem)
Steam i podobne launchery uruchamiają `steam.exe`, który zamyka się a faktyczny daemon żyje gdzie indziej. Ten sam wzorzec występuje na macOS (Steam relauncher) i Linux (steam-runtime-launcher).
- Strategia uniwersalna: po `start_app` w pętli przez 10 s skanować listę procesów w poszukiwaniu nazwy pliku binarki. Pierwszy znaleziony PID → przypisany do entry. Działa na każdej platformie bez zmian, bo `sysinfo` jest cross-platform.

### 7.6 Elewacja uprawnień
- **Windows**: `runas` verb przez `ShellExecuteEx`, lub UAC manifest, lub osobny relaunch. Wykrycie potrzeby: `ERROR_ELEVATION_REQUIRED` (1218).
- **macOS**: `osascript -e 'do shell script "..." with administrator privileges'` — pokazuje natywny prompt. Apkom z piaskownicy (sandbox) tego się nie zrobi — projekt powinien być non-sandbox (osobne podpisywanie).
- **Linux**: `pkexec` (z polkit) jako standard, fallback `sudo` w terminalu. Apkom Flatpak — odpowiednie portale.

### 7.7 Specyfika gamingu na !Windows
Dla Twojego use case (iRacing, Fanatec, SimHub) — to **wszystko jest Windows-only**. Linux ma alternatywy (Steam Proton dla iRacing — częściowo działa, OpenFFBoard zamiast Fanatec UI, SimHub działa na Wine), ale to inna historia. macOS — głucho.
- **Wniosek**: cross-platform fundament jest słuszny, ale realnie sesje gamingowe odpalisz tylko na Win. macOS/Linux build apki ma sens dla nie-gamingowych profili (praca, design, dev, stream).

### 7.8 File system: paths, permissions, executables
- **Windows**: `.exe`, `.bat`, `.cmd`. Ścieżki z backslashami, ale Tauri normalizuje.
- **macOS**: `.app` bundle to katalog — `path/to/MyApp.app/Contents/MacOS/MyApp` to faktyczna binarka. Tauri shell powinien akceptować obie formy; dla `.app` używać `open -a "MyApp.app"`.
- **Linux**: bit wykonywalności (`chmod +x`), shebangi w skryptach. `.desktop` Exec= może mieć field codes (`%U`, `%f`) — trzeba je usunąć przed odpaleniem.

---

## 8. Struktura projektu

```
payload-board/
├── src/                          # frontend (React + TS + shadcn)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn — generowane, edytowane (radius 0)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── sidebar/ProfileList.tsx
│   │   ├── dashboard/AppTile.tsx
│   │   ├── dashboard/Sparkline.tsx
│   │   ├── dashboard/StatusBar.tsx
│   │   ├── editor/ProfileEditor.tsx
│   │   ├── editor/AppEntryEditor.tsx
│   │   └── icons/                # konfiguracja FA, exporty używanych ikon
│   │       └── index.ts
│   ├── ipc/                      # wrappery na invoke()
│   │   ├── profiles.ts
│   │   ├── processes.ts
│   │   └── metrics.ts
│   ├── hooks/
│   │   ├── useProfiles.ts
│   │   ├── useMetricsStream.ts
│   │   └── useHotkeys.ts
│   ├── styles/
│   │   ├── tokens.css            # custom properties + override shadcn
│   │   └── globals.css
│   └── types.ts
│
├── src-tauri/
│   ├── Cargo.toml                # conditional deps per platforma
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── commands/
│       │   ├── profiles.rs
│       │   ├── processes.rs
│       │   ├── sequencer.rs
│       │   └── installed_apps.rs
│       ├── monitor.rs            # sysinfo loop (cross-platform)
│       ├── icon_cache.rs
│       └── platform/             # platform abstraction
│           ├── mod.rs            # trait PlatformAdapter + factory
│           ├── windows.rs        # #[cfg(windows)]
│           ├── macos.rs          # #[cfg(target_os = "macos")]
│           └── linux.rs          # #[cfg(target_os = "linux")]
│
├── tailwind.config.ts            # custom paleta, purge default colors
├── components.json               # config shadcn
├── vite.config.ts
└── package.json
```

---

## 9. Co przekazać Claude Code na start

Wklej do CC:

> Zbuduj aplikację desktopową cross-platform (Windows / macOS / Linux) o nazwie **Payload Board** (bundle ID: `com.matt.payload-board`) wg planu w `payload-board-plan.md`. Stack: Tauri 2 + React + TS + Tailwind + shadcn/ui + FontAwesome 6 Free (Solid + Regular). Zacznij od **Fazy 0** (setup) i **Fazy 1** (MVP scaffold).
>
> Twarde zasady, których nie łamiesz:
> - Cała logika platform-specific siedzi za traitem `PlatformAdapter` w `src-tauri/src/platform/`. Frontend nie wie nic o platformie. `cfg` flagi tylko w tym module.
> - Wszystkie shadcn komponenty mają `--radius: 0`, brak `shadow-*`, kolory wyłącznie z naszych tokenów (sekcja 6). Po `npx shadcn add <component>` od razu edytuj wygenerowany plik i wyczyść zaokrąglenia/cienie.
> - Wszystkie ikony przez `<FontAwesomeIcon />` z FA Free (Solid + Regular). Domyślny rozmiar 12 px, kolor `--text-muted` w spoczynku — szczegóły w sekcji 6 (kompensowanie ciężaru Solid). Żadnych emoji, żadnego Lucide, żadnych SVG ad-hoc. Mapowanie ikon trzymaj w `src/components/icons/index.ts`, żeby ewentualne przejście na Pro Sharp Light w przyszłości było zmianą jednego pliku.
> - Po każdej fazie zatrzymaj się, pokaż diff, opisz jak uruchomić i przetestować.
> - `cargo check` (na targecie hosta) i `npm run build` przed każdym commitem.
> - Każda funkcja w `PlatformAdapter` ma działającą implementację dla wszystkich trzech platform przed merge'em fazy.

Sugerowane parametry sesji CC:
- Plan mode przed każdą fazą — niech wypisze pliki, czeka na akceptację.
- Po każdej fazie commit z tagiem `phase-N`.
- Buildy testowe na każdym OS-ie — najlepiej GitHub Actions matrix (`windows-latest`, `macos-latest`, `ubuntu-latest`) ustawione już w Fazie 0.

---

## 10. Kryteria gotowości MVP

Aplikacja jest "gotowa jako MVP" gdy:

1. Buduje się i odpala na Windows, macOS i Linux z tego samego kodu.
2. Tworzę profil "iRacing" na Windows, dodaję 5 prawdziwych aplikacji (Steam, SimHub, DX Light, iRacing, Fanatec).
3. Tworzę profil "Praca" na macOS, dodaję Slack, Linear, Spotify, Browser.
4. Klikam **RUN SEQUENCE** — wszystkie startują w mojej kolejności, z opóźnieniami.
5. Widzę kafelki z LED, CPU%, RAM, sparkline aktualizowanym co sekundę.
6. Klikam stop na pojedynczym kafelku — proces się zamyka, LED gaśnie.
7. Klikam **END SESSION** — wszystko zamyka się graceful, po 5s timeout → kill.
8. Restart aplikacji nie traci profilu — wszystko persystuje.
9. UI wygląda jak kokpit, nie jak Bootstrap. Zero zaokrągleń, zero shadowów, ikony FA Free Solid w 12 px — wyciszone w spoczynku, akcent dopiero na akcję.
