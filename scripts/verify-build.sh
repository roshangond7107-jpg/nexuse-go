#!/usr/bin/env bash
# NEXUSE GO — build verification with honest result classes.
#
#   PASSED          command ran and exited 0
#   FAILED          command ran, exited non-zero, and the output does NOT look like an environment problem  => a PROJECT problem
#   NOT EXECUTABLE  the environment cannot run it (no network / missing tool) — says nothing about project quality
#   BLOCKED         a prerequisite step did not PASS, so this step was not attempted
#   SKIPPED         explicitly skipped by the operator (SKIP_ANDROID_APK=1)
#
# Exit code: 1 = at least one FAILED · 2 = nothing failed but verification is INCOMPLETE · 0 = everything required PASSED.
# Never edits source files. Usage:
#   bash scripts/verify-build.sh                  # real run -> docs/BUILD-VERIFICATION.generated.{md,json}
#   OUT=/tmp/r.md bash scripts/verify-build.sh    # custom report path (json next to it)
#   bash scripts/verify-build.sh --self-test      # tests the classifier itself (no network, no project commands)
# Which steps need network / GitHub / extra tools: docs/BUILD-VERIFICATION.md §2.
set -uo pipefail
cd "$(dirname "$0")/.."
MODE=real; [ "${1:-}" = "--self-test" ] && MODE=selftest
OUT="${OUT:-docs/BUILD-VERIFICATION.generated.md}"; JSON="${OUT%.md}.json"
[ "$MODE" = selftest ] && OUT="$(mktemp -d)/selftest.md" && JSON="${OUT%.md}.json"
TMP="$(mktemp -d)"; ORDER=(); declare -A NAME RES WHY NEEDS CMD LOGF; N=0
# Environment-problem signatures. (Deliberately NOT "Corepack is about to download": that is printed on success too.)
NETRE='ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|Could not resolve host|Temporary failure in name resolution|fetch failed|ERR_PNPM_META_FETCH_FAIL|ERR_PNPM_FETCH_|Network request failed|npm error network|unable to access .https|TLS|certificate'

