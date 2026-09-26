window.YOHAKU_REPLAY = {
  "generatedFrom": "src/core/rules.ts + queue.ts + night.ts",
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
  }
};
