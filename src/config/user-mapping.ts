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
  'nnchau@gmail.com': true,               // NN Châu
};

/**
 * Mapping Jira email → Lark email để tag (@mention) trong message
 * 
 * Format: 'jira-email@company.com': 'lark-email@company.com'
 * Nếu email giống nhau, vẫn phải thêm vào để enable @mention
 */
export const JIRA_TO_LARK_EMAIL_MAPPING: Record<string, string> = {
  'phambinhan133@gmail.com': 'phambinhan133@gmail.com',           // Pham Thi Binh An
  'datcv@deepcare.io': 'candat96@gmail.com',                      // Cấn Đạt
  'ducbeoyt@gmail.com': 'ducbeoyt@gmail.com',                     // Phan Anh Đức
  'dungcq86@gmail.com': 'dungcq86@gmail.com',                     // Trần Tiến Dũng
  'viethoang08052000@gmail.com': 'viethoang08052000@gmail.com',   // Viet Hoang
  'hoanien@gmail.com': 'nien3103@gmail.com',                      // Hoa Niên
  'huantruong@gmail.com': 'huantruong1210@gmail.com',             // Huấn Trương
  'ttluong.huph1995@gmail.com': 'ttluong.huph1995@gmail.com',     // Tăng Thị Lương
  'tranquangnguyen2811@gmail.com': 'tranquangnguyen2811@gmail.com', // Trần Quang Nguyên
  'hoanntd@deepcare.io': 'tranguyendanhoan@gmail.com',            // Nguyễn Trần Đan Hoàn
  'sonkdqte@gmail.com': 'sonph.dev@gmail.com',                    // Phạm Hồng Sơn
  // 'du@gmail.com': '',                                          // Nguyễn Dư - chưa có email Lark
  'admater99@gmail.com': 'admater99@gmail.com',                   // Nguyễn Tuấn Thành
  'luuanhthu2912@gmail.com': 'luuanhthu2912@gmail.com',           // Lưu Anh Thư
  'tungnt.txt.2k@gmail.com': 'tungnt.txt.2k@gmail.com',           // Nguyễn Thanh Tùng
  'nnchau@gmail.com': 'nganngocchau01@gmail.com',                 // NN Châu
};

/**
 * Kiểm tra xem user có phải là thành viên team không
 */
export function isTeamMember(email: string): boolean {
  return email in JIRA_TEAM_EMAILS;
}

/**
 * Format tên user cho Lark message với @mention nếu có email mapping
 * @param displayName - Tên hiển thị của user từ Jira
 * @param jiraEmail - Email Jira của user (optional)
 * @returns Formatted string với @mention hoặc plain text
 */
export function formatUserName(displayName: string, jiraEmail?: string): string {
  // Nếu có email và có trong mapping → tag bằng email + hiển thị tên
  if (jiraEmail && jiraEmail in JIRA_TO_LARK_EMAIL_MAPPING) {
    const larkEmail = JIRA_TO_LARK_EMAIL_MAPPING[jiraEmail];
    return `<at email="${larkEmail}"></at> **${displayName}**`;
  }
  
  // Fallback: hiển thị tên plain text (bold)
  return `**${displayName}**`;
}
