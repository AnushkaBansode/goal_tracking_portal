/**
 * AI Goal Suggestion Service
 * --------------------------
 * Mock suggestions with contextual ranking + guaranteed minimum count.
 * Future: set OPENAI_API_KEY and implement callOpenAI().
 */

const MIN_SUGGESTIONS = 3;
const MAX_SUGGESTIONS = 5;

const THRUST_AREAS = [
  'Innovation & R&D',
  'Customer Success',
  'Operational Excellence',
  'Revenue Growth',
  'Team Development',
];

/** Primary pool — diverse business goals with priority + impact % */
const SUGGESTION_POOL = [
  {
    title: 'Increase automated test coverage',
    description: 'Expand unit and integration tests for core services to reduce regression risk.',
    thrustArea: 'Innovation & R&D',
    suggestedTarget: '85',
    priority: 'High',
    estimatedImpact: '22% reduction in production defects',
    uomType: 'Percentage',
    weightage: 15,
  },
  {
    title: 'Reduce average ticket response time',
    description: 'Introduce tier-1 macros and a knowledge base to speed up first responses.',
    thrustArea: 'Customer Success',
    suggestedTarget: '25',
    priority: 'High',
    estimatedImpact: '18% improvement in CSAT scores',
    uomType: 'Percentage',
    weightage: 15,
  },
  {
    title: 'Streamline deployment pipeline',
    description: 'Automate staging deploys and add smoke tests before production promotion.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '40',
    priority: 'Medium',
    estimatedImpact: '15% faster release cycles',
    uomType: 'Percentage',
    weightage: 12,
  },
  {
    title: 'Grow qualified pipeline by Q3',
    description: 'Partner with marketing on outbound sequences for mid-market accounts.',
    thrustArea: 'Revenue Growth',
    suggestedTarget: 'Q3',
    priority: 'High',
    estimatedImpact: '12% pipeline growth quarter-over-quarter',
    uomType: 'Timeline',
    weightage: 20,
  },
  {
    title: 'Complete leadership skills workshop',
    description: 'Finish the internal mentorship program and peer feedback sessions.',
    thrustArea: 'Team Development',
    suggestedTarget: '100',
    priority: 'Medium',
    estimatedImpact: '20% faster onboarding for new hires',
    uomType: 'Percentage',
    weightage: 10,
  },
  {
    title: 'Ship two customer-facing experiments',
    description: 'Run A/B tests on onboarding flows with measurable conversion lift.',
    thrustArea: 'Innovation & R&D',
    suggestedTarget: '2',
    priority: 'Medium',
    estimatedImpact: '8% lift in trial-to-paid conversion',
    uomType: 'Numeric',
    weightage: 15,
  },
  {
    title: 'Cut infrastructure cost per user',
    description: 'Right-size cloud resources and enable autoscaling on peak workloads.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '15',
    priority: 'Low',
    estimatedImpact: '10% savings on monthly cloud spend',
    uomType: 'Percentage',
    weightage: 10,
  },
  {
    title: 'Close enterprise renewal backlog',
    description: 'Prioritize at-risk accounts with executive check-ins and success plans.',
    thrustArea: 'Revenue Growth',
    suggestedTarget: '90',
    priority: 'High',
    estimatedImpact: '25% improvement in renewal rate',
    uomType: 'Percentage',
    weightage: 18,
  },
  {
    title: 'Establish weekly team knowledge share',
    description: 'Rotate presenters on tools, incidents, and wins to spread expertise.',
    thrustArea: 'Team Development',
    suggestedTarget: '12',
    priority: 'Low',
    estimatedImpact: '14% improvement in cross-team collaboration',
    uomType: 'Numeric',
    weightage: 10,
  },
  {
    title: 'Improve NPS on onboarding cohort',
    description: 'Survey new users at day 7 and address top three friction themes.',
    thrustArea: 'Customer Success',
    suggestedTarget: '50',
    priority: 'Medium',
    estimatedImpact: '16% increase in Net Promoter Score',
    uomType: 'Numeric',
    weightage: 12,
  },
  {
    title: 'Launch partner referral program',
    description: 'Incentivize existing clients to refer qualified leads with tracked attribution.',
    thrustArea: 'Revenue Growth',
    suggestedTarget: '30',
    priority: 'Medium',
    estimatedImpact: '11% new revenue from partner channel',
    uomType: 'Percentage',
    weightage: 14,
  },
  {
    title: 'Standardize incident postmortems',
    description: 'Document root causes and action items within 48 hours of Sev-2 incidents.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '100',
    priority: 'High',
    estimatedImpact: '30% reduction in repeat incidents',
    uomType: 'Percentage',
    weightage: 12,
  },
  {
    title: 'Publish quarterly product roadmap brief',
    description: 'Align stakeholders on priorities, risks, and measurable outcomes for the quarter.',
    thrustArea: 'Innovation & R&D',
    suggestedTarget: '1',
    priority: 'Low',
    estimatedImpact: '12% better alignment on delivery priorities',
    uomType: 'Numeric',
    weightage: 10,
  },
  {
    title: 'Reduce churn in first 90 days',
    description: 'Proactive outreach for accounts showing low product adoption signals.',
    thrustArea: 'Customer Success',
    suggestedTarget: '20',
    priority: 'High',
    estimatedImpact: '19% decrease in early-stage churn',
    uomType: 'Percentage',
    weightage: 16,
  },
  {
    title: 'Mentor two junior team members',
    description: 'Pair on deliverables and provide bi-weekly career development feedback.',
    thrustArea: 'Team Development',
    suggestedTarget: '2',
    priority: 'Medium',
    estimatedImpact: '24% improvement in team retention',
    uomType: 'Numeric',
    weightage: 10,
  },
];

