// Runs the existing Gradle project. Never fabricates output: reports the APK only if the file exists afterwards.
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const variant = process.argv[2] === 'release' ? 'release' : 'debug';
const androidDir = resolve(import.meta.dirname, '..', 'apps', 'mobile', 'android');
const isWin = process.platform === 'win32';
const task = variant === 'release' ? 'assembleRelease' : 'assembleDebug';

const r = spawnSync(isWin ? 'gradlew.bat' : './gradlew', [task, '--stacktrace'], { cwd: androidDir, stdio: 'inherit', shell: isWin });
if (r.status !== 0) { console.error(`\nGradle ${task} FAILED (exit ${r.status}). No APK is claimed.`); process.exit(r.status ?? 1); }

const apk = join(androidDir, 'app', 'build', 'outputs', 'apk', variant, `app-${variant}.apk`);
if (!existsSync(apk)) { console.error(`Gradle reported success but ${apk} does not exist.`); process.exit(1); }
console.log(`\nAPK: ${apk}\nSize: ${statSync(apk).size} bytes`);
if (variant === 'debug') console.log('NOTE: the debug APK does not embed the JS bundle; it needs Metro (pnpm --filter @nexuse/mobile start + adb reverse tcp:8081 tcp:8081).');
