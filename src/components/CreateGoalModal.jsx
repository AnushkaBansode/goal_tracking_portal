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

const UOM_TYPES = ['Numeric', 'Percentage', 'Timeline', 'Zero-based'];

const EMPTY_FORM = {
  title: '',
  description: '',
  thrustArea: '',
  uomType: 'Numeric',
  targetValue: '',
  weightage: 10,
};

export default function CreateGoalModal({ isOpen, onClose, onSuccess, initialGoal = null }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill form when accepting an AI suggestion (or other external seed data)
  useEffect(() => {
    if (isOpen && initialGoal) {
      setFormData({
        title: initialGoal.title || '',
        description: initialGoal.description || '',
        thrustArea: initialGoal.thrustArea || '',
        uomType: initialGoal.uomType || 'Numeric',
        targetValue: initialGoal.targetValue != null ? String(initialGoal.targetValue) : '',
        weightage: Number(initialGoal.weightage) || 10,
      });
      setError('');
    } else if (isOpen && !initialGoal) {
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weightage' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Rule Enforcement Check
    if (formData.weightage < 10) {
      setError('Validation Error: Minimum weightage per goal is 10%');
      return;
    }

    setIsSubmitting(true);
    
    const trimmedTarget = formData.targetValue.trim();
    if (!trimmedTarget) {
      setError('Form Error: Target Value is required.');
      setIsSubmitting(false);
      return;
    }

    // Timeline goals may use non-numeric targets (e.g. "Q3")
    let serializedTarget = trimmedTarget;
    if (formData.uomType !== 'Timeline') {
      const numericTargetValue = Number(trimmedTarget.replace(/[^0-9.]/g, ''));
      if (isNaN(numericTargetValue)) {
        setError('Form Error: Target Value must be a valid number.');
        setIsSubmitting(false);
        return;
      }
      serializedTarget = String(numericTargetValue);
    }

    try {
      const { data } = await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thrustArea: formData.thrustArea,
          uomType: formData.uomType,
          targetValue: serializedTarget,
          weightage: Number(formData.weightage),
          role: 'employee'
        })
      });

      onSuccess(data);
      onClose();
      
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error('[CreateGoalModal] Save failed:', err);
      setError(err.message || 'Could not connect to backend. Run: cd backend && npm start');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h2>Create New Goal</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-form">
          {error && <div className="error-message" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #fca5a5', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
          
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

          <div className="form-row">
            <div className="form-group">
              <label>Thrust Area</label>
              <select name="thrustArea" value={formData.thrustArea} onChange={handleChange} required>
                <option value="">Select Area</option>
                {THRUST_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>UoM Type</label>
              <select name="uomType" value={formData.uomType} onChange={handleChange} required>
                {UOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}