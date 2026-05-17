import { useMemo } from 'react';
import { Target, CheckCircle, TrendingUp, PieChart, AlertCircle, RefreshCw } from 'lucide-react';
import { computeGoalAnalytics } from '../../utils/goalAnalytics';
import AnalyticsCard from './AnalyticsCard';
import GoalProgressChart from './GoalProgressChart';
import './GoalAnalyticsSection.css';

/**
 * Employee dashboard analytics: metric cards + progress chart.
 * Metrics recompute from `goals` whenever goals change (create/edit/delete/progress).
 */
export default function GoalAnalyticsSection({ goals, loading, error, onRetry }) {
  const analytics = useMemo(() => computeGoalAnalytics(goals), [goals]);

  if (loading) {
    return (
      <section className="goal-analytics-section" aria-busy="true" aria-label="Goal analytics loading">
        <h3 className="analytics-section-title">Goal Analytics</h3>
        <div className="analytics-cards-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="analytics-card analytics-card-skeleton" />
          ))}
        </div>
        <div className="analytics-chart-card analytics-chart-skeleton" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="goal-analytics-section">
        <div className="analytics-error" role="alert">
          <AlertCircle size={22} />
          <div>
            <p className="analytics-error-title">Could not load analytics</p>
            <p className="analytics-error-message">{error}</p>
          </div>
          {onRetry && (
            <button type="button" className="btn-secondary analytics-retry-btn" onClick={onRetry}>
              <RefreshCw size={16} />
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="goal-analytics-section" aria-label="Goal analytics">
      <h3 className="analytics-section-title">Goal Analytics</h3>

      <div className="analytics-cards-grid">
        <AnalyticsCard
          label="Total Goals"
          value={analytics.totalGoals}
          icon={<Target size={20} />}
          bgClass="bg-blue-light"
          textClass="text-blue"
          subtitle={{
            text: analytics.totalGoals === 0 ? 'Create your first goal' : 'Active in your portfolio',
            variant: 'neutral',
          }}
        />
        <AnalyticsCard
          label="Completed Goals"
          value={analytics.completedGoals}
          icon={<CheckCircle size={20} />}
          bgClass="bg-green-light"
          textClass="text-green"
          subtitle={{
            text: `${analytics.completedGoals} of ${analytics.totalGoals} finished`,
            variant: analytics.completedGoals > 0 ? 'positive' : 'neutral',
          }}
        />
        <AnalyticsCard
          label="Average Progress"
          value={`${analytics.averageProgressPercentage}%`}
          icon={<TrendingUp size={20} />}
          bgClass="bg-purple-light"
          textClass="text-purple"
          subtitle={{
            text: 'Mean progress across all goals',
            variant: 'neutral',
          }}
        />
        <AnalyticsCard
          label="Overall Completion"
          value={`${analytics.overallCompletionPercentage}%`}
          icon={<PieChart size={20} />}
          bgClass="bg-blue-light"
          textClass="text-blue"
          subtitle={{
            text: 'Share of goals marked complete',
            variant: analytics.overallCompletionPercentage >= 50 ? 'positive' : 'neutral',
          }}
        />
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-header">
          <h4>Progress by Goal</h4>
          <span className="analytics-chart-hint">Up to 8 most recent goals</span>
        </div>
        <GoalProgressChart chartData={analytics.chartData} />
      </div>
    </section>
  );
}
