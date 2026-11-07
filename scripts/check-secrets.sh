#!/usr/bin/env bash
# Fails if service-role usage or JWT-like secrets appear in client code.
set -euo pipefail
fail=0
if grep -RIn --include='*.ts' --include='*.tsx' --include='*.js' -E 'SERVICE_ROLE' apps packages 2>/dev/null | grep -v '/node_modules/' ; then
  echo "ERROR: SERVICE_ROLE referenced in app/package code"; fail=1
fi
if grep -RInE 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.' apps packages supabase 2>/dev/null | grep -v '/node_modules/'; then
  echo "ERROR: JWT-like string committed"; fail=1
fi
exit $fail
