import { useCallback, useEffect, useRef, useState } from 'react';
import { ICE_SERVERS } from '../utils/constants';

export function useWebRTC({ socket, roomCode, role, onIncomingData }) {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const [connectionState, setConnectionState] = useState('new');
  const [dataChannelOpen, setDataChannelOpen] = useState(false);

  const offerSentRef = useRef(false);
  const answerReceivedRef = useRef(false);
  const lastRoomCodeRef = useRef(null);

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
     Force reset peer connection
  ============================================================ */
  const resetPeer = useCallback(() => {
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
    setConnectionState('new');
    setDataChannelOpen(false);
  }, []);

  /* ============================================================
     Wire data channel
  ============================================================ */
  const wireDataChannel = (dc) => {
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      setDataChannelOpen(true);
    };
    dc.onclose = () => {
      setDataChannelOpen(false);
    };
    dc.onerror = (err) => console.error('[dc] error', err);
    dc.onmessage = (event) => handlerRef.current?.(event);
  };

  /* ============================================================
     Create peer connection
  ============================================================ */
  const createPeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      const s = socketRef.current;
      const rc = roomCodeRef.current;
      if (e.candidate && s && rc) {
        s.emit('webrtc-ice-candidate', {
          roomCode: rc,
          candidate: e.candidate,
        });
      }
    };

    pc.onicecandidateerror = (e) => {
      console.warn('[ice] candidate error:', e.errorCode, e.errorText);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);
      if (['failed', 'disconnected', 'closed'].includes(state)) {
        setDataChannelOpen(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'disconnected' || state === 'failed') {
        try {
          pc.restartIce?.();
        } catch (err) {
          console.warn('[pc] restartIce failed:', err);
        }
      }
    };

    pc.onsignalingstatechange = () => {
    };

    pc.ondatachannel = (e) => {
      dcRef.current = e.channel;
      wireDataChannel(e.channel);
    };

    pcRef.current = pc;
    return pc;
  }, []);

  /* ============================================================
     HOST: create offer
  ============================================================ */
  const startAsHost = useCallback(async () => {
    const s = socketRef.current;
    const rc = roomCodeRef.current;

    if (!s || !rc) return;
    if (!s.connected) return;
    if (offerSentRef.current) {
      return;
    }
    offerSentRef.current = true;

    try {
      const pc = createPeer();

      const dc = pc.createDataChannel('webdrop', { ordered: true });
      dcRef.current = dc;
      wireDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      s.emit('webrtc-offer', { roomCode: rc, offer });
    } catch (err) {
      console.error('[host] startAsHost error:', err);
      offerSentRef.current = false;
    }
  }, [createPeer]);

  /* ============================================================
     GUEST: handle offer
  ============================================================ */
  const handleOffer = useCallback(
    async (offer) => {
      const s = socketRef.current;
      const rc = roomCodeRef.current;
      if (!s || !rc) return;


      try {
        const pc = createPeer();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        s.emit('webrtc-answer', { roomCode: rc, answer });
      } catch (err) {
        console.error('[guest] handleOffer error:', err);
      }
    },
    [createPeer]
  );

  /* ============================================================
     HOST: handle answer
  ============================================================ */
  const handleAnswer = useCallback(async (answer) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (answerReceivedRef.current) return;
    answerReceivedRef.current = true;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('[host] setRemoteDescription error:', err);
    }
  }, []);

  /* ============================================================
     ICE candidate
  ============================================================ */
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[ice] error', err);
    }
  }, []);

  /* ============================================================
     Socket signaling listeners
  ============================================================ */
  useEffect(() => {
    if (!socket) return;

    const onOffer = async ({ offer }) => await handleOffer(offer);
    const onAnswer = async ({ answer }) => await handleAnswer(answer);
    const onIce = async ({ candidate }) => await handleIceCandidate(candidate);

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIce);

    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIce);
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

  /* ============================================================
     RESET ON ROOM CHANGE (only when switching rooms)
  ============================================================ */
  useEffect(() => {
    if (!roomCode) return;

    const isFirstMount = lastRoomCodeRef.current === null;
    const isSameRoom = lastRoomCodeRef.current === roomCode;

    if (!isFirstMount && !isSameRoom) {
      resetPeer();
    }

    lastRoomCodeRef.current = roomCode;
  }, [roomCode, resetPeer]);

  /* ============================================================
     Tab visibility
  ============================================================ */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;

      const pc = pcRef.current;
      if (!pc) return;

      const dc = dcRef.current;
      if (dc?.readyState === 'open') return;


      if (
        pc.connectionState === 'disconnected' ||
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed'
      ) {
        try {
          pc.restartIce?.();
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  /* ============================================================
     Health check
  ============================================================ */
  useEffect(() => {
    const interval = setInterval(() => {
      const pc = pcRef.current;
      const dc = dcRef.current;
      if (!pc) return;
      if (dc?.readyState === 'open') return;

      const iceState = pc.iceConnectionState;
      const connState = pc.connectionState;

      if (iceState === 'failed' || connState === 'failed') {
        try {
          pc.restartIce?.();
        } catch {}
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ============================================================
     StrictMode-safe unmount cleanup
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
      }, 500);

      return () => clearTimeout(timer);
    };
  }, []);

  return {
    startAsHost,
    connectionState,
    dataChannelOpen,
    getDataChannel: () => dcRef.current,
    resetPeer,
  };
}