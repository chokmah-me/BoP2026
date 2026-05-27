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
        "involved": ["US", "IR"], "escalationLevel": 1,
        "description": "IAEA inspectors expelled. Enrichment at 84%. Israeli strike window opening. US 5th Fleet on alert in the Gulf.",
        "region": "persian_gulf", "location": { "x": 580, "y": 155 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "hormuz_blockade_threat", "name": "Hormuz Closure Threat", "domain": "economic",
        "involved": ["GB", "US", "IN", "IR"], "escalationLevel": 1,
        "description": "IRGC commanders threaten Strait of Hormuz closure. Oil markets spike 18%. Indian Navy on quiet standby.",
        "region": "persian_gulf", "location": { "x": 592, "y": 172 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "iran_proxy_escalation", "name": "Iran Proxy Network Activated", "domain": "military",
        "involved": ["US", "IR", "EU", "GB"], "escalationLevel": 1,
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
  },
  "south_china_sea_2026": {
    "id": "south_china_sea_2026",
    "name": "South China Sea, 2026",
    "description": "China seizes a contested reef. Drone swarms have replaced coast guard skippers. Semiconductor supply lines hang in the balance. Five powers have a stake — none want to fire first.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "scs_island_seizure", "name": "SCS Island Seizure", "domain": "military",
        "involved": ["CN", "US", "IN"], "escalationLevel": 1,
        "description": "PLA forces occupy Scarborough Shoal in force. Philippine coast guard vessels turned back. US 7th Fleet repositioning.",
        "region": "scs_waters", "location": { "x": 748, "y": 210 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "scs_sea_lane", "name": "Sea Lane Blockade Threat", "domain": "economic",
        "involved": ["CN", "US", "GB"], "escalationLevel": 1,
        "description": "China signals intent to restrict passage through contested waters. 40% of global trade volume at risk. Insurance rates climbing.",
        "region": "scs_waters", "location": { "x": 732, "y": 225 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "tech_supply_crunch", "name": "Semiconductor Chokepoint", "domain": "supply_chain",
        "involved": ["CN", "US", "EU"], "escalationLevel": 1,
        "description": "Taiwan TSMC output interrupted. ASML equipment shipments frozen. Global chip lead times extending to 14+ months.",
        "region": "indo_pacific", "location": { "x": 762, "y": 195 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "drone_swarm_incident", "name": "Autonomous Engagement", "domain": "autonomous",
        "involved": ["CN", "US", "IN"], "escalationLevel": 1,
        "description": "CN drone swarms intercept US P-8 maritime patrol. Rules of engagement untested. No casualty — yet. Decision loops compressing.",
        "region": "scs_waters", "location": { "x": 755, "y": 215 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":  { "CN": 0.70, "EU": 0.85, "IN": 0.55, "RU": 0.55, "GB": 0.65, "IR": 0.40 },
      "CN":  { "US": 0.70, "EU": 0.45, "IN": 0.55, "RU": 0.75, "GB": 0.65, "IR": 0.45 },
      "EU":  { "US": 0.80, "CN": 0.40, "IN": 0.40, "RU": 0.60, "GB": 0.50, "IR": 0.35 },
      "IN":  { "US": 0.50, "CN": 0.65, "EU": 0.40, "RU": 0.40, "GB": 0.60, "IR": 0.40 },
      "RU":  { "US": 0.60, "CN": 0.75, "EU": 0.55, "IN": 0.35, "GB": 0.40, "IR": 0.60 },
      "GB":  { "US": 0.60, "CN": 0.65, "EU": 0.50, "IN": 0.55, "RU": 0.40, "IR": 0.50 },
      "IR":  { "US": 0.35, "CN": 0.50, "EU": 0.30, "IN": 0.40, "RU": 0.60, "GB": 0.55 }
    }
  },
  "korean_peninsula_2026": {
    "id": "korean_peninsula_2026",
    "name": "Korean Peninsula, 2026",
    "description": "DPRK moves tactical warheads to forward positions after the latest ICBM series. China talks, Russia arms, the US 7th Fleet repositions. The peninsula is one miscalculation from exchange.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "dprk_icbm_series", "name": "ICBM Test Series", "domain": "military",
        "involved": ["DPRK", "US"], "escalationLevel": 1,
        "description": "DPRK fires three Hwasong-18 ICBMs over Japan in 72 hours. US STRATCOM elevates alert. DEFCON 4.",
        "region": "korean_peninsula", "location": { "x": 783, "y": 133 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "sanctions_collapse", "name": "Sanctions Regime Collapse", "domain": "economic",
        "involved": ["US", "DPRK", "CN", "RU"], "escalationLevel": 1,
        "description": "Russian oil-for-arms swap collapses UN sanctions. Chinese banks resume correspondent relationships. Treasury's maximum-pressure toolkit is broken.",
        "region": "korean_peninsula", "location": { "x": 772, "y": 125 },
        "age": 2, "cascadeLog": []
      },
      {
        "id": "lazarus_financial_ops", "name": "Lazarus Financial Operations", "domain": "cyber",
        "involved": ["DPRK", "US", "GB"], "escalationLevel": 1,
        "description": "Lazarus Group drains $1.2B from South Korean and UK crypto exchanges. Funds routed to ICBM procurement. Attribution confirmed, response options limited.",
        "region": "korean_peninsula", "location": { "x": 790, "y": 140 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "peninsula_nuclear_posture", "name": "Forward Nuclear Posture", "domain": "military",
        "involved": ["DPRK", "US", "CN"], "escalationLevel": 2,
        "description": "Satellite imagery confirms tactical warheads at Kaesong and Wonsan. Kim signals first-use if regime survival threatened. US-ROK combined exercises suspended under pressure.",
        "region": "korean_peninsula", "location": { "x": 778, "y": 148 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":   { "CN": 0.60, "EU": 0.80, "IN": 0.50, "RU": 0.55, "GB": 0.75, "IR": 0.40, "DPRK": 0.30 },
      "CN":   { "US": 0.65, "EU": 0.45, "IN": 0.50, "RU": 0.70, "GB": 0.55, "IR": 0.50, "DPRK": 0.55 },
      "EU":   { "US": 0.75, "CN": 0.40, "IN": 0.40, "RU": 0.55, "GB": 0.55, "IR": 0.40, "DPRK": 0.25 },
      "IN":   { "US": 0.50, "CN": 0.55, "EU": 0.40, "RU": 0.35, "GB": 0.55, "IR": 0.45, "DPRK": 0.25 },
      "RU":   { "US": 0.60, "CN": 0.65, "EU": 0.50, "IN": 0.35, "GB": 0.45, "IR": 0.65, "DPRK": 0.50 },
      "GB":   { "US": 0.70, "CN": 0.55, "EU": 0.60, "IN": 0.55, "RU": 0.40, "IR": 0.55, "DPRK": 0.30 },
      "IR":   { "US": 0.40, "CN": 0.50, "EU": 0.35, "IN": 0.45, "RU": 0.65, "GB": 0.55, "DPRK": 0.30 },
      "DPRK": { "US": 0.35, "CN": 0.55, "EU": 0.25, "IN": 0.25, "RU": 0.45, "GB": 0.30, "IR": 0.30 }
    }
  }
};
