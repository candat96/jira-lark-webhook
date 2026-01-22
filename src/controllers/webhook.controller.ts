import { Request, Response } from 'express';
import { JiraWebhookPayload } from '../types/jira.types';
import { jiraService } from '../services/jira.service';
import { larkService } from '../services/lark.service';
import { logger } from '../utils/logger';
import { config } from '../config/config';

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

      // Xác định webhook URL dựa trên project key
      const projectKey = payload.issue?.key?.split('-')[0]; // Extract project key (e.g., "APO" from "APO-70")
      let webhookUrl = config.larkWebhookUrl; // Default webhook
      
      if (projectKey === 'APO' && config.larkWebhookUrlApp) {
        webhookUrl = config.larkWebhookUrlApp;
        logger.info(`🎯 Project APO detected - using WEBHOOK_URL_APP`);
      } else if (projectKey === 'QLLQLKH' && config.larkWebhookUrlQlkh) {
        webhookUrl = config.larkWebhookUrlQlkh;
        logger.info(`🎯 Project QLLQLKH detected - using WEBHOOK_URL_QLKH`);
      } else {
        logger.info(`🎯 Project ${projectKey} - using default WEBHOOK_URL`);
      }

      // Send to Lark với retry fallback (tự động retry không tag nếu lỗi)
      const success = await larkService.sendMessageWithRetry(processedEvent, webhookUrl);

      if (success) {
        logger.info(`✅ Đã gửi thông báo Lark cho issue ${processedEvent.issueKey} - Lark đã xác nhận nhận được`);
        res.status(200).json({ message: 'Notification sent' });
      } else {
        logger.error(`❌ Gửi thông báo Lark thất bại cho issue ${processedEvent.issueKey} - Lark trả về lỗi`);
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

  /**
   * Test endpoint - send test message to APP webhook
   */
  async testLarkAppIntegration(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Sending test message to Lark APP webhook...');
      const success = await larkService.sendTestMessage(config.larkWebhookUrlApp);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Test message sent to Lark APP webhook successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test message to Lark APP webhook',
        });
      }
    } catch (error) {
      logger.error('Error sending test message to APP webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test endpoint - send test message to QLKH webhook
   */
  async testLarkQlkhIntegration(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Sending test message to Lark QLKH webhook...');
      const success = await larkService.sendTestMessage(config.larkWebhookUrlQlkh);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Test message sent to Lark QLKH webhook successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test message to Lark QLKH webhook',
        });
      }
    } catch (error) {
      logger.error('Error sending test message to QLKH webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const webhookController = new WebhookController();
