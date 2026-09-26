window.YOHAKU_REPLAY = {
  "generatedFrom": "src/core/rules.ts + queue.ts + night.ts + src/ports/classifier.ts",
  "seed": 2,
  "simulation": true,
  "executable": false,
  "cases": {
    "auto": {
      "verdict": "auto",
      "rule": 8,
      "reason": "within the standing grant for \"experience/why-you-put-it-back\""
    },
    "human": {
      "verdict": "human",
      "rule": 7,
      "reason": "first request from first-contact.newco.eth"
    },
    "risk": {
      "verdict": "deny",
      "rule": 4,
      "reason": "the payment source failed screening — known_scammer — The address has a confirmed history of malicious activity, including scams, phishing, or other harmful behavior."
    },
    "silence": {
      "verdict": "deny",
      "rule": -1,
      "reason": "the deadline passed without an answer — silence is not consent"
    },
    "unknown": {
      "verdict": "deny",
      "rule": 4,
      "reason": "screening was unavailable — we do not settle unchecked"
    }
  },
  "night": {
    "arrived": 52,
    "auto": 32,
    "deny": 12,
    "caps": [
      {
        "cap": 0,
        "surfaced": 0
      },
      {
        "cap": 1,
        "surfaced": 1
      },
      {
        "cap": 2,
        "surfaced": 2
      },
      {
        "cap": 3,
        "surfaced": 3
      },
      {
        "cap": 4,
        "surfaced": 4
      }
    ]
  },
  "traffic": {
    "agents": [
      "retail-insight.dentsu-x.eth",
      "cafe-nearby.local.eth",
      "market-research.acme.eth",
      "trendwatch.shibuya.eth",
      "demand.nozomi-labs.eth",
      "unknown-buyer.eth",
      "first-contact.newco.eth"
    ],
    "items": [
      {
        "id": "req-001",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-002",
        "agent": 1,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3
      },
      {
        "id": "req-003",
        "agent": 2,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-004",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "deny",
        "rule": 4
      },
      {
        "id": "req-005",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-006",
        "agent": 2,
        "category": "wallet/your-address",
        "verdict": "deny",
        "rule": 2
      },
      {
        "id": "req-007",
        "agent": 3,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-008",
        "agent": 3,
        "category": "wallet/your-address",
        "verdict": "deny",
        "rule": 2
      },
      {
        "id": "req-009",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-010",
        "agent": 4,
        "category": "experience/first-five-minutes",
        "verdict": "deny",
        "rule": 4
      },
      {
        "id": "req-011",
        "agent": 0,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-012",
        "agent": 1,
        "category": "contact/where-you-live",
        "verdict": "deny",
        "rule": 2
      },
      {
        "id": "req-013",
        "agent": 1,
        "category": "experience/the-time-it-failed-you",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-014",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-015",
        "agent": 0,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3
      },
      {
        "id": "req-016",
        "agent": 1,
        "category": "experience/where-you-got-stuck",
        "verdict": "deny",
        "rule": 1
      },
      {
        "id": "req-017",
        "agent": 1,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-018",
        "agent": 1,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-019",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-020",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-021",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-022",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-023",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-024",
        "agent": 0,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-025",
        "agent": 0,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3
      },
      {
        "id": "req-026",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-027",
        "agent": 5,
        "category": "experience/where-you-got-stuck",
        "verdict": "deny",
        "rule": 1
      },
      {
        "id": "req-028",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-029",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-030",
        "agent": 0,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-031",
        "agent": 0,
        "category": "experience/how-it-tasted",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-032",
        "agent": 3,
        "category": "experience/the-time-it-failed-you",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-033",
        "agent": 1,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-034",
        "agent": 3,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-035",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "deny",
        "rule": 4
      },
      {
        "id": "req-036",
        "agent": 6,
        "category": "experience/why-you-put-it-back",
        "verdict": "human",
        "rule": 7
      },
      {
        "id": "req-037",
        "agent": 0,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-038",
        "agent": 2,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-039",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-040",
        "agent": 1,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5
      },
      {
        "id": "req-041",
        "agent": 2,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-042",
        "agent": 5,
        "category": "experience/how-it-tasted",
        "verdict": "human",
        "rule": 7
      },
      {
        "id": "req-043",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-044",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-045",
        "agent": 2,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3
      },
      {
        "id": "req-046",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-047",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-048",
        "agent": 0,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-049",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-050",
        "agent": 2,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-051",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8
      },
      {
        "id": "req-052",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8
      }
    ],
    "bundles": [
      {
        "category": "experience/why-you-stopped",
        "ids": [
          "req-011",
          "req-018",
          "req-024",
          "req-040"
        ]
      },
      {
        "category": "experience/the-time-it-failed-you",
        "ids": [
          "req-013",
          "req-032"
        ]
      },
      {
        "category": "experience/how-it-tasted",
        "ids": [
          "req-042"
        ]
      },
      {
        "category": "experience/why-you-put-it-back",
        "ids": [
          "req-036"
        ]
      }
    ],
    "caps": [
      {
        "cap": 0,
        "surfaced": [],
        "deferred": [
          "experience/why-you-stopped",
          "experience/the-time-it-failed-you",
          "experience/how-it-tasted",
          "experience/why-you-put-it-back"
        ],
        "expired": []
      },
      {
        "cap": 1,
        "surfaced": [
          "experience/why-you-stopped"
        ],
        "deferred": [
          "experience/the-time-it-failed-you",
          "experience/how-it-tasted",
          "experience/why-you-put-it-back"
        ],
        "expired": []
      },
      {
        "cap": 2,
        "surfaced": [
          "experience/why-you-stopped",
          "experience/the-time-it-failed-you"
        ],
        "deferred": [
          "experience/how-it-tasted",
          "experience/why-you-put-it-back"
        ],
        "expired": []
      },
      {
        "cap": 3,
        "surfaced": [
          "experience/why-you-stopped",
          "experience/the-time-it-failed-you",
          "experience/how-it-tasted"
        ],
        "deferred": [
          "experience/why-you-put-it-back"
        ],
        "expired": []
      },
      {
        "cap": 4,
        "surfaced": [
          "experience/why-you-stopped",
          "experience/the-time-it-failed-you",
          "experience/how-it-tasted",
          "experience/why-you-put-it-back"
        ],
        "deferred": [],
        "expired": []
      }
    ],
    "ai": {
      "initial": {
        "verdict": "human",
        "rule": 9,
        "reason": "no rule matched — the unknown goes to a person, never to auto"
      },
      "ask": {
        "verdict": "human",
        "rule": 9,
        "reason": "unrecognised — Illustrative model choice; no model was called"
      },
      "drop": {
        "verdict": "deny",
        "rule": 9,
        "reason": "unrecognised and not worth asking: Illustrative model choice; no model was called"
      }
    }
  }
};
