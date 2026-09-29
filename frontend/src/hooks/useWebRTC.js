// src/hooks/useWebRTC.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { ICE_SERVERS } from '../utils/constants';

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
     KEEP dataChannelOpen IN SYNC WITH THE REAL CHANNEL STATE
     FIX: a transient 'disconnected' peer state used to force this
     flag to false, and nothing set it back to true when the
     connection recovered (dc.onopen never fires again). The UI then
     showed "Establishing" while the channel was open and the
     transfer was still running.
  ============================================================ */

  const syncDataChannelOpen = useCallback(() => {
    setDataChannelOpen(dcRef.current?.readyState === 'open');
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

      // Ignore a late close event from an old channel that has
      // already been replaced by a new one.
      if (dcRef.current && dcRef.current !== dc) return;

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
      const existingState = pcRef.current.connectionState;

      // FIX: if the old peer connection is dead, reset it instead
      // of silently returning a connection that can never work again.
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
        // Recovered from a temporary drop — re-sync the flag.
        syncDataChannelOpen();
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

      if (state === 'failed' || state === 'closed') {
        // Really dead.
        setDataChannelOpen(false);
      } else {
        // 'connected' / 'disconnected' / 'connecting': the channel may
        // still be perfectly usable (e.g. a brief network blip), so
        // mirror its actual readyState instead of assuming it is down.
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
  }, [wireDataChannel, resetPeer, syncDataChannelOpen]);

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
      // FIX: an offer was sent before, but check whether that
      // connection is actually still alive. If it's dead (guest
      // left / connection failed), allow a fresh offer to go out.
      const existingState = pcRef.current?.connectionState;

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
  }, [createPeer, wireDataChannel, resetPeer]);

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
     RE-OFFER WHEN A NEW PEER JOINS THE SAME ROOM
     FIX: roomCode does not change when a guest leaves and rejoins
     the SAME room, so the "reset when room changes" effect above
     never fires. Without this, the host keeps a dead/closed
     RTCPeerConnection around and never sends a fresh offer, so a
     rejoining guest can never reconnect.
  ============================================================ */

  useEffect(() => {
    if (!socket) return;

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
      // No action needed here: the peer connection will naturally
      // go to 'disconnected'/'failed', and createPeer()/startAsHost()
      // will detect that dead state and reset on the next join.
    };

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
    };
  }, [socket, startAsHost]);

  /* ============================================================
     RE-OFFER WHEN *WE* RECONNECT (e.g. mobile tab backgrounded
     during the file picker, then came back).

     FIX: When our own socket drops and reconnects, we get a new
     socket.id. RoomContext re-registers that new socket.id with
     the server's room (see RoomContext.jsx) and bumps rejoinNonce.
     If we are the host, nobody else will proactively re-offer to
     us (the 'user-joined' broadcast only reaches OTHER members,
     not ourselves), so we must kick off a fresh offer ourselves.
  ============================================================ */

  const didMountRejoinRef = useRef(false);

  useEffect(() => {
    if (!didMountRejoinRef.current) {
      // Skip the initial render — rejoinNonce starts at 0 and this
      // effect firing on mount does not mean a reconnect happened.
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
  }, [rejoinNonce, startAsHost]);

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