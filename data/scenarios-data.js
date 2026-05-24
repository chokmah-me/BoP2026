window.SCENARIOS_DATA = {
  "taiwan_strait_2026": {
    "id": "taiwan_strait_2026",
    "name": "Taiwan Strait, 2026",
    "description": "PLA forces mobilize around Taiwan as the US-China trade war peaks. Europe watches from the sidelines — for now.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "taiwan_military", "name": "Taiwan Strait Escalation", "domain": "military",
        "involved": ["CN", "US"], "escalationLevel": 2,
        "description": "PLA naval exercises have become continuous. Taiwan ADIZ violated 14 times this month.",
        "region": "east_asia", "location": { "x": 752, "y": 178 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "us_china_trade", "name": "US-China Trade War", "domain": "economic",
        "involved": ["US", "CN"], "escalationLevel": 3,
        "description": "Semiconductor export controls escalating. China's rare earth restrictions hitting US defense production.",
        "region": "east_asia", "location": { "x": 765, "y": 155 },
        "age": 3, "cascadeLog": []
      },
      {
        "id": "baltic_cyber", "name": "Baltic Cyber Probe", "domain": "cyber",
        "involved": ["RU", "EU"], "escalationLevel": 1,
        "description": "Coordinated probes on Baltic power grid SCADA. Attribution 70% confident to GRU Unit 74455.",
        "region": "europe", "location": { "x": 500, "y": 85 },
        "age": 1, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":  { "CN": 0.65, "EU": 0.85, "IN": 0.55, "RU": 0.60, "GB": 0.70, "IR": 0.45 },
      "CN":  { "US": 0.70, "EU": 0.50, "IN": 0.55, "RU": 0.75, "GB": 0.60, "IR": 0.50 },
      "EU":  { "US": 0.80, "CN": 0.45, "IN": 0.40, "RU": 0.65, "GB": 0.50, "IR": 0.40 },
      "IN":  { "US": 0.50, "CN": 0.60, "EU": 0.45, "RU": 0.40, "GB": 0.55, "IR": 0.45 },
      "RU":  { "US": 0.65, "CN": 0.70, "EU": 0.60, "IN": 0.40, "GB": 0.45, "IR": 0.65 },
      "GB":  { "US": 0.65, "CN": 0.60, "EU": 0.55, "IN": 0.50, "RU": 0.45, "IR": 0.55 },
      "IR":  { "US": 0.40, "CN": 0.50, "EU": 0.35, "IN": 0.45, "RU": 0.60, "GB": 0.55 }
    }
  },
  "iran_nuclear_2026": {
    "id": "iran_nuclear_2026",
    "name": "Iran Nuclear Threshold, 2026",
    "description": "Iran's enrichment program crosses 84%. The Gulf trembles. Every major power has a stake, and none agree on what to do.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "iran_nuclear_program", "name": "Iran Nuclear Threshold", "domain": "military",
        "involved": ["US", "EU", "IN", "CN", "RU"], "escalationLevel": 2,
        "description": "IAEA inspectors expelled. Enrichment at 84%. Israeli strike window opening. US 5th Fleet on alert in the Gulf.",
        "region": "persian_gulf", "location": { "x": 580, "y": 155 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "hormuz_blockade_threat", "name": "Hormuz Closure Threat", "domain": "economic",
        "involved": ["GB", "US", "IN"], "escalationLevel": 1,
        "description": "IRGC commanders threaten Strait of Hormuz closure. Oil markets spike 18%. Indian Navy on quiet standby.",
        "region": "persian_gulf", "location": { "x": 592, "y": 172 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "iran_proxy_escalation", "name": "Iran Proxy Network Activated", "domain": "military",
        "involved": ["EU", "GB", "US", "RU", "CN"], "escalationLevel": 2,
        "description": "Hezbollah on highest alert. Houthi strikes resuming. Iranian-backed militias mobilizing across Iraq and Syria.",
        "region": "levant", "location": { "x": 548, "y": 170 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "gulf_bloc_fracture", "name": "Gulf Bloc Internal Fracture", "domain": "diplomatic",
        "involved": ["GB", "US"], "escalationLevel": 1,
        "description": "Qatar opens back-channel to Tehran. UAE and Saudi diverge on response. Gulf Cooperation Council paralyzed.",
        "region": "persian_gulf", "location": { "x": 572, "y": 182 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":  { "CN": 0.55, "EU": 0.80, "IN": 0.50, "RU": 0.55, "GB": 0.75, "IR": 0.50 },
      "CN":  { "US": 0.65, "EU": 0.45, "IN": 0.50, "RU": 0.70, "GB": 0.65, "IR": 0.55 },
      "EU":  { "US": 0.75, "CN": 0.40, "IN": 0.45, "RU": 0.60, "GB": 0.55, "IR": 0.45 },
      "IN":  { "US": 0.50, "CN": 0.55, "EU": 0.40, "RU": 0.35, "GB": 0.70, "IR": 0.50 },
      "RU":  { "US": 0.60, "CN": 0.65, "EU": 0.55, "IN": 0.35, "GB": 0.50, "IR": 0.70 },
      "GB":  { "US": 0.70, "CN": 0.55, "EU": 0.60, "IN": 0.65, "RU": 0.40, "IR": 0.60 },
      "IR":  { "US": 0.45, "CN": 0.55, "EU": 0.40, "IN": 0.50, "RU": 0.65, "GB": 0.60 }
    }
  }
};
