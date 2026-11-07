#!/usr/bin/env bash
# Runs migrations + seed + RLS tests against a THROWAWAY local Postgres (needs postgres 14+ binaries; run as non-root or via su postgres).
# Usage: supabase/tests/run.sh   (set PGBIN if binaries are not on PATH)
set -euo pipefail
PGBIN="${PGBIN:-$(dirname "$(command -v postgres || echo /usr/lib/postgresql/16/bin/postgres)")}"
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
DIR="$(mktemp -d)"; PORT="${PGPORT:-54329}"
trap '"$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
"$PGBIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
"$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
P=("$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${P[@]}" -c "create database nexuse" && P+=(-d nexuse)
for f in "$HERE/00_supabase_shim.sql" "$ROOT"/supabase/migrations/*.sql "$ROOT/supabase/seed.sql"; do echo "applying $(basename "$f")"; "${P[@]}" -f "$f" >/dev/null; done
echo "re-running seed (idempotency)"; "${P[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null
"${P[@]}" -t -f "$HERE/rls_tests.sql"
