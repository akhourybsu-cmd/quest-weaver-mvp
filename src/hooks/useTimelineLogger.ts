import { supabase } from "@/integrations/supabase/client";

export type TimelineEventKind =
  | 'session_start'
  | 'session_end'
  | 'encounter_start'
  | 'encounter_end'
  | 'quest_created'
  | 'quest_completed'
  | 'quest_objective'
  | 'npc_appearance'
  | 'item_gained'
  | 'location_discovered'
  | 'note_created'
  | 'highlight'
  | 'custom';

export interface TimelineLogParams {
  campaignId: string;
  sessionId?: string | null;
  kind: TimelineEventKind;
  title: string;
  summary?: string;
  refType?: string;
  refId?: string;
  payload?: Record<string, any>;
  inGameDate?: string;
  playerVisible?: boolean;
}

export async function logTimelineEvent(params: TimelineLogParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('timeline_events')
      .insert({
        campaign_id: params.campaignId,
        session_id: params.sessionId || null,
        kind: params.kind,
        title: params.title,
        summary: params.summary || null,
        ref_type: params.refType || null,
        ref_id: params.refId || null,
        payload: params.payload || {},
        in_game_date: params.inGameDate || null,
        player_visible: params.playerVisible ?? false,
      });

    if (error) {
      console.error('Failed to log timeline event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error logging timeline event:', err);
    return { success: false, error: err.message };
  }
}

// Convenience functions for common event types
export const timelineLogger = {
  sessionStart: (campaignId: string, sessionId: string, sessionName?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'session_start',
      title: 'Session Started',
      summary: sessionName ? `Session "${sessionName}" began` : 'A new session began',
      playerVisible: true,
    }),

  sessionEnd: (campaignId: string, sessionId: string, sessionName?: string, duration?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'session_end',
      title: 'Session Ended',
      summary: sessionName ? `Session "${sessionName}" concluded` : 'Session concluded',
      payload: duration ? { duration } : {},
      playerVisible: true,
    }),

  encounterStart: (campaignId: string, sessionId: string | null, encounterName: string, encounterId: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'encounter_start',
      title: 'Combat Initiated',
      summary: `Encounter: ${encounterName}`,
      refType: 'encounter',
      refId: encounterId,
      playerVisible: true,
    }),

  encounterEnd: (campaignId: string, sessionId: string | null, encounterName: string, encounterId: string, outcome?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'encounter_end',
      title: 'Combat Resolved',
      summary: outcome ? `${encounterName}: ${outcome}` : `${encounterName} concluded`,
      refType: 'encounter',
      refId: encounterId,
      playerVisible: true,
    }),

  questCreated: (campaignId: string, sessionId: string | null, questTitle: string, questId: string, questGiver?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'quest_created',
      title: 'New Quest',
      summary: questGiver ? `"${questTitle}" from ${questGiver}` : `"${questTitle}"`,
      refType: 'quest',
      refId: questId,
      playerVisible: true,
    }),

  questCompleted: (campaignId: string, sessionId: string | null, questTitle: string, questId: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'quest_completed',
      title: 'Quest Completed',
      summary: `"${questTitle}" has been completed`,
      refType: 'quest',
      refId: questId,
      playerVisible: true,
    }),

  questObjective: (campaignId: string, sessionId: string | null, questTitle: string, objective: string, questId: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'quest_objective',
      title: 'Objective Complete',
      summary: `${questTitle}: ${objective}`,
      refType: 'quest',
      refId: questId,
      playerVisible: true,
    }),

  npcAppearance: (campaignId: string, sessionId: string | null, npcName: string, npcId: string, context?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'npc_appearance',
      title: 'NPC Encountered',
      summary: context ? `${npcName}: ${context}` : `The party met ${npcName}`,
      refType: 'npc',
      refId: npcId,
      playerVisible: true,
    }),

  itemGained: (campaignId: string, sessionId: string | null, itemName: string, recipient?: string, itemId?: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'item_gained',
      title: 'Item Acquired',
      summary: recipient ? `${recipient} received ${itemName}` : `Party acquired ${itemName}`,
      refType: itemId ? 'item' : undefined,
      refId: itemId,
      playerVisible: true,
    }),

  locationDiscovered: (campaignId: string, sessionId: string | null, locationName: string, locationId: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'location_discovered',
      title: 'Location Discovered',
      summary: `The party discovered ${locationName}`,
      refType: 'location',
      refId: locationId,
      playerVisible: true,
    }),

  noteCreated: (campaignId: string, sessionId: string | null, noteTitle: string, noteId: string) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'note_created',
      title: 'Note Added',
      summary: noteTitle,
      refType: 'note',
      refId: noteId,
      playerVisible: false,
    }),

  highlight: (campaignId: string, sessionId: string | null, title: string, summary?: string, playerVisible = true) =>
    logTimelineEvent({
      campaignId,
      sessionId,
      kind: 'highlight',
      title,
      summary,
      playerVisible,
    }),

  custom: (params: TimelineLogParams) => logTimelineEvent(params),
};
