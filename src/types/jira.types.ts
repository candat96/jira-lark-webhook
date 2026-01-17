// Jira User Information
export interface JiraUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
  avatarUrls?: Record<string, string>;
}

// Jira Issue Status
export interface JiraStatus {
  id: string;
  name: string;
  statusCategory?: {
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

// Jira Issue Type
export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl?: string;
}

// Jira Priority
export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

// Jira Issue Fields
export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  reporter: JiraUser;
  priority: JiraPriority;
  issuetype: JiraIssueType;
  description?: string;
  created?: string;
  updated?: string;
}

// Jira Issue
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

// Jira Changelog Item
export interface JiraChangelogItem {
  field: string;
  fieldtype: string;
  from: string | null;
  fromString: string | null;
  to: string | null;
  toString: string | null;
}

// Jira Changelog
export interface JiraChangelog {
  id: string;
  items: JiraChangelogItem[];
}

// Jira Comment
export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
}

// Main Jira Webhook Payload
export interface JiraWebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue_event_type_name?: string;
  user?: JiraUser;
  issue: JiraIssue;
  changelog?: JiraChangelog;
  comment?: JiraComment;
}

// Event Types
export enum JiraEventType {
  ISSUE_CREATED = 'jira:issue_created',
  ISSUE_UPDATED = 'jira:issue_updated',
  ISSUE_DELETED = 'jira:issue_deleted',
  COMMENT_CREATED = 'comment_created',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
}

// Processed Event for Lark
export interface ProcessedJiraEvent {
  eventType: 'created' | 'status_changed' | 'assignee_changed' | 'comment_added';
  issueKey: string;
  issueSummary: string;
  issueUrl: string;
  reporter: JiraUser;
  assignee: JiraUser | null;
  status: string;
  priority: string;
  issueType: string;
  changeDetails?: {
    field: string;
    fromValue: string | null;
    toValue: string | null;
  };
  comment?: {
    author: JiraUser;
    body: string;
  };
}
