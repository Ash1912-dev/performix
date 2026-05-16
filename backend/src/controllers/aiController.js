const { suggestGoal } = require('../utils/groqService');

// Simple in-memory rate limiter: userId → { count, resetAt }
const rateLimitMap = new Map();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * POST /api/ai/suggest-goal
 * Body: { roughIdea, department, thrustArea }
 */
const suggestGoalHandler = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Rate limit check
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Try again later.',
      });
    }

    const { roughIdea, department, thrustArea } = req.body;

    if (!roughIdea || roughIdea.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a goal idea with at least 5 characters.',
      });
    }

    const suggestion = await suggestGoal({
      roughIdea: roughIdea.trim(),
      department: department || req.user.department || 'General',
      thrustArea: thrustArea || 'General',
    });

    if (!suggestion) {
      return res.status(500).json({
        success: false,
        message: 'AI suggestion failed, please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      suggestion: {
        title: suggestion.title,
        description: suggestion.description,
        uomType: suggestion.uomType,
        uomReason: suggestion.uomReason,
        suggestedTarget: suggestion.suggestedTarget,
        targetUnit: suggestion.targetUnit,
        weightageSuggestion: suggestion.weightageSuggestion,
        tips: suggestion.tips,
      },
    });
  } catch (error) {
    console.error('AI suggestion error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'AI suggestion failed, please try again.',
    });
  }
};

module.exports = { suggestGoalHandler };
