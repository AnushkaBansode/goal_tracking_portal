/**
 * Reusable metric card for dashboard analytics.
 */
export default function AnalyticsCard({ label, value, subtitle, icon, bgClass = 'bg-blue-light', textClass = 'text-blue' }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <span className="analytics-card-label">{label}</span>
        <div className={`analytics-card-icon ${bgClass}`}>
          <span className={textClass}>{icon}</span>
        </div>
      </div>
      <div className="analytics-card-value">{value}</div>
      {subtitle && (
        <p className={`analytics-card-subtitle ${subtitle.variant || 'neutral'}`}>{subtitle.text}</p>
      )}
    </div>
  );
}
