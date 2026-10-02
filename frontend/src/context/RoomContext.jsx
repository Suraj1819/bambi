// src/context/RoomContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { io } from 'socket.io-client';

import { SOCKET_URL } from '../utils/constants';
import {
  detectDevice,
  detectDeviceInfo,
  refineDeviceInfo,
} from '../utils/fileUtils';

const RoomContext = createContext(null);

const RECENT_ROOMS_KEY = 'webdrop-recent-rooms';

/* ============================================================
   CONTEXT HOOK
============================================================ */

export function useRoom() {
  const ctx = useContext(RoomContext);

  if (!ctx) {
    throw new Error('useRoom must be used inside <RoomProvider>');
  }

  return ctx;
}

/* ============================================================
   HOST TOKEN HELPERS
============================================================ */

function hostTokenKey(roomCode) {
  return `webdrop-host-token-${roomCode}`;
}

export function saveHostToken(roomCode, token) {
  if (!roomCode || !token) return;

  try {
    window.sessionStorage.setItem(
      hostTokenKey(roomCode),
      token
    );
  } catch (error) {
    console.warn('[Room] Failed to save host token:', error);
  }
}

export function getHostToken(roomCode) {
  if (!roomCode) return null;

  try {
    return window.sessionStorage.getItem(
      hostTokenKey(roomCode)
    );
  } catch (error) {
    console.warn('[Room] Failed to read host token:', error);
    return null;
  }
}

export function clearHostToken(roomCode) {
  if (!roomCode) return;

  try {
    window.sessionStorage.removeItem(
      hostTokenKey(roomCode)
    );
  } catch (error) {
    console.warn('[Room] Failed to clear host token:', error);
  }
}

/* ============================================================
   RECENT ROOMS
============================================================ */

