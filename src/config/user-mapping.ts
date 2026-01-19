/**
 * Mapping Jira emails để theo dõi issues của team
 * 
 * KHÔNG cần Lark Open ID - chỉ cần Jira emails để filter
 * Messages sẽ hiển thị tên dạng text, không @mention
 * 
 * Format: 'jira-email@company.com': true
 */
export const JIRA_TEAM_EMAILS: Record<string, boolean> = {
  // Team members
  'phambinhan133@gmail.com': true,        // Pham Thi Binh An
  'datcv@deepcare.io': true,              // Cấn Đạt
  'ducbeoyt@gmail.com': true,             // Phan Anh Đức
  'dungcq86@gmail.com': true,             // Trần Tiến Dũng
  'viethoang08052000@gmail.com': true,    // Viet Hoang
  'hoanien@gmail.com': true,              // Hoa Niên
  'huantruong@gmail.com': true,           // Huấn Trương
  'ttluong.huph1995@gmail.com': true,     // Tăng Thị Lương
  'tranquangnguyen2811@gmail.com': true,  // Trần Quang Nguyên
  'hoanntd@deepcare.io': true,            // Nguyễn Trần Đan Hoàn
  'sonkdqte@gmail.com': true,             // Phạm Hồng Sơn
  'du@gmail.com': true,                   // Nguyễn Dư
  'admater99@gmail.com': true,            // Nguyễn Tuấn Thành
  'luuanhthu2912@gmail.com': true,        // Lưu Anh Thư
  'tungnt.txt.2k@gmail.com': true,        // Nguyễn Thanh Tùng
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
