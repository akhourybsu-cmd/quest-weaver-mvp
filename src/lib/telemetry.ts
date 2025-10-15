import { supabase } from "@/integrations/supabase/client";

export type TelemetryEventType =
  | "encounter_start"
  | "encounter_end"
  | "round_start"
  | "turn_advance"
  | "damage_applied"
  | "healing_applied"
  | "effect_created"
  | "effect_expired"
  | "condition_applied"
  | "save_prompt_created"
  | "save_result_submitted"
  | "combat_action_error";

interface TelemetryEvent {
  campaignId?: string;
  encounterId?: string;
  eventType: TelemetryEventType;
  eventData?: Record<string, any>;
  latencyMs?: number;
  errorMessage?: string;
}

/**
 * Track a telemetry event
 */
export async function trackEvent(event: TelemetryEvent): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("analytics_events").insert({
      campaign_id: event.campaignId,
      encounter_id: event.encounterId,
      user_id: user?.id,
      event_type: event.eventType,
      event_data: event.eventData || {},
      latency_ms: event.latencyMs,
      error_message: event.errorMessage,
    });
  } catch (error) {
    // Silently fail telemetry - don't disrupt user experience
    console.warn("Telemetry tracking failed:", error);
  }
}

/**
 * Track a combat action with latency measurement
 */
export async function trackCombatAction<T>(
  eventType: TelemetryEventType,
  action: () => Promise<T>,
  metadata: Omit<TelemetryEvent, "eventType" | "latencyMs">
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await action();
    const latencyMs = Math.round(performance.now() - startTime);
    
    await trackEvent({
      ...metadata,
      eventType,
      latencyMs,
    });
    
    return result;
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await trackEvent({
      ...metadata,
      eventType: "combat_action_error",
      latencyMs,
      errorMessage,
      eventData: {
        ...metadata.eventData,
        originalEventType: eventType,
      },
    });
    
    throw error;
  }
}

/**
 * Create a telemetry wrapper for a function
 */
export function withTelemetry<TArgs extends any[], TReturn>(
  eventType: TelemetryEventType,
  fn: (...args: TArgs) => Promise<TReturn>,
  getMetadata: (...args: TArgs) => Omit<TelemetryEvent, "eventType" | "latencyMs">
) {
  return async (...args: TArgs): Promise<TReturn> => {
    return trackCombatAction(eventType, () => fn(...args), getMetadata(...args));
  };
}
