const users = require('./users');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Goal = require('./models/Goal');
const { computeGoalAnalytics } = require('./utils/goalAnalytics');
const {
  generateSuggestions,
  generateMockSuggestions,
  MIN_SUGGESTIONS,
} = require('./services/aiSuggestionService');

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to MongoDB using local loopback IP configuration
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/goalTracker';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Successfully'))
  .catch(err => console.error('Database connection failed:', err.message));

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: dbState === 1,
    db: dbState === 1 ? 'connected' : 'disconnected',
    port: Number(process.env.PORT) || 5000,
  });
});

// LOGIN API ROUTE
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);

    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Routes
// Aggregated analytics for dashboard (single DB query)
app.get('/api/goals/analytics', async (req, res) => {
  try {
    const role = req.query.role || 'employee';
    const goals = await Goal.find({ role })
      .select('title progress status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const analytics = computeGoalAnalytics(goals);
    console.log(`GET /api/goals/analytics → total=${analytics.totalGoals}, avg=${analytics.averageProgressPercentage}%`);
    res.json(analytics);
  } catch (err) {
    console.error('GET /api/goals/analytics failed:', err);
    res.status(500).json({ error: 'Failed to fetch goal analytics', details: err.message });
  }
});

// Get all goals filtered by role context
app.get('/api/goals', async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role ? { role } : {};
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    console.log(`GET /api/goals → ${goals.length} goal(s)`);
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals failed:', err);
    res.status(500).json({ error: 'Failed to fetch goals', details: err.message });
  }
});

// Create a new goal with rule-based checks
app.post('/api/goals', async (req, res) => {
  try {
    // This will print every incoming payload directly to your VS Code terminal!
    console.log('--- INCOMING WEB REQUEST DATA ---');
    console.log(req.body);

    const { title, description, thrustArea, uomType, targetValue, weightage, role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role context is required' });
    }
    
    // Safety Fallback Check: Parse incoming numbers explicitly to avoid string concatenation bugs
    const parsedWeightage = Number(weightage) || 0;
    const parsedTargetValue = Number(targetValue) || 0;

    if (parsedWeightage < 10) {
      return res.status(400).json({ error: 'Rule Violation: Minimum weightage per individual goal is 10%' });
    }

    // Business Logic Constraints Rules Validation
    const userGoals = await Goal.find({ role: 'employee' });
    
    if (userGoals.length >= 8) {
      return res.status(400).json({ error: 'Rule Violation: Maximum limit of 8 goals per employee reached.' });
    }
    
    const currentTotalWeightage = userGoals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
    if (currentTotalWeightage + parsedWeightage > 100) {
      return res.status(400).json({ 
        error: `Rule Violation: Combined weightage cannot exceed 100%. Current running total: ${currentTotalWeightage}%` 
      });
    }

    // Creating document object with defensive defaults for Phase 1 and Phase 2 fields
    const newGoal = new Goal({
      title: title || 'Untitled Goal',
      description: description || '',
      thrustArea: thrustArea || 'General',
      uomType: uomType || 'Numeric',
      targetValue: String(targetValue || ''), 
      weightage: parsedWeightage,
      role: role,
      status: req.body.status || 'Not Started',
      progress: req.body.progress !== undefined ? Number(req.body.progress) : 0
    });

    const savedGoal = await newGoal.save();
    console.log('🎉 Goal successfully committed to MongoDB collection!');
    res.status(201).json(savedGoal);

  } catch (err) {
    // FORCE ERROR TO PRINT TO TERMINAL REGARDLESS OF EXPRESS STATE
    console.error('❌ CRASH DETECTED IN POST /API/GOALS ROUTE:');
    console.error(err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation Error', details: err.message });
    }

    res.status(500).json({ 
      error: 'Failed to create goal document inside database.', 
      details: err.message 
    });
  }
});

// Update a goal (Progress, Status, etc.)
app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`--- PUT REQUEST TO UPDATE GOAL ${id} ---`);
    console.log(updates);
    
    // Automatically manage status based on progress if progress is sent
    if (updates.progress !== undefined) {
      if (updates.progress < 0 || updates.progress > 100) {
        return res.status(400).json({ error: 'Progress must be between 0 and 100' });
      }
      if (updates.progress === 0) updates.status = 'Not Started';
      else if (updates.progress === 100) updates.status = 'Completed';
      else updates.status = 'In Progress';
    }

    const updatedGoal = await Goal.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updatedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(updatedGoal);
  } catch (err) {
    console.error(`❌ CRASH DETECTED IN PUT /API/GOALS/${req.params.id} ROUTE:`, err);
    res.status(500).json({ error: 'Failed to update goal', details: err.message });
  }
});

