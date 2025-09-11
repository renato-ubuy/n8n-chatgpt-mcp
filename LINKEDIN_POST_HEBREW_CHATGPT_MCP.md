# פוסט לינקדאין (עברית) — N8N + ChatGPT/Claude MCP

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
גרסה: v1.0.1-chatgpt (כולל קשיחות CORS ותיוג Traefik)

