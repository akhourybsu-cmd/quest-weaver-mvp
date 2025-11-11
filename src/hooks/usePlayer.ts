import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/player';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'qw:players';
const LAST_PLAYER_KEY = 'qw:lastPlayerId';

export const usePlayer = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlayers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlayers = useCallback((updatedPlayers: Player[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers));
      setPlayers(updatedPlayers);
    } catch (error) {
      console.error('Failed to save players:', error);
    }
  }, []);

  const createPlayer = useCallback((name: string, color: string, avatarUrl?: string): Player => {
    const newPlayer: Player = {
      id: nanoid(),
      name,
      color,
      avatarUrl,
      deviceIds: [navigator.userAgent],
      createdAt: Date.now(),
    };
    const updated = [...players, newPlayer];
    savePlayers(updated);
    localStorage.setItem(LAST_PLAYER_KEY, newPlayer.id);
    return newPlayer;
  }, [players, savePlayers]);

  const getPlayer = useCallback((playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  }, [players]);

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    const updated = players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    );
    savePlayers(updated);
  }, [players, savePlayers]);

  const deletePlayer = useCallback((playerId: string) => {
    const updated = players.filter(p => p.id !== playerId);
    savePlayers(updated);
    const lastPlayer = localStorage.getItem(LAST_PLAYER_KEY);
    if (lastPlayer === playerId) {
      localStorage.removeItem(LAST_PLAYER_KEY);
    }
  }, [players, savePlayers]);

  const getLastPlayerId = useCallback(() => {
    return localStorage.getItem(LAST_PLAYER_KEY);
  }, []);

  const setLastPlayerId = useCallback((playerId: string) => {
    localStorage.setItem(LAST_PLAYER_KEY, playerId);
  }, []);

  return {
    players,
    loading,
    createPlayer,
    getPlayer,
    updatePlayer,
    deletePlayer,
    getLastPlayerId,
    setLastPlayerId,
  };
};
