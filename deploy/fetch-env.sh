#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/psycho.box}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
PARAM_PREFIX="${PARAM_PREFIX:-/psycho/prod/box}"

mkdir -p "$APP_DIR"

get_param() {
  local name="$1"
  aws ssm get-parameter \
    --region "$AWS_REGION" \
    --name "$PARAM_PREFIX/$name" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text
}

BACKEND_API_URL="$(get_param backend-api-url)"
BACKEND_REFRESH_COOKIE_NAME="$(get_param backend-refresh-cookie-name)"
NODE_ENV_VALUE="$(get_param node-env 2>/dev/null || printf '%s' 'production')"
PORT_VALUE="$(get_param port 2>/dev/null || printf '%s' '3000')"

cat > "$ENV_FILE" <<EOF
NODE_ENV=$NODE_ENV_VALUE
PORT=$PORT_VALUE
BACKEND_API_URL=$BACKEND_API_URL
BACKEND_REFRESH_COOKIE_NAME=$BACKEND_REFRESH_COOKIE_NAME
EOF

chmod 600 "$ENV_FILE"
