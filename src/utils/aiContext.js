import { apiFetch } from '../api';

/**
 * Normalize API payload into render-ready suggestion objects.
 */
export function parseAISuggestionsResponse(data) {
  if (!data || data.success === false) return [];

  const raw = Array.isArray(data.suggestions)
    ? data.suggestions
    : Array.isArray(data)
      ? data
      : [];

  return raw.map((item, index) => ({
    ...item,
    id: item.id || `ai-${Date.now()}-${index}`,
    title: item.title || 'Untitled Goal',
    description: item.description || '',
    thrustArea: item.thrustArea || 'Operational Excellence',
    suggestedTarget: item.suggestedTarget ?? item.targetValue ?? '10',
    priority: item.priority || 'Medium',
    estimatedImpact: item.estimatedImpact || '10% improvement in team performance',
    uomType: item.uomType || 'Numeric',
    weightage: Number(item.weightage) || 10,
  }));
}

/**
 * Fetch AI suggestions — retries with minimal query if contextual request returns empty.
 */
export async function fetchAISuggestions(goals, analytics, role = 'employee') {
  const { params } = buildAISuggestionContext(goals, analytics, role);

  const request = async (queryString) => {
    const { data } = await apiFetch(`/api/ai/suggestions?${queryString}`);
    return parseAISuggestionsResponse(data);
  };

  let list = await request(params.toString());

  if (list.length === 0) {
    console.warn('[AI] Contextual request returned empty; retrying with role-only query');
    const fallbackParams = new URLSearchParams({ role });
    list = await request(fallbackParams.toString());
  }

  return list;
}

/**
 * Build query context for AI suggestions from current goals + analytics.
 */
export function buildAISuggestionContext(goals, analytics, role = 'employee') {
  const list = Array.isArray(goals) ? goals : [];

  const thrustCounts = {};
  list.forEach((g) => {
    if (g.thrustArea) {
      thrustCounts[g.thrustArea] = (thrustCounts[g.thrustArea] || 0) + 1;
    }
  });

  const dominantThrustArea = Object.entries(thrustCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  const params = new URLSearchParams({
    role,
    averageProgress: String(analytics?.averageProgressPercentage ?? 0),
    goalCount: String(list.length),
    existingTitles: list.slice(0, 10).map((g) => g.title).join('|'),
  });

  if (dominantThrustArea) {
    params.set('thrustArea', dominantThrustArea);
  }

  return { params, dominantThrustArea };
}

/** Map an AI suggestion into Create Goal modal initial values */
export function suggestionToInitialGoal(suggestion) {
  return {
    title: suggestion.title || '',
    description: suggestion.description || '',
    thrustArea: suggestion.thrustArea || '',
    uomType: suggestion.uomType || 'Numeric',
    targetValue: String(suggestion.suggestedTarget ?? suggestion.targetValue ?? ''),
    weightage: Number(suggestion.weightage) || 10,
  };
}
