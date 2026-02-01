const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

type LogLevel = "info" | "warn" | "error" | "critical";

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    timestamp: string;
}

export async function log(level: LogLevel, message: string, context?: Record<string, any>) {
    const timestamp = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    // 1. Console Log (For System/Vercel Logs)
    const logData = { level, message, context, timestamp };

    if (level === "error" || level === "critical") {
        console.error(JSON.stringify(logData));
    } else {
        console.log(JSON.stringify(logData));
    }

    // 2. Telegram Alert (Only for Critical/Error)
    if ((level === "error" || level === "critical") && TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
        try {
            const icon = level === "critical" ? "🚨" : "⚠️";
            const sensitiveContext = context ? JSON.stringify(context, null, 2).slice(0, 500) : "No context"; // Truncate

            const text = `${icon} *Sistem Hatası*\n\n💬 *Mesaj:* ${message}\n🕒 *Zaman:* ${timestamp}\n📜 *Detay:* \`\`\`json\n${sensitiveContext}\n\`\`\``;

            // Fire and forget
            fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: text,
                    parse_mode: "Markdown"
                })
            }).catch(e => console.error("Logger: Failed to send Telegram alert", e));
        } catch (e) {
            // Fail safe
        }
    }
}

export const logger = {
    info: (msg: string, ctx?: any) => log("info", msg, ctx),
    warn: (msg: string, ctx?: any) => log("warn", msg, ctx),
    error: (msg: string, ctx?: any) => log("error", msg, ctx),
    critical: (msg: string, ctx?: any) => log("critical", msg, ctx),
};
