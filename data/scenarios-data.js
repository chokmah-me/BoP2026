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
      },
      {
        "id": "iran_bio_program", "name": "Iran Biological Weapons Program", "domain": "biological",
        "involved": ["IR", "US", "EU"], "escalationLevel": 1,
        "description": "OPCW inspectors report suspicious dual-use fermentation facilities outside Tabriz. Intelligence suggests IRGC-linked biological R&D exceeding medical justification.",
        "region": "persian_gulf", "location": { "x": 573, "y": 162 },
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
      },
      {
        "id": "dprk_emp_threat", "name": "DPRK EMP Threat", "domain": "emp",
        "involved": ["DPRK", "US", "CN"], "escalationLevel": 1,
        "description": "DPRK signals intent to detonate a high-altitude nuclear device over the peninsula. KN-23 short-range ballistics repositioned to launch corridors consistent with HAED profile.",
        "region": "korean_peninsula", "location": { "x": 785, "y": 138 },
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
  },
  "sovereignty_void_2026": {
    "id": "sovereignty_void_2026",
    "name": "Sovereignty Void",
    "description": "Golden Dome is online. Boost-phase physics set the clock. Your doctrine sets your speed. The gap between them is the point.",
    "startYear": 2026,
    "player": "US",
    "requiresDoctrine": true,
    "crises": [
      {
        "id": "boost_phase_north_korea", "name": "DPRK Boost-Phase Launch",
        "domain": "autonomous", "involved": ["US", "CN", "DPRK"],
        "escalationLevel": 0, "t_event": 90,
        "description": "KP solid-fuel ICBM detected at T+0. Boost phase ends at T+90. Only JUCHE (t_rat 45s) closes this window.",
        "region": "northeast_asia", "location": { "x": 720, "y": 175 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "hypersonic_taiwan", "name": "PLA Hypersonic Strike",
        "domain": "autonomous", "involved": ["US", "CN"],
        "escalationLevel": 0, "t_event": 120,
        "description": "DF-ZF hypersonic glide vehicle detected inbound. Intercept window: 120 seconds. MING doctrine can close this.",
        "region": "taiwan_strait", "location": { "x": 710, "y": 250 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "c2_blackout", "name": "C2 Comms Blackout",
        "domain": "cyber", "involved": ["US", "CN", "RU"],
        "escalationLevel": 0, "t_event": null, "t_rat_penalty": 30,
        "description": "Adversaries probing satellite uplinks. If this crisis escalates, every doctrine responds 30 seconds slower.",
        "region": "global", "location": { "x": 400, "y": 300 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "policy_review_tribunal", "name": "DoDD 3000.09 Review",
        "domain": "diplomatic", "involved": ["US", "EU", "GB"],
        "escalationLevel": 0, "t_event": null,
        "description": "Allies demand accountability for autonomous engagement pre-delegation. Dormant until pre_delegate_authority is taken.",
        "region": "north_atlantic", "location": { "x": 340, "y": 160 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US": { "CN": 0.65, "EU": 0.85, "IN": 0.55, "RU": 0.60, "GB": 0.70, "IR": 0.45 },
      "CN": { "US": 0.70, "EU": 0.50, "IN": 0.55, "RU": 0.75, "GB": 0.60, "IR": 0.50 },
      "EU": { "US": 0.80, "CN": 0.45, "IN": 0.40, "RU": 0.65, "GB": 0.50, "IR": 0.40 },
      "IN": { "US": 0.50, "CN": 0.60, "EU": 0.45, "RU": 0.40, "GB": 0.55, "IR": 0.45 },
      "RU": { "US": 0.65, "CN": 0.70, "EU": 0.60, "IN": 0.40, "GB": 0.45, "IR": 0.65 },
      "GB": { "US": 0.65, "CN": 0.60, "EU": 0.55, "IN": 0.50, "RU": 0.45, "IR": 0.55 },
      "IR": { "US": 0.40, "CN": 0.50, "EU": 0.35, "IN": 0.45, "RU": 0.60, "GB": 0.55 }
    }
  },
  "orbital_warfare_2026": {
    "id": "orbital_warfare_2026",
    "name": "Orbital Warfare, 2026",
    "description": "A destructive ASAT test seeds a debris field as GPS goes dark over a theater. Cislunar resource claims harden. Low Earth orbit — the substrate of every power's military and economy — becomes contested terrain. The first runaway debris cascade has no exit.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "asat_demonstration", "name": "ASAT Demonstration", "domain": "space",
        "involved": ["US", "CN"], "escalationLevel": 1,
        "description": "A destructive direct-ascent ASAT test shatters a defunct satellite into 1,500+ trackable fragments. Conjunction warnings spike across LEO. Both powers blame the other for opening the door.",
        "region": "orbit", "location": { "x": 700, "y": 60 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "gnss_jamming", "name": "GNSS Denial", "domain": "space",
        "involved": ["US", "RU", "EU"], "escalationLevel": 1,
        "description": "Wide-area GPS and Galileo jamming blankets a contested theater. Civil aviation reroutes; precision munitions degrade. Attribution points to mobile electronic-warfare assets.",
        "region": "orbit", "location": { "x": 470, "y": 70 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "commsat_blackout", "name": "Comms Satellite Blackout", "domain": "cyber",
        "involved": ["US", "CN", "RU"], "escalationLevel": 1,
        "description": "Uplink interference and a suspected cyber intrusion knock several geostationary comms satellites offline. Strategic-warning links flicker. C2 falls back to brittle terrestrial paths.",
        "region": "orbit", "location": { "x": 620, "y": 50 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "lunar_resource_claim", "name": "Cislunar Resource Claim", "domain": "diplomatic",
        "involved": ["US", "CN", "IN"], "escalationLevel": 1,
        "description": "Competing Artemis Accords and ILRS partners stake overlapping claims to a south-pole ice deposit. A safety-zone declaration is read as a sovereignty grab. The Outer Space Treaty strains.",
        "region": "orbit", "location": { "x": 560, "y": 40 },
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
  "megacity_siege_2026": {
    "id": "megacity_siege_2026",
    "name": "Megacity Siege, 2026",
    "description": "A coastal megacity of 20 million fractures as the host state collapses. A US-led stabilization force, a rival-backed faction, and entrenched insurgents grind block by block. There is no clean front — only a protracted siege, a humanitarian catastrophe in the making, and no quick way out.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "coastal_megacity_siege", "name": "Coastal Megacity Siege", "domain": "urban",
        "involved": ["US", "CN", "EU"], "escalationLevel": 2,
        "description": "Block-by-block fighting locks down the old port district. A US-led stabilization force and a rival-backed faction hold opposite banks of the river. Neither can clear the city; neither will leave it.",
        "region": "megacity", "location": { "x": 600, "y": 235 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "insurgent_network", "name": "Insurgent Network", "domain": "urban",
        "involved": ["US", "IN"], "escalationLevel": 1,
        "description": "A decentralized insurgent cell network controls the informal settlements ringing the city. IED campaigns and ambushes erode any force that tries to hold ground.",
        "region": "megacity", "location": { "x": 615, "y": 248 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "humanitarian_corridor_crisis", "name": "Humanitarian Corridor Crisis", "domain": "diplomatic",
        "involved": ["US", "EU", "IN"], "escalationLevel": 1,
        "description": "Two million civilians are trapped without water or power. Negotiations over evacuation corridors stall as each party suspects the others of exploiting the routes militarily.",
        "region": "megacity", "location": { "x": 588, "y": 250 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "urban_infrastructure_collapse", "name": "Urban Infrastructure Collapse", "domain": "economic",
        "involved": ["US", "CN"], "escalationLevel": 1,
        "description": "The megacity's port, grid, and water treatment have failed under the siege. The regional economy seizes; the humanitarian clock accelerates.",
        "region": "megacity", "location": { "x": 605, "y": 222 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":  { "CN": 0.65, "EU": 0.85, "IN": 0.55, "RU": 0.55, "GB": 0.60, "IR": 0.45 },
      "CN":  { "US": 0.70, "EU": 0.45, "IN": 0.55, "RU": 0.75, "GB": 0.60, "IR": 0.50 },
      "EU":  { "US": 0.80, "CN": 0.40, "IN": 0.45, "RU": 0.60, "GB": 0.50, "IR": 0.40 },
      "IN":  { "US": 0.55, "CN": 0.60, "EU": 0.45, "RU": 0.40, "GB": 0.55, "IR": 0.45 },
      "RU":  { "US": 0.60, "CN": 0.70, "EU": 0.55, "IN": 0.40, "GB": 0.45, "IR": 0.60 },
      "GB":  { "US": 0.65, "CN": 0.60, "EU": 0.55, "IN": 0.55, "RU": 0.45, "IR": 0.55 },
      "IR":  { "US": 0.40, "CN": 0.50, "EU": 0.35, "IN": 0.45, "RU": 0.60, "GB": 0.55 }
    }
  }
,
  "financial_contagion_2026": {
    "id": "financial_contagion_2026",
    "name": "Financial Contagion, 2026",
    "description": "The global dollar-clearing architecture is seizing. Three sovereign defaults are imminent, BRICS+ is accelerating a reserve-currency alternative, and the G20 has no communiqué. The US can stabilize the system — or let rivals exploit the fractures.",
    "startYear": 2026,
    "player": "US",
    "crises": [
      {
        "id": "clearing_network_failure", "name": "Clearing Network Failure", "domain": "economic",
        "involved": ["US", "EU", "GB", "CN"], "escalationLevel": 2,
        "description": "The SWIFT-CHIPS-Fedwire interbank settlement layer is under coordinated cyberattack. Clearing has frozen in three jurisdictions simultaneously. $4 trillion in daily transactions are at risk of cascade default.",
        "region": "global_finance", "location": { "x": 410, "y": 145 },
        "age": 0, "cascadeLog": []
      },
      {
        "id": "sovereign_debt_crisis", "name": "Sovereign Debt Cascade", "domain": "economic",
        "involved": ["IN", "GB", "EU", "US"], "escalationLevel": 1,
        "description": "Emerging market sovereign debt is collapsing as dollar-denominated obligations come due in a rising-rate environment. Three G20 members face imminent default. IMF reserves are insufficient at this scale.",
        "region": "global_finance", "location": { "x": 490, "y": 175 },
        "age": 1, "cascadeLog": []
      },
      {
        "id": "dollar_weaponization_backlash", "name": "Dollar Weaponization Backlash", "domain": "supply_chain",
        "involved": ["CN", "RU", "GB", "US"], "escalationLevel": 1,
        "description": "BRICS+ announces a commodity settlement basket backed by gold and energy reserves. Yuan clearing volumes surge. The dollar's reserve currency share drops 8% in 60 days — the fastest realignment since Bretton Woods.",
        "region": "global_finance", "location": { "x": 360, "y": 160 },
        "age": 2, "cascadeLog": []
      },
      {
        "id": "g20_coordination_collapse", "name": "G20 Coordination Collapse", "domain": "diplomatic",
        "involved": ["US", "CN", "EU", "IN"], "escalationLevel": 1,
        "description": "The G20 emergency session ends without communiqué. The US-China split paralyzes the multilateral response. Each major economy is now acting unilaterally to insulate itself — accelerating the fragmentation it was convened to arrest.",
        "region": "global_finance", "location": { "x": 450, "y": 130 },
        "age": 0, "cascadeLog": []
      }
    ],
    "intelQuality": {
      "US":  { "CN": 0.70, "EU": 0.90, "IN": 0.65, "RU": 0.60, "GB": 0.85, "IR": 0.45 },
      "CN":  { "US": 0.70, "EU": 0.55, "IN": 0.55, "RU": 0.70, "GB": 0.65, "IR": 0.50 },
      "EU":  { "US": 0.85, "CN": 0.50, "IN": 0.50, "RU": 0.60, "GB": 0.65, "IR": 0.45 },
      "IN":  { "US": 0.60, "CN": 0.65, "EU": 0.55, "RU": 0.45, "GB": 0.65, "IR": 0.45 },
      "RU":  { "US": 0.60, "CN": 0.70, "EU": 0.60, "IN": 0.45, "GB": 0.50, "IR": 0.65 },
      "GB":  { "US": 0.80, "CN": 0.65, "EU": 0.70, "IN": 0.60, "RU": 0.50, "IR": 0.55 },
      "IR":  { "US": 0.40, "CN": 0.50, "EU": 0.35, "IN": 0.45, "RU": 0.60, "GB": 0.55 }
    }
  }
};
