import express, { Express, Request, Response, NextFunction } from 'express';
import { config, validateConfig } from './config/config';
import { webhookController } from './controllers/webhook.controller';
import { logger } from './utils/logger';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration error:', error);
  process.exit(1);
}

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.post('/webhook/jira', (req, res) => webhookController.handleJiraWebhook(req, res));
app.get('/health', (req, res) => webhookController.healthCheck(req, res));
app.get('/test', (req, res) => webhookController.testLarkIntegration(req, res));
app.get('/test-app', (req, res) => webhookController.testLarkAppIntegration(req, res));
app.get('/test-qlkh', (req, res) => webhookController.testLarkQlkhIntegration(req, res));
app.get('/test-prm', (req, res) => webhookController.testLarkPrmIntegration(req, res));
app.get('/test-hrm', (req, res) => webhookController.testLarkHrmIntegration(req, res));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Jira-Lark Webhook',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      webhook: 'POST /webhook/jira',
      health: 'GET /health',
      test: 'GET /test',
      testApp: 'GET /test-app',
      testQlkh: 'GET /test-qlkh',
      testPrm: 'GET /test-prm',
      testHrm: 'GET /test-hrm',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
app.listen(config.port, () => {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🚀 Jira-Lark Webhook Server Started');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`📡 Server running on port ${config.port}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Webhook URL: ${config.serverUrl}/webhook/jira`);
  logger.info(`💚 Health check: ${config.serverUrl}/health`);
  logger.info(`🧪 Test endpoint: ${config.serverUrl}/test`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;
