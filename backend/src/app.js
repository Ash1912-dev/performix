const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimiter = require('./middleware/rateLimitMiddleware');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const goalRoutes = require('./routes/goalRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const auditRoutes = require('./routes/auditRoutes');
const sharedGoalRoutes = require('./routes/sharedGoalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const escalationRoutes = require('./routes/escalationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
require('./cron/escalationCron');

const app = express();

// Security & logging
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/shared-goals', sharedGoalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/escalation', escalationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check for frontend wake-up detection
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Performix API is running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Performix API running...' });
});

// Debug route — remove after testing
app.get('/api/debug/mydata', async (req, res) => {
  try {
    const { email } = req.query;
    const User = require('./models/User');
    const GoalSheet = require('./models/GoalSheet');
    const CheckIn = require('./models/CheckIn');
    const user = await User.findOne({ email });
    if (!user) return res.json({ error: 'User not found' });
    const sheet = await GoalSheet.findOne({ employeeId: user._id }).populate('goals');
    const checkins = await CheckIn.find({ employeeId: user._id }).populate('goalId');
    res.json({ user: { _id: user._id, name: user.name, role: user.role }, sheet, checkins });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0].toUpperCase()
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            method: Object.keys(handler.route.methods)[0].toUpperCase()
          });
        }
      });
    }
  });
  res.json(routes);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected...');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
