import axios from 'axios';
import { LarkMessage, LarkCard, LarkCardHeader } from '../types/lark.types';
import { ProcessedJiraEvent } from '../types/jira.types';
import { formatUserName } from '../config/user-mapping';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class LarkService {
  /**
   * Gửi message đến Lark webhook
   */
  async sendMessage(message: LarkMessage, webhookUrl?: string): Promise<boolean> {
    try {
      const targetUrl = webhookUrl || config.larkWebhookUrl;
      const response = await axios.post(targetUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Log full response for debugging
      logger.info('Lark API response:', JSON.stringify(response.data));
      
      // Lark returns { StatusCode: 0 } for success
      // Also check for code: 0 (some endpoints use this)
      if (response.data.StatusCode === 0 || response.data.code === 0) {
        logger.info('✅ Lark message sent successfully');
        return true;
      } else {
        logger.error('❌ Lark API error:', JSON.stringify(response.data));
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error('❌ Lark API request failed:', {
          status: error.response.status,
          data: error.response.data,
        });
      } else {
        logger.error('❌ Failed to send Lark message:', error);
      }
      return false;
    }
  }

  /**
   * Gửi message với retry fallback (nếu lỗi @mention thì gửi lại không tag)
   */
  async sendMessageWithRetry(event: ProcessedJiraEvent, webhookUrl?: string): Promise<boolean> {
    // Format message với @mention trước
    const messageWithMention = this.formatEventMessage(event, true);
    
    // Thử gửi với @mention trước
    const success = await this.sendMessage(messageWithMention, webhookUrl);
    
    if (success) {
      return true;
    }

    // Nếu thất bại, thử lại không tag
    logger.warn('⚠️ Gửi với @mention thất bại, thử lại không tag...');
    
    // Format lại message không có @mention
    const messageWithoutMention = this.formatEventMessage(event, false);
    
    // Retry
    return await this.sendMessage(messageWithoutMention, webhookUrl);
  }

  /**
   * Format ProcessedJiraEvent thành Lark card message
   */
  formatEventMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const { eventType } = event;

    switch (eventType) {
      case 'created':
        return this.formatIssueCreatedMessage(event, useMention);
      case 'status_changed':
        return this.formatStatusChangedMessage(event, useMention);
      case 'assignee_changed':
        return this.formatAssigneeChangedMessage(event, useMention);
      case 'comment_added':
        return this.formatCommentAddedMessage(event, useMention);
      default:
        return this.formatGenericMessage(event, useMention);
    }
  }

  /**
   * Format: Issue Created
   */
  private formatIssueCreatedMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const reporterName = formatUserName(event.reporter.displayName, event.reporter.emailAddress, useMention);
    const assigneeName = event.assignee
      ? formatUserName(event.assignee.displayName, event.assignee.emailAddress, useMention)
      : '_Chưa assign_';

    const issueUrl = `${event.issueUrl}/browse/${event.issueKey}`;

    const content = `**[${event.issueKey}] ${event.issueSummary}**

📝 Reporter: ${reporterName}
👤 Assignee: ${assigneeName}
📊 Status: ${event.status}
🔖 Type: ${event.issueType}
⚡ Priority: ${event.priority}`;

    return this.createCardMessage(
      '🎫 Ticket mới được tạo',
      content,
      'blue',
      issueUrl
    );
  }

  /**
   * Format: Status Changed
   */
  private formatStatusChangedMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const reporterName = formatUserName(event.reporter.displayName, event.reporter.emailAddress, useMention);
    const assigneeName = event.assignee
      ? formatUserName(event.assignee.displayName, event.assignee.emailAddress, useMention)
      : '_Chưa assign_';

    const fromStatus = event.changeDetails?.fromValue || 'N/A';
    const toStatus = event.changeDetails?.toValue || event.status;
    const issueUrl = `${event.issueUrl}/browse/${event.issueKey}`;

    // Determine color based on status
    let template: LarkCardHeader['template'] = 'orange';
    if (toStatus.toLowerCase().includes('done') || toStatus.toLowerCase().includes('resolved')) {
      template = 'green';
    }

    const content = `**[${event.issueKey}] ${event.issueSummary}**

📝 Reporter: ${reporterName}
👤 Assignee: ${assigneeName}
📊 Status: ${fromStatus} → **${toStatus}**`;

    return this.createCardMessage(
      '📊 Thay đổi trạng thái',
      content,
      template,
      issueUrl
    );
  }

  /**
   * Format: Assignee Changed
   */
  private formatAssigneeChangedMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const reporterName = formatUserName(event.reporter.displayName, event.reporter.emailAddress, useMention);

    // fromAssignee: chỉ có tên (không có email từ Jira changelog)
    const fromAssignee = event.changeDetails?.fromValue || '_Chưa assign_';
    
    // toAssignee: có đầy đủ thông tin từ event.assignee
    const toAssignee = event.assignee
      ? formatUserName(event.assignee.displayName, event.assignee.emailAddress, useMention)
      : '_Chưa assign_';
    
    const issueUrl = `${event.issueUrl}/browse/${event.issueKey}`;

    const content = `**[${event.issueKey}] ${event.issueSummary}**

📝 Reporter: ${reporterName}
👤 Assignee: ${fromAssignee} → ${toAssignee}
📊 Status: ${event.status}`;

    return this.createCardMessage(
      '👤 Assignee thay đổi',
      content,
      'yellow',
      issueUrl
    );
  }

  /**
   * Format: Comment Added
   */
  private formatCommentAddedMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const reporterName = formatUserName(event.reporter.displayName, event.reporter.emailAddress, useMention);
    const assigneeName = event.assignee
      ? formatUserName(event.assignee.displayName, event.assignee.emailAddress, useMention)
      : '_Chưa assign_';

    const commenterName = event.comment
      ? formatUserName(event.comment.author.displayName, event.comment.author.emailAddress, useMention)
      : 'Unknown';

    // Truncate comment body if too long
    const commentBody = event.comment?.body || '';
    const commentPreview = commentBody.length > 200
      ? commentBody.substring(0, 200) + '...'
      : commentBody;

    const issueUrl = `${event.issueUrl}/browse/${event.issueKey}`;

    const content = `**[${event.issueKey}] ${event.issueSummary}**

📝 Reporter: ${reporterName}
👤 Assignee: ${assigneeName}
💬 ${commenterName} commented:
_"${commentPreview}"_`;

    return this.createCardMessage(
      '💬 Comment mới',
      content,
      'purple',
      issueUrl
    );
  }

  /**
   * Format: Generic message
   */
  private formatGenericMessage(event: ProcessedJiraEvent, useMention: boolean = true): LarkMessage {
    const issueUrl = `${event.issueUrl}/browse/${event.issueKey}`;
    const content = `**[${event.issueKey}] ${event.issueSummary}**

📊 Status: ${event.status}`;

    return this.createCardMessage(
      '🔔 Issue Update',
      content,
      'grey',
      issueUrl
    );
  }

  /**
   * Helper: Create Lark card message
   */
  private createCardMessage(
    title: string,
    content: string,
    template: LarkCardHeader['template'] = 'blue',
    buttonUrl?: string
  ): LarkMessage {
    const card: LarkCard = {
      header: {
        title: {
          tag: 'plain_text',
          content: title,
        },
        template,
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content,
          },
        },
      ],
    };

    // Add button if URL provided
    if (buttonUrl) {
      card.elements.push({
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: 'Xem chi tiết →',
            },
            type: 'primary',
            url: buttonUrl,
          },
        ],
      });
    }

    return {
      msg_type: 'interactive',
      card,
    };
  }

  /**
   * Send test message
   */
  async sendTestMessage(webhookUrl?: string): Promise<boolean> {
    const message = this.createCardMessage(
      '✅ Test Message',
      '**Jira-Lark Webhook đang hoạt động!**\n\nServer đã sẵn sàng nhận Jira webhooks.',
      'green'
    );

    return this.sendMessage(message, webhookUrl);
  }
}

export const larkService = new LarkService();
