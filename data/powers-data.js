window.POWERS_DATA = {
  "US": {
    "id": "US", "name": "United States", "flag": "🇺🇸", "color": "#1a3a6b",
    "trueState": { "military": 92, "nuclear": 3, "economic": 78, "cyber": 90, "info": 70, "domestic": 62, "space": 88 },
    "relationships": { "CN": -55, "EU": 65, "IN": 40, "RU": -72, "GB": 30, "IR": -80, "DPRK": -88 },
    "riskTolerance": 0.55, "patience": 0.5,
    "priorityDomains": ["military", "economic", "diplomatic"],
    "actionPoints": 3
  },
  "CN": {
    "id": "CN", "name": "China", "flag": "🇨🇳", "color": "#8b0000",
    "trueState": { "military": 80, "nuclear": 2, "economic": 72, "cyber": 82, "info": 75, "domestic": 58, "space": 70 },
    "relationships": { "US": -55, "EU": -10, "IN": -35, "RU": 45, "GB": -20, "IR": 20, "DPRK": 35 },
    "riskTolerance": 0.4, "patience": 0.9,
    "priorityDomains": ["economic", "diplomatic", "cyber"],
    "actionPoints": 3
  },
  "EU": {
    "id": "EU", "name": "European Union", "flag": "🇪🇺", "color": "#003399",
    "trueState": { "military": 55, "nuclear": 1, "economic": 75, "cyber": 60, "info": 65, "domestic": 55, "space": 50 },
    "relationships": { "US": 65, "CN": -10, "IN": 30, "RU": -68, "GB": -5, "IR": -40, "DPRK": -60 },
    "riskTolerance": 0.3, "patience": 0.7,
    "priorityDomains": ["diplomatic", "economic"],
    "actionPoints": 3
  },
  "IN": {
    "id": "IN", "name": "India", "flag": "🇮🇳", "color": "#FF9933",
    "trueState": { "military": 68, "nuclear": 2, "economic": 65, "cyber": 55, "info": 50, "domestic": 70, "space": 45 },
    "relationships": { "US": 40, "CN": -35, "EU": 30, "RU": 20, "GB": -15, "IR": 15, "DPRK": -20 },
    "riskTolerance": 0.45, "patience": 0.7,
    "priorityDomains": ["diplomatic", "economic"],
    "actionPoints": 3
  },
  "RU": {
    "id": "RU", "name": "Russia", "flag": "🇷🇺", "color": "#5c3a1e",
    "trueState": { "military": 72, "nuclear": 4, "economic": 38, "cyber": 78, "info": 80, "domestic": 45, "space": 60 },
    "relationships": { "US": -72, "CN": 45, "EU": -68, "IN": 20, "GB": -30, "IR": 38, "DPRK": 30 },
    "riskTolerance": 0.75, "patience": 0.35,
    "priorityDomains": ["military", "info", "cyber"],
    "actionPoints": 3
  },
  "GB": {
    "id": "GB", "name": "Gulf Bloc", "flag": "🛢️", "color": "#c8a400",
    "trueState": { "military": 50, "nuclear": 0, "economic": 82, "cyber": 40, "info": 55, "domestic": 65, "space": 20 },
    "relationships": { "US": 30, "CN": 25, "EU": 15, "IN": 20, "RU": -30, "IR": -30, "DPRK": -45 },
    "riskTolerance": 0.5, "patience": 0.6,
    "priorityDomains": ["economic", "military"],
    "actionPoints": 3
  },
  "IR": {
    "id": "IR", "name": "Iran", "flag": "🇮🇷", "color": "#2d6a4f",
    "trueState": { "military": 55, "nuclear": 2, "economic": 35, "cyber": 60, "info": 65, "domestic": 45, "space": 25 },
    "relationships": { "US": -88, "CN": 20, "EU": -35, "IN": 15, "RU": 40, "GB": -30, "DPRK": 25 },
    "riskTolerance": 0.7, "patience": 0.65,
    "priorityDomains": ["military", "info", "cyber"],
    "actionPoints": 3
  },
  "DPRK": {
    "id": "DPRK", "name": "North Korea", "flag": "🇰🇵", "color": "#4a0000",
    "trueState": { "military": 68, "nuclear": 7, "economic": 18, "cyber": 52, "info": 48, "domestic": 28, "space": 12 },
    "relationships": { "US": -92, "CN": 35, "EU": -55, "IN": -20, "RU": 30, "GB": -50, "IR": 25 },
    "riskTolerance": 0.85, "patience": 0.35,
    "priorityDomains": ["military", "nuclear", "cyber"],
    "actionPoints": 3
  }
};
