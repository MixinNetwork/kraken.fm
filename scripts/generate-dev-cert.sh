#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/.devcert"
KEY_PATH="$CERT_DIR/localhost-key.pem"
CERT_PATH="$CERT_DIR/localhost-cert.pem"
CONFIG_PATH="$CERT_DIR/openssl.cnf"

mkdir -p "$CERT_DIR"

HOSTNAME_VALUE="$(hostname)"
SAN_LINES=(
  "DNS.1 = localhost"
  "DNS.2 = ${HOSTNAME_VALUE}"
  "IP.1 = 127.0.0.1"
)

INDEX=2
for ADDRESS in $(hostname -I 2>/dev/null || true); do
  if [[ "$ADDRESS" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    SAN_LINES+=("IP.${INDEX} = ${ADDRESS}")
    INDEX=$((INDEX + 1))
  fi
done

{
  printf '%s\n' '[req]'
  printf '%s\n' 'default_bits = 2048'
  printf '%s\n' 'prompt = no'
  printf '%s\n' 'default_md = sha256'
  printf '%s\n' 'x509_extensions = req_ext'
  printf '%s\n' 'distinguished_name = dn'
  printf '\n'
  printf '%s\n' '[dn]'
  printf '%s\n' 'CN = localhost'
  printf '\n'
  printf '%s\n' '[req_ext]'
  printf '%s\n' 'subjectAltName = @alt_names'
  printf '\n'
  printf '%s\n' '[alt_names]'
  printf '%s\n' "${SAN_LINES[@]}"
} > "$CONFIG_PATH"

openssl req \
  -x509 \
  -newkey rsa:2048 \
  -nodes \
  -keyout "$KEY_PATH" \
  -out "$CERT_PATH" \
  -days 365 \
  -config "$CONFIG_PATH"

echo "Wrote $KEY_PATH"
echo "Wrote $CERT_PATH"
