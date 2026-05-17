import { useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Wand2 } from 'lucide-react';
import { fetchAISuggestions } from '../../utils/aiContext';
import AISuggestionCard from './AISuggestionCard';
import './AISuggestionsSection.css';

/**
 * AI Suggestions panel — fetches contextual goals on demand when user clicks Generate.
 */
export default function AISuggestionsSection({ goals, analytics, role, onAcceptSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const list = await fetchAISuggestions(goals, analytics, role);

      setSuggestions(list);
      setHasGenerated(true);

      if (list.length === 0) {
        console.error('[AISuggestionsSection] API returned no suggestions after retry');
        setError('AI service unavailable. Start backend: cd backend && npm start');
      }
    } catch (err) {
      console.error('[AISuggestionsSection] generate failed:', err);
      setError(err.message || 'Failed to reach AI suggestions API');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (suggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  return (
    <section className="ai-suggestions-section" aria-label="AI Suggestions">
      <div className="ai-suggestions-header">
        <div className="ai-suggestions-heading">
          <div className="ai-section-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h3>AI Suggestions</h3>
            <p className="ai-section-subtitle">
              Smart goals based on your thrust areas, progress, and existing portfolio
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary ai-generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="ai-spinner" aria-hidden />
              Generating…
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generate AI Goals
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="ai-error-banner" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" className="btn-link" onClick={handleGenerate}>
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="ai-loading-grid" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ai-suggestion-card ai-suggestion-skeleton" />
          ))}
        </div>
      )}

      {!loading && hasGenerated && suggestions.length > 0 && (
        <div className="ai-suggestions-grid">
          {suggestions.map((suggestion, index) => (
            <AISuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
              onAccept={onAcceptSuggestion}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {!loading && !hasGenerated && !error && (
        <div className="ai-empty-state">
          <Sparkles size={32} className="ai-empty-icon" />
          <p>Click <strong>Generate AI Goals</strong> to get personalized recommendations.</p>
        </div>
      )}

      {!loading && hasGenerated && suggestions.length === 0 && !error && (
        <div className="ai-empty-state">
          <p>All suggestions were dismissed.</p>
          <button type="button" className="btn-secondary" onClick={handleGenerate}>
            <RefreshCw size={16} />
            Generate again
          </button>
        </div>
      )}
    </section>
  );
}
