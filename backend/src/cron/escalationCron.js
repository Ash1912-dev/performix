const cron = require('node-cron');
const { runEscalationEngine } = require('../utils/escalationEngine');

cron.schedule('0 8 * * *', async () => {
  await runEscalationEngine();
  console.log('Escalation engine ran at', new Date());
});