export function getRecentRooms() {
  try {
    const raw = window.localStorage.getItem(
      RECENT_ROOMS_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(
      '[Room] Failed to read recent rooms:',
      error
    );

    return [];
  }
}

export function addRecentRoom(roomCode, role) {
  if (!roomCode || !role) return;

  try {
    const existing = getRecentRooms().filter(
      (room) => room.roomCode !== roomCode
    );

    const next = [
      {
        roomCode,
        role,
        at: Date.now(),
      },
      ...existing,
    ].slice(0, 6);

    window.localStorage.setItem(
      RECENT_ROOMS_KEY,
      JSON.stringify(next)
    );
  } catch (error) {
    console.warn(
      '[Room] Failed to save recent room:',
      error
    );
  }
}

/* ============================================================
   PROVIDER
============================================================ */

export function RoomProvider({ children }) {
  /* ----------------------------------------------------------
     SOCKET
  ---------------------------------------------------------- */

  const socketRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  /* ----------------------------------------------------------
     ROOM STATE
  ---------------------------------------------------------- */

  const [roomCode, setRoomCode] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [locked, setLocked] = useState(false);

  /*
   * navLocked is UI/navigation protection.
   * It is intentionally separate from the server-side room lock.
   */
  const [navLocked, setNavLocked] = useState(false);

  /* ----------------------------------------------------------
     DEVICE STATE
  ---------------------------------------------------------- */

  const [deviceName, setDeviceName] = useState(() =>
    detectDevice()
  );

  const [deviceInfo, setDeviceInfo] = useState(() =>
    detectDeviceInfo()
  );

  const [deviceInfoReady, setDeviceInfoReady] =
    useState(false);

  /* ----------------------------------------------------------
     REJOIN NONCE
     
     Every successful socket re-registration increments this.
     
     useWebRTC listens to this value and can create a fresh
     offer when the host reconnects to the signaling server.
  ---------------------------------------------------------- */

  const [rejoinNonce, setRejoinNonce] = useState(0);

  /* ============================================================
     REFS
  ============================================================ */

  const roomCodeRef = useRef(null);
  const roleRef = useRef(null);
  const deviceNameRef = useRef(deviceName);
  const deviceInfoRef = useRef(deviceInfo);

  /*
   * Prevents an old reconnect callback from restoring a room
   * after the user manually left it.
   */
  const manualResetRef = useRef(false);

  /* ============================================================
     SYNC STATE -> REFS
  ============================================================ */

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    deviceNameRef.current = deviceName;
  }, [deviceName]);

  useEffect(() => {
    deviceInfoRef.current = deviceInfo;
  }, [deviceInfo]);

  /* ============================================================
     REFINE DEVICE INFORMATION
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadDeviceInfo() {
      try {
        const refined = await refineDeviceInfo(
          detectDeviceInfo()
        );

        if (cancelled || !refined) {
          return;
        }

        setDeviceInfo(refined);

        if (refined.label) {
          setDeviceName(refined.label);
        }

        setDeviceInfoReady(true);
      } catch (error) {
        console.warn(
          '[Room] Device info refinement failed:',
          error
        );

        if (!cancelled) {
          setDeviceInfoReady(true);
        }
      }
    }

    loadDeviceInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     APPLY ROOM STATE
  ============================================================ */

  const applyRoomState = useCallback((room) => {
    if (!room) return;

    if (Array.isArray(room.users)) {
      setUsers(room.users);
    }

    if (typeof room.locked === 'boolean') {
      setLocked(room.locked);
    }
  }, []);

  /* ============================================================
     SOCKET INITIALIZATION
  ============================================================ */

  useEffect(() => {
    console.log(
      '[Room] Connecting Socket.IO:',
      SOCKET_URL
    );

    const s = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = s;
    setSocket(s);

    /* ----------------------------------------------------------
       CONNECT
    ---------------------------------------------------------- */

    const onConnect = () => {
      console.log(
        '[Room] Socket connected:',
        s.id
      );

      setConnected(true);

      /*
       * If there is no active room, there is nothing to restore.
       */
      const rc = roomCodeRef.current;

      if (!rc) {
        return;
      }

      /*
       * If reset() happened manually while socket was reconnecting,
       * don't restore the old room.
       */
      if (manualResetRef.current) {
        console.log(
          '[Room] Manual reset detected, skipping rejoin'
        );

        return;
      }

      const currentRole = roleRef.current;

      const token =
        currentRole === 'host'
          ? getHostToken(rc)
          : undefined;

      console.log(
        '[Room] Re-registering room after socket connection:',
        rc
      );

      s.emit(
        'join-room',
        {
          roomCode: rc,
          deviceName: deviceNameRef.current,
          deviceInfo: deviceInfoRef.current,
          hostToken: token,
        },
        (res) => {
          /*
           * The user may have left while the request was
           * travelling. Do not restore anything in that case.
           */
          if (manualResetRef.current) {
            return;
          }

          if (res?.success) {
            console.log(
              '[Room] Room re-registered successfully:',
              rc
            );

            /*
             * Server may return the authoritative role.
             */
            if (
              res.role === 'host' ||
              res.role === 'guest'
            ) {
              setRole(res.role);
              roleRef.current = res.role;
            }

            if (res.room) {
              applyRoomState(res.room);
            }

            /*
             * Tell WebRTC that signaling re-registration
             * completed successfully.
             */
            setRejoinNonce((value) => value + 1);

            return;
          }

          console.warn(
            '[Room] Room re-registration failed:',
            res?.message
          );

          /*
           * If the room no longer exists or the token is invalid,
           * clear local room state.
           */
          setRoomCode(null);
          setRole(null);
          setUsers([]);
          setLocked(false);

          roomCodeRef.current = null;
          roleRef.current = null;

          if (
            res?.message?.toLowerCase?.().includes('room') ||
            res?.message?.toLowerCase?.().includes('token')
          ) {
            clearHostToken(rc);
          }
        }
      );
    };

    /* ----------------------------------------------------------
       DISCONNECT
    ---------------------------------------------------------- */

    const onDisconnect = (reason) => {
      console.warn(
        '[Room] Socket disconnected:',
        reason
      );

      setConnected(false);
    };

    /* ----------------------------------------------------------
       CONNECT ERROR
    ---------------------------------------------------------- */

    const onConnectError = (error) => {
      console.warn(
        '[Room] Socket connection error:',
        error?.message || error
      );

      setConnected(false);
    };

    /* ----------------------------------------------------------
       RECONNECT ATTEMPT
    ---------------------------------------------------------- */

    const onReconnectAttempt = (attempt) => {
      console.log(
        '[Room] Socket reconnect attempt:',
        attempt
      );
    };

    /* ----------------------------------------------------------
       RECONNECT
    ---------------------------------------------------------- */

    const onReconnect = (attempt) => {
      console.log(
        '[Room] Socket reconnected after attempts:',
        attempt
      );
    };

    /* ----------------------------------------------------------
       REGISTER SOCKET EVENTS
    ---------------------------------------------------------- */

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.io.on('reconnect_attempt', onReconnectAttempt);
    s.io.on('reconnect', onReconnect);

    /*
     * Socket could already be connected immediately after io().
     */
    if (s.connected) {
      setConnected(true);
    }

    /* ----------------------------------------------------------
       CLEANUP
    ---------------------------------------------------------- */

    return () => {
      console.log('[Room] Cleaning Socket.IO instance');

      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);

      s.io.off(
        'reconnect_attempt',
        onReconnectAttempt
      );

      s.io.off(
        'reconnect',
        onReconnect
      );

      s.disconnect();

      if (socketRef.current === s) {
        socketRef.current = null;
      }
    };
  }, [applyRoomState]);

  /* ============================================================
     SOCKET ROOM EVENTS
  ============================================================ */

  useEffect(() => {
    if (!socket) {
      return;
    }

    /* ----------------------------------------------------------
       USER JOINED
    ---------------------------------------------------------- */

    const onUserJoined = (payload) => {
      console.log(
        '[Room] User joined:',
        payload
      );

      if (payload?.room) {
        applyRoomState(payload.room);
      }
    };

    /* ----------------------------------------------------------
       USER LEFT
    ---------------------------------------------------------- */

    const onUserLeft = (payload) => {
      console.log(
        '[Room] User left:',
        payload
      );

      if (payload?.room) {
        applyRoomState(payload.room);
        return;
      }

      if (payload?.socketId) {
        setUsers((previous) =>
          previous.filter(
            (user) =>
              user.socketId !== payload.socketId
          )
        );
      }
    };

    /* ----------------------------------------------------------
       ROOM LOCK
    ---------------------------------------------------------- */

    const onRoomLockChanged = (payload) => {
      const nextLocked = Boolean(
        payload?.locked
      );

      console.log(
        '[Room] Room lock changed:',
        nextLocked
      );

      setLocked(nextLocked);
    };

    /* ----------------------------------------------------------
       ROOM EXPIRED
    ---------------------------------------------------------- */

    const onRoomExpired = (payload) => {
      console.log(
        '[Room] Room expired:',
        payload
      );

      const currentRoom =
        roomCodeRef.current;

      if (currentRoom) {
        clearHostToken(currentRoom);
      }

      setRoomCode(null);
      setRole(null);
      setUsers([]);
      setLocked(false);

      roomCodeRef.current = null;
      roleRef.current = null;
    };

    /* ----------------------------------------------------------
       ROOM ENDED
    ---------------------------------------------------------- */

    const onRoomEnded = (payload) => {
      console.log(
        '[Room] Room ended:',
        payload
      );

      const currentRoom =
        roomCodeRef.current;

      if (currentRoom) {
        clearHostToken(currentRoom);
      }

      setRoomCode(null);
      setRole(null);
      setUsers([]);
      setLocked(false);

      roomCodeRef.current = null;
      roleRef.current = null;
    };

    /* ----------------------------------------------------------
       KICKED
    ---------------------------------------------------------- */

    const onKicked = (payload) => {
      console.log(
        '[Room] Current device was kicked:',
        payload
      );

      const currentRoom =
        roomCodeRef.current;

      if (currentRoom) {
        clearHostToken(currentRoom);
      }

      setRoomCode(null);
      setRole(null);
      setUsers([]);
      setLocked(false);

      roomCodeRef.current = null;
      roleRef.current = null;
    };

    /* ----------------------------------------------------------
       REGISTER
    ---------------------------------------------------------- */

    socket.on(
      'user-joined',
      onUserJoined
    );

    socket.on(
      'user-left',
      onUserLeft
    );

    socket.on(
      'room-lock-changed',
      onRoomLockChanged
    );

    socket.on(
      'room-expired',
      onRoomExpired
    );

    socket.on(
      'room-ended',
      onRoomEnded
    );

    socket.on(
      'kicked',
      onKicked
    );

    /* ----------------------------------------------------------
       CLEANUP
    ---------------------------------------------------------- */

    return () => {
      socket.off(
        'user-joined',
        onUserJoined
      );

      socket.off(
        'user-left',
        onUserLeft
      );

      socket.off(
        'room-lock-changed',
        onRoomLockChanged
      );

      socket.off(
        'room-expired',
        onRoomExpired
      );

      socket.off(
        'room-ended',
        onRoomEnded
      );

      socket.off(
        'kicked',
        onKicked
      );
    };
  }, [socket, applyRoomState]);

  /* ============================================================
     SET ROOM
     
     Wrapper keeps refs immediately synchronized.
     This is important because Socket.IO callbacks can execute
     before React has committed the next render.
  ============================================================ */

  const updateRoomCode = useCallback((value) => {
    const next =
      typeof value === 'string'
        ? value.trim().toUpperCase()
        : value;

    manualResetRef.current = false;

    roomCodeRef.current = next || null;

    setRoomCode(next || null);
  }, []);

  /* ============================================================
     SET ROLE
  ============================================================ */

  const updateRole = useCallback((value) => {
    roleRef.current = value || null;

    setRole(value || null);
  }, []);

  /* ============================================================
     RESET
     
     Used when user manually leaves a room.
  ============================================================ */

  const reset = useCallback(() => {
    const currentRoom =
      roomCodeRef.current;

    console.log(
      '[Room] Resetting local room state:',
      currentRoom
    );

    /*
     * Mark this as manual so a socket reconnect callback
     * cannot restore the old room.
     */
    manualResetRef.current = true;

    if (currentRoom) {
      clearHostToken(currentRoom);
    }

    roomCodeRef.current = null;
    roleRef.current = null;

    setRoomCode(null);
    setRole(null);
    setUsers([]);
    setLocked(false);
    setNavLocked(false);
  }, []);

  /* ============================================================
     CLEAR MANUAL RESET FLAG
     
     Call this before creating/joining a completely new room.
  ============================================================ */

  const prepareForNewRoom = useCallback(() => {
    manualResetRef.current = false;
  }, []);

  /* ============================================================
     MEMOIZED CONTEXT VALUE
  ============================================================ */

  const value = useMemo(
    () => ({
      /* Socket */
      socket,
      socketRef,
      connected,

      /* Room */
      roomCode,
      setRoomCode: updateRoomCode,

      role,
      setRole: updateRole,

      users,
      setUsers,

      locked,
      setLocked,

      /* Navigation */
      navLocked,
      setNavLocked,

      /* Device */
      deviceName,
      setDeviceName,

      deviceInfo,
      setDeviceInfo,

      deviceInfoReady,

      /* Reconnect */
      rejoinNonce,

      /* Helpers */
      reset,
      prepareForNewRoom,
    }),
    [
      socket,
      connected,
      roomCode,
      updateRoomCode,
      role,
      updateRole,
      users,
      locked,
      navLocked,
      deviceName,
      deviceInfo,
      deviceInfoReady,
      rejoinNonce,
      reset,
      prepareForNewRoom,
    ]
  );

  /* ============================================================
     PROVIDER
  ============================================================ */

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}