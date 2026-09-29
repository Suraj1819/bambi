import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  LogOut,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Download,
  Trash2,
  X,
  Wifi,
  ShieldCheck,
  CloudUpload,
  Paperclip,
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Power,
  Lock,
  Unlock,
  Share2,
  RotateCcw,
  Clock,
  QrCode,
} from 'lucide-react';
import { useRoom, getHostToken, saveHostToken, clearHostToken, addRecentRoom } from '../context/RoomContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { toast } from '../components/common/ToastContainer';
import PeerRadar from '../components/common/PeerRadar';
import {
  detectDevice,
  detectDeviceInfo,
  formatBytes,
  formatETA,
  formatLocalDateTime,
  getFileCategory,
} from '../utils/fileUtils';

function getDeviceIcon(deviceName) {
  const name = (deviceName || '').toLowerCase();
  if (name.includes('iphone') || (name.includes('android') && !name.includes('tablet')))
    return Smartphone;
  if (name.includes('ipad') || name.includes('tablet')) return Tablet;
  if (name.includes('windows') || name.includes('mac') || name.includes('linux'))
    return Laptop;
  return Monitor;
}

function getFileTypeIcon(mimeType) {
  const category = getFileCategory(mimeType);
  if (category === 'image') return FileImage;
  if (category === 'video') return FileVideo;
  if (category === 'audio') return FileAudio;
  if (category === 'archive') return FileArchive;
  return FileText;
}

const LARGE_FILE_WARNING_BYTES = 500 * 1024 * 1024;

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return null;
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.35);
  } catch {}
}

function notifyTransferComplete(fileName, direction) {
  playCompletionSound();
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('WebDrop', {
        body: direction === 'in' ? `Received ${fileName}` : `Sent ${fileName}`,
      });
    }
  } catch {}
}

