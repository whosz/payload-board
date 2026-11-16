import { open } from '@tauri-apps/plugin-shell';

export const SGDB_API_URL = 'https://www.steamgriddb.com/profile/preferences/api';

/** Opens a web page in the default browser. */
export const openExternal = (url: string) => open(url).catch(() => {});
