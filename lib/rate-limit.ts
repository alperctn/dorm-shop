type Options = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export default function rateLimit(options?: Options) {
    const tokenCache = new Map();
    const interval = options?.interval || 60000;

    return {
        check: (res: Response, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const now = Date.now();
                const tokenCount = tokenCache.get(token) || [0, now];

                // Reset if interval passed
                if (now - tokenCount[1] > interval) {
                    tokenCount[0] = 0;
                    tokenCount[1] = now;
                }

                tokenCount[0] += 1;
                tokenCache.set(token, tokenCount);

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage > limit;

                return isRateLimited ? reject() : resolve();
            }),
    };
}