export default function RoomPage() {
  const { roomCode: urlCode } = useParams();
  const navigate = useNavigate();

  const {
    socket,
    deviceName: ctxDeviceName,
    deviceInfo: ctxDeviceInfo,
    setRoomCode,
    setRole,
    role,
    users,
    setUsers,
    locked,
    setLocked,
    setNavLocked,
  } = useRoom();

  const deviceName = ctxDeviceName || detectDevice();
  const deviceInfo = ctxDeviceInfo || detectDeviceInfo();
  const roomCode = (urlCode || '').toUpperCase();

  const [joining, setJoining] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef(null);
  const joinedRef = useRef(false);
  const disconnectingRef = useRef(false);
  const hostTokenRef = useRef(getHostToken(roomCode));

  useEffect(() => {
    if (!socket || !roomCode) return;
    if (joinedRef.current) return;
    joinedRef.current = true;
    setJoining(true);
    setRoomError('');
    setRoomCode(roomCode);

    const minWait = new Promise((r) => setTimeout(r, 600));

    socket.emit(
      'join-room',
      { roomCode, deviceName, deviceInfo, hostToken: hostTokenRef.current || undefined },
      async (res) => {
        await minWait;
        setJoining(false);
        if (!res?.success) {
          setRoomError(res?.message || 'Could not join room');
          toast.error('Cannot join', res?.message || 'Room not found');
          joinedRef.current = false;
          return;
        }
        const me = res.room?.users?.find((u) => u.socketId === socket.id);
        const amHost = Boolean(me?.isHost);
        setRole(amHost ? 'host' : 'guest');
        setUsers(res.room?.users || []);
        setLocked(Boolean(res.room?.locked));
        setExpiresAt(res.room?.expiresAt || null);
        addRecentRoom(roomCode, amHost ? 'host' : 'guest');
      }
    );

    const t = setTimeout(() => {
      setJoining(false);
      joinedRef.current = false;
    }, 8000);
    return () => {
      clearTimeout(t);
      joinedRef.current = false;
    };
    // eslint-disable-next-line
  }, [socket, roomCode]);

  useEffect(() => {
    setNavLocked(true);
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      setNavLocked(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [setNavLocked]);

  const requestNotifyPermission = useCallback(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotifyEnabled(true);
      return;
    }
    Notification.requestPermission().then((perm) => setNotifyEnabled(perm === 'granted'));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onRoomEnded = () => {
      clearHostToken(roomCode);
      toast.error('Room ended', 'The host has ended this room.');
      setNavLocked(false);
      navigate('/');
    };

    const onKicked = () => {
      toast.error('Removed', 'The host removed you from this room.');
      setNavLocked(false);
      navigate('/');
    };

    const onRoomExpired = () => {
      clearHostToken(roomCode);
      toast.error('Room expired', 'The 30-minute timer has ended.');
      setNavLocked(false);
      navigate('/');
    };

    socket.on('room-ended', onRoomEnded);
    socket.on('kicked', onKicked);
    socket.on('room-expired', onRoomExpired);
    return () => {
      socket.off('room-ended', onRoomEnded);
      socket.off('kicked', onKicked);
      socket.off('room-expired', onRoomExpired);
    };
    // eslint-disable-next-line
  }, [socket, roomCode]);

  const [remainingMs, setRemainingMs] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const expiryLabel = remainingMs != null ? formatETA(remainingMs / 1000) : null;

  const handleEndRoom = useCallback(() => {
    if (!socket || !hostTokenRef.current) return;
    socket.emit('end-room', { roomCode, hostToken: hostTokenRef.current }, (res) => {
      if (!res?.success) {
        toast.error('Could not end room', res?.message || 'Try again.');
        return;
      }
      clearHostToken(roomCode);
      setNavLocked(false);
      navigate('/');
    });
  }, [socket, roomCode, navigate, setNavLocked]);

  const handleToggleLock = useCallback(() => {
    if (!socket || !hostTokenRef.current) return;
    socket.emit(
      'set-room-lock',
      { roomCode, hostToken: hostTokenRef.current, locked: !locked },
      (res) => {
        if (!res?.success) {
          toast.error('Could not update lock', res?.message || 'Try again.');
          return;
        }
        setLocked(res.locked);
        toast.success(
          res.locked ? 'Room locked' : 'Room unlocked',
          res.locked ? 'New devices cannot join.' : 'The room now accepts new joins.'
        );
      }
    );
  }, [socket, roomCode, locked, setLocked]);

  const handleKickPeer = useCallback(
    (socketId) => {
      if (!socket || !hostTokenRef.current) return;
      socket.emit('kick-peer', { roomCode, hostToken: hostTokenRef.current, socketId }, (res) => {
        if (!res?.success) toast.error('Could not remove peer', res?.message || 'Try again.');
      });
    },
    [socket, roomCode]
  );

  const transferRef = useRef(null);
  const onIncomingData = useCallback((event) => {
    transferRef.current?.handleIncomingData(event);
  }, []);

  const webrtc = useWebRTC({ socket, roomCode, role, onIncomingData });
  const transfer = useFileTransfer({ getDataChannel: webrtc.getDataChannel });

  const peer = users.find((u) => u.socketId !== socket?.id);
  const prevPeerRef = useRef(false);

  const [peerReveal, setPeerReveal] = useState('idle');
  const peerRevealTimers = useRef([]);

  useEffect(() => {
    const hasPeer = Boolean(peer);

    if (hasPeer && !prevPeerRef.current) {
      peerRevealTimers.current.forEach(clearTimeout);
      peerRevealTimers.current = [];
      setPeerReveal('listening');
      const t1 = setTimeout(() => setPeerReveal('fetching'), 800);
      const t2 = setTimeout(() => setPeerReveal('ready'), 800 + 1200);
      peerRevealTimers.current = [t1, t2];
    } else if (!hasPeer && prevPeerRef.current) {
      peerRevealTimers.current.forEach(clearTimeout);
      peerRevealTimers.current = [];
      setPeerReveal('idle');
      transfer.markPeerDisconnected();
      toast.warning('Peer disconnected', 'Active transfers were stopped. They can rejoin to continue.');
    } else if (hasPeer && prevPeerRef.current === false && peerReveal === 'idle') {
      setPeerReveal('ready');
    }

    prevPeerRef.current = hasPeer;
    return () => {
      peerRevealTimers.current.forEach(clearTimeout);
      peerRevealTimers.current = [];
    };
    // eslint-disable-next-line
  }, [peer?.socketId]);

  useEffect(() => {
    transferRef.current = transfer;
  }, [transfer]);

  const dataChannelReady = webrtc.dataChannelOpen;
  const peerVisible = Boolean(peer) && peerReveal === 'ready';
  const connected = dataChannelReady && peerReveal === 'ready';

  const connectionState = (() => {
    if (connected) return 'connected';
    if (peer && peerReveal === 'ready') return 'establishing';
    if (peer && peerReveal === 'fetching') return 'establishing';
    if (peer && peerReveal === 'listening') return 'waiting';
    return 'waiting';
  })();

  const waitingForLabel =
    role === 'host' ? 'Waiting for guest' : role === 'guest' ? 'Waiting for host' : 'Waiting for peer';

  const stateInfo = {
    waiting: {
      label: peerReveal === 'listening' ? 'Listening' : waitingForLabel,
      badgeClass: 'bg-slate-500',
      dotClass: 'bg-slate-400',
    },
    establishing: {
      label: peerReveal === 'fetching' ? 'Fetching…' : 'Establishing',
      badgeClass: 'bg-amber-500',
      dotClass: 'bg-amber-500 animate-pulse',
    },
    connected: {
      label: 'Connected',
      badgeClass: 'bg-purple-600',
      dotClass: 'bg-emerald-500',
    },
  }[connectionState];

  useEffect(() => {
    if (role !== 'host') return;
    if (users.length !== 2) return;
    if (peerReveal !== 'ready') return;
    if (webrtc.connectionState !== 'new') return;
    webrtc.startAsHost();
    // eslint-disable-next-line
  }, [role, users.length, peerReveal, webrtc.connectionState]);

  const inviteUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/join?room=${roomCode}` : '';

  const handleCopyInvite = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = inviteUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Copied', 'Invite link copied.');
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Copy failed', 'Please copy manually.');
    }
  }, [inviteUrl]);

  const handleCopyCode = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomCode);
      } else {
        const ta = document.createElement('textarea');
        ta.value = roomCode;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Copied', `Room code ${roomCode} copied.`);
    } catch {
      toast.error('Copy failed', 'Please copy the code manually.');
    }
  }, [roomCode]);

  const handleShareInvite = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'WebDrop room',
          text: `Join my WebDrop room: ${roomCode}`,
          url: inviteUrl,
        });
      }
    } catch {}
  }, [inviteUrl, roomCode]);

  const handleFilesSelected = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      if (connectionState !== 'connected') {
        toast.warning('Not connected yet', `${waitingForLabel}. Files will be enabled once connected.`);
        return;
      }
      const big = files.find((f) => f.size > LARGE_FILE_WARNING_BYTES);
      if (big) {
        toast.warning(
          'Large file selected',
          `${big.name} is ${formatBytes(big.size)}. Large transfers can take a while — keep this tab open until it finishes.`
        );
      }
      requestNotifyPermission();
      transfer.sendFiles(files);
    },
    [connectionState, waitingForLabel, transfer, requestNotifyPermission]
  );

  useEffect(() => {
    if (!showQr) return;
    const onOutside = (e) => {
      if (qrRef.current && !qrRef.current.contains(e.target)) setShowQr(false);
    };
    const onEscape = (e) => {
      if (e.key === 'Escape') setShowQr(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [showQr]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.files;
      if (items && items.length) handleFilesSelected(items);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFilesSelected]);

  // Let the receiver know a file is on the way as soon as the offer arrives,
  // rather than only once the transfer completes.
  const notifiedOffersRef = useRef(new Set());
  useEffect(() => {
    transfer.incoming.forEach((f) => {
      if (f.status === 'pending' && !notifiedOffersRef.current.has(f.fileId)) {
        notifiedOffersRef.current.add(f.fileId);
        const notify = toast.info || toast.success;
        notify(
          'Incoming file',
          `${peer?.deviceName || 'Peer'} wants to send "${f.name}" (${formatBytes(f.size)})`
        );
      }
    });
  }, [transfer.incoming, peer]);

  const handleDisconnect = useCallback(
    (e) => {
      if (!e) return;
      if (!e.nativeEvent || !e.nativeEvent.isTrusted) return;
      const btn = e.currentTarget;
      if (!btn || btn.dataset.disconnectBtn !== 'true') return;
      if (disconnectingRef.current) return;
      disconnectingRef.current = true;

      socket?.emit('leave-room', { roomCode });
      webrtc.resetPeer?.();
      setRoomCode(null);
      setRole(null);
      setUsers([]);
      joinedRef.current = false;
      navigate('/');
    },
    [socket, roomCode, webrtc, setRoomCode, setRole, setUsers, navigate]
  );

  const totalActiveSpeed = useMemo(() => {
    const active = [...transfer.outgoing, ...transfer.incoming].filter(
      (f) => f.status === 'transferring' || f.status === 'receiving'
    );
    return active.reduce((sum, f) => sum + (f.speed || 0), 0);
  }, [transfer.outgoing, transfer.incoming]);
  const totalActiveSpeedLabel = formatSpeed(totalActiveSpeed);

  // Unified, priority-ordered queue: anything needing your attention or actively
  // moving surfaces first (incoming offers included), then completed, then
  // failed/rejected/cancelled — instead of always listing every outgoing file
  // before any incoming one regardless of what actually needs attention.
  const queuePriority = (status) => {
    if (status === 'pending') return 0;
    if (status === 'waiting' || status === 'transferring' || status === 'receiving') return 1;
    if (status === 'completed') return 2;
    return 3;
  };
  const queueItems = useMemo(() => {
    const items = [
      ...transfer.incoming.map((f) => ({ file: f, direction: 'in' })),
      ...transfer.outgoing.map((f) => ({ file: f, direction: 'out' })),
    ];
    return items
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const diff = queuePriority(a.item.file.status) - queuePriority(b.item.file.status);
        return diff !== 0 ? diff : a.idx - b.idx;
      })
      .map(({ item }) => item);
  }, [transfer.incoming, transfer.outgoing]);

  if (joining && socket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] dark:bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <p className="text-[14px] text-slate-500 dark:text-slate-400">Joining room…</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] dark:bg-surface px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-500/20 dark:bg-surface-card">
          <p className="text-[20px] font-bold text-slate-900 dark:text-white">Cannot join</p>
          <p className="mt-3 text-[14px] text-slate-500 dark:text-slate-400">{roomError}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-[14px] font-semibold text-white hover:bg-purple-700"
          >
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  const filesCount = transfer.outgoing.length + transfer.incoming.length;
  const YouIcon = getDeviceIcon(deviceName);
  const PeerIcon = getDeviceIcon(peer?.deviceName);

  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 sm:py-10 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p
                className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 sm:text-[10px]"
                style={{ letterSpacing: '0.24em' }}
              >
                Transmission Room
              </p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase text-white transition-all duration-300 sm:px-3 sm:text-[10px] ${stateInfo.badgeClass}`}
                style={{ letterSpacing: '0.1em' }}
              >
                {connectionState === 'connected' && (
                  <CheckCircle className="h-3 w-3" strokeWidth={2.8} />
                )}
                {connectionState === 'establishing' && (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.8} />
                )}
                {connectionState === 'waiting' && <Wifi className="h-3 w-3" strokeWidth={2.8} />}
                {stateInfo.label}
              </span>
            </div>

            <h1 className="mt-2 font-heading text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[32px] lg:text-[40px]">
              Room{' '}
              <span className="font-mono tracking-[0.05em] text-purple-600 dark:text-purple-400">
                {roomCode}
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[14px]">
              Share files directly. The signaling server only helps these two browsers find each
              other.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-[12px] font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20 sm:px-4 sm:py-2.5 sm:text-[13px]"
              title="Copy room code"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="font-mono tracking-widest">{roomCode}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:px-4 sm:py-2.5 sm:text-[13px]"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden xs:inline sm:inline">Copy invite</span>
              <span className="xs:hidden sm:hidden">Invite</span>
            </button>

            <div ref={qrRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors sm:px-4 sm:py-2.5 sm:text-[13px] ${
                  showQr
                    ? 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-400/30 dark:bg-purple-500/20 dark:text-purple-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
                title="Show QR code to join"
              >
                <QrCode className="h-3.5 w-3.5" strokeWidth={2.2} />
                QR
              </button>

              {showQr && (
                <div className="absolute right-0 top-full z-30 mt-3 w-[min(260px,calc(100vw-2rem))] rounded-2xl border border-purple-200 bg-white p-4 shadow-xl shadow-purple-900/10 dark:border-purple-500/20 dark:bg-surface-card">
                  <div className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-purple-200 bg-white dark:border-purple-500/20 dark:bg-surface-card" />

                  <div className="relative flex items-center justify-between gap-2">
                    <p
                      className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                      style={{ letterSpacing: '0.16em' }}
                    >
                      Scan to join
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQr(false)}
                      aria-label="Close QR code"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  </div>

                  <div className="relative mt-3 flex justify-center rounded-xl border border-slate-100 bg-white p-3 dark:border-surface-border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        inviteUrl
                      )}`}
                      alt="Scan to join this room"
                      width={176}
                      height={176}
                      className="h-[176px] w-[176px] max-w-full"
                    />
                  </div>

                  <p className="relative mt-3 text-center text-[12px] text-slate-500 dark:text-slate-400">
                    Room{' '}
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {roomCode}
                    </span>
                  </p>

                  <div className="relative mt-3">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-surface-border dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" strokeWidth={2.2} />
                      Copy link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                type="button"
                onClick={handleShareInvite}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:hidden"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                Share
              </button>
            )}

            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold sm:py-2.5 sm:text-[13px] ${
                peerVisible
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-surface-border dark:bg-white/5 dark:text-slate-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${peerVisible ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
              {peerVisible ? '2' : '1'}/2
            </span>

            {role === 'host' && (
              <button
                type="button"
                onClick={handleToggleLock}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors sm:px-4 sm:py-2.5 sm:text-[13px] ${
                  locked
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
                title={locked ? 'Unlock room' : 'Lock room to new joins'}
              >
                {locked ? (
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                ) : (
                  <Unlock className="h-3.5 w-3.5" strokeWidth={2.4} />
                )}
                <span className="hidden sm:inline">{locked ? 'Locked' : 'Lock room'}</span>
              </button>
            )}

            <button
              type="button"
              data-disconnect-btn="true"
              onClick={handleDisconnect}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:px-4 sm:py-2.5 sm:text-[13px]"
              title="Leave — the room stays open and you can rejoin"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.4} />
              Leave
            </button>

            {role === 'host' && (
              <button
                type="button"
                onClick={handleEndRoom}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 sm:px-4 sm:py-2.5 sm:text-[13px]"
                title="End the room for everyone"
              >
                <Power className="h-3.5 w-3.5" strokeWidth={2.4} />
                <span className="hidden sm:inline">End room</span>
              </button>
            )}
          </div>
        </div>

        {expiryLabel && (
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-400 dark:text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Room expires in {expiryLabel}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5 md:grid-cols-[340px_1fr] lg:grid-cols-[400px_1fr]">
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-surface-border dark:bg-surface-card sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                    style={{ letterSpacing: '0.22em' }}
                  >
                    Live Topology
                  </p>
                  <h3 className="mt-1 font-heading text-[18px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[20px]">
                    Peer radar
                  </h3>
                </div>
                {connectionState === 'connected' ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" strokeWidth={2.4} />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${stateInfo.dotClass}`} />
                )}
              </div>

              {/* Peer radar: search animation jab tak device nahi milta,
                  connect hone ke baad poori device details */}
              <PeerRadar
                role={role}
                peer={peer}
                peerVisible={peerVisible}
                peerReveal={peerReveal}
                connected={connected}
                connectionState={connectionState}
                deviceName={deviceName}
                deviceInfo={deviceInfo}
                YouIcon={YouIcon}
                PeerIcon={PeerIcon}
                onKickPeer={handleKickPeer}
              />

              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-3 dark:border-surface-border">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">Data channel</span>
                  <span
                    className={`text-[12px] font-semibold sm:text-[13px] ${
                      connectionState === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : connectionState === 'establishing'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {connectionState === 'connected'
                      ? 'DTLS active'
                      : connectionState === 'establishing'
                      ? 'Establishing…'
                      : 'Waiting'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">Room created</span>
                  <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[13px]">
                    {expiresAt ? formatLocalDateTime(expiresAt - 30 * 60 * 1000) : '--'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">Expires at</span>
                  <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[13px]">
                    {expiresAt ? formatLocalDateTime(expiresAt) : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 transition-all duration-300 sm:p-5 ${
                connectionState === 'connected'
                  ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                  : connectionState === 'establishing'
                  ? 'border-amber-100 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/10'
                  : 'border-purple-100 bg-purple-50/60 dark:border-purple-500/20 dark:bg-purple-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    connectionState === 'connected'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20'
                      : connectionState === 'establishing'
                      ? 'bg-amber-100 dark:bg-amber-500/20'
                      : 'bg-purple-100 dark:bg-purple-500/20'
                  }`}
                >
                  {connectionState === 'connected' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : connectionState === 'establishing' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                  ) : (
                    <span className="text-[14px] text-purple-600">🔗</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-[14px]">
                    {connectionState === 'connected'
                      ? 'Peer connected'
                      : connectionState === 'establishing'
                      ? 'Establishing secure channel'
                      : 'Waiting for the other device?'}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[13px]">
                    {connectionState === 'connected' ? (
                      <>
                        Encrypted DataChannel is open with{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {peer?.deviceName || 'peer'}
                        </span>
                        . You can now send and receive files.
                      </>
                    ) : connectionState === 'establishing' ? (
                      'Both devices found each other. Negotiating DTLS encryption over WebRTC — this usually takes a few seconds.'
                    ) : (
                      <>
                        Send room code{' '}
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {roomCode}
                        </span>{' '}
                        or share the invite link / QR code. Only one receiver can join.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            <div
              onClick={() =>
                connectionState === 'connected' && document.getElementById('file-input')?.click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                if (connectionState === 'connected') setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (connectionState !== 'connected') return;
                handleFilesSelected(e.dataTransfer?.files);
              }}
              className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10 lg:p-14 ${
                isDragging
                  ? 'scale-[1.01] border-purple-500 bg-purple-100/60 dark:border-purple-400 dark:bg-purple-500/15'
                  : connectionState === 'connected'
                  ? 'cursor-pointer border-purple-300 bg-purple-50/30 hover:border-purple-400 hover:bg-purple-50/60 dark:border-purple-500/30 dark:bg-purple-500/5 dark:hover:border-purple-400/50 dark:hover:bg-purple-500/10'
                  : connectionState === 'establishing'
                  ? 'cursor-wait border-amber-300 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-500/5'
                  : 'cursor-not-allowed border-slate-200 bg-slate-50 dark:border-surface-border dark:bg-white/[0.02]'
              }`}
            >
              {connectionState === 'establishing' && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              )}

              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300 sm:h-14 sm:w-14 ${
                  connectionState === 'connected'
                    ? 'bg-purple-100 dark:bg-purple-500/15'
                    : connectionState === 'establishing'
                    ? 'bg-amber-100 dark:bg-amber-500/15'
                    : 'bg-slate-100 dark:bg-white/5'
                }`}
              >
                {connectionState === 'establishing' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400 sm:h-6 sm:w-6" />
                ) : (
                  <CloudUpload
                    className={`h-6 w-6 sm:h-7 sm:w-7 ${
                      connectionState === 'connected'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                    strokeWidth={1.8}
                  />
                )}
              </div>

              <p className="relative mt-3 text-[15px] font-semibold text-slate-900 dark:text-white sm:mt-4 sm:text-[18px]">
                {connectionState === 'connected'
                  ? 'Drop files to transfer'
                  : connectionState === 'establishing'
                  ? 'Establishing connection…'
                  : `${waitingForLabel} to connect…`}
              </p>

              <p className="relative mt-1.5 max-w-md text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[14px]">
                {connectionState === 'connected'
                  ? 'Drag and drop any file here, or choose from your device. Nothing is uploaded.'
                  : connectionState === 'establishing'
                  ? 'Secure DataChannel is being negotiated. This will be ready in a few seconds.'
                  : 'Files transfer directly between browsers over an encrypted WebRTC DataChannel. Nothing touches our servers.'}
              </p>

              {connectionState === 'connected' && (
                <>
                  <div className="relative mt-4 flex w-full flex-wrap items-center justify-center gap-2 sm:mt-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('file-input')?.click();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:shadow-none dark:hover:bg-white/10 sm:px-5 sm:text-[14px]"
                    >
                      <Paperclip className="h-4 w-4" strokeWidth={2} />
                      Choose files
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('folder-input')?.click();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:shadow-none dark:hover:bg-white/10 sm:px-5 sm:text-[14px]"
                    >
                      <FileArchive className="h-4 w-4" strokeWidth={2} />
                      Choose folder
                    </button>
                  </div>
                  <p className="relative mt-5 px-2 text-[10px] font-medium leading-relaxed tracking-wide text-slate-400 dark:text-slate-600 sm:mt-6 sm:text-[11px]">
                    16 KB CHUNKS · BACKPRESSURE ENABLED · NO SIZE LIMIT
                  </p>
                </>
              )}

              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                id="folder-input"
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-surface-border dark:bg-surface-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                    style={{ letterSpacing: '0.22em' }}
                  >
                    Transfer Queue
                  </p>
                  <h3 className="mt-1 font-heading text-[18px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[20px]">
                    Files in this room
                  </h3>
                  {filesCount > 0 && (
                    <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                      {filesCount} file{filesCount === 1 ? '' : 's'} ·{' '}
                      {formatBytes(
                        [...transfer.outgoing, ...transfer.incoming].reduce(
                          (sum, f) => sum + (f.size || 0),
                          0
                        )
                      )}{' '}
                      total
                      {totalActiveSpeedLabel && (
                        <>
                          {' '}
                          ·{' '}
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {totalActiveSpeedLabel}
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-surface-border dark:bg-white/5 dark:text-slate-400">
                    {filesCount} items
                  </span>
                  {filesCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={transfer.clearCompleted}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        <CheckCircle className="h-3 w-3" strokeWidth={2.4} />
                        <span className="hidden xs:inline">Clear completed</span>
                        <span className="xs:hidden">Clear done</span>
                      </button>
                      <button
                        type="button"
                        onClick={transfer.clearAll}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 transition-all hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2.4} />
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              {filesCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center sm:py-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                    <FileText className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[15px]">
                    No files in the queue
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">
                    Accepted transfers will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-3">
                  {queueItems.map(({ file: f, direction }) =>
                    direction === 'out' ? (
                      <FileRow
                        key={f.fileId}
                        file={f}
                        direction="out"
                        onCancel={() => transfer.cancelOutgoing(f.fileId)}
                        onRemove={() => transfer.removeFile(f.fileId, 'out')}
                        onRetry={() => transfer.retryFile(f.fileId)}
                        onCompleteNotify={() => notifyTransferComplete(f.name, 'out')}
                      />
                    ) : (
                      <FileRow
                        key={f.fileId}
                        file={f}
                        direction="in"
                        onDownload={() => transfer.downloadFile(f.fileId)}
                        onAccept={() => transfer.acceptOffer(f.fileId)}
                        onReject={() => transfer.rejectOffer(f.fileId)}
                        onCancel={() => transfer.cancelIncoming(f.fileId)}
                        onRemove={() => transfer.removeFile(f.fileId, 'in')}
                        onCompleteNotify={() => notifyTransferComplete(f.name, 'in')}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-[14px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </button>
        </div>
      </div>
    </div>
  );
}

function FileRow({
  file,
  direction,
  onDownload,
  onAccept,
  onReject,
  onCancel,
  onRemove,
  onRetry,
  onCompleteNotify,
}) {
  const [removing, setRemoving] = useState(false);
  const notifiedRef = useRef(false);

  const isIncoming = direction === 'in';
  const isPending = file.status === 'pending';
  const isReceiving = file.status === 'receiving';
  const isCompleted = file.status === 'completed';
  const isFailed = file.status === 'failed';
  const isRejected = file.status === 'rejected';
  const isCancelled = file.status === 'cancelled';
  const isWaiting = file.status === 'waiting';
  const isTransferring = file.status === 'transferring';

  useEffect(() => {
    if (isCompleted && !notifiedRef.current) {
      notifiedRef.current = true;
      onCompleteNotify?.();
    }
    // eslint-disable-next-line
  }, [isCompleted]);

  const canDownload = isIncoming && isCompleted && file.blob;
  const canCancel =
    (isIncoming && isReceiving) || (!isIncoming && (isWaiting || isTransferring));
  const canRetry = !isIncoming && isFailed && Boolean(onRetry);
  const cancelLabel = isIncoming ? 'Cancel receiving' : 'Cancel transfer';
  const hasActionsRow = canDownload || canRetry || isPending || canCancel;

  const transferredBytes = isIncoming
    ? file.bytesReceived || 0
    : file.bytesReceived || file.bytesSent || 0;

  const progress = Math.min(100, file.size > 0 ? (transferredBytes / file.size) * 100 : 0);

  const speedLabel = formatSpeed(file.speed);
  const isActive = isReceiving || isTransferring;
  const remainingBytes = Math.max(0, (file.size || 0) - transferredBytes);
  const etaSeconds = file.speed > 0 ? remainingBytes / file.speed : null;
  const etaLabel = isActive && etaSeconds != null ? formatETA(etaSeconds) : null;

  const statusLabel = (() => {
    if (isCompleted) return isIncoming ? 'Received' : 'Sent';
    if (isFailed) return 'Failed';
    if (isRejected) return 'Rejected';
    if (isCancelled) return 'Cancelled';
    if (isPending) return isIncoming ? 'Incoming — waiting for you' : 'Waiting for response';
    if (isWaiting) return 'Waiting for accept…';
    if (isActive) return `${progress.toFixed(1)}%`;
    return 'Ready';
  })();

  const statusColor = isCompleted
    ? 'text-emerald-600 dark:text-emerald-400'
    : isFailed || isRejected || isCancelled
    ? 'text-red-500 dark:text-red-400'
    : isPending || isWaiting
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-slate-500 dark:text-slate-400';

  const TypeIcon = getFileTypeIcon(file.mimeType);

  const isActiveOrPending = isPending || isWaiting || isTransferring || isReceiving;

  const handleRemove = () => {
    // For anything still in flight or awaiting a response, the X must actually
    // cancel/reject so the other side's row updates too — not just disappear
    // locally while the peer still sees a pending request or a stalled transfer.
    if (isActiveOrPending) {
      if (isIncoming) {
        if (isPending) onReject?.();
        else onCancel?.();
      } else {
        onCancel?.();
      }
      return;
    }
    setRemoving(true);
    setTimeout(() => onRemove?.(), 220);
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all duration-200 dark:border-surface-border dark:bg-white/[0.03] ${
        removing ? 'translate-x-4 scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 sm:h-10 sm:w-10">
          <TypeIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 sm:h-5 sm:w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white sm:text-[14px]">
            {file.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-[12px]">
            <span className="text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className={statusColor}>{statusLabel}</span>
          </div>
        </div>

        {isCompleted && !isIncoming && (
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
        )}

        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove file"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>

      {hasActionsRow && (
        <div className="flex flex-col gap-2">
          {isPending && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-purple-700"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Accept
              </button>
            </div>
          )}

          {(canDownload || canRetry || canCancel) && (
            <div className="flex flex-wrap gap-2">
              {canDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 text-[13px] font-semibold text-white hover:bg-purple-700 sm:flex-none"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              )}
              {canRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 text-[13px] font-semibold text-white hover:bg-purple-700 sm:flex-none"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 sm:flex-none"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {cancelLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isActive && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {formatBytes(transferredBytes)} / {formatBytes(file.size)}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {etaLabel && (
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <Clock className="h-3 w-3" />
                  {etaLabel} left
                </span>
              )}
              {speedLabel && (
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {speedLabel}
                </span>
              )}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}