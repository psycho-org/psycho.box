#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/psycho.box}"

cd "$APP_DIR"

./deploy/fetch-env.sh
npm ci
npm run build
sudo systemctl daemon-reload
sudo systemctl restart psycho-box
sudo systemctl status psycho-box --no-pager