/** Used when contextual filtering leaves too few items */
const FALLBACK_SUGGESTIONS = [
  {
    title: 'Define quarterly OKR milestones',
    description: 'Set measurable checkpoints for your top three priorities this quarter.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '3',
    priority: 'High',
    estimatedImpact: '20% clearer progress tracking',
    uomType: 'Numeric',
    weightage: 10,
  },
  {
    title: 'Improve weekly customer check-ins',
    description: 'Schedule structured touchpoints with key accounts to surface risks early.',
    thrustArea: 'Customer Success',
    suggestedTarget: '10',
    priority: 'Medium',
    estimatedImpact: '15% higher account health scores',
    uomType: 'Numeric',
    weightage: 12,
  },
  {
    title: 'Contribute to process automation initiative',
    description: 'Identify one manual workflow and propose a lightweight automation plan.',
    thrustArea: 'Innovation & R&D',
    suggestedTarget: '1',
    priority: 'Low',
    estimatedImpact: '10% time saved on repetitive tasks',
    uomType: 'Numeric',
    weightage: 10,
  },
  {
    title: 'Hit monthly revenue target',
    description: 'Focus outbound and upsell motions on highest-probability deals in pipeline.',
    thrustArea: 'Revenue Growth',
    suggestedTarget: '100',
    priority: 'High',
    estimatedImpact: '18% progress toward revenue quota',
    uomType: 'Percentage',
    weightage: 15,
  },
  {
    title: 'Complete skills certification',
    description: 'Finish one role-relevant certification to strengthen team capability.',
    thrustArea: 'Team Development',
    suggestedTarget: '1',
    priority: 'Medium',
    estimatedImpact: '12% boost in role readiness',
    uomType: 'Numeric',
    weightage: 10,
  },
];

const LOW_PROGRESS_BOOST = [
  {
    title: 'Define clear milestones for in-flight goals',
    description: 'Break stalled work into weekly checkpoints with visible owners.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '4',
    priority: 'High',
    estimatedImpact: '28% faster completion of lagging goals',
    uomType: 'Numeric',
    weightage: 10,
  },
  {
    title: 'Schedule bi-weekly progress reviews',
    description: 'Align with your manager on blockers and reprioritize as needed.',
    thrustArea: 'Team Development',
    suggestedTarget: '6',
    priority: 'Medium',
    estimatedImpact: '17% improvement in on-time delivery',
    uomType: 'Numeric',
    weightage: 10,
  },
];

const HIGH_GOAL_COUNT_BOOST = [
  {
    title: 'Consolidate overlapping objectives',
    description: 'Merge similar goals to free weightage and sharpen focus.',
    thrustArea: 'Operational Excellence',
    suggestedTarget: '2',
    priority: 'Medium',
    estimatedImpact: '14% simpler portfolio management',
    uomType: 'Numeric',
    weightage: 10,
  },
];

/**
 * Normalize title for duplicate comparison (exact match only).
 */
