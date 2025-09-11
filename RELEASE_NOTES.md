# v1.0.3-chatgpt — ChatGPT-compatible SSE, tightened CORS, Traefik labels, docs and posts

Highlights
- ChatGPT Connector compatibility via SSE (`/sse` and `/sse/message`)
- Tight CORS allowlist across SSE/WS/OAuth using `CORS_ORIGIN`
- Traefik labels aligned with app CORS (allowlist, expose headers, credentials)
- Dockerfile ports corrected: 3004 (SSE), 3006 (WS), 3007 (OAuth)
- README: ChatGPT guide + SSE curl test
- Auto-release workflow on tag push
- LinkedIn posts (Hebrew + English) included below

Upgrade notes
- Set `CORS_ORIGIN` to exact origins you use (example: `https://chat.openai.com,https://chatgpt.com,https://n8n-mcp.right-api.com`)
- Redeploy so Traefik picks up label changes
- Secure `/app/data` volume which persists credentials and sessions

Compatibility
- Claude web: OAuth/SSE
- ChatGPT: SSE

---

## LinkedIn Post (Hebrew)

שלום לכולם! 🚀

בימים האחרונים עבדנו על גשר MCP חכם שמאפשר לחבר את ChatGPT (וגם Claude) לעולמות האוטומציה של n8n — בצורה מאובטחת, מהירה ופשוטה לפריסה.

מה השגנו?
- תמיכה מלאה ב-ChatGPT Connectors דרך SSE (Server-Sent Events) ✅
- תמיכה ב-WebSocket + OAuth ל־Claude ולשימושים מתקדמים ✅
- הקשחת CORS ברמת האפליקציה וב־Traefik ע״פ רשימת Allowlist ✅
- תיעוד מעודכן והדגמות Curl לבדיקה מהירה ✅
- פריסת Docker ו־Traefik עם תצורה ידידותית ופורטים מסודרים ✅

מה זה נותן בפועל?
- אפשר לנהל Workflows של n8n ישירות מתוך ChatGPT/Claude: יצירה, עדכון, הפעלה, קבלת היסטוריה ועוד.
- חיבור מאובטח ודינמי לכל סביבת n8n — בהזנת Host + API Key או באמצעות OAuth ב־Claude.
- גמישות מלאה: SSE ל־ChatGPT, WS/OAuth ל־Claude — לפי הצורך.

דגשים טכניים עיקריים
- SSE Endpoint תואם ChatGPT Connectors בכתובת: `/sse` (עם POST ל־`/sse/message`).
- CORS מקורב לפי משתנה סביבה `CORS_ORIGIN` (רשימה מופרדת בפסיקים):
  `https://chat.openai.com, https://chatgpt.com, https://n8n-mcp.right-api.com`.
- תצורת Traefik הותאמה להצמדת כותרות CORS תואמות (Allowlist, Expose-Headers, Allow-Credentials).
- Dockerfile ו־Compose מעודכנים: SSE ב־3004, WS ב־3006, OAuth ב־3007.

אבטחה
- הפרדת סשנים ואחסון ממוזער וקונפיגורבילי של נתוני התחברות (תיקיית `/app/data`).
- מומלץ להגדיר סיסמאות מנהל וסביבות CORS מדויקות בפרודקשן.

איך מתחילים?
1) מריצים במצב SSE ל־ChatGPT: `MCP_MODE=sse` ו־`PORT=3004`.
2) מגדירים `CORS_ORIGIN` ל־ChatGPT ודומיינים רלוונטיים.
3) מחברים את ChatGPT Connector ל־`/sse` לפי ההסבר ב־README (כלול גם תסריט Curl לדוגמה).

מאגר קוד
- GitHub: https://github.com/shaike1/n8n-chatgpt-mcp (כולל תיעוד ודוגמאות)

קרדיטים וקריאה לפעולה
- נשמח למשוב, כוכב ⭐️ ב־GitHub, ו־PRs לשיפורים.
- אם אתם רוצים עזרה בהטמעה/פריסה — דברו איתי בפרטי.

—
גרסה: v1.0.3-chatgpt (כולל קשיחות CORS ותיוג Traefik)

---

## LinkedIn Post (English)

Hi everyone! 🚀

We’ve just shipped a robust MCP bridge that connects ChatGPT (and Claude) to n8n automation — securely, fast, and easy to deploy.

What we achieved
- Full ChatGPT Connectors support via SSE ✅
- WebSocket + OAuth support for Claude and advanced scenarios ✅
- Tight CORS at the app and Traefik levels (allowlist) ✅
- Fresh docs and curl examples for quick testing ✅
- Docker + Traefik deployment with clean ports and health checks ✅

What this enables
- Manage n8n workflows directly from ChatGPT/Claude: create, update, execute, list history, and more.
- Securely connect any n8n instance by host + API key or via OAuth for Claude.
- Flexibility: SSE for ChatGPT, WS/OAuth for Claude — choose per use case.

Technical highlights
- SSE endpoint compatible with ChatGPT Connectors at `/sse` with POST to `/sse/message`.
- CORS controlled via `CORS_ORIGIN` (comma-separated allowlist), e.g.:
  `https://chat.openai.com, https://chatgpt.com, https://n8n-mcp.right-api.com`.
- Traefik labels aligned with the same CORS policy (allowlist, expose-headers, allow-credentials).
- Ports standardized: SSE 3004, WS 3006, OAuth 3007.

Security
- Session separation and minimal, configurable persistence under `/app/data`.
- Set strong admin credentials and precise `CORS_ORIGIN` in production.

Getting started
- Run in SSE mode for ChatGPT: `MCP_MODE=sse` and `PORT=3004`.
- Set `CORS_ORIGIN` to ChatGPT + your domain(s).
- Connect the ChatGPT Connector to `/sse` as described in README (curl test included).

Repo
- GitHub: https://github.com/shaike1/n8n-chatgpt-mcp

Credits & CTA
- Feedback is welcome, stars ⭐️ and PRs too.
- Need help deploying or integrating? DM me.

—
Release: v1.0.3-chatgpt (CORS/Traefik tightened, docs updated)
