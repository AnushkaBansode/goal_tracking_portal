import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../api';
import './CreateGoalModal.css';

const THRUST_AREAS = [
  'Innovation & R&D',
  'Customer Success',
  'Operational Excellence',
  'Revenue Growth',
  'Team Development'
];

export default function EditGoalModal({ isOpen, onClose, goal, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thrustArea: '',
    targetValue: '',
    weightage: 10,
    progress: 0
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        thrustArea: goal.thrustArea || '',
        targetValue: goal.targetValue || '',
        weightage: goal.weightage ?? 10,
        progress: goal.progress ?? 0
      });
      setError('');
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weightage' || name === 'progress' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.weightage < 10) {
      setError('Validation Error: Minimum weightage per goal is 10%');
      return;
    }

    if (formData.progress < 0 || formData.progress > 100) {
      setError('Progress must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);

    const numericTargetValue = Number(formData.targetValue.replace(/[^0-9.]/g, ''));
    if (isNaN(numericTargetValue) || formData.targetValue.trim() === '') {
      setError('Form Error: Target Value must be a valid number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data } = await apiFetch(`/api/goals/${goal._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thrustArea: formData.thrustArea,
          targetValue: String(numericTargetValue),
          weightage: Number(formData.weightage),
          progress: Number(formData.progress)
        })
      });

      onSuccess(data);
      onClose();
    } catch (err) {
      console.error('[EditGoalModal] Save failed:', err);
      setError(err.message || 'Could not connect to backend. Run: cd backend && npm start');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h2>Edit Goal</h2>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Goal Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Increase test coverage"
              required
            />
          </div>

          <div className="form-group">
            <label>Goal Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the goal..."
              required
            />
          </div>

          <div className="form-group">
            <label>Thrust Area</label>
            <select name="thrustArea" value={formData.thrustArea} onChange={handleChange} required>
              <option value="">Select Area</option>
              {THRUST_AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Value</label>
              <input
                type="text"
                name="targetValue"
                value={formData.targetValue}
                onChange={handleChange}
                placeholder="e.g., 100"
                required
              />
            </div>

            <div className="form-group">
              <label>Weightage (%)</label>
              <input
                type="number"
                name="weightage"
                value={formData.weightage}
                onChange={handleChange}
                min="10"
                max="100"
                required
              />
              <small>Minimum 10%</small>
            </div>
          </div>

          <div className="form-group">
            <label>Progress ({formData.progress}%)</label>
            <input
              type="range"
              name="progress"
              value={formData.progress}
              onChange={handleChange}
              min="0"
              max="100"
              className="edit-progress-slider"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
