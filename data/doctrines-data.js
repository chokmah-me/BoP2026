window.DOCTRINES_DATA = [
  {
    id: "MAGA",
    name: "America First",
    power: "US",
    flag: "🇺🇸",
    tagline: "No bad deals. No foreign wars.",
    ideology: "The world owes America nothing. Alliances are liabilities unless they pay. Every crisis is a negotiation opportunity.",
    difficulty: "Medium",
    profile: {
      riskTolerance: 0.65,
      patience: 0.25,
      priorityDomains: ["economic", "military", "diplomatic"],
      t_rat: 180
    },
    winCondition: {
      id: "bilateral_surplus",
      description: "Reach turn 20 with US domestic ≥ 65 and 2+ bilateral deals struck — without entering a multilateral forum."
    },
    advisorVoice: "transactional",
    advisorTagline: "AMERICA FIRST ADVISORY SYSTEM",
    advisorLines: [
      "What's in it for us?",
      "Allies free-ride. Make them pay.",
      "This isn't our war. Yet.",
      "Every crisis is leverage — use it.",
      "We don't do coalitions. We do deals."
    ],
    openingBriefing: "You don't do coalitions. You do deals. Every crisis is leverage.",
    doctrineFailCondition: "You entered a multilateral institution. The base has abandoned you.",
    doctrineWinMessage: "You played it straight: bilateral deals, no entanglements, and the base held. History called it isolationism. You called it winning."
  },
  {
    id: "TWELVER",
    name: "12er Shiism",
    power: "IR",
    flag: "🇮🇷",
    tagline: "The Hidden Imam approaches. Chaos is preparation.",
    ideology: "History ends when the Mahdi returns. Every escalation brings that moment closer. Martyrdom is not a cost — it is the point.",
    difficulty: "Hard",
    profile: {
      riskTolerance: 0.85,
      patience: 0.8,
      priorityDomains: ["military", "info", "cyber"],
      t_rat: 240
    },
    winCondition: {
      id: "nuclear_threshold",
      description: "Reach turn 20 with IR nuclear ≥ 4 without triggering nuclear exchange, OR with 2+ active crises involving Iran."
    },
    advisorVoice: "eschatological",
    advisorTagline: "VELAYAT-E FAQIH STRATEGIC COUNCIL",
    advisorLines: [
      "Pressure hardens the faithful.",
      "Let them threaten. We have waited 1000 years.",
      "The Axis holds. Patience is our weapon.",
      "Sanctions change nothing. We endure.",
      "Every provocation is an opportunity."
    ],
    openingBriefing: "You are not trying to win. You are trying to survive long enough for history to turn.",
    doctrineFailCondition: "The regime collapsed before the threshold was reached. The Mahdi did not come.",
    doctrineWinMessage: "The threshold crossed. The world held its breath and did nothing. History turned — slowly, as it always does."
  },
  {
    id: "EU_FATALISM",
    name: "European Fatalism",
    power: "EU",
    flag: "🇪🇺",
    tagline: "We have seen this before.",
    ideology: "Europe has exhausted its capacity for violence and now mistakes exhaustion for wisdom. Process is the goal. The summit is the strategy.",
    difficulty: "Easy",
    profile: {
      riskTolerance: 0.15,
      patience: 0.9,
      priorityDomains: ["diplomatic", "economic", "info"],
      t_rat: 300
    },
    winCondition: {
      id: "multilateral_survival",
      description: "Reach turn 20 with EU domestic ≥ 50 and 3+ multilateral forums convened."
    },
    advisorVoice: "fatalist",
    advisorTagline: "EUROPEAN EXTERNAL ACTION SERVICE",
    advisorLines: [
      "We've drafted a strongly worded statement.",
      "Another emergency summit has been called.",
      "Strategic autonomy remains aspirational.",
      "We express deep concern through proper channels.",
      "The situation is grave. We are monitoring it closely."
    ],
    openingBriefing: "You have no army worth mentioning, no will to use it, and excellent wine. Survive on process.",
    doctrineFailCondition: "Europe's domestic stability collapsed. The project failed from within, as always.",
    doctrineWinMessage: "You convened, drafted, condemned, and negotiated. Not a shot fired. History will call it weakness. You call it survival."
  },
  {
    id: "MING",
    name: "Ming Restoration",
    power: "CN",
    flag: "🇨🇳",
    tagline: "We are not rising. We are returning.",
    ideology: "China is not a rising power — it is a returning one. The century of humiliation ends on our terms. Time is our strategic advantage.",
    difficulty: "Hard",
    profile: {
      riskTolerance: 0.35,
      patience: 0.95,
      priorityDomains: ["economic", "diplomatic", "cyber"],
      t_rat: 120
    },
    winCondition: {
      id: "civilizational_return",
      description: "Reach turn 20 with CN economic ≥ 80 and Taiwan crisis at escalation ≤ 1 — resolved without direct military action."
    },
    advisorVoice: "imperial",
    advisorTagline: "CENTRAL FOREIGN AFFAIRS COMMISSION",
    advisorLines: [
      "Act through proxies. Never directly.",
      "Let them exhaust themselves.",
      "Taiwan is an internal matter. Time is on our side.",
      "Economic dominance precedes military dominance.",
      "The long game is the only game."
    ],
    openingBriefing: "Every move you make should be legible in 50 years. The long game is the only game.",
    doctrineFailCondition: "China chose force over patience. The century of restoration was interrupted.",
    doctrineWinMessage: "The economy secured. Taiwan quieted. No shots fired by Chinese hands. The restoration proceeds — exactly as planned."
  }
];
