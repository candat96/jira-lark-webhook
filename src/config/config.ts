import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
  larkWebhookUrl: process.env.WEBHOOK_URL || '',
  jiraUrl: process.env.JIRA_URL || '',
};

// Validate required config
export function validateConfig(): void {
  if (!config.larkWebhookUrl) {
    throw new Error('WEBHOOK_URL is required in .env file');
  }
  if (!config.jiraUrl) {
    throw new Error('JIRA_URL is required in .env file');
  }
}
