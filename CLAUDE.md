# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A webhook bridge that receives Jira webhook events and forwards formatted notifications to Lark (Feishu) group chats as interactive card messages. Built with Express 5 + TypeScript.

## Common Commands

- **Dev server**: `npm run dev` (uses nodemon + ts-node)
- **Build**: `npm run build` (compiles TypeScript to `dist/`)
- **Start production**: `npm start` (runs compiled `dist/index.js`)
- **Docker**: `npm run docker:build`, `npm run docker:up`, `npm run docker:down`
- **No test suite** — `npm test` is a placeholder. Use `GET /test`, `/test-app`, `/test-qlkh`, `/test-prm`, `/test-hrm` endpoints to manually verify Lark integration. Shell script `test.sh` sends sample payloads via curl.

## Architecture

```
Jira --POST /webhook/jira--> Express Server --POST--> Lark Bot Webhook(s)
```

**Request flow**: `src/index.ts` (Express routes) → `webhook.controller.ts` (handles request) → `jira.service.ts` (parses & filters event) → `lark.service.ts` (formats card & sends to Lark)

### Key Design Decisions

- **Per-project webhook routing**: The controller extracts the Jira project key from the issue key (e.g., "APO" from "APO-70") and routes to a dedicated Lark webhook URL if configured (`WEBHOOK_URL_APP`, `WEBHOOK_URL_QLKH`, `WEBHOOK_URL_PRM`, `WEBHOOK_URL_HRM`). Falls back to the default `WEBHOOK_URL`.
- **Team filtering**: Only issues where the reporter or assignee email is in `JIRA_TEAM_EMAILS` (in `src/config/user-mapping.ts`) get forwarded. Non-team issues are silently ignored.
- **@mention with fallback**: Messages attempt Lark `<at email="...">` mentions using the `JIRA_TO_LARK_EMAIL_MAPPING`. If sending fails, automatically retries without mentions.
- **Always returns 200 to Jira**: Even on errors, to prevent Jira webhook retry storms.
- **Handled event types**: `created`, `status_changed`, `assignee_changed`, `comment_added`. Self-comments (commenter = reporter) are filtered out.

### Adding a New Project Webhook

1. Add env var (e.g., `WEBHOOK_URL_NEWPROJ`) in `.env` and `src/config/config.ts`
2. Add routing condition in `webhook.controller.ts` `handleJiraWebhook()`
3. Add test endpoint in `src/index.ts`

### Adding a New Team Member

Add their Jira email to `JIRA_TEAM_EMAILS` and optionally map it to their Lark email in `JIRA_TO_LARK_EMAIL_MAPPING` (both in `src/config/user-mapping.ts`).

## Configuration

Required env vars: `WEBHOOK_URL`, `JIRA_URL`. See `.env.example` for all options.
