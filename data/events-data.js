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
    }
  ]
};
