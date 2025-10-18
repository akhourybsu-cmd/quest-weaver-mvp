import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

type ReconnectOpts = {
  maxRetries?: number;
  baseDelayMs?: number;
};

/**
 * Creates a resilient Supabase Realtime channel that automatically reconnects
 * on errors, closures, or timeouts using exponential backoff.
 */
export function resilientChannel(
  supabase: SupabaseClient,
  topic: string,
  opts: ReconnectOpts = {}
): RealtimeChannel {
  const { maxRetries = 6, baseDelayMs = 300 } = opts;
  let retries = 0;
  let channel = supabase.channel(topic);

  function rejoin() {
    if (retries >= maxRetries) {
      console.warn(`[resilientChannel] Max retries reached for topic "${topic}"`);
      return;
    }
    const delay = baseDelayMs * Math.pow(2, retries++);
    console.log(`[resilientChannel] Reconnecting to "${topic}" in ${delay}ms (attempt ${retries})`);
    setTimeout(() => {
      channel = supabase.channel(topic);
      attach();
    }, delay);
  }

  function attach() {
    channel
      .on("system", { event: "closed" }, rejoin)
      .on("system", { event: "error" }, rejoin)
      .on("system", { event: "timed_out" }, rejoin)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[resilientChannel] Successfully subscribed to "${topic}"`);
          retries = 0;
        }
      });
  }

  attach();
  return channel;
}
