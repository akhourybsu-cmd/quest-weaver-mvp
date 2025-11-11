import { RECKONING_SEED } from "@/data/demoSeeds";

export function createDemo(): { demoId: string; expiresAt: number } {
  const demoId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

  const campaign = JSON.parse(JSON.stringify(RECKONING_SEED));
  campaign.id = demoId;

  localStorage.setItem(
    `demo_${demoId}`,
    JSON.stringify({ campaign, expiresAt, createdAt: Date.now() })
  );

  console.log(`[DEMO] Created demo: ${demoId}, expires at ${new Date(expiresAt).toISOString()}`);

  return { demoId, expiresAt };
}

export function cleanupExpiredDemos() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("demo_"));
  const now = Date.now();
  let cleaned = 0;

  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      if (data.expiresAt && data.expiresAt < now) {
        localStorage.removeItem(key);
        cleaned++;
      }
    } catch (e) {
      // Invalid data, remove it
      localStorage.removeItem(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[DEMO] Cleaned up ${cleaned} expired demo(s)`);
  }
}
