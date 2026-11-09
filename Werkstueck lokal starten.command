#!/bin/zsh
cd -- "${0:A:h}"
NODE_BIN=$(command -v node)
if [[ -z "$NODE_BIN" && -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
 NODE_BIN="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ -z "$NODE_BIN" ]]; then
 print 'Bitte Node.js 22 oder neuer von https://nodejs.org installieren und erneut öffnen.'
 read '?Mit Enter schließen.'
 exit 1
fi
"$NODE_BIN" scripts/build.mjs || exit 1
export WERKSTUECK_OPEN_BROWSER=1
"$NODE_BIN" server/local.mjs
read '?Mit Enter schließen.'
