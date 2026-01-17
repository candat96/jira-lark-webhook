/**
 * Mapping Jira emails để theo dõi issues của team
 * 
 * KHÔNG cần Lark Open ID - chỉ cần Jira emails để filter
 * Messages sẽ hiển thị tên dạng text, không @mention
 * 
 * Format: 'jira-email@company.com': true
 */
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // TODO: Thêm email Jira của team members tại đây
  // Example (for testing):
  'john.doe@company.com': true,
  'jane.smith@company.com': true,
  'bob.wilson@company.com': true,
};

/**
 * DEPRECATED - Giữ lại để backward compatibility
 * Sẽ xóa sau khi migrate hoàn toàn
 */
export const JIRA_TO_LARK_MAPPING: Record<string, string> = {};

/**
 * Kiểm tra xem user có phải là thành viên team không
 */
export function isTeamMember(email: string): boolean {
  return email in JIRA_TEAM_EMAILS;
}

/**
 * Format tên user cho Lark message (plain text, không @mention)
 */
export function formatUserName(displayName: string): string {
  return `**${displayName}**`;
}
