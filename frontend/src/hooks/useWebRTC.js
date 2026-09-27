import { useCallback, useEffect, useRef, useState } from 'react';
import { ICE_SERVERS } from '../utils/constants';

export function useWebRTC({
  socket,
  roomCode,
  role,
  onIncomingData,
}) {
  const pcRef = useRef(null);
  const dcRef = useRef(null);

  const [connectionState, setConnectionState] = useState('new');
  const [dataChannelOpen, setDataChannelOpen] = useState(false);

  const offerSentRef = useRef(false);
  const answerReceivedRef = useRef(false);
  const lastRoomCodeRef = useRef(null);

  // Important: ICE candidates can arrive before remoteDescription
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

  const handlerRef = useRef(onIncomingData);

  useEffect(() => {
    handlerRef.current = onIncomingData;
  }, [onIncomingData]);

  /* ============================================================
     RESET PEER
  ============================================================ */

  const resetPeer = useCallback(() => {
    console.log('[WebRTC] Resetting peer connection');

    try {
      dcRef.current?.close();
    } catch {}

    try {
      pcRef.current?.close();
    } catch {}

    pcRef.current = null;
    dcRef.current = null;

    offerSentRef.current = false;
    answerReceivedRef.current = false;

    pendingIceCandidatesRef.current = [];

    setConnectionState('new');
    setDataChannelOpen(false);
  }, []);

  /* ============================================================
     DATA CHANNEL
  ============================================================ */

  const wireDataChannel = useCallback((dc) => {
    if (!dc) return;

    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log('[WebRTC] DataChannel OPEN');

      setDataChannelOpen(true);
    };

    dc.onclose = () => {
      console.log('[WebRTC] DataChannel CLOSED');

      setDataChannelOpen(false);
    };

    dc.onerror = (err) => {
      console.error('[WebRTC] DataChannel ERROR:', err);
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
      return pcRef.current;
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
      }

      if (state === 'disconnected') {
        console.warn(
          '[WebRTC] ICE disconnected'
        );
      }

      if (state === 'failed') {
        console.error(
          '[WebRTC] ICE connection FAILED'
        );

        try {
          pc.restartIce?.();
        } catch (err) {
          console.warn(
            '[WebRTC] restartIce failed:',
            err
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

      if (
        state === 'connected'
      ) {
        console.log(
          '[WebRTC] PEER CONNECTED'
        );
      }

      if (
        state === 'failed' ||
        state === 'disconnected' ||
        state === 'closed'
      ) {
        setDataChannelOpen(false);
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
       DATA CHANNEL FROM REMOTE PEER
    ---------------------------------------------------------- */

    pc.ondatachannel = (event) => {
      console.log(
        '[WebRTC] Remote DataChannel received'
      );

      dcRef.current = event.channel;

      wireDataChannel(event.channel);
    };

    pcRef.current = pc;

    return pc;
  }, [wireDataChannel]);

  /* ============================================================
     HOST - CREATE OFFER
  ============================================================ */

  const startAsHost = useCallback(async () => {
    const s = socketRef.current;
    const rc = roomCodeRef.current;

    if (!s || !rc) {
      console.warn(
        '[Host] Socket or room missing'
      );
      return;
    }

    if (!s.connected) {
      console.warn(
        '[Host] Socket not connected'
      );
      return;
    }

    if (offerSentRef.current) {
      console.log(
        '[Host] Offer already sent'
      );
      return;
    }

    offerSentRef.current = true;

    try {
      console.log(
        '[Host] Starting WebRTC connection'
      );

      const pc = createPeer();

      /* Create DataChannel only on host */

      const dc = pc.createDataChannel(
        'webdrop',
        {
          ordered: true,
        }
      );

      dcRef.current = dc;

      wireDataChannel(dc);

      /* Create offer */

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
  }, [createPeer, wireDataChannel]);

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

        /* Set remote description FIRST */

        await pc.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        console.log(
          '[Guest] Remote description set'
        );

        /* ------------------------------------------------------
           Add ICE candidates that arrived early
        ------------------------------------------------------ */

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

        /* Create answer */

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

        /* ------------------------------------------------------
           Add queued ICE candidates
        ------------------------------------------------------ */

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

      /* --------------------------------------------------------
         IMPORTANT:
         Remote description must exist before addIceCandidate
      -------------------------------------------------------- */

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
      const timer = setTimeout(() => {
        try {
          dcRef.current?.close();
        } catch {}

        try {
          pcRef.current?.close();
        } catch {}

        pcRef.current = null;
        dcRef.current = null;

        offerSentRef.current = false;
        answerReceivedRef.current = false;

        pendingIceCandidatesRef.current = [];
      }, 500);

      return () => {
        clearTimeout(timer);
      };
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