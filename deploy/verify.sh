#!/usr/bin/env bash
#
# Compare the new host against the Mac Studio it is meant to replace.
#
#   DOMAIN=yohaku.mintan.org bash verify.sh
#
# Reports the difference rather than a pass/fail, because some rows are expected to
# differ until Kou's settlement and classifier secrets are in place.
#
set -uo pipefail

DOMAIN="${DOMAIN:?set DOMAIN}"
STUDIO="${STUDIO:-https://mac-studio.taila649e1.ts.net}"
NEW="https://${DOMAIN}"

# A workstation that saw NXDOMAIN before the record existed keeps that negative answer
# cached for a while. Pin the address so this reports on the host, not on the local resolver.
IP="${IP:-}"
PIN=()
[ -n "$IP" ] && PIN=(--resolve "${DOMAIN}:443:${IP}" --resolve "${DOMAIN}:80:${IP}")

row() { # url jq-path
  curl -s --max-time 15 ${PIN[@]+"${PIN[@]}"} "$1/health" 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const h=JSON.parse(s); const p=process.argv[1].split(".");
        let v=h; for (const k of p) v=v?.[k];
        console.log(v===undefined?"—":String(v));
      } catch { console.log("unreachable"); }
    });' "$2"
}

printf '  %-24s %-34s %s\n' "" "studio" "$DOMAIN"
printf '  %-24s %-34s %s\n' "------------------------" "----------------------------------" "----------------------"
for k in ok owner dailyCap \
         wired.routing wired.classifier wired.identity wired.identityMode \
         wired.ownerApproval wired.koeRegistration wired.experience \
         wired.screening wired.settlement wired.delegationReader; do
  a=$(row "$STUDIO" "$k"); b=$(row "$NEW" "$k")
  mark=" "; [ "$a" != "$b" ] && mark="≠"
  printf '%s %-24s %-34s %s\n' "$mark" "$k" "$a" "$b"
done

echo
echo "pages:"
for p in / /experience; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 ${PIN[@]+"${PIN[@]}"} "${NEW}${p}")
  printf '  %-14s %s\n' "$p" "$code"
done

echo
echo "tls:"
curl -sI --max-time 15 ${PIN[@]+"${PIN[@]}"} "$NEW/health" | head -1
echo "  issuer: $(echo | openssl s_client -connect "${IP:-$DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
  | openssl x509 -noout -issuer 2>/dev/null | sed 's/^issuer=//')"
