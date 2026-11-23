#!/bin/bash
# Double-click to run Checko client version 2 at http://localhost:3001
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH"
echo "Installing packages (first run takes a minute)…"
npm install --no-audit --no-fund || { echo "npm install failed"; read -p "Press Enter to close"; exit 1; }
rm -rf .next
( sleep 6; open "http://localhost:3001/?intro" ) &
echo "Starting Checko v2 at http://localhost:3001  (press Ctrl+C to stop)"
npm run dev
