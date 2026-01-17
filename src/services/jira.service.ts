import {
  JiraWebhookPayload,
  JiraEventType,
  ProcessedJiraEvent,
  JiraChangelogItem,
} from '../types/jira.types';
import { isTeamMember } from '../config/user-mapping';
import { logger } from '../utils/logger';

export class JiraService {
  /**
   * Kiểm tra xem event có liên quan đến team không
   */
  isRelevantToTeam(payload: JiraWebhookPayload): boolean {
    const { issue } = payload;
    
    // Check reporter
    const reporterEmail = issue.fields.reporter?.emailAddress;
    if (reporterEmail && isTeamMember(reporterEmail)) {
      return true;
    }
    
    // Check assignee
    const assigneeEmail = issue.fields.assignee?.emailAddress;
    if (assigneeEmail && isTeamMember(assigneeEmail)) {
      return true;
    }
    
    return false;
  }

  /**
   * Parse Jira webhook payload thành ProcessedJiraEvent
   */
  parseEvent(payload: JiraWebhookPayload): ProcessedJiraEvent | null {
    const { webhookEvent, issue, changelog, comment } = payload;

    // Kiểm tra xem có liên quan đến team không
    if (!this.isRelevantToTeam(payload)) {
      logger.debug(`Issue ${issue.key} không liên quan đến team, bỏ qua`);
      return null;
    }

    // Extract issue URL
    const issueUrl = this.getIssueUrl(issue.self);

    // Base event data
    const baseEvent = {
      issueKey: issue.key,
      issueSummary: issue.fields.summary,
      issueUrl,
      reporter: issue.fields.reporter,
      assignee: issue.fields.assignee,
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      issueType: issue.fields.issuetype.name,
    };

    // Case 1: Issue Created
    if (webhookEvent === JiraEventType.ISSUE_CREATED) {
      logger.info(`Issue created: ${issue.key}`);
      return {
        ...baseEvent,
        eventType: 'created',
      };
    }

    // Case 2: Issue Updated
    if (webhookEvent === JiraEventType.ISSUE_UPDATED) {
      // Check for status change
      const statusChange = this.findChangelogItem(changelog, 'status');
      if (statusChange) {
        logger.info(`Issue ${issue.key} status changed: ${statusChange.fromString} → ${statusChange.toString}`);
        return {
          ...baseEvent,
          eventType: 'status_changed',
          changeDetails: {
            field: 'status',
            fromValue: statusChange.fromString,
            toValue: statusChange.toString,
          },
        };
      }

      // Check for assignee change
      const assigneeChange = this.findChangelogItem(changelog, 'assignee');
      if (assigneeChange) {
        logger.info(`Issue ${issue.key} assignee changed: ${assigneeChange.fromString} → ${assigneeChange.toString}`);
        return {
          ...baseEvent,
          eventType: 'assignee_changed',
          changeDetails: {
            field: 'assignee',
            fromValue: assigneeChange.fromString,
            toValue: assigneeChange.toString,
          },
        };
      }

      // Check for comment
      if (comment && payload.issue_event_type_name === 'issue_commented') {
        // Filter: không notify khi tự comment vào issue của mình
        const commentAuthorEmail = comment.author.emailAddress;
        const reporterEmail = issue.fields.reporter.emailAddress;
        
        if (commentAuthorEmail === reporterEmail) {
          logger.debug(`Self-comment by ${commentAuthorEmail}, bỏ qua`);
          return null;
        }

        logger.info(`New comment on ${issue.key} by ${comment.author.displayName}`);
        return {
          ...baseEvent,
          eventType: 'comment_added',
          comment: {
            author: comment.author,
            body: comment.body,
          },
        };
      }
    }

    // Không match với bất kỳ event nào cần xử lý
    logger.debug(`Event type ${webhookEvent} không được xử lý`);
    return null;
  }

  /**
   * Tìm changelog item theo field name
   */
  private findChangelogItem(
    changelog: JiraWebhookPayload['changelog'],
    fieldName: string
  ): JiraChangelogItem | null {
    if (!changelog || !changelog.items) {
      return null;
    }
    
    return changelog.items.find(item => item.field === fieldName) || null;
  }

  /**
   * Extract issue URL từ Jira self link
   */
  private getIssueUrl(selfUrl: string): string {
    // selfUrl format: https://your-domain.atlassian.net/rest/api/2/issue/12345
    // Convert to: https://your-domain.atlassian.net/browse/PROJ-123
    try {
      const url = new URL(selfUrl);
      const baseUrl = `${url.protocol}//${url.host}`;
      // We'll use the issue key in the calling code
      return baseUrl;
    } catch (error) {
      logger.warn('Failed to parse Jira URL:', selfUrl);
      return selfUrl;
    }
  }
}

export const jiraService = new JiraService();
