// src/hooks/useWebRTC.js

import { useCallback, useEffect, useRef, useState } from 'react';
import { ICE_SERVERS } from '../utils/constants';
import { playSound } from '../utils/soundManager';

export function useWebRTC({
  socket,
  roomCode,
  role,
  onIncomingData,
  rejoinNonce,
}) {
  const pcRef = useRef(null);
  const dcRef = useRef(null);

  const [connectionState, setConnectionState] = useState('new');
  const [dataChannelOpen, setDataChannelOpen] = useState(false);

  const offerSentRef = useRef(false);
  const answerReceivedRef = useRef(false);
  const lastRoomCodeRef = useRef(null);

  /*
   * Used to know whether this DataChannel was actually opened.
   *
   * We should NOT play disconnect.mp3 when a channel that never opened
   * gets closed during setup/reset.
   */
  const dataChannelWasOpenedRef = useRef(false);

  /*
   * Prevent duplicate disconnect sounds from the same channel.
   */
  const disconnectSoundPlayedRef = useRef(false);

  /*
   * ICE candidates can arrive before remoteDescription.
   */
  const pendingIceCandidatesRef = useRef([]);

  const socketRef = useRef(socket);
  const roomCodeRef = useRef(roomCode);
  const roleRef = useRef(role);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  /*
   * Always use the latest incoming-data callback.
   */
  const handlerRef = useRef(onIncomingData);

  useEffect(() => {
    handlerRef.current = onIncomingData;
  }, [onIncomingData]);

  /* ============================================================
     RESET PEER
  ============================================================ */

  const resetPeer = useCallback(() => {
    console.log('[WebRTC] Resetting peer connection');

    const currentDc = dcRef.current;

    /*
     * If the current channel was actually established, closing it
     * represents a real WebRTC disconnection.
     */
    if (
      currentDc &&
      dataChannelWasOpenedRef.current &&
      currentDc.readyState === 'open'
    ) {
      if (!disconnectSoundPlayedRef.current) {
        disconnectSoundPlayedRef.current = true;
        playSound('disconnect');
      }
    }

    try {
      currentDc?.close();
    } catch {}

    try {
      pcRef.current?.close();
    } catch {}

    pcRef.current = null;
    dcRef.current = null;

    offerSentRef.current = false;
    answerReceivedRef.current = false;

    pendingIceCandidatesRef.current = [];

    dataChannelWasOpenedRef.current = false;
    disconnectSoundPlayedRef.current = false;

    setConnectionState('new');
    setDataChannelOpen(false);
  }, []);

  /* ============================================================
     KEEP DATA CHANNEL STATE IN SYNC
  ============================================================ */

  const syncDataChannelOpen = useCallback(() => {
    const isOpen = dcRef.current?.readyState === 'open';

    setDataChannelOpen(Boolean(isOpen));
  }, []);

  /* ============================================================
     DATA CHANNEL
  ============================================================ */

  const wireDataChannel = useCallback((dc) => {
    if (!dc) {
      return;
    }

    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log('[WebRTC] DataChannel OPEN');

      /*
       * Mark this channel as genuinely established.
       */
      dataChannelWasOpenedRef.current = true;

      /*
       * Allow a future disconnect event to play its sound.
       */
      disconnectSoundPlayedRef.current = false;

      setDataChannelOpen(true);

      /*
       * This is the actual P2P connection-established event.
       */
      playSound('connect');
    };

    dc.onclose = () => {
      console.log('[WebRTC] DataChannel CLOSED');

      /*
       * Ignore late close event from an old DataChannel.
       */
      if (dcRef.current && dcRef.current !== dc) {
        return;
      }

      setDataChannelOpen(false);

      /*
       * Only play disconnect sound if this channel had actually
       * reached OPEN state.
       */
      if (
        dataChannelWasOpenedRef.current &&
        !disconnectSoundPlayedRef.current
      ) {
        disconnectSoundPlayedRef.current = true;
        playSound('disconnect');
      }

      dataChannelWasOpenedRef.current = false;
    };

    dc.onerror = (error) => {
      console.error('[WebRTC] DataChannel ERROR:', error);
    };

    dc.onmessage = (event) => {
      handlerRef.current?.(event);
    };
  }, []);

  /* ============================================================
     CREATE PEER CONNECTION
  ============================================================ */

  const createPeer = useCallback(() => {
    if (pcRef.current) {
      const existingState = pcRef.current.connectionState;

      /*
       * Dead peer connection cannot be reused.
       */
      if (
        existingState === 'failed' ||
        existingState === 'closed' ||
        existingState === 'disconnected'
      ) {
        console.log(
          '[WebRTC] Existing peer is dead, resetting before creating new one'
        );

        resetPeer();
      } else {
        return pcRef.current;
      }
    }

    console.log('[WebRTC] Creating RTCPeerConnection');

    const pc = new RTCPeerConnection(ICE_SERVERS);

    /* ----------------------------------------------------------
       ICE CANDIDATE
    ---------------------------------------------------------- */

    pc.onicecandidate = (event) => {
      const candidate = event.candidate;
      const s = socketRef.current;
      const rc = roomCodeRef.current;

      if (!candidate || !s || !rc) {
        return;
      }

      if (!s.connected) {
        console.warn(
          '[WebRTC] Socket not connected, ICE candidate not sent'
        );
        return;
      }

      console.log('[WebRTC] Sending ICE candidate');

      s.emit('webrtc-ice-candidate', {
        roomCode: rc,
        candidate,
      });
    };

    /* ----------------------------------------------------------
       ICE CANDIDATE ERROR
    ---------------------------------------------------------- */

    pc.onicecandidateerror = (event) => {
      console.warn(
        '[WebRTC] ICE candidate error:',
        event.errorCode,
        event.errorText,
        event.url
      );
    };

    /* ----------------------------------------------------------
       ICE GATHERING
    ---------------------------------------------------------- */

    pc.onicegatheringstatechange = () => {
      console.log(
        '[WebRTC] ICE gathering:',
        pc.iceGatheringState
      );
    };

    /* ----------------------------------------------------------
       ICE CONNECTION STATE
    ---------------------------------------------------------- */

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;

      console.log(
        '[WebRTC] ICE connection state:',
        state
      );

      if (state === 'connected' || state === 'completed') {
        console.log('[WebRTC] ICE connection established');

        syncDataChannelOpen();
      }

      if (state === 'disconnected') {
        console.warn('[WebRTC] ICE disconnected');
      }

      if (state === 'failed') {
        console.error('[WebRTC] ICE connection FAILED');

        try {
          pc.restartIce?.();
        } catch (error) {
          console.warn(
            '[WebRTC] restartIce failed:',
            error
          );
        }
      }
    };

    /* ----------------------------------------------------------
       PEER CONNECTION STATE
    ---------------------------------------------------------- */

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      console.log(
        '[WebRTC] Peer connection state:',
        state
      );

      setConnectionState(state);

      if (state === 'connected') {
        console.log('[WebRTC] PEER CONNECTED');

        syncDataChannelOpen();
      }

      if (state === 'failed' || state === 'closed') {
        setDataChannelOpen(false);
      } else {
        syncDataChannelOpen();
      }
    };

    /* ----------------------------------------------------------
       SIGNALING STATE
    ---------------------------------------------------------- */

    pc.onsignalingstatechange = () => {
      console.log(
        '[WebRTC] Signaling state:',
        pc.signalingState
      );
    };

    /* ----------------------------------------------------------
       REMOTE DATA CHANNEL
    ---------------------------------------------------------- */

    pc.ondatachannel = (event) => {
      console.log(
        '[WebRTC] Remote DataChannel received'
      );

      /*
       * Close previous channel if a different one arrives.
       */
      if (
        dcRef.current &&
        dcRef.current !== event.channel
      ) {
        try {
          dcRef.current.close();
        } catch {}
      }

      dcRef.current = event.channel;

      /*
       * New channel has not opened yet.
       */
      dataChannelWasOpenedRef.current = false;
      disconnectSoundPlayedRef.current = false;

      wireDataChannel(event.channel);
    };

    pcRef.current = pc;

    return pc;
  }, [
    wireDataChannel,
    resetPeer,
    syncDataChannelOpen,
  ]);

  /* ============================================================
     HOST - CREATE OFFER
  ============================================================ */

  const startAsHost = useCallback(async () => {
    const s = socketRef.current;
    const rc = roomCodeRef.current;

    if (!s || !rc) {
      console.warn('[Host] Socket or room missing');
      return;
    }

    if (!s.connected) {
      console.warn('[Host] Socket not connected');
      return;
    }

    if (offerSentRef.current) {
      const existingState =
        pcRef.current?.connectionState;

      const isHealthy =
        pcRef.current &&
        existingState !== 'failed' &&
        existingState !== 'closed' &&
        existingState !== 'disconnected';

      if (isHealthy) {
        console.log(
          '[Host] Offer already sent, connection healthy'
        );

        return;
      }

      console.log(
        '[Host] Previous connection dead, allowing new offer'
      );

      resetPeer();
    }

    offerSentRef.current = true;

    try {
      console.log(
        '[Host] Starting WebRTC connection'
      );

      const pc = createPeer();

      /*
       * Host creates the DataChannel.
       */
      const dc = pc.createDataChannel(
        'webdrop',
        {
          ordered: true,
        }
      );

      dcRef.current = dc;

      dataChannelWasOpenedRef.current = false;
      disconnectSoundPlayedRef.current = false;

      wireDataChannel(dc);

      /*
       * Create offer.
       */
      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      console.log(
        '[Host] Sending WebRTC offer'
      );

      s.emit('webrtc-offer', {
        roomCode: rc,
        offer: pc.localDescription,
      });
    } catch (error) {
      console.error(
        '[Host] startAsHost error:',
        error
      );

      offerSentRef.current = false;
    }
  }, [
    createPeer,
    wireDataChannel,
    resetPeer,
  ]);

  /* ============================================================
     GUEST - HANDLE OFFER
  ============================================================ */

  const handleOffer = useCallback(
    async (offer) => {
      const s = socketRef.current;
      const rc = roomCodeRef.current;

      if (!s || !rc) {
        return;
      }

      try {
        console.log(
          '[Guest] Received WebRTC offer'
        );

        const pc = createPeer();

        /*
         * Remote description MUST be set first.
         */
        await pc.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        console.log(
          '[Guest] Remote description set'
        );

        /*
         * Add queued ICE candidates.
         */
        const pendingCandidates =
          pendingIceCandidatesRef.current;

        if (pendingCandidates.length > 0) {
          console.log(
            '[Guest] Adding queued ICE candidates:',
            pendingCandidates.length
          );

          for (const candidate of pendingCandidates) {
            try {
              await pc.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (error) {
              console.warn(
                '[Guest] Queued ICE candidate error:',
                error
              );
            }
          }

          pendingIceCandidatesRef.current = [];
        }

        /*
         * Create answer.
         */
        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        console.log(
          '[Guest] Sending WebRTC answer'
        );

        s.emit('webrtc-answer', {
          roomCode: rc,
          answer: pc.localDescription,
        });
      } catch (error) {
        console.error(
          '[Guest] handleOffer error:',
          error
        );
      }
    },
    [createPeer]
  );

  /* ============================================================
     HOST - HANDLE ANSWER
  ============================================================ */

  const handleAnswer = useCallback(
    async (answer) => {
      const pc = pcRef.current;

      if (!pc) {
        console.warn(
          '[Host] Peer connection missing'
        );

        return;
      }

      if (answerReceivedRef.current) {
        return;
      }

      answerReceivedRef.current = true;

      try {
        console.log(
          '[Host] Received WebRTC answer'
        );

        await pc.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        console.log(
          '[Host] Remote description set'
        );

        /*
         * Add queued ICE candidates.
         */
        const pendingCandidates =
          pendingIceCandidatesRef.current;

        if (pendingCandidates.length > 0) {
          console.log(
            '[Host] Adding queued ICE candidates:',
            pendingCandidates.length
          );

          for (const candidate of pendingCandidates) {
            try {
              await pc.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (error) {
              console.warn(
                '[Host] Queued ICE candidate error:',
                error
              );
            }
          }

          pendingIceCandidatesRef.current = [];
        }
      } catch (error) {
        console.error(
          '[Host] setRemoteDescription error:',
          error
        );

        answerReceivedRef.current = false;
      }
    },
    []
  );

  /* ============================================================
     HANDLE ICE CANDIDATE
  ============================================================ */

  const handleIceCandidate = useCallback(
    async (candidate) => {
      if (!candidate) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        console.warn(
          '[ICE] Peer connection not ready. Queueing candidate.'
        );

        pendingIceCandidatesRef.current.push(
          candidate
        );

        return;
      }

      /*
       * Remote description must exist before adding candidate.
       */
      if (!pc.remoteDescription) {
        console.log(
          '[ICE] Remote description not ready. Queueing candidate.'
        );

        pendingIceCandidatesRef.current.push(
          candidate
        );

        return;
      }

      try {
        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log(
          '[ICE] Candidate added'
        );
      } catch (error) {
        console.warn(
          '[ICE] addIceCandidate error:',
          error
        );
      }
    },
    []
  );

  /* ============================================================
     SOCKET SIGNALING LISTENERS
  ============================================================ */

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onOffer = async ({ offer }) => {
      await handleOffer(offer);
    };

    const onAnswer = async ({ answer }) => {
      await handleAnswer(answer);
    };

    const onIce = async ({ candidate }) => {
      await handleIceCandidate(candidate);
    };

    socket.on(
      'webrtc-offer',
      onOffer
    );

    socket.on(
      'webrtc-answer',
      onAnswer
    );

    socket.on(
      'webrtc-ice-candidate',
      onIce
    );

    return () => {
      socket.off(
        'webrtc-offer',
        onOffer
      );

      socket.off(
        'webrtc-answer',
        onAnswer
      );

      socket.off(
        'webrtc-ice-candidate',
        onIce
      );
    };
  }, [
    socket,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  /* ============================================================
     RESET WHEN ROOM CHANGES
  ============================================================ */

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const isFirstMount =
      lastRoomCodeRef.current === null;

    const isSameRoom =
      lastRoomCodeRef.current === roomCode;

    if (!isFirstMount && !isSameRoom) {
      resetPeer();
    }

    lastRoomCodeRef.current = roomCode;
  }, [
    roomCode,
    resetPeer,
  ]);

  /* ============================================================
     RE-OFFER WHEN NEW PEER JOINS
  ============================================================ */

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onUserJoined = () => {
      if (roleRef.current === 'host') {
        console.log(
          '[WebRTC] New peer joined, (re)initiating connection'
        );

        startAsHost();
      }
    };

    const onUserLeft = () => {
      console.log(
        '[WebRTC] Peer left the room'
      );
    };

    socket.on(
      'user-joined',
      onUserJoined
    );

    socket.on(
      'user-left',
      onUserLeft
    );

    return () => {
      socket.off(
        'user-joined',
        onUserJoined
      );

      socket.off(
        'user-left',
        onUserLeft
      );
    };
  }, [
    socket,
    startAsHost,
  ]);

  /* ============================================================
     RE-OFFER AFTER SOCKET RECONNECT
  ============================================================ */

  const didMountRejoinRef = useRef(false);

  useEffect(() => {
    if (!didMountRejoinRef.current) {
      didMountRejoinRef.current = true;
      return;
    }

    if (rejoinNonce === undefined) {
      return;
    }

    if (roleRef.current === 'host') {
      console.log(
        '[WebRTC] Local socket reconnected & re-registered, sending fresh offer'
      );

      startAsHost();
    }
  }, [
    rejoinNonce,
    startAsHost,
  ]);

  /* ============================================================
     TAB VISIBILITY
  ============================================================ */

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState !== 'visible'
      ) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        return;
      }

      const dc = dcRef.current;

      if (dc?.readyState === 'open') {
        return;
      }

      if (
        pc.connectionState === 'disconnected' ||
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed'
      ) {
        console.log(
          '[WebRTC] Restarting ICE after visibility change'
        );

        try {
          pc.restartIce?.();
        } catch (error) {
          console.warn(
            '[WebRTC] restartIce failed:',
            error
          );
        }
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    window.addEventListener(
      'focus',
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

      window.removeEventListener(
        'focus',
        handleVisibility
      );
    };
  }, []);

  /* ============================================================
     HEALTH CHECK
  ============================================================ */

  useEffect(() => {
    const interval = setInterval(() => {
      const pc = pcRef.current;
      const dc = dcRef.current;

      if (!pc) {
        return;
      }

      if (dc?.readyState === 'open') {
        return;
      }

      const iceState =
        pc.iceConnectionState;

      const connState =
        pc.connectionState;

      if (
        iceState === 'failed' ||
        connState === 'failed'
      ) {
        console.log(
          '[WebRTC] Health check: restarting ICE'
        );

        try {
          pc.restartIce?.();
        } catch (error) {
          console.warn(
            '[WebRTC] restartIce failed:',
            error
          );
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      /*
       * Cleanup should not produce a fake disconnect sound simply
       * because the React component is being unmounted.
       */
      const dc = dcRef.current;
      const pc = pcRef.current;

      try {
        dc?.close();
      } catch {}

      try {
        pc?.close();
      } catch {}

      dcRef.current = null;
      pcRef.current = null;

      offerSentRef.current = false;
      answerReceivedRef.current = false;

      pendingIceCandidatesRef.current = [];

      dataChannelWasOpenedRef.current = false;
      disconnectSoundPlayedRef.current = true;
    };
  }, []);

  /* ============================================================
     RETURN
  ============================================================ */

  return {
    startAsHost,
    connectionState,
    dataChannelOpen,

    getDataChannel: () => dcRef.current,

    resetPeer,
  };
}