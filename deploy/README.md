# Running yohaku on a host

These three scripts stand up `https://yohaku.texx.io` and keep it reproducible. They hold no
secrets: `push-env.sh` reads the repo-root `.env`, which is gitignored and stays on the
workstation.

```
bootstrap.sh    provision a fresh VM: Node 22, Caddy, systemd, firewall, clone, npm ci
push-env.sh     compose /etc/yohaku/env from the workstation .env and restart
verify.sh       compare the host's /health against another deployment
```

## Why a VM and not a serverless host

Not a preference — three places in the code require a writable disk and exactly one writer.

- `src/server/state.ts:91-97` journals a completed response before money can move, so a retry
  after a restart cannot settle twice.
- `src/server/attention.ts:43-50` commits the day's invitations before exposing them. On a
  read-only filesystem this yields **zero** invitations, not degraded ones — the human
  approval path simply never starts.
- `src/server/state.ts:6` — "Both files require a single writer."

Vercel, Cloud Run, and the free tiers of Render and Koyeb each break at least one of these.

## First run

```sh
scp deploy/bootstrap.sh ubuntu@<ip>:/tmp/
ssh ubuntu@<ip> 'sudo DOMAIN=yohaku.texx.io bash /tmp/bootstrap.sh'
DOMAIN=yohaku.texx.io HOST=ubuntu@<ip> bash deploy/push-env.sh
DOMAIN=yohaku.texx.io bash deploy/verify.sh
```

`bootstrap.sh` is idempotent — re-run it to pick up a new commit. It adds 2 GB of swap on a
host under 2 GB of RAM, because `idkit-config.ts` bundles three browser entry points with
esbuild on every start and that peak will OOM a 1 GB box.

DNS must resolve to the host **unproxied** before Caddy can pass the ACME challenge. On
Cloudflare that means the grey cloud; an orange-cloud record answers from Cloudflare's
addresses and the challenge never arrives.

## Updating secrets

`push-env.sh` **replaces** `/etc/yohaku/env`. Anything added by hand on the host is lost on
the next run, so new values go in the workstation `.env` and get pushed from there.

```sh
DRY_RUN=1 DOMAIN=yohaku.texx.io bash deploy/push-env.sh   # prints the file, values masked
```

## Two hosts at once

Safe only while this host has no `AGENT_PRIVATE_KEY`: without a signing key it cannot settle,
so it cannot race the other deployment. `docs/build/HOSTING-MIGRATION.md:90` forbids two entry
points sharing one payment key — give each host its own buyer wallet instead.

Each host also keeps its own `attention.json`, and that file is what enforces the daily cap.
Two hosts for one owner spend two allowances. Set `YOHAKU_DAILY_CAP=0` on any host that must
not reach the owner.

## Current deployment

| | |
| --- | --- |
| URL | `https://yohaku.texx.io` |
| Host | Oracle Cloud Always Free `VM.Standard.E2.1.Micro`, Tokyo |
| State | `/var/lib/yohaku/requests.json`, `/var/lib/yohaku/attention.json` |
| Secrets | `/etc/yohaku/env`, mode 0600, outside the checkout |
| Service | `systemctl status yohaku`, logs via `journalctl -u yohaku` |

The A1 ARM shape (2 OCPU / 12 GB) was the first choice and never became available — Tokyo has
a single availability domain and Always Free cannot leave the home region, so "Out of host
capacity" has nowhere to fall back to. Retry it later if a bigger box is wanted.
