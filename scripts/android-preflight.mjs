// Read-only environment check for local Android builds. Changes nothing; exits 1 if a hard requirement is missing.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const androidDir = join(root, 'apps', 'mobile', 'android');
let failed = false;
const ok = (m) => console.log(`[ OK ] ${m}`);
const bad = (m) => { failed = true; console.log(`[FAIL] ${m}`); };
const warn = (m) => console.log(`[WARN] ${m}`);

const major = Number(process.versions.node.split('.')[0]);
major >= 20 ? ok(`Node ${process.versions.node}`) : bad(`Node ${process.versions.node} (need >= 20.11)`);

{
  const r = spawnSync('java', ['-version'], { encoding: 'utf8' });
  const text = `${r.stderr ?? ''}${r.stdout ?? ''}`;
  const m = /version "(\d+)/.exec(text);
  if (r.error || !m) bad('java not found on PATH (JDK 17 or 21 required; Android Studio ships one in <install>\\jbr)');
  else {
    const v = Number(m[1]);
    v >= 17 && v <= 23 ? ok(`JDK ${v} (Gradle 8.10.2 supports 17-23)`) : bad(`JDK ${v} not supported by Gradle 8.10.2 (use 17 or 21)`);
  }
}

const home = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!home || !existsSync(home)) bad('ANDROID_HOME is not set or does not exist');
else {
  ok(`ANDROID_HOME=${home}`);
  const need = [['platforms/android-35', 'Android SDK Platform 35'], ['build-tools/35.0.0', 'Build-Tools 35.0.0'], ['ndk/26.1.10909125', 'NDK 26.1.10909125'], ['platform-tools', 'Platform-Tools']];
  for (const [p, label] of need) existsSync(join(home, ...p.split('/'))) ? ok(label) : bad(`${label} missing (SDK Manager)`);
  existsSync(join(home, 'cmake')) ? ok('CMake present') : warn('CMake not found (SDK Manager > SDK Tools > CMake 3.22.1; needed for New Architecture native build)');
}
existsSync(join(androidDir, 'gradlew.bat')) ? ok('gradlew.bat present') : bad('apps/mobile/android/gradlew.bat missing');
existsSync(join(root, 'node_modules')) ? ok('node_modules installed') : bad('run `pnpm install` at the repo root first');
if (root.length > 40) warn(`Repo path is ${root.length} chars; Windows 260-char path limits can break native builds. Prefer something like C:\\dev\\nexuse-go and enable long paths.`);
const lp = join(androidDir, 'local.properties');
if (!existsSync(lp) && !home) warn('No local.properties and no ANDROID_HOME');
if (existsSync(lp)) ok(`local.properties: ${readFileSync(lp, 'utf8').split(/\r?\n/).find((l) => l.startsWith('sdk.dir')) ?? '(no sdk.dir line)'}`);
console.log(failed ? '\nPreflight FAILED.' : '\nPreflight passed (this does not mean the APK builds).');
process.exit(failed ? 1 : 0);
