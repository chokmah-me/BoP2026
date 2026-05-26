const Domains = (() => {
  const ACTIONS = [
    // ── MILITARY ──────────────────────────────────────────────────────────────
    {
      id: 'deploy_forces',
      domain: 'military',
      name: 'Deploy Forces',
      description: 'Move naval/air assets into contested region. Raises military readiness; signals resolve.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { military: 5 }, target: { military: -3 } },
      effects2nd: [
        { prob: 0.45, effect: { self: { domestic: -5 } }, label: 'Public opposition to deployment' },
        { prob: 0.30, effect: { crisis_escalation: 1 }, label: 'Target interprets as hostile' }
      ],
      effects3rd: [
        { condition: 'third_party_involved', effect: { third_party: { relationships_us: -8 } }, label: 'Non-aligned powers distance themselves' }
      ],
      domains: ['military'],
      tooltip: 'High signal. High escalation risk. Drains domestic support.'
    },
    {
      id: 'military_exercises',
      domain: 'military',
      name: 'Joint Exercises',
      description: 'Conduct exercises with allies. Builds interoperability without direct confrontation.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { military: 3 } },
      effects2nd: [
        { prob: 0.25, effect: { relationship_ally: 8 }, label: 'Ally confidence strengthened' },
        { prob: 0.20, effect: { adversary_relationship: -5 }, label: 'Adversary reads exercises as preparation' }
      ],
      effects3rd: [],
      tooltip: 'Low risk. Modest gain. Good for maintaining alliances.'
    },
    {
      id: 'arms_sale',
      domain: 'military',
      name: 'Arms Sale',
      description: 'Sell advanced weapons to a partner. Generates revenue and strengthens their deterrent.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: { self: { economic: 3 }, target: { military: 8 } },
      effects2nd: [
        { prob: 0.35, effect: { third_party_hostility: 6 }, label: 'Regional rivals alarmed' },
        { prob: 0.20, effect: { self: { info: -5 } }, label: 'Criticized as destabilizing' }
      ],
      effects3rd: [],
      tooltip: 'Economic gain. Moderate regional blowback risk.'
    },
    {
      id: 'force_withdrawal',
      domain: 'military',
      name: 'Withdraw Forces',
      description: 'Pull back forward-deployed assets. De-escalatory signal, at cost of credibility.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: -1,
      effects1st: { self: { military: -5, domestic: 6 } },
      effects2nd: [
        { prob: 0.40, effect: { adversary_relationship: 10 }, label: 'Adversary reads as concession, probes further' },
        { prob: 0.30, effect: { ally_relationship: -8 }, label: 'Allies question commitment' }
      ],
      effects3rd: [],
      tooltip: 'De-escalates. But adversaries may exploit perceived weakness.'
    },

    // ── ECONOMIC ──────────────────────────────────────────────────────────────
    {
      id: 'sanctions',
      domain: 'economic',
      name: 'Impose Sanctions',
      description: 'Target an adversary\'s economy. Hits their economic stats; costs your trade relationships.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { economic: -4 }, target: { economic: -12 } },
      effects2nd: [
        { prob: 0.50, effect: { self: { economic: -5 } }, label: 'Blowback from allied trading partners' },
        { prob: 0.30, effect: { target: { domestic: -6 } }, label: 'Internal hardship fuels nationalist backlash' }
      ],
      effects3rd: [
        { condition: 'sanctions_stacking', effect: { systemic: 'financial_fragmentation' }, label: 'Multiple sanctions risk clearing network fragmentation' }
      ],
      tooltip: 'Strong economic weapon. Stacking with others risks 4th-order blowback.'
    },
    {
      id: 'trade_deal',
      domain: 'economic',
      name: 'Offer Trade Deal',
      description: 'Extend preferential trade terms. Builds economic ties and softens adversarial posture.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: -1,
      effects1st: { self: { economic: 4 }, target: { economic: 6 } },
      effects2nd: [
        { prob: 0.35, effect: { relationship_target: 12 }, label: 'Relationship improvement' },
        { prob: 0.20, effect: { third_party_hostility: 5 }, label: 'Third powers worry about exclusion' }
      ],
      effects3rd: [],
      tooltip: 'Positive-sum. Builds alignment. Third-party envy risk.'
    },
    {
      id: 'supply_chain_reshoring',
      domain: 'economic',
      name: 'Reshore Supply Chain',
      description: 'Reduce strategic dependencies. Short-term cost; long-term resilience.',
      cost: 2,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { economic: -6, military: 4, cyber: 3 } },
      effects2nd: [
        { prob: 0.40, effect: { self: { economic: 8 } }, label: 'Long-term industrial capacity increases', delay: 3 },
        { prob: 0.25, effect: { self: { domestic: -4 } }, label: 'Consumer prices rise, domestic pressure' }
      ],
      effects3rd: [],
      tooltip: 'Investment. Pays off slowly. Hurts now, helps later.'
    },
    {
      id: 'financial_pressure',
      domain: 'economic',
      name: 'Financial Pressure',
      description: 'Use dollar dominance or financial networks to squeeze an adversary\'s reserves.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { economic: -2 }, target: { economic: -10 } },
      effects2nd: [
        { prob: 0.40, effect: { target: { cyber: 8 } }, label: 'Target accelerates financial cyber capabilities' },
        { prob: 0.30, effect: { systemic_risk: 'financial_fragmentation' }, label: 'Accelerates de-dollarization pressure' }
      ],
      effects3rd: [],
      tooltip: 'Effective but accelerates dollar alternatives. Use sparingly.'
    },

    // ── DIPLOMATIC ────────────────────────────────────────────────────────────
    {
      id: 'bilateral_negotiation',
      domain: 'diplomatic',
      name: 'Bilateral Negotiation',
      description: 'Open direct back-channel talks. Low signal, potentially high yield.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: -1,
      effects1st: {},
      effects2nd: [
        { prob: 0.55, effect: { relationship_target: 10 }, label: 'Confidence-building measure succeeds' },
        { prob: 0.20, effect: { crisis_escalation: -1 }, label: 'Crisis de-escalation achieved' },
        { prob: 0.15, effect: {}, label: 'Talks stall; no progress' }
      ],
      effects3rd: [],
      tooltip: 'Low cost. Uncertain return. Best combined with other signals.'
    },
    {
      id: 'multilateral_forum',
      domain: 'diplomatic',
      name: 'Multilateral Forum',
      description: 'Convene allies or UN process. Slower but builds durable coalition.',
      cost: 2,
      requiresTarget: false,
      escalationDelta: -1,
      effects1st: { self: { info: 6 } },
      effects2nd: [
        { prob: 0.50, effect: { ally_relationships: 8 }, label: 'Allied coordination improves' },
        { prob: 0.20, effect: { target: { info: -5 } }, label: 'Adversary isolated diplomatically' }
      ],
      effects3rd: [],
      tooltip: 'Legitimacy builder. Slower to produce results.'
    },
    {
      id: 'public_statement',
      domain: 'diplomatic',
      name: 'Public Statement',
      description: 'Declare a redline or commitment publicly. Raises stakes but signals resolve.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 1,
      effects1st: { self: { info: 8 } },
      effects2nd: [
        { prob: 0.40, effect: { crisis_escalation: 1 }, label: 'Adversary sees declaration as provocation' },
        { prob: 0.35, effect: { ally_relationships: 6 }, label: 'Allies rally to stated position' }
      ],
      effects3rd: [],
      tooltip: 'Creates commitment trap. Credibility depends on follow-through.'
    },
    {
      id: 'secret_channel',
      domain: 'diplomatic',
      name: 'Back-Channel Contact',
      description: 'Reach out through intelligence or deniable intermediaries. High deniability.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: -1,
      effects1st: {},
      effects2nd: [
        { prob: 0.45, effect: { relationship_target: 15 }, label: 'Private understanding reached' },
        { prob: 0.25, effect: { self: { info: -8 } }, label: 'Channel leaked; embarrassing exposure' }
      ],
      effects3rd: [],
      tooltip: 'High upside, leak risk. Best when official channels are closed.'
    },

    // ── CYBER ─────────────────────────────────────────────────────────────────
    {
      id: 'cyber_defense_hardening',
      domain: 'cyber',
      name: 'Defensive Hardening',
      description: 'Upgrade critical infrastructure cyber defenses. Reduces vulnerability.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { cyber: 8 } },
      effects2nd: [
        { prob: 0.30, effect: { self: { economic: -3 } }, label: 'Mandatory upgrade costs hit private sector' }
      ],
      effects3rd: [],
      tooltip: 'Pure defense. No escalation. Always worthwhile.'
    },
    {
      id: 'cyber_infrastructure_probe',
      domain: 'cyber',
      name: 'Infrastructure Probe',
      description: 'Test adversary grid and SCADA vulnerabilities. Quiet but escalatory if detected.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { cyber: 5 } },
      effects2nd: [
        { prob: 0.35, effect: { crisis_escalation: 1 }, label: 'Probe attributed; adversary retaliates' },
        { prob: 0.50, effect: { self: { cyber: 8 } }, label: 'Vulnerability map updated' }
      ],
      effects3rd: [
        { condition: 'multiple_cyber_active', effect: { systemic: 'internet_balkanization' }, label: 'Multiple probes accelerate Balkanization pressure' }
      ],
      tooltip: 'Intel gain. Detection risk. May trigger retaliatory probe.'
    },
    {
      id: 'cyber_offensive_reveal',
      domain: 'cyber',
      name: 'Reveal Cyber Capability',
      description: 'Signal that you have offensive cyber tools. Deters escalation; reveals your hand.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { cyber: -5, info: 8 } },
      effects2nd: [
        { prob: 0.40, effect: { adversary_cyber: -8 }, label: 'Adversaries adjust operations, lose some ops' },
        { prob: 0.25, effect: { self: { domestic: 4 } }, label: 'Public reassured by demonstrated capability' }
      ],
      effects3rd: [],
      tooltip: 'Deterrence signal. Costs future surprise. Use tactically.'
    },
    {
      id: 'attribution_claim',
      domain: 'cyber',
      name: 'Attribution Claim',
      description: 'Publicly attribute a cyberattack. Imposes reputational cost; requires evidence.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { target: { info: -10 } },
      effects2nd: [
        { prob: 0.40, effect: { relationship_target: -12 }, label: 'Diplomatic relations deteriorate' },
        { prob: 0.25, effect: { self: { info: -6 } }, label: 'Attribution disputed; credibility hit' }
      ],
      effects3rd: [],
      tooltip: 'Naming and shaming. Requires solid intel or backfires.'
    },

    // ── INFORMATION ───────────────────────────────────────────────────────────
    {
      id: 'release_intel',
      domain: 'info',
      name: 'Release Intelligence',
      description: 'Declassify and publish intelligence to shape the narrative.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { info: 10 } },
      effects2nd: [
        { prob: 0.35, effect: { self: { cyber: -5 } }, label: 'Sources and methods partially exposed' },
        { prob: 0.40, effect: { ally_relationships: 6 }, label: 'Allies appreciate transparency' }
      ],
      effects3rd: [],
      tooltip: 'Shapes narrative. Costs collection capabilities long-term.'
    },
    {
      id: 'counter_narrative',
      domain: 'info',
      name: 'Counter-Narrative',
      description: 'Deploy strategic communications to undermine adversary framing.',
      cost: 1,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: { self: { info: 6 }, target: { info: -6 } },
      effects2nd: [
        { prob: 0.30, effect: { self: { info: 8 } }, label: 'Narrative wins traction in third-party media' }
      ],
      effects3rd: [],
      tooltip: 'Symmetric information warfare. Steady, incremental effect.'
    },
    {
      id: 'plant_leak',
      domain: 'info',
      name: 'Plant Leak',
      description: 'Feed selective intelligence to shape adversary perception. High deniability.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: {},
      effects2nd: [
        { prob: 0.55, effect: { target_perception_distorted: true }, label: 'Adversary makes decisions based on false data' },
        { prob: 0.25, effect: { self: { info: -10 } }, label: 'Leak traced; credibility severely damaged' }
      ],
      effects3rd: [],
      tooltip: 'High-risk, high-reward deception. If caught, credibility collapses.'
    },

    // ── DOMESTIC ──────────────────────────────────────────────────────────────
    {
      id: 'grid_stabilization',
      domain: 'domestic',
      name: 'Grid Stabilization',
      description: 'Emergency investment in critical infrastructure. Reduces cyber vulnerability.',
      cost: 2,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { domestic: 8, cyber: 5, economic: -4 } },
      effects2nd: [],
      effects3rd: [],
      tooltip: 'Defensive resilience. Costs economic resources.'
    },
    {
      id: 'coalition_shoring',
      domain: 'domestic',
      name: 'Shore Up Coalition',
      description: 'Political effort to unify domestic factions behind foreign policy.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { domestic: 10 } },
      effects2nd: [
        { prob: 0.25, effect: { self: { economic: -5 } }, label: 'Concessions to coalition partners cost resources' }
      ],
      effects3rd: [],
      tooltip: 'Unifies domestic factions. NPC powers favor this when domestic support is below 50.'
    },
    {
      id: 'emergency_powers',
      domain: 'domestic',
      name: 'Emergency Powers',
      description: 'Declare emergency to mobilize resources. Effective but damages democratic norms.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { domestic: -8, military: 10, economic: 5 } },
      effects2nd: [
        { prob: 0.35, effect: { ally_relationships: -8 }, label: 'Allies alarmed by democratic backsliding' }
      ],
      effects3rd: [],
      tooltip: 'Powerful but corrosive. Use in genuine crisis only.'
    },
    {
      id: 'reform_signal',
      domain: 'domestic',
      name: 'Reform Signal',
      description: 'Announce domestic reforms. Boosts stability and international legitimacy.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { domestic: 6, info: 5 } },
      effects2nd: [
        { prob: 0.30, effect: { ally_relationships: 8 }, label: 'Allies reward demonstrated governance' }
      ],
      effects3rd: [],
      tooltip: 'Slow but durable. Better for long-term stability than short-term crises.'
    },

    // ── SUPPLY CHAIN ──────────────────────────────────────────────────────────
    {
      id: 'critical_minerals_deal',
      domain: 'supply_chain',
      name: 'Critical Minerals Deal',
      description: 'Secure bilateral access to rare earths, lithium, or semiconductors. Locks in a supply partner and signals economic alignment.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: { self: { economic: 6 }, target: { economic: 5 } },
      effects2nd: [
        { prob: 0.40, effect: { adversary_relationship: -8 }, label: 'Excluded powers view deal as economic bloc formation' },
        { prob: 0.25, effect: { self: { domestic: 4 } }, label: 'Domestic industry lobbies applaud supply security' }
      ],
      effects3rd: [
        { condition: 'third_party_involved', effect: { third_party: { relationships_us: -5 } }, label: 'Non-aligned states read deal as coercive alignment pressure' }
      ],
      domains: ['supply_chain'],
      tooltip: 'Economic lock-in. Builds resilience but draws adversary reaction.'
    },
    {
      id: 'supply_chain_chokepoint',
      domain: 'supply_chain',
      name: 'Chokepoint Seizure',
      description: 'Threaten or seize control of a critical supply route — a strait, port, or processing facility — to pressure a rival.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { economic: 4 }, target: { economic: -15 } },
      effects2nd: [
        { prob: 0.35, effect: { self: { domestic: -6 } }, label: 'Global backlash raises domestic political cost' },
        { prob: 0.25, effect: { target: { military: 4 } }, label: 'Target mobilizes to defend threatened route' }
      ],
      effects3rd: [
        { condition: 'third_party_involved', effect: { third_party: { economic: -8 } }, label: 'Third parties suffer collateral supply disruption' }
      ],
      domains: ['supply_chain'],
      tooltip: 'High leverage, high cost. Risks third-party blowback.'
    },
    {
      id: 'tech_export_ban',
      domain: 'supply_chain',
      name: 'Technology Export Ban',
      description: 'Prohibit sale of advanced chips, manufacturing equipment, or dual-use tech to the target. Slows their military and economic modernization.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: { self: { economic: -4 }, target: { economic: -10 } },
      effects2nd: [
        { prob: 0.40, effect: { target: { military: -5 } }, label: "Target's defense modernization slowed" },
        { prob: 0.30, effect: { ally_relationships: -6 }, label: 'Allies resist being forced into decoupling' }
      ],
      effects3rd: [],
      domains: ['supply_chain'],
      tooltip: 'Self-costly. Forces decoupling but strains allies.'
    },
    {
      id: 'reshoring_investment',
      domain: 'supply_chain',
      name: 'Industrial Reshoring',
      description: 'Fund domestic production of critical inputs: semiconductors, rare earths, pharmaceuticals. Long-term resilience at short-term economic cost.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { economic: -5, military: 3, domestic: 4 } },
      effects2nd: [
        { prob: 0.35, effect: { ally_relationships: 5 }, label: 'Allies see a stable supply partner emerging' },
        { prob: 0.20, effect: { self: { economic: 4 } }, label: 'Early industrial gains offset some costs' }
      ],
      effects3rd: [],
      domains: ['supply_chain'],
      tooltip: 'Short-term economic cost. Some early gains possible; allies may warm to a stable supply partner.'
    },

    // ── AUTONOMOUS ────────────────────────────────────────────────────────────
    {
      id: 'drone_swarm_deploy',
      domain: 'autonomous',
      name: 'Drone Swarm Deployment',
      description: 'Deploy autonomous UCAV swarms into a contested zone. Low political cost per unit, but high escalation risk if engagement rules are crossed.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 1,
      effects1st: { self: { military: 7 }, target: { military: -5 } },
      effects2nd: [
        { prob: 0.30, effect: { self: { domestic: -4 } }, label: 'Domestic opposition to autonomous weapons use' },
        { prob: 0.25, effect: { target: { cyber: -4 } }, label: 'Swarm disrupts adversary comms and sensor networks' }
      ],
      effects3rd: [
        { condition: 'third_party_involved', effect: { third_party: { relationships_us: -7 } }, label: 'Non-aligned states alarmed by autonomous escalation precedent' }
      ],
      domains: ['autonomous'],
      tooltip: 'High signal. Lower cost than boots. Escalation unpredictable.'
    },
    {
      id: 'autonomous_defense_net',
      domain: 'autonomous',
      name: 'Autonomous Defense Net',
      description: 'Deploy AI-driven sensor fusion and intercept layers around key installations. Reduces adversary first-strike confidence.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { military: 5, cyber: 3 } },
      effects2nd: [
        { prob: 0.25, effect: { self: { domestic: -3 } }, label: 'Civil liberties concerns over AI-controlled weapons' },
        { prob: 0.20, effect: { adversary_relationship: -5 }, label: 'Adversaries read net as preparation for first strike' }
      ],
      effects3rd: [],
      domains: ['autonomous'],
      tooltip: 'Defensive posture. Reduces adversary risk appetite.'
    },
    {
      id: 'counter_swarm_ops',
      domain: 'autonomous',
      name: 'Counter-Swarm Operations',
      description: 'Electronic warfare and kinetic intercepts target adversary drone swarms. Degrades their autonomous warfare advantage.',
      cost: 2,
      requiresTarget: true,
      escalationDelta: 0,
      effects1st: { self: { military: 3, cyber: 4 }, target: { military: -6 } },
      effects2nd: [
        { prob: 0.40, effect: { crisis_escalation: 1 }, label: 'Kinetic intercepts escalate rules of engagement' },
        { prob: 0.25, effect: { self: { cyber: 4 } }, label: 'EW data improves own cyber posture' }
      ],
      effects3rd: [],
      domains: ['autonomous'],
      tooltip: 'Counters drone advantage. Risks conventional escalation.'
    },
    {
      id: 'ai_surveillance_grid',
      domain: 'autonomous',
      name: 'AI Surveillance Grid',
      description: 'Expand AI-curated intelligence collection over the target region. Improves perception accuracy and early warning.',
      cost: 1,
      requiresTarget: false,
      escalationDelta: 0,
      effects1st: { self: { info: 8, cyber: 3 } },
      effects2nd: [
        { prob: 0.30, effect: { adversary_relationship: -6 }, label: 'Adversaries detect surveillance expansion' },
        { prob: 0.20, effect: { ally_relationships: -4 }, label: 'Allies raise data sovereignty concerns' }
      ],
      effects3rd: [],
      domains: ['autonomous'],
      tooltip: 'Intel gain. Improves epistemic accuracy for 2–3 turns.'
    }
  ];

  function getAll() { return ACTIONS; }

  function getByDomain(domain) {
    return ACTIONS.filter(a => a.domain === domain);
  }

  function getById(id) {
    return ACTIONS.find(a => a.id === id);
  }

  function getDomainList() {
    return ['military', 'economic', 'diplomatic', 'cyber', 'info', 'domestic', 'supply_chain', 'autonomous'];
  }

  function getDomainLabel(domain) {
    return {
      military: 'Military',
      economic: 'Economic',
      diplomatic: 'Diplomatic',
      cyber: 'Cyber',
      info: 'Information',
      domestic: 'Domestic',
      supply_chain: 'Supply Chain',
      autonomous: 'Autonomous'
    }[domain] || domain;
  }

  function getDomainIcon(domain) {
    return {
      military: '⚔️',
      economic: '💰',
      diplomatic: '🕊️',
      cyber: '💻',
      info: '📡',
      domestic: '🏛️',
      supply_chain: '⛓️',
      autonomous: '🤖'
    }[domain] || '●';
  }

  return { getAll, getByDomain, getById, getDomainList, getDomainLabel, getDomainIcon };
})();
