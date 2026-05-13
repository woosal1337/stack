import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface InstalledPluginRecord {
  installPath?: string;
}

interface InstalledPluginsFile {
  plugins?: Record<string, InstalledPluginRecord[]>;
}

/** Returns the set of currently-installed plugin paths from installed_plugins.json. */
export function activePluginPaths(): { pluginName: string; path: string }[] {
  const data = readJson<InstalledPluginsFile>(paths.claude.installedPlugins);
  if (!data?.plugins) return [];

  const out: { pluginName: string; path: string }[] = [];
  for (const [fullName, records] of Object.entries(data.plugins)) {
    const pluginName = fullName.split("@")[0] ?? fullName;
    for (const record of records) {
      if (record.installPath) out.push({ pluginName, path: record.installPath });
    }
  }
  return out;
}
