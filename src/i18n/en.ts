import type { Dict } from './index';

// English is the source language: only plural forms need an entry (everything else falls back to the key).
export const en: Dict = {
  "(+{count} more)": { one: "(+{count} more)", other: "(+{count} more)" },
  "Start {count} apps in order": { one: "Start {count} app in order", other: "Start {count} apps in order" },
  "{count} apps": { one: "{count} app", other: "{count} apps" },
  "{count} crashed": { one: "{count} crashed", other: "{count} crashed" },
  "{count} live": { one: "{count} live", other: "{count} live" },
  "{count} results": { one: "{count} result", other: "{count} results" },
};
