import { Sparkles, Target, TrendingUp, Check, X } from 'lucide-react';

const PRIORITY_STYLES = {
  High: 'priority-high',
  Medium: 'priority-medium',
  Low: 'priority-low',
};

/**
 * Single AI-generated goal suggestion card with accept / reject actions.
 */
export default function AISuggestionCard({ suggestion, onAccept, onReject, index = 0 }) {
  const priorityClass = PRIORITY_STYLES[suggestion.priority] || 'priority-medium';

  return (
    <article
      className="ai-suggestion-card fade-in"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="ai-suggestion-card-top">
        <div className="ai-suggestion-icon">
          <Sparkles size={18} />
        </div>
        <span className={`ai-priority-badge ${priorityClass}`}>{suggestion.priority}</span>
      </div>

      <h4 className="ai-suggestion-title">{suggestion.title}</h4>
      <p className="ai-suggestion-description">{suggestion.description}</p>

      <ul className="ai-suggestion-meta">
        <li>
          <Target size={14} />
          <span>{suggestion.thrustArea}</span>
        </li>
        <li>
          <TrendingUp size={14} />
          <span>Target: {suggestion.suggestedTarget}</span>
        </li>
      </ul>

      <p className="ai-suggestion-impact">
        <strong>Impact:</strong> {suggestion.estimatedImpact}
      </p>

      <div className="ai-suggestion-actions">
        <button type="button" className="btn-primary ai-accept-btn" onClick={() => onAccept(suggestion)}>
          <Check size={16} />
          Accept Goal
        </button>
        <button type="button" className="btn-secondary ai-reject-btn" onClick={() => onReject(suggestion)}>
          <X size={16} />
          Reject
        </button>
      </div>
    </article>
  );
}
