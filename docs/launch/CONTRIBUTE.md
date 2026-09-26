# Build the agent-customer future with us / 一緒につくる

Yohaku is MIT-licensed. The customer is an agent; the person sets the boundaries.
YohakuはMITライセンス。エージェントが顧客になっても、人が守りたい境界を残すOSSです。

## Choose a first contribution / 最初の貢献

| Work / 貢献 | A useful result / 目指す成果 |
| --- | --- |
| Connect an agent / エージェントを接続 | A reproducible request with who, what, purpose, price and deadline. Handle auto, human and deny. Start with local fixtures. |
| Protect a boundary / 境界を試す | A regression test showing a revoked grant, provider timeout or missed deadline cannot silently become permission. |
| Bind payment screening / 支払い審査を結びつける | Establish the authenticated payer-to-screening-target relationship; reject mismatches. Coordinate with maintainers before altering the live payment path. |
| Build an adapter / 接続先を増やす | Implement a port with failure behavior and tests, without giving the model a grant option. |
| Explore a NEO handoff / NEO連携を具体化 | Review the non-executable sample record with Curvegrid. Agree on fields and trust model before treating it as an API. |
| Test the human experience / 人の体験を検証 | Feedback about when to ask, what must never be shared, and an acceptable daily cap. No private respondent data is needed in a public Issue. |

## Start locally

Read the repository's `AGENTS.md`, install dependencies and run `npm run check`. Open
`docs/launch.html` to inspect the replay. Rebuild its data with
`node --import tsx docs/launch/build.ts`.

Discuss the change in the repository and submit a focused PR with what changed and how it was
verified. Do not add unverified performance, revenue or identity guarantees to the copy.

Repository: https://github.com/kou-uni/ethglobal-tokyo2026-uni
