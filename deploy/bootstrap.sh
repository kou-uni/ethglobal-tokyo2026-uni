#!/usr/bin/env bash
#
# Yohaku — provision an Oracle Always Free ARM VM to run the demo server.
#
#   sudo DOMAIN=yohaku.mintan.org bash bootstrap.sh
#
# Idempotent: re-run it after a repo update or a config change.
#
# Why a VM and not a serverless host: src/server/state.ts journals completed requests
# before money can move, and src/server/attention.ts refuses to surface invitations it
# could not persist first. Both require a writable disk and exactly one writer.
#
set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN, e.g. DOMAIN=yohaku.mintan.org}"
REF="${REF:-origin/main}"
REPO="${REPO:-https://github.com/kou-uni/ethglobal-tokyo2026-uni.git}"

APP_DIR=/opt/yohaku/app
STATE_DIR=/var/lib/yohaku
ENV_FILE=/etc/yohaku/env
PORT=8402

log() { printf '\n==> %s\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

log "swap, if this host is small"
# idkit-config.ts bundles three browser entry points with esbuild at every start. On the
# 1 GB E2.1.Micro that peak is the difference between booting and being OOM-killed.
TOTAL_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$TOTAL_MB" -lt 2048 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    added 2G swap (host has ${TOTAL_MB}MB RAM)"
else
  echo "    skipped (${TOTAL_MB}MB RAM, or swap already present)"
fi

log "base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

log "node 22"
# engines in package.json requires >=22; tsx and esbuild are runtime dependencies here.
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node --version

log "caddy (terminates TLS, reverse-proxies to 127.0.0.1:${PORT})"
if ! command -v caddy >/dev/null; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

log "service account and directories"
id -u yohaku >/dev/null 2>&1 || useradd --system --home-dir "$STATE_DIR" --shell /usr/sbin/nologin yohaku
install -d -o root  -g root   -m 0755 /opt/yohaku
install -d -o yohaku -g yohaku -m 0700 "$STATE_DIR"
install -d -o root  -g root   -m 0700 /etc/yohaku

log "repo at ${REF}"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" remote set-url origin "$REPO"
  git -C "$APP_DIR" fetch --prune origin
else
  git clone --no-checkout "$REPO" "$APP_DIR"
  git -C "$APP_DIR" fetch --prune origin
fi
git -C "$APP_DIR" checkout --detach "$REF"
git -C "$APP_DIR" --no-pager log --oneline -1

log "dependencies (--include=dev: tsx and esbuild are needed at runtime)"
cd "$APP_DIR"
npm ci --include=dev --no-audit --no-fund
# Code stays root-owned so the service account cannot rewrite what it runs.
chown -R root:root "$APP_DIR"
# tsx wants a cache next to the modules; give it the one directory it may write.
install -d -o yohaku -g yohaku -m 0755 "$APP_DIR/node_modules/.cache"

log "systemd unit"
cat > /etc/systemd/system/yohaku.service <<UNIT
[Unit]
Description=Yohaku — escalation router for the agent economy
Documentation=https://github.com/kou-uni/ethglobal-tokyo2026-uni
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=yohaku
Group=yohaku
WorkingDirectory=${APP_DIR}
# Values in this file win over any .env in the checkout — see src/core/env.ts:19.
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=production
Environment=HOME=${STATE_DIR}
ExecStart=${APP_DIR}/node_modules/.bin/tsx src/server/main.ts
Restart=always
RestartSec=3

# Exactly one writer. src/server/state.ts:6 — "Both files require a single writer."
# Do not add a second instance, a second host sharing AGENT_PRIVATE_KEY, or any scaling.
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=${STATE_DIR}

[Install]
WantedBy=multi-user.target
UNIT

log "caddy site"
cat > /etc/caddy/Caddyfile <<CADDY
${DOMAIN} {
	reverse_proxy 127.0.0.1:${PORT}
}
CADDY

log "firewall: Oracle images drop everything but 22 by default"
for p in 80 443; do
  iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 1 -p tcp --dport "$p" -j ACCEPT
done
if command -v netfilter-persistent >/dev/null; then
  netfilter-persistent save
else
  apt-get install -y -qq iptables-persistent && netfilter-persistent save
fi

log "start"
systemctl daemon-reload
systemctl enable --now caddy
systemctl restart caddy
if [ -s "$ENV_FILE" ]; then
  systemctl enable --now yohaku
  systemctl restart yohaku
  sleep 4
  systemctl --no-pager --lines=20 status yohaku || true
else
  systemctl enable yohaku
  echo
  echo "  ${ENV_FILE} is empty — not starting yohaku yet."
  echo "  Run push-env.sh from the workstation, then: sudo systemctl start yohaku"
fi

echo
echo "  provisioned. next:"
echo "    curl -s https://${DOMAIN}/health | jq"
