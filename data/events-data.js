window.EVENT_TABLE = {
  "events": [
    {
      "id": "ransomware_financial", "name": "Global Ransomware Strike",
      "description": "A ransomware cartel hits clearing networks in 3 countries simultaneously.",
      "probability": 0.08, "conditions": [],
      "effects": { "targets": ["random_2"], "statDeltas": { "economic": -8, "cyber": -5 } },
      "advisorText": "Our models suggest pre-positioning. Expect follow-on strikes within 2 turns.",
      "cascadeRisk": "financial_fragmentation"
    },
    {
      "id": "climate_migration_wave", "name": "Climate Migration Surge",
      "description": "A heat event triggers mass displacement across the Sahel. EU and Gulf Bloc face border pressure.",
      "probability": 0.10, "conditions": [],
      "effects": { "targets": ["EU", "GB"], "statDeltas": { "domestic": -7 } },
      "advisorText": "Demographic pressure will compound for 3+ turns unless addressed domestically.",
      "cascadeRisk": "domestic_fragility_cascade"
    },
    {
      "id": "deepfake_diplomatic_cable", "name": "Fabricated Diplomatic Cable",
      "description": "An LLM-generated cable purportedly from State Dept surfaces, implying willingness to abandon Taiwan.",
      "probability": 0.07, "conditions": [{ "crisis": "taiwan_military", "minEscalation": 2 }],
      "effects": { "targets": ["CN"], "perceptionDelta": { "source": "US", "stat": "military", "delta": -15 } },
      "advisorText": "Intel confidence on this cable is low. Our analysts rate it 35% authentic.",
      "cascadeRisk": "epistemic_cascade"
    },
    {
      "id": "tech_oligopoly_data_breach", "name": "Big Tech Data Breach",
      "description": "A major US cloud provider suffers a state-level intrusion. Classified contractor data exposed.",
      "probability": 0.09, "conditions": [],
      "effects": { "targets": ["US"], "statDeltas": { "cyber": -10, "info": -8 } },
      "advisorText": "Attribution unclear. Could be CN, RU, or a cartel with state backing.",
      "cascadeRisk": null
    },
    {
      "id": "india_border_skirmish", "name": "Himalayan Border Skirmish",
      "description": "A patrol clash at LAC leaves soldiers dead. Both sides mobilize forward brigades.",
      "probability": 0.08, "conditions": [],
      "effects": { "targets": ["IN", "CN"], "statDeltas": { "military": -5, "domestic": -6 } },
      "advisorText": "India will likely hedge further from US alignment in the short term.",
      "cascadeRisk": null
    },
    {
      "id": "gulf_oil_shock", "name": "Strait of Hormuz Incident",
      "description": "An unattributed mine strike disables a tanker. Insurance rates spike. Oil hits $140.",
      "probability": 0.08, "conditions": [],
      "effects": { "targets": ["GB", "US", "EU"], "statDeltas": { "economic": -10 } },
      "advisorText": "The Gulf Bloc will prioritize economic over strategic positioning this turn.",
      "cascadeRisk": null
    },
    {
      "id": "space_asat_test", "name": "ASAT Debris Event",
      "description": "An orbital debris field from an undisclosed ASAT test threatens commercial and military satellites.",
      "probability": 0.06, "conditions": [],
      "effects": { "targets": ["all"], "statDeltas": { "space": -10 } },
      "advisorText": "C4ISR degradation will affect all powers' real-time situational awareness for 2 turns.",
      "cascadeRisk": "communications_blackout"
    },
    {
      "id": "eu_coalition_fracture", "name": "EU Internal Split",
      "description": "Hungary and Slovakia block an EU sanctions package. The unified response mechanism stalls.",
      "probability": 0.09,
      "conditions": [{ "power": "EU", "stat": "domestic", "maxValue": 50 }],
      "effects": { "targets": ["EU"], "statDeltas": { "info": -12, "domestic": -8 } },
      "advisorText": "EU action may be constrained next turn.",
      "cascadeRisk": null
    },
    {
      "id": "bio_lab_incident", "name": "Biosafety Level-4 Incident",
      "description": "A containment breach at a dual-use research facility triggers international alarm. Origin disputed.",
      "probability": 0.05, "conditions": [],
      "effects": { "targets": ["random_1"], "statDeltas": { "domestic": -12, "info": -10 } },
      "advisorText": "Domestic stability impacts will be severe if not managed within 3 turns.",
      "cascadeRisk": "domestic_fragility_cascade"
    },
    {
      "id": "arms_race_signal", "name": "Hypersonic Test Disclosure",
      "description": "A major power announces a successful hypersonic glide vehicle test, outpacing existing missile defenses.",
      "probability": 0.09, "conditions": [],
      "effects": { "targets": ["random_2"], "statDeltas": { "military": -6, "domestic": -4 } },
      "advisorText": "Deterrence calculus shifts. Expect adversaries to accelerate procurement.",
      "cascadeRisk": null
    },
    {
      "id": "currency_crisis", "name": "Reserve Currency Shock",
      "description": "A major economy unexpectedly abandons a dollar-peg. Cross-border settlements freeze for 48 hours.",
      "probability": 0.07, "conditions": [{ "power": "US", "stat": "economic", "maxValue": 55 }],
      "effects": { "targets": ["US", "EU", "GB"], "statDeltas": { "economic": -8 } },
      "advisorText": "De-dollarization accelerating. Three turns of reduced US financial leverage expected.",
      "cascadeRisk": "financial_fragmentation"
    },
    {
      "id": "satellite_jamming", "name": "GPS Constellation Jamming",
      "description": "Coordinated jamming of civilian and military GPS signals disrupts navigation across two regions simultaneously.",
      "probability": 0.08, "conditions": [],
      "effects": { "targets": ["all"], "statDeltas": { "cyber": -5, "military": -4 } },
      "advisorText": "Attributed to RU or CN with high confidence. No public acknowledgment.",
      "cascadeRisk": "communications_blackout"
    },
    {
      "id": "port_blockade", "name": "Chokepoint Interdiction",
      "description": "Naval assets bottle up a critical port. Container shipping halts. Global supply chains stutter.",
      "probability": 0.07, "conditions": [{ "crisisMinCount": 1, "minEscalation": 2 }],
      "effects": { "targets": ["random_2"], "statDeltas": { "economic": -10, "military": 3 } },
      "advisorText": "The blockading power is signaling. This is coercive, not yet kinetic.",
      "cascadeRisk": null
    },
    {
      "id": "coup_risk", "name": "Coup Attempt",
      "description": "A domestic faction attempts to seize power in a mid-tier state. Government survives but authority is fractured.",
      "probability": 0.06, "conditions": [{ "power": "any", "stat": "domestic", "maxValue": 35 }],
      "effects": { "targets": ["random_1"], "statDeltas": { "domestic": -15, "military": -5, "info": -8 } },
      "advisorText": "Regime stability uncertain for 2 turns. Outside actors may exploit the vacuum.",
      "cascadeRisk": "domestic_fragility_cascade"
    },
    {
      "id": "arctic_dispute", "name": "Arctic Shelf Confrontation",
      "description": "Competing icebreaker fleets shadow each other over contested mineral rights. A close pass raises alarm.",
      "probability": 0.06, "conditions": [],
      "effects": { "targets": ["RU", "US"], "statDeltas": { "military": -3, "domestic": -3 } },
      "advisorText": "Neither side wants escalation, but domestic audiences are watching.",
      "cascadeRisk": null
    },
    {
      "id": "undersea_cable_cut", "name": "Undersea Cable Sabotage",
      "description": "Two major transoceanic fiber cables severed simultaneously. Atlantic data traffic drops 40%.",
      "probability": 0.06, "conditions": [],
      "effects": { "targets": ["US", "EU", "GB"], "statDeltas": { "cyber": -8, "economic": -5 } },
      "advisorText": "Recovery takes 3 months minimum. Attribution is technically possible but politically fraught.",
      "cascadeRisk": "communications_blackout"
    },
    {
      "id": "pandemic_scare", "name": "Novel Pathogen Alert",
      "description": "WHO declares a Public Health Emergency. Cross-border movement halts. Markets react before facts emerge.",
      "probability": 0.05, "conditions": [],
      "effects": { "targets": ["all"], "statDeltas": { "economic": -7, "domestic": -6 } },
      "advisorText": "Historical base rate suggests 60% chance this resolves without pandemic. But 3 turns of uncertainty.",
      "cascadeRisk": "domestic_fragility_cascade"
    },
    {
      "id": "space_debris_cascade", "name": "Kessler Cascade Initiation",
      "description": "A collision in low orbit triggers a debris field that threatens the ISS and 200+ commercial satellites.",
      "probability": 0.04, "conditions": [{ "power": "any", "stat": "space", "maxValue": 40 }],
      "effects": { "targets": ["all"], "statDeltas": { "space": -15, "military": -5 } },
      "advisorText": "Worse than the ASAT test. Orbital operations degraded for years. Military C4ISR severely affected.",
      "cascadeRisk": "communications_blackout"
    },
    {
      "id": "financial_sanctions_evasion", "name": "Sanctions Evasion Network Exposed",
      "description": "An investigative leak reveals a multi-jurisdiction scheme allowing sanctioned entities to access global finance.",
      "probability": 0.07, "conditions": [],
      "effects": { "targets": ["US"], "statDeltas": { "economic": -5, "info": -7 } },
      "advisorText": "Allies frustrated. Enforcement credibility takes a hit. Expect diplomatic pressure to tighten the regime.",
      "cascadeRisk": null
    },
    {
      "id": "protest_wave", "name": "Cross-Border Protest Wave",
      "description": "Mass demonstrations spread across three capitals in a single week, linked by social media coordination.",
      "probability": 0.08, "conditions": [{ "minTurn": 5 }],
      "effects": { "targets": ["random_2"], "statDeltas": { "domestic": -10, "info": -5 } },
      "advisorText": "Governments responsive to protests gain legitimacy. Those that suppress risk spiraling instability.",
      "cascadeRisk": "domestic_fragility_cascade"
    },
    {
      "id": "ai_model_leak", "name": "Frontier AI Model Exfiltrated",
      "description": "A state-level intrusion exfiltrates weights for a frontier AI model. Capability advantage narrows overnight.",
      "probability": 0.06, "conditions": [{ "minTurn": 4 }],
      "effects": { "targets": ["US"], "statDeltas": { "cyber": -8, "info": -10, "economic": -6 } },
      "advisorText": "Whoever has the weights has the capability. Advantage window was shorter than projected.",
      "cascadeRisk": "epistemic_cascade"
    },
    {
      "id": "rogue_actor_attack", "name": "Non-State Actor Strike",
      "description": "A well-resourced non-state actor launches coordinated attacks on financial and transport infrastructure.",
      "probability": 0.06, "conditions": [{ "crisisMinCount": 1, "minEscalation": 3 }],
      "effects": { "targets": ["random_2"], "statDeltas": { "domestic": -8, "economic": -7 } },
      "advisorText": "Opportunistic. Crisis-adjacent non-state actors exploit the confusion. Attribution will be contested.",
      "cascadeRisk": null
    },
    {
      "id": "diplomatic_expulsion", "name": "Mass Diplomatic Expulsion",
      "description": "Two powers simultaneously expel each other's ambassadors over a contested incident. Back-channels go dark.",
      "probability": 0.07, "conditions": [{ "minTurn": 3 }],
      "effects": { "targets": ["random_2"], "statDeltas": { "info": -12, "domestic": -5 } },
      "advisorText": "Negotiating bandwidth collapses. Back-channel repair will take 2+ turns minimum.",
      "cascadeRisk": "epistemic_cascade"
    },
    {
      "id": "energy_grid_attack", "name": "Power Grid Attack",
      "description": "A sophisticated attack on a national power grid causes rolling blackouts for 72 hours.",
      "probability": 0.07, "conditions": [{ "power": "any", "stat": "cyber", "maxValue": 35 }],
      "effects": { "targets": ["random_1"], "statDeltas": { "cyber": -12, "domestic": -9, "economic": -8 } },
      "advisorText": "This was a demonstration, not a war. The capability exists. Deterrence calculus has shifted.",
      "cascadeRisk": "communications_blackout"
    }
  ]
};
