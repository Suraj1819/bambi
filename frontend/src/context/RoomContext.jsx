import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { detectDevice, detectDeviceInfo } from '../utils/fileUtils';

const RoomContext = createContext(null);
const RECENT_ROOMS_KEY = 'webdrop-recent-rooms';

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}

/* ============================================================
   Host-token persistence (sessionStorage)
   Lets a host reload/rejoin the same room and be recognised as
   host again, without ever exposing the token to the other peer.
============================================================ */
function hostTokenKey(roomCode) {
  return `webdrop-host-token-${roomCode}`;
}
export function saveHostToken(roomCode, token) {
  try {
    window.sessionStorage.setItem(hostTokenKey(roomCode), token);
  } catch {}
}
export function getHostToken(roomCode) {
  try {
    return window.sessionStorage.getItem(hostTokenKey(roomCode));
  } catch {
    return null;
  }
}
export function clearHostToken(roomCode) {
  try {
    window.sessionStorage.removeItem(hostTokenKey(roomCode));
  } catch {}
}

/* ============================================================
   Recent rooms (localStorage only — never sent to the server)
============================================================ */
export function getRecentRooms() {
  try {
    const raw = window.localStorage.getItem(RECENT_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function addRecentRoom(roomCode, role) {
  try {
    const existing = getRecentRooms().filter((r) => r.roomCode !== roomCode);
    const next = [{ roomCode, role, at: Date.now() }, ...existing].slice(0, 6);
    window.localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(next));
  } catch {}
}

export function RoomProvider({ children }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const [roomCode, setRoomCode] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [locked, setLocked] = useState(false);
  const [navLocked, setNavLocked] = useState(false);
  const [deviceName] = useState(() => detectDevice());
  const [deviceInfo] = useState(() => detectDeviceInfo());

  /* ------------------------------------------------------------
     FIX: bumped whenever we successfully re-register our socket
     with the server's room after a reconnect (see onConnect below).
     Consumers (like useWebRTC) can watch this to know "I need to
     (re)send a fresh WebRTC offer, my old signaling session is
     stale even though the room state itself looks fine".
  ------------------------------------------------------------ */
  const [rejoinNonce, setRejoinNonce] = useState(0);

  // Always-current refs so the socket event handlers (registered once,
  // on mount) can see the latest roomCode/role without stale closures.
  const roomCodeRef = useRef(null);
  const roleRef = useRef(null);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  /* ============================================================
     SOCKET LIFECYCLE
  ============================================================ */
  useEffect(() => {
    const s = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = s;
    setSocket(s);

    const onConnect = () => {
      setConnected(true);

      const rc = roomCodeRef.current;

      // Not in a room yet (this is the very first connection) —
      // nothing to restore.
      if (!rc) {
        return;
      }

      /* --------------------------------------------------------
         FIX: This 'connect' event firing while we already have an
         active roomCode means socket.io just RECONNECTED us (e.g.
         mobile browser was backgrounded while the file picker was
         open, network blip, etc). Reconnecting gives us a brand
         new socket.id on the server, but the server's room.users
         list still only knows about our OLD (now dead) socket.id.

         Without this, we *look* like we're still in the room on
         the frontend (React state says so), but the server has no
         idea this new socket belongs to the room — so every WebRTC
         signaling message we send gets silently rejected as
         "Unauthorized", and the connection can never come back.

         Re-emitting 'join-room' here re-registers our new socket.id
         against the same room. The backend already treats this
         exactly like a normal join (it's idempotent / safe).
      -------------------------------------------------------- */
      const currentRole = roleRef.current;
      const token =
        currentRole === 'host' ? getHostToken(rc) : undefined;

      s.emit(
        'join-room',
        {
          roomCode: rc,
          deviceName,
          deviceInfo,
          hostToken: token,
        },
        (res) => {
          if (res?.success) {
            console.log(
              '[Room] Re-registered with server after reconnect:',
              rc
            );

            if (Array.isArray(res.room?.users)) {
              setUsers(res.room.users);
            }

            if (typeof res.room?.locked === 'boolean') {
              setLocked(res.room.locked);
            }

            // Tell consumers (useWebRTC) that a fresh signaling
            // round is needed.
            setRejoinNonce((n) => n + 1);
          } else {
            console.warn(
              '[Room] Failed to re-register after reconnect:',
              res?.message
            );

            // Room likely expired / was closed / got full while we
            // were disconnected — nothing more we can do, reset.
            setRoomCode(null);
            setRole(null);
            setUsers([]);
            setLocked(false);
          }
        }
      );
    };

    const onDisconnect = () => setConnected(false);
    // 🎯 Do NOT clear room state on socket disconnect — the user might be reconnecting

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) setConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
    };
  }, [deviceName, deviceInfo]);

  /* ============================================================
     GLOBAL ROOM LISTENERS
  ============================================================ */
  useEffect(() => {
    if (!socket) return;

    const applyRoom = (room) => {
      if (!room) return;
      if (Array.isArray(room.users)) setUsers(room.users);
      if (typeof room.locked === 'boolean') setLocked(room.locked);
    };

    const onUserJoined = (payload) => applyRoom(payload?.room);

    const onUserLeft = (payload) => {
      if (payload?.room) {
        applyRoom(payload.room);
      } else if (payload?.socketId) {
        setUsers((prev) => prev.filter((u) => u.socketId !== payload.socketId));
      }
    };

    const onRoomLockChanged = ({ locked: l }) => setLocked(Boolean(l));

    const onRoomExpired = () => {
      setRoomCode(null);
      setUsers([]);
      setRole(null);
      setLocked(false);
    };

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('room-lock-changed', onRoomLockChanged);
    socket.on('room-expired', onRoomExpired);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('room-lock-changed', onRoomLockChanged);
      socket.off('room-expired', onRoomExpired);
    };
  }, [socket]);

  const reset = useCallback(() => {
    setRoomCode(null);
    setRole(null);
    setUsers([]);
    setLocked(false);
  }, []);

  const value = useMemo(
    () => ({
      socket,
      connected,
      roomCode,
      setRoomCode,
      role,
      setRole,
      users,
      setUsers,
      locked,
      setLocked,
      navLocked,
      setNavLocked,
      deviceName,
      deviceInfo,
      reset,
      rejoinNonce,
    }),
    [
      socket,
      connected,
      roomCode,
      role,
      users,
      locked,
      navLocked,
      deviceName,
      deviceInfo,
      reset,
      rejoinNonce,
    ]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