# ---------- capability preflight ----------
declare -A CAP CAPWHY
cap() { CAP[$1]=$2; CAPWHY[$1]=$3; }
preflight() {
  local v; v="$(node -v 2>/dev/null | sed 's/^v//')"
  if [ -n "$v" ] && [ "$(printf '%s\n20.11.0\n' "$v" | sort -V | head -1)" = "20.11.0" ]; then cap node yes "node v$v"; else cap node no "need Node >= 20.11 (found: ${v:-none})"; fi
  local code; code="$(curl -sS -m 10 -o /dev/null -w '%{http_code}' https://registry.npmjs.org/zod 2>/dev/null || true)"
  if [ "$code" = 200 ]; then cap net yes "npm registry reachable (HTTP 200)"; else cap net no "npm registry unreachable (HTTP ${code:-000}); install, Expo and Next steps need it"; fi
  if command -v pnpm >/dev/null 2>&1 && pnpm -v >/dev/null 2>&1; then cap pnpm yes "pnpm $(pnpm -v 2>/dev/null)"; else cap pnpm no "pnpm not usable (corepack must download pnpm@9.15.0 from the registry)"; fi
  if command -v java >/dev/null 2>&1 && [ -n "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]; then cap android yes "java + Android SDK present"; else cap android no "JDK 17 and/or ANDROID_HOME missing"; fi
  local pgbin="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
  if [ -n "$pgbin" ] && [ -x "$pgbin/initdb" ]; then PGBIN="$pgbin"; cap postgres yes "PostgreSQL binaries at $pgbin"; else cap postgres no "PostgreSQL server binaries not found"; fi
}

# ---------- engine ----------
# step ID "Name" "needs(comma list of caps)" "deps(comma list of step IDs)" "command"
step() {
  local id="$1" name="$2" needs="$3" deps="$4" cmd="$5"; N=$((N+1)); ORDER+=("$id"); NAME[$id]="$name"; NEEDS[$id]="${needs:--}"; CMD[$id]="$cmd"
  local log="$TMP/$id.log"; LOGF[$id]="$log"; : > "$log"
  if [ -n "${SKIP:-}" ] && [[ ",$SKIP," == *",$id,"* ]]; then RES[$id]=SKIPPED; WHY[$id]="skipped by operator (SKIP=$SKIP)"; return; fi
  local c; for c in ${needs//,/ }; do
    if [ "${CAP[$c]:-no}" != yes ]; then RES[$id]="NOT EXECUTABLE"; WHY[$id]="needs '$c': ${CAPWHY[$c]:-unknown}"; echo ">>> $name: NOT EXECUTABLE (${WHY[$id]})"; return; fi
  done
  local d; for d in ${deps//,/ }; do
    if [ "${RES[$d]:-}" != PASSED ]; then RES[$id]=BLOCKED; WHY[$id]="prerequisite '$d' is ${RES[$d]:-not run}"; echo ">>> $name: BLOCKED (${WHY[$id]})"; return; fi
  done
  echo ">>> $name"; timeout "${STEP_TIMEOUT:-1500}" bash -c "$cmd" >"$log" 2>&1; local rc=$?
  if [ $rc -eq 0 ]; then RES[$id]=PASSED; WHY[$id]="exit 0"
  elif [ $rc -eq 124 ]; then RES[$id]=FAILED; WHY[$id]="timed out after ${STEP_TIMEOUT:-1500}s"
  elif grep -Eq "$NETRE" "$log"; then RES[$id]="NOT EXECUTABLE"; WHY[$id]="exit $rc with network-error signature: $(grep -Em1 "$NETRE" "$log" | cut -c1-140)"
  else RES[$id]=FAILED; WHY[$id]="exit $rc (project problem — see output tail)"; fi
  echo "    -> ${RES[$id]}"
}

real_steps() {
  step tools    "Tool versions"                         ""            ""                'node -v; (pnpm -v || true); (java -version 2>&1 | head -1 || true); echo ANDROID_HOME=${ANDROID_HOME:-unset}'
  step secrets  "Secrets scan"                          ""            ""                'bash scripts/check-secrets.sh'
  step db       "Database migrations + RLS suite"       "postgres"    ""                'if [ "$(id -u)" -eq 0 ]; then su postgres -s /bin/bash -c "PGBIN='"$PGBIN"' bash '"$PWD"'/supabase/tests/run.sh"; else PGBIN='"$PGBIN"' bash supabase/tests/run.sh; fi; r=$?; true; exit $r'
  step install  "Generate lockfile (pnpm install)"      "net,pnpm"    ""                'pnpm install --no-frozen-lockfile'
  step frozen   "Reproducible install (--frozen-lockfile)" "net,pnpm" "install"         'test -f pnpm-lock.yaml && pnpm install --frozen-lockfile'
  step seed     "Seed is current"                       ""            "install"         'pnpm check:seed'
  step test     "Unit tests (real vitest)"              ""            "install"         'pnpm test'
  step typecheck "TypeScript checks (all workspaces)"   ""            "install"         'pnpm typecheck'
  step build    "Next.js production build"              "net"         "install"         'pnpm --filter @nexuse/web build'
  step expocheck "Expo dependency validation"           "net"         "install"         'cd apps/mobile && pnpm exec expo install --check'
  step doctor   "Expo doctor"                           "net"         "install"         'cd apps/mobile && npx --yes expo-doctor'
  step bundle   "Android JS bundle (expo export)"       "net"         "install"         'cd apps/mobile && pnpm exec expo export --platform android --output-dir "$(mktemp -d)"'
  step apk      "Android debug APK (prebuild + gradle)" "net,android" "install"         'cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean && cd android && ./gradlew assembleDebug'
}
selftest_steps() { # synthetic commands only: proves each result class is produced correctly
  step st_pass   "synthetic: passes"                 ""          ""        'echo ok'
  step st_fail   "synthetic: genuine project failure" ""         ""        'echo "TypeError: x is not a function" ; exit 1'
  step st_net    "synthetic: network error at runtime" ""        ""        'echo "Error: getaddrinfo ENOTFOUND registry.npmjs.org"; exit 1'
  step st_cap    "synthetic: missing capability"     "nonexistent" ""      'echo should-not-run'
  step st_block  "synthetic: dependent of failure"   ""          "st_fail" 'echo should-not-run'
  step st_block2 "synthetic: dependent of passed"    ""          "st_pass" 'echo ok'
  step st_to     "synthetic: timeout"                ""          ""        'sleep 5'
  step st_skip   "synthetic: operator skip"          ""          ""        'echo should-not-run'
}

preflight
if [ "$MODE" = selftest ]; then CAP[nonexistent]=no; CAPWHY[nonexistent]="synthetic"; STEP_TIMEOUT=1 SKIP=st_skip selftest_steps; else real_steps; fi

# ---------- report ----------
cnt() { local k=0 i; for i in "${ORDER[@]}"; do [ "${RES[$i]}" = "$1" ] && k=$((k+1)); done; echo $k; }
P=$(cnt PASSED); F=$(cnt FAILED); X=$(cnt "NOT EXECUTABLE"); B=$(cnt BLOCKED); S=$(cnt SKIPPED)
if [ "$F" -gt 0 ]; then VERDICT="FAILED"; EXIT=1; elif [ $((X+B+S)) -gt 0 ]; then VERDICT="INCOMPLETE"; EXIT=2; else VERDICT="VERIFIED"; EXIT=0; fi
{
  echo "# BUILD VERIFICATION (generated)"; echo
  echo "Generated by \`scripts/verify-build.sh\` on $(date -u +%Y-%m-%dT%H:%M:%SZ), host $(uname -srm). Raw results; nothing hand-edited."
  echo; echo "## Verdict: **$VERDICT** — $P passed · $F failed · $X not executable · $B blocked · $S skipped"
  echo; echo "- **FAILED** = a real project problem. **NOT EXECUTABLE / BLOCKED** = the environment could not run it; this says nothing about project quality and must be re-run where it can execute."
  echo; echo "## Environment capabilities"; echo "| Capability | Available | Detail |"; echo "|---|---|---|"
  for c in node net pnpm android postgres; do echo "| $c | ${CAP[$c]:-?} | ${CAPWHY[$c]:-} |"; done
  echo; echo "## Steps"; echo "| # | Step | Result | Why | Needs |"; echo "|---|---|---|---|---|"
  k=0; for i in "${ORDER[@]}"; do k=$((k+1)); echo "| $k | ${NAME[$i]} | **${RES[$i]}** | ${WHY[$i]//|/\\|} | ${NEEDS[$i]} |"; done
  echo; echo "## Output tails (executed steps only)"
  for i in "${ORDER[@]}"; do case "${RES[$i]}" in PASSED|FAILED|"NOT EXECUTABLE") if [ -s "${LOGF[$i]}" ]; then printf '\n### %s — %s\n```\n' "${NAME[$i]}" "${RES[$i]}"; tail -n 30 "${LOGF[$i]}"; printf '```\n'; fi;; esac; done
} > "$OUT"
{ printf '{"verdict":"%s","passed":%s,"failed":%s,"not_executable":%s,"blocked":%s,"skipped":%s,"steps":[' "$VERDICT" "$P" "$F" "$X" "$B" "$S"
  sep=""; for i in "${ORDER[@]}"; do printf '%s{"id":"%s","result":"%s"}' "$sep" "$i" "${RES[$i]}"; sep=","; done; printf ']}\n'; } > "$JSON"

if [ "$MODE" = selftest ]; then
  ok=1; chk() { [ "${RES[$1]}" = "$2" ] || { echo "SELF-TEST FAIL: $1 expected $2 got ${RES[$1]}"; ok=0; }; }
  chk st_pass PASSED; chk st_fail FAILED; chk st_net "NOT EXECUTABLE"; chk st_cap "NOT EXECUTABLE"; chk st_block BLOCKED; chk st_block2 PASSED; chk st_to FAILED; chk st_skip SKIPPED
  [ "$VERDICT" = FAILED ] || { echo "SELF-TEST FAIL: verdict should be FAILED"; ok=0; }
  [ $ok -eq 1 ] && { echo "SELF-TEST PASSED (classifier behaves as specified)"; rm -rf "$TMP"; exit 0; } || { rm -rf "$TMP"; exit 1; }
fi
rm -rf "$TMP"; echo; echo "Verdict: $VERDICT ($P passed, $F failed, $X not executable, $B blocked, $S skipped). Report: $OUT"
exit $EXIT
