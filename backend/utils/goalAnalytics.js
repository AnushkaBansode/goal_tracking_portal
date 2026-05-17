/**
 * Compute goal analytics from a list of goal documents.
 * Used by GET /api/goals/analytics and kept in sync with frontend utils.
 */
function computeGoalAnalytics(goals) {
  const list = Array.isArray(goals) ? goals : [];
  const totalGoals = list.length;

  const completedGoals = list.filter(
    (g) => g.status === 'Completed' || Number(g.progress) >= 100
  ).length;

  const averageProgress = totalGoals === 0
    ? 0
    : list.reduce((sum, g) => sum + (Number(g.progress) || 0), 0) / totalGoals;

  const overallCompletionPercentage = totalGoals === 0
    ? 0
    : (completedGoals / totalGoals) * 100;

  // Chart: up to 8 most recent goals (caller should sort by createdAt desc)
  const chartData = list.slice(0, 8).map((g) => {
    const title = g.title || 'Untitled';
    return {
      name: title.length > 20 ? `${title.slice(0, 20)}…` : title,
      fullTitle: title,
      progress: Number(g.progress) || 0,
      status: g.status || 'Not Started',
    };
  });

  return {
    totalGoals,
    completedGoals,
    averageProgressPercentage: Math.round(averageProgress),
    overallCompletionPercentage: Math.round(overallCompletionPercentage),
    chartData,
  };
}

module.exports = { computeGoalAnalytics };
