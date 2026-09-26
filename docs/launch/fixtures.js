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
    "arrived": 50,
    "auto": 28,
    "deny": 13,
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
    "scenario": "50 explanatory requests: 48 from seed 2 + two rule-9 requests with illustrative ask/drop choices; screening is mocked",
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
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-002",
        "agent": 1,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-003",
        "agent": 2,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-004",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "deny",
        "rule": 4,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "flagged"
      },
      {
        "id": "req-005",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-006",
        "agent": 2,
        "category": "wallet/your-address",
        "verdict": "deny",
        "rule": 2,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "flagged"
      },
      {
        "id": "req-007",
        "agent": 3,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-008",
        "agent": 3,
        "category": "wallet/your-address",
        "verdict": "deny",
        "rule": 2,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-009",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-010",
        "agent": 4,
        "category": "experience/first-five-minutes",
        "verdict": "deny",
        "rule": 4,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "flagged"
      },
      {
        "id": "req-011",
        "agent": 0,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-012",
        "agent": 1,
        "category": "contact/where-you-live",
        "verdict": "deny",
        "rule": 2,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-013",
        "agent": 1,
        "category": "experience/the-time-it-failed-you",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-014",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-015",
        "agent": 0,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-016",
        "agent": 1,
        "category": "experience/where-you-got-stuck",
        "verdict": "deny",
        "rule": 1,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-017",
        "agent": 1,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-018",
        "agent": 1,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-019",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-020",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-021",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-022",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-023",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-024",
        "agent": 0,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-025",
        "agent": 0,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-026",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-027",
        "agent": 5,
        "category": "experience/where-you-got-stuck",
        "verdict": "deny",
        "rule": 1,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-028",
        "agent": 1,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-029",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-030",
        "agent": 0,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-031",
        "agent": 0,
        "category": "experience/how-it-tasted",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-032",
        "agent": 3,
        "category": "experience/the-time-it-failed-you",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-033",
        "agent": 1,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-034",
        "agent": 3,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-035",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "deny",
        "rule": 4,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "flagged"
      },
      {
        "id": "req-036",
        "agent": 6,
        "category": "experience/why-you-put-it-back",
        "verdict": "human",
        "rule": 7,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-037",
        "agent": 0,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-038",
        "agent": 2,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-039",
        "agent": 0,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-040",
        "agent": 1,
        "category": "experience/why-you-stopped",
        "verdict": "human",
        "rule": 5,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-041",
        "agent": 2,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-042",
        "agent": 5,
        "category": "experience/how-it-tasted",
        "verdict": "human",
        "rule": 7,
        "initialVerdict": "human",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-043",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-044",
        "agent": 4,
        "category": "experience/why-you-put-it-back",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-045",
        "agent": 2,
        "category": "judgement/what-youd-warn-a-friend-about",
        "verdict": "deny",
        "rule": 3,
        "initialVerdict": "deny",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-046",
        "agent": 3,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-047",
        "agent": 1,
        "category": "experience/first-five-minutes",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "req-048",
        "agent": 0,
        "category": "experience/what-you-expected",
        "verdict": "auto",
        "rule": 8,
        "initialVerdict": "auto",
        "modelChoice": null,
        "screening": "clean"
      },
      {
        "id": "launch-unknown-ask",
        "agent": 2,
        "category": "experience/a-new-question",
        "verdict": "human",
        "rule": 9,
        "initialVerdict": "human",
        "modelChoice": "ask",
        "screening": "clean"
      },
      {
        "id": "launch-unknown-drop",
        "agent": 2,
        "category": "experience/a-new-question",
        "verdict": "deny",
        "rule": 9,
        "initialVerdict": "human",
        "modelChoice": "drop",
        "screening": "clean"
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
        "category": "experience/a-new-question",
        "ids": [
          "launch-unknown-ask"
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
          "experience/a-new-question",
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
          "experience/a-new-question",
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
          "experience/a-new-question",
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
          "experience/a-new-question"
        ],
        "deferred": [
          "experience/how-it-tasted",
          "experience/why-you-put-it-back"
        ],
        "expired": []
      },
      {
        "cap": 4,
        "surfaced": [
          "experience/why-you-stopped",
          "experience/the-time-it-failed-you",
          "experience/a-new-question",
          "experience/how-it-tasted"
        ],
        "deferred": [
          "experience/why-you-put-it-back"
        ],
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
  },
  "criteria": {
    "threshold": 1000,
    "dailyCap": 2,
    "notificationHour": 7,
    "examples": [
      {
        "id": "routine",
        "input": {
          "id": "routine",
          "amount": 120,
          "category": "allowed",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-routine",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "auto",
          "rule": 8,
          "reason": "within the standing grant for \"experience/why-you-put-it-back\""
        },
        "decision": {
          "verdict": "auto",
          "rule": 8,
          "reason": "within the standing grant for \"experience/why-you-put-it-back\""
        },
        "modelChoice": null
      },
      {
        "id": "limit",
        "input": {
          "id": "limit",
          "amount": 1000,
          "category": "allowed",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-limit",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 1000,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "auto",
          "rule": 8,
          "reason": "within the standing grant for \"experience/why-you-put-it-back\""
        },
        "decision": {
          "verdict": "auto",
          "rule": 8,
          "reason": "within the standing grant for \"experience/why-you-put-it-back\""
        },
        "modelChoice": null
      },
      {
        "id": "over",
        "input": {
          "id": "over",
          "amount": 1001,
          "category": "allowed",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-over",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 1001,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "human",
          "rule": 6,
          "reason": "1001 JPYC is above the threshold"
        },
        "decision": {
          "verdict": "human",
          "rule": 6,
          "reason": "1001 JPYC is above the threshold"
        },
        "modelChoice": null
      },
      {
        "id": "stranger",
        "input": {
          "id": "stranger",
          "amount": 120,
          "category": "allowed",
          "party": "new",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-stranger",
          "who": "first-contact.newco.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "human",
          "rule": 7,
          "reason": "first request from first-contact.newco.eth"
        },
        "decision": {
          "verdict": "human",
          "rule": 7,
          "reason": "first request from first-contact.newco.eth"
        },
        "modelChoice": null
      },
      {
        "id": "sensitive",
        "input": {
          "id": "sensitive",
          "amount": 120,
          "category": "sensitive",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-sensitive",
          "who": "market-research.acme.eth",
          "what": "experience/the-time-it-failed-you",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "human",
          "rule": 5,
          "reason": "\"experience/the-time-it-failed-you\" is a sensitive domain"
        },
        "decision": {
          "verdict": "human",
          "rule": 5,
          "reason": "\"experience/the-time-it-failed-you\" is a sensitive domain"
        },
        "modelChoice": null
      },
      {
        "id": "forbidden",
        "input": {
          "id": "forbidden",
          "amount": 120,
          "category": "forbidden",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-forbidden",
          "who": "market-research.acme.eth",
          "what": "contact/where-you-live",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 2,
          "reason": "\"contact/where-you-live\" is never offered"
        },
        "decision": {
          "verdict": "deny",
          "rule": 2,
          "reason": "\"contact/where-you-live\" is never offered"
        },
        "modelChoice": null
      },
      {
        "id": "risk",
        "input": {
          "id": "risk",
          "amount": 120,
          "category": "allowed",
          "party": "known",
          "risk": "flagged",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-risk",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 4,
          "reason": "the payment source failed screening"
        },
        "decision": {
          "verdict": "deny",
          "rule": 4,
          "reason": "the payment source failed screening"
        },
        "modelChoice": null
      },
      {
        "id": "unavailable",
        "input": {
          "id": "unavailable",
          "amount": 120,
          "category": "allowed",
          "party": "known",
          "risk": "unavailable",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-unavailable",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 4,
          "reason": "screening was unavailable — we do not settle unchecked"
        },
        "decision": {
          "verdict": "deny",
          "rule": 4,
          "reason": "screening was unavailable — we do not settle unchecked"
        },
        "modelChoice": null
      },
      {
        "id": "revoked",
        "input": {
          "id": "revoked",
          "amount": 120,
          "category": "allowed",
          "party": "known",
          "risk": "clean",
          "grant": "revoked"
        },
        "request": {
          "id": "criteria-revoked",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 1,
          "reason": "the grant for \"experience/why-you-put-it-back\" was revoked"
        },
        "decision": {
          "verdict": "deny",
          "rule": 1,
          "reason": "the grant for \"experience/why-you-put-it-back\" was revoked"
        },
        "modelChoice": null
      },
      {
        "id": "expired",
        "input": {
          "id": "expired",
          "amount": 120,
          "category": "allowed",
          "party": "known",
          "risk": "clean",
          "grant": "expired"
        },
        "request": {
          "id": "criteria-expired",
          "who": "market-research.acme.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 3,
          "reason": "the grant for \"experience/why-you-put-it-back\" expired on 2025-01-01T00:00:00Z"
        },
        "decision": {
          "verdict": "deny",
          "rule": 3,
          "reason": "the grant for \"experience/why-you-put-it-back\" expired on 2025-01-01T00:00:00Z"
        },
        "modelChoice": null
      },
      {
        "id": "ask",
        "input": {
          "id": "ask",
          "amount": 120,
          "category": "unknown",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-ask",
          "who": "market-research.acme.eth",
          "what": "experience/a-new-question",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "human",
          "rule": 9,
          "reason": "no rule matched — the unknown goes to a person, never to auto"
        },
        "decision": {
          "verdict": "human",
          "rule": 9,
          "reason": "unrecognised — Illustrative model choice; no model was called"
        },
        "modelChoice": "ask"
      },
      {
        "id": "drop",
        "input": {
          "id": "drop",
          "amount": 120,
          "category": "unknown",
          "party": "known",
          "risk": "clean",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-drop",
          "who": "market-research.acme.eth",
          "what": "experience/a-new-question",
          "purpose": "market-research",
          "price": {
            "amount": 120,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "human",
          "rule": 9,
          "reason": "no rule matched — the unknown goes to a person, never to auto"
        },
        "decision": {
          "verdict": "deny",
          "rule": 9,
          "reason": "unrecognised and not worth asking: Illustrative model choice; no model was called"
        },
        "modelChoice": "drop"
      },
      {
        "id": "combined",
        "input": {
          "id": "combined",
          "amount": 1001,
          "category": "allowed",
          "party": "new",
          "risk": "flagged",
          "grant": "valid"
        },
        "request": {
          "id": "criteria-combined",
          "who": "first-contact.newco.eth",
          "what": "experience/why-you-put-it-back",
          "purpose": "market-research",
          "price": {
            "amount": 1001,
            "currency": "JPYC"
          },
          "deadline": "2026-09-26T12:00:00+09:00"
        },
        "initial": {
          "verdict": "deny",
          "rule": 4,
          "reason": "the payment source failed screening"
        },
        "decision": {
          "verdict": "deny",
          "rule": 4,
          "reason": "the payment source failed screening"
        },
        "modelChoice": null
      }
    ]
  }
};
