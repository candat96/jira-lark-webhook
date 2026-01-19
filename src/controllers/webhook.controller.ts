import { Request, Response } from 'express';
import { JiraWebhookPayload } from '../types/jira.types';
import { jiraService } from '../services/jira.service';
import { larkService } from '../services/lark.service';
import { logger } from '../utils/logger';

export class WebhookController {
  /**
   * Handle Jira webhook POST request
   */
  async handleJiraWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as JiraWebhookPayload;

      logger.info(`Received Jira webhook: ${payload.webhookEvent} for issue ${payload.issue?.key}`);
      logger.debug('Payload:', JSON.stringify(payload, null, 2));
      console.log("paylload", payload)

      // Parse event
      const processedEvent = jiraService.parseEvent(payload);

      if (!processedEvent) {
        logger.info('Event không cần xử lý, bỏ qua');
        res.status(200).json({ message: 'Event ignored' });
        return;
      }

      // Format Lark message
      const larkMessage = larkService.formatEventMessage(processedEvent);

      // Send to Lark
      const success = await larkService.sendMessage(larkMessage);

      if (success) {
        logger.info(`✅ Đã gửi thông báo Lark cho issue ${processedEvent.issueKey}`);
        res.status(200).json({ message: 'Notification sent' });
      } else {
        logger.error(`❌ Gửi thông báo Lark thất bại cho issue ${processedEvent.issueKey}`);
        // Still return 200 to Jira to prevent retries
        res.status(200).json({ message: 'Notification failed' });
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      // Always return 200 to Jira to prevent retry storms
      res.status(200).json({ message: 'Error occurred' });
    }
  }

  /**
   * Health check endpoint
   */
  healthCheck(req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'jira-lark-webhook',
    });
  }

  /**
   * Test endpoint - send test message to Lark
   */
  async testLarkIntegration(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Sending test message to Lark...');
      const success = await larkService.sendTestMessage();

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Test message sent to Lark successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test message to Lark',
        });
      }
    } catch (error) {
      logger.error('Error sending test message:', error);
      res.status(500).json({
        success: false,
        message: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const webhookController = new WebhookController();
