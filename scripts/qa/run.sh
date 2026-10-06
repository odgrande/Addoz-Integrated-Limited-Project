#!/usr/bin/env bash
# QA only: full end-to-end run on a throwaway local PGlite database (never the live one).
# Usage: bash scripts/qa/run.sh   (from the project root; takes ~10 minutes)
set -u
cd "$(dirname "$0")/../.."
export PGLITE_DIR="$PWD/.qa/db"
QA_ENV=(DATABASE_URL="postgres://qa:qa@127.0.0.1:9/never" BETTER_AUTH_URL="http://localhost:3200" NEXT_PUBLIC_APP_URL="http://localhost:3200" BREVO_API_KEY="" EMAIL_FROM="")

stop() { for pid in $(netstat -ano | grep ":3200 " | grep LISTENING | awk '{print $5}' | sort -u); do taskkill //PID "$pid" //T //F >/dev/null 2>&1; done; sleep 3; }
wait_up() { for _ in $(seq 1 120); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3200/auth/login)" = 200 ] && return 0; sleep 2; done; echo "server did not start"; exit 1; }
serve() { env "${QA_ENV[@]}" PGLITE_DIR="$PGLITE_DIR" npx next "$1" -p 3200 > .qa/server-$1.log 2>&1 & wait_up; }

stop
rm -rf .qa/db .qa/state.json .next && mkdir -p .qa
echo "== schema + reference data"
echo y | npx drizzle-kit push --config scripts/qa/drizzle.pglite.config.ts --force 2>&1 | grep -E "Changes applied|rror"
npx tsx scripts/qa/seed.ts
echo "== production build"
env "${QA_ENV[@]}" PGLITE_DIR="memory://" npx next build > .qa/build.log 2>&1
grep -qE "Compiled successfully" .qa/build.log && [ -f .next/prerender-manifest.json ] || { echo "BUILD FAILED"; tail -30 .qa/build.log; exit 1; }
echo "build ok"
echo "== register (dev server prints the emailed codes)"
serve dev; QA_LOG=.qa/server-dev.log node scripts/qa/e2e.mjs register | grep -E "FAIL|passed, "; stop
node scripts/qa/db-tool.mjs promote qa.admin@addoz.test
echo "== main flows (production build)"
serve start; node scripts/qa/e2e.mjs main | grep -E "FAIL|passed, "; stop
node scripts/qa/db-tool.mjs expire "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(".qa/state.json","utf8")).jobId)')"
echo "== expiry + reinstate"
serve start; node scripts/qa/e2e.mjs expiry | grep -E "FAIL|passed, "
echo "== server errors logged: $(grep -ciE '\berror\b' .qa/server-start.log)"
echo "(server left running on http://localhost:3200 for visual checks)"