// Delete a goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`--- DELETE REQUEST FOR GOAL ${id} ---`);
    const deletedGoal = await Goal.findByIdAndDelete(id);
    if (!deletedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal successfully deleted', id });
  } catch (err) {
    console.error(`❌ CRASH DETECTED IN DELETE /API/GOALS/${req.params.id} ROUTE:`, err);
    res.status(500).json({ error: 'Failed to delete goal', details: err.message });
  }
});

// Manager Dashboard Metrics
app.get('/api/dashboard/manager', async (req, res) => {
  try {
    const allGoals = await Goal.find().lean();
    
    // Calculate team goals (total goals in system)
    const totalGoals = allGoals.length;
    
    // Calculate pending approvals (goals in progress that may need review)
    const pendingApprovals = allGoals.filter(g => g.status === 'In Progress').length;
    
    // Calculate team velocity (average progress across all goals)
    const averageProgress = allGoals.length > 0 
      ? Math.round(allGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / allGoals.length)
      : 0;
    
    // Get recent team goals for the list
    const recentGoals = await Goal.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log(`GET /api/dashboard/manager → totalGoals=${totalGoals}, pending=${pendingApprovals}, velocity=${averageProgress}%`);
    res.json({
      totalGoals,
      pendingApprovals,
      teamVelocity: averageProgress,
      recentGoals,
      completedGoals: allGoals.filter(g => g.status === 'Completed').length
    });
  } catch (err) {
    console.error('GET /api/dashboard/manager failed:', err);
    res.status(500).json({ error: 'Failed to fetch manager dashboard data', details: err.message });
  }
});

// Admin Dashboard Metrics
app.get('/api/dashboard/admin', async (req, res) => {
  try {
    const allGoals = await Goal.find().lean();
    
    // Calculate total users (unique roles in goals)
    const uniqueRoles = new Set(allGoals.map(g => g.role));
    const totalUsers = uniqueRoles.size;
    
    // Calculate total goals
    const totalGoals = allGoals.length;
    
    // Calculate active goals (not completed)
    const activeGoals = allGoals.filter(g => g.status !== 'Completed').length;
    
    // Calculate system health (based on goal completion rate)
    const completedGoals = allGoals.filter(g => g.status === 'Completed').length;
    const systemHealth = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100)
      : 100;
    
    // Calculate locked goals (goals not started)
    const lockedGoals = allGoals.filter(g => g.status === 'Not Started').length;
    
    // Get system alerts (recent goals that need attention)
    const systemAlerts = allGoals
      .filter(g => g.status === 'In Progress')
      .sort({ createdAt: -1 })
      .slice(0, 5)
      .map(g => ({
        id: g._id,
        title: g.title,
        status: g.status,
        progress: g.progress,
        createdAt: g.createdAt
      }));
    
    console.log(`GET /api/dashboard/admin → users=${totalUsers}, goals=${totalGoals}, health=${systemHealth}%`);
    res.json({
      totalUsers,
      totalGoals,
      activeGoals,
      systemHealth,
      lockedGoals,
      systemAlerts
    });
  } catch (err) {
    console.error('GET /api/dashboard/admin failed:', err);
    res.status(500).json({ error: 'Failed to fetch admin dashboard data', details: err.message });
  }
});

// AI Goal Suggestions — always returns { success: true, suggestions: [...] }
app.get('/api/ai/suggestions', async (req, res) => {
  const role = String(req.query.role || 'employee');
  const thrustArea = String(req.query.thrustArea || '').trim();
  const averageProgress = Number(req.query.averageProgress) || 0;
  const goalCount = Number(req.query.goalCount) || 0;

  // Pipe-delimited titles from query (URLSearchParams encodes safely)
  let existingTitles = [];
  if (typeof req.query.existingTitles === 'string' && req.query.existingTitles.length > 0) {
    existingTitles = req.query.existingTitles.split('|').map((t) => t.trim()).filter(Boolean);
  }

  const context = {
    role,
    thrustArea: thrustArea || undefined,
    averageProgress,
    goalCount,
    existingTitles,
  };

  console.log('[AI] GET /api/ai/suggestions — context:', context);

  const sendOk = (suggestions, source) => {
    let list = Array.isArray(suggestions) ? suggestions : [];
    if (list.length < MIN_SUGGESTIONS) {
      console.warn(`[AI] Only ${list.length} suggestion(s); regenerating fallback`);
      list = generateMockSuggestions(context);
    }
    if (list.length < MIN_SUGGESTIONS) {
      list = generateMockSuggestions({ role: 'employee' });
    }
    console.log(`[AI] Responding with ${list.length} suggestion(s) (${source})`);
    return res.status(200).json({
      success: true,
      suggestions: list,
      count: list.length,
      source,
      generatedAt: new Date().toISOString(),
    });
  };

  try {
    const suggestions = await generateSuggestions(context);
    return sendOk(suggestions, process.env.OPENAI_API_KEY ? 'openai' : 'mock');
  } catch (err) {
    console.error('[AI] generateSuggestions failed:', err);
    return sendOk(generateMockSuggestions(context), 'mock-fallback');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});