function normalizeTitle(title) {
  return String(title || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * True only when an existing goal has the same title (not substring match).
 */
function isExactDuplicate(suggestionTitle, existingTitles) {
  const candidate = normalizeTitle(suggestionTitle);
  if (!candidate) return false;
  return existingTitles.some((t) => normalizeTitle(t) === candidate);
}

/**
 * Score contextual relevance for sorting.
 */
function scoreSuggestion(item, context) {
  let score = 0;
  if (context.thrustArea && item.thrustArea === context.thrustArea) score += 5;
  if (context.role === 'employee') score += 1;
  if (context.averageProgress < 40 && item.priority === 'High') score += 2;
  if (context.goalCount >= 6 && item.thrustArea === 'Operational Excellence') score += 2;
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  score += priorityWeight[item.priority] || 0;
  return score;
}

/**
 * Merge unique suggestions by normalized title until target count is met.
 */
function fillToMinimum(selected, sourcePools, existingTitles, targetCount) {
  const seen = new Set(selected.map((s) => normalizeTitle(s.title)));

  for (const pool of sourcePools) {
    for (const item of pool) {
      const key = normalizeTitle(item.title);
      if (seen.has(key)) continue;
      if (isExactDuplicate(item.title, existingTitles)) continue;
      selected.push({ ...item });
      seen.add(key);
      if (selected.length >= targetCount) break;
    }
    if (selected.length >= targetCount) break;
  }

  return selected;
}

/**
 * Assign stable unique ids per response.
 */
function withIds(items) {
  const stamp = Date.now();
  return items.map((item, index) => ({
    id: `ai-${stamp}-${index}`,
    ...item,
  }));
}

/**
 * Build contextual mock suggestions — always returns at least MIN_SUGGESTIONS.
 */
function generateMockSuggestions(context) {
  const {
    role = 'employee',
    thrustArea = '',
    averageProgress = 0,
    goalCount = 0,
    existingTitles = [],
  } = context;

  const existingNormalized = existingTitles
    .map(normalizeTitle)
    .filter(Boolean);

  let pool = [...SUGGESTION_POOL];

  if (averageProgress < 40) {
    pool = [...LOW_PROGRESS_BOOST, ...pool];
  }
  if (goalCount >= 6) {
    pool = [...HIGH_GOAL_COUNT_BOOST, ...pool];
  }

  // Exclude only exact title duplicates (avoids short-substring false positives)
  pool = pool.filter((item) => !isExactDuplicate(item.title, existingNormalized));

  pool.sort(
    (a, b) => scoreSuggestion(b, { role, thrustArea, averageProgress, goalCount })
      - scoreSuggestion(a, { role, thrustArea, averageProgress, goalCount })
  );

  if (thrustArea && THRUST_AREAS.includes(thrustArea)) {
    const inArea = pool.filter((p) => p.thrustArea === thrustArea);
    const other = pool.filter((p) => p.thrustArea !== thrustArea);
    pool = [...inArea, ...other];
  }

  const targetCount = Math.min(
    MAX_SUGGESTIONS,
    Math.max(MIN_SUGGESTIONS, 5 - Math.floor(goalCount / 3))
  );

  let selected = pool.slice(0, targetCount);

  // Fallback: never return fewer than MIN_SUGGESTIONS
  if (selected.length < MIN_SUGGESTIONS) {
    selected = fillToMinimum(
      selected,
      [FALLBACK_SUGGESTIONS, SUGGESTION_POOL, LOW_PROGRESS_BOOST, HIGH_GOAL_COUNT_BOOST],
      existingNormalized,
      MIN_SUGGESTIONS
    );
  }

  // Last resort: allow fallbacks even if titles matched (slightly varied labels)
  if (selected.length < MIN_SUGGESTIONS) {
    const emergency = FALLBACK_SUGGESTIONS.slice(0, MIN_SUGGESTIONS).map((item, i) => ({
      ...item,
      title: `${item.title} (Suggested ${i + 1})`,
    }));
    selected = fillToMinimum(selected, [emergency], [], MIN_SUGGESTIONS);
  }

  return withIds(selected.slice(0, MAX_SUGGESTIONS));
}

async function callOpenAI(context) {
  throw new Error('OpenAI integration not configured');
}

async function generateSuggestions(context) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const fromAi = await callOpenAI(context);
      if (Array.isArray(fromAi) && fromAi.length >= MIN_SUGGESTIONS) {
        return withIds(fromAi.slice(0, MAX_SUGGESTIONS));
      }
    } catch (err) {
      console.error('[AI] OpenAI call failed, falling back to mock:', err.message);
    }
  }

  const suggestions = generateMockSuggestions(context);
  if (suggestions.length < MIN_SUGGESTIONS) {
    console.warn('[AI] Mock generator below minimum; applying emergency fallback');
    return withIds(FALLBACK_SUGGESTIONS.slice(0, MIN_SUGGESTIONS));
  }
  return suggestions;
}

module.exports = {
  generateSuggestions,
  generateMockSuggestions,
  THRUST_AREAS,
  MIN_SUGGESTIONS,
  MAX_SUGGESTIONS,
};
