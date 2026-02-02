
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { LiveState } from '@/types';
import { useToast } from './use-toast';

// Throttle broadcast to avoid flooding Supabase
const THROTTLE_MS = 200;

export function useLiveSession(scheduleId: string, isHost: boolean) {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase || !scheduleId) {
      return;
    }

    const channel = supabase.channel(`live-room-${scheduleId}`, {
      // self: false means we don't receive our own broadcasts, but we set it to !isHost so the host can see its own messages if needed for debugging or state persistence.
      config: { broadcast: { self: !isHost, ack: true } },
    });
    
    channelRef.current = channel;

    // Followers listen for state updates
    if (!isHost) {
        channel.on('broadcast', { event: 'state-update' }, ({ payload }) => {
            setLiveState(payload);
        });
    }

    channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
           toast({
            title: 'Erro de Conexão',
            description: 'Não foi possível conectar à sala ao vivo. Verifique sua conexão e as configurações do Supabase Realtime.',
            variant: 'destructive',
          });
        } else {
            setIsConnected(false);
        }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
       if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }
    };
  }, [scheduleId, isHost, toast]);

  const broadcastState = useCallback((newState: LiveState) => {
    // Only the host can broadcast
    if (isHost && channelRef.current && isConnected) {
        // Update the host's own state immediately
        setLiveState(newState);

        // Throttle the actual broadcast
        if (broadcastTimeoutRef.current) {
            clearTimeout(broadcastTimeoutRef.current);
        }

        broadcastTimeoutRef.current = setTimeout(() => {
             channelRef.current?.send({
                type: 'broadcast',
                event: 'state-update',
                payload: newState,
            });
        }, THROTTLE_MS);
    }
  }, [isHost, isConnected]);

  return { liveState, broadcastState, isConnected };
}
