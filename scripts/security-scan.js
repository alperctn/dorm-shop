const fs = require('fs');
const path = require('path');

const CHECKLIST = [
    {
        id: "SEC-001",
        description: "HTTP Security Headers in next.config.js",
        file: "next.config.js",
        checks: [
            "Strict-Transport-Security",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection"
        ]
    },
    {
        id: "SEC-002",
        description: "Rate Limiting on Order API",
        file: "app/api/order/route.ts",
        checks: [
            "rateLimit",
            "limiter.check"
        ]
    },
    {
        id: "SEC-003",
        description: "Rate Limiting on Login API",
        file: "app/api/login/route.ts",
        checks: [
            "Rate Limiting",
            "attemptsPath"
        ]
    },
    {
        id: "SEC-004",
        description: "Server-Side Price Validation",
        file: "app/api/order/route.ts",
        checks: [
            "serverCalculatedTotal",
            "grandTotal = serverCalculatedTotal"
        ]
    },
    {
        id: "SEC-005",
        description: "Secure Admin Authorization (Status API)",
        file: "app/api/status/route.ts",
        checks: [
            "admin_session"
        ]
    },
    {
        id: "SEC-006",
        description: "Secure UUID for Orders",
        file: "app/api/order/route.ts",
        checks: [
            "crypto.randomUUID()"
        ]
    },
    {
        id: "SEC-007",
        description: "Strict Cookie Settings (CSRF)",
        file: "app/api/login/route.ts",
        checks: [
            "sameSite: \"strict\"",
            "secure: process.env.NODE_ENV"
        ]
    },
    {
        id: "SEC-008",
        description: "Force Dynamic (Cache Disabling)",
        file: "app/api/products/route.ts",
        checks: [
            "export const dynamic = \"force-dynamic\""
        ]
    }
];

function runScan() {
    console.log("🛡️  Starting DormShop Automated Security Audit...\n");
    let passed = 0;
    let failed = 0;

    CHECKLIST.forEach(item => {
        const filePath = path.join(__dirname, "..", item.file);

        if (!fs.existsSync(filePath)) {
            console.log(`❌ [${item.id}] ${item.description}: FILE NOT FOUND (${item.file})`);
            failed++;
            return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const missing = item.checks.filter(check => !content.includes(check));

        if (missing.length === 0) {
            console.log(`✅ [${item.id}] ${item.description}`);
            passed++;
        } else {
            console.log(`❌ [${item.id}] ${item.description}`);
            console.log(`    Missing patterns: ${missing.join(", ")}`);
            failed++;
        }
    });

    console.log("\n---------------------------------------------------");
    console.log(`📊 Result: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) {
        console.log("🏆 Systems Secure! Ready for production.");
    } else {
        console.log("⚠️  Security vulnerabilities detected.");
        process.exit(1);
    }
}

runScan();
