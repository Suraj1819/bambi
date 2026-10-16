
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
const MAX_RECENT_ROOMS = 6;

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
   RECENT ROOMS / NOTIFICATION HISTORY
============================================================ */

export function getRecentRooms() {
  try {
    const raw = window.localStorage.getItem(RECENT_ROOMS_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (room) =>
        room &&
        typeof room.roomCode === 'string' &&
        typeof room.role === 'string'
    );
  } catch (error) {
    console.warn('[Room] Failed to read recent rooms:', error);
    return [];
  }
}

export function addRecentRoom(roomCode, role) {
  if (!roomCode || !role) return getRecentRooms();

  const normalizedCode = roomCode.trim().toUpperCase();

  if (!normalizedCode) return getRecentRooms();

  try {
    const existing = getRecentRooms().filter(
      (room) => room.roomCode !== normalizedCode
    );

    const next = [
      {
        roomCode: normalizedCode,
        role,
        at: Date.now(),
      },
      ...existing,
    ].slice(0, MAX_RECENT_ROOMS);

    window.localStorage.setItem(
      RECENT_ROOMS_KEY,
      JSON.stringify(next)
    );

    window.dispatchEvent(
      new CustomEvent('webdrop-recent-rooms-updated', {
        detail: next,
      })
    );

    return next;
  } catch (error) {
    console.warn('[Room] Failed to save recent room:', error);
    return getRecentRooms();
  }
}

export function removeRecentRoom(roomCode) {
  if (!roomCode) return getRecentRooms();

  const normalizedCode = roomCode.trim().toUpperCase();

  try {
    const next = getRecentRooms().filter(
      (room) => room.roomCode !== normalizedCode
    );

    window.localStorage.setItem(
      RECENT_ROOMS_KEY,
      JSON.stringify(next)
    );

    window.dispatchEvent(
      new CustomEvent('webdrop-recent-rooms-updated', {
        detail: next,
      })
    );

    return next;
  } catch (error) {
    console.warn('[Room] Failed to remove recent room:', error);
    return getRecentRooms();
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
  const [navLocked, setNavLocked] = useState(false);

  /* ----------------------------------------------------------
     RECENT ROOMS
  ---------------------------------------------------------- */

  const [recentRooms, setRecentRooms] = useState(() =>
    getRecentRooms()
  );

  const refreshRecentRooms = useCallback(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  useEffect(() => {
    const handleRecentRoomsUpdate = (event) => {
      if (Array.isArray(event.detail)) {
        setRecentRooms(event.detail);
      } else {
        refreshRecentRooms();
      }
    };

    const handleStorage = (event) => {
      if (event.key === RECENT_ROOMS_KEY) {
        refreshRecentRooms();
      }
    };

    window.addEventListener(
      'webdrop-recent-rooms-updated',
      handleRecentRoomsUpdate
    );

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(
        'webdrop-recent-rooms-updated',
        handleRecentRoomsUpdate
      );

      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshRecentRooms]);

  /* ----------------------------------------------------------
     DEVICE STATE
  ---------------------------------------------------------- */

  const [deviceName, setDeviceName] = useState(() => detectDevice());
  const [deviceInfo, setDeviceInfo] = useState(() =>
    detectDeviceInfo()
  );
  const [deviceInfoReady, setDeviceInfoReady] = useState(false);

  /* ----------------------------------------------------------
     REJOIN NONCE
  ---------------------------------------------------------- */

  const [rejoinNonce, setRejoinNonce] = useState(0);

  /* ----------------------------------------------------------
     REFS
  ---------------------------------------------------------- */

  const roomCodeRef = useRef(null);
  const roleRef = useRef(null);
  const deviceNameRef = useRef(deviceName);
  const deviceInfoRef = useRef(deviceInfo);

  const manualResetRef = useRef(false);
  const joinRequestRef = useRef(null);

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
        const refined = await refineDeviceInfo(detectDeviceInfo());

        if (cancelled || !refined) return;

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
    console.log('[Room] Connecting Socket.IO:', SOCKET_URL);

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

    const onConnect = () => {
      console.log('[Room] Socket connected:', s.id);
      setConnected(true);

      const rc = roomCodeRef.current;

      if (!rc || manualResetRef.current) return;

      const currentRole = roleRef.current;
      const token =
        currentRole === 'host' ? getHostToken(rc) : undefined;

      s.emit(
        'join-room',
        {
          roomCode: rc,
          deviceName: deviceNameRef.current,
          deviceInfo: deviceInfoRef.current,
          hostToken: token,
        },
        (res) => {
          if (
            manualResetRef.current ||
            roomCodeRef.current !== rc
          ) {
            return;
          }

          if (res?.success) {
            if (res.role === 'host' || res.role === 'guest') {
              roleRef.current = res.role;
              setRole(res.role);
            }

            if (res.room) {
              applyRoomState(res.room);
            }

            setRejoinNonce((value) => value + 1);
            return;
          }

          console.warn(
            '[Room] Room re-registration failed:',
            res?.message
          );

          setRoomCode(null);
          setRole(null);
          setUsers([]);
          setLocked(false);
          setNavLocked(false);

          roomCodeRef.current = null;
          roleRef.current = null;
        }
      );
    };

    const onDisconnect = (reason) => {
      console.warn('[Room] Socket disconnected:', reason);
      setConnected(false);
    };

    const onConnectError = (error) => {
      console.warn(
        '[Room] Socket connection error:',
        error?.message || error
      );
      setConnected(false);
    };

    const onReconnectAttempt = (attempt) => {
      console.log('[Room] Socket reconnect attempt:', attempt);
    };

    const onReconnect = (attempt) => {
      console.log(
        '[Room] Socket reconnected after attempts:',
        attempt
      );
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.io.on('reconnect_attempt', onReconnectAttempt);
    s.io.on('reconnect', onReconnect);

    if (s.connected) {
      setConnected(true);
    }

    return () => {
      console.log('[Room] Cleaning Socket.IO instance');

      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.io.off('reconnect_attempt', onReconnectAttempt);
      s.io.off('reconnect', onReconnect);

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
    if (!socket) return undefined;

    const clearCurrentRoomState = () => {
      const currentRoom = roomCodeRef.current;

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
    };

    const onUserJoined = (payload) => {
      console.log('[Room] User joined:', payload);

      if (payload?.room) {
        applyRoomState(payload.room);
      }
    };

    const onUserLeft = (payload) => {
      console.log('[Room] User left:', payload);

      if (payload?.room) {
        applyRoomState(payload.room);
        return;
      }

      if (payload?.socketId) {
        setUsers((previous) =>
          previous.filter(
            (user) => user.socketId !== payload.socketId
          )
        );
      }
    };

    const onRoomLockChanged = (payload) => {
      setLocked(Boolean(payload?.locked));
    };

    const onRoomExpired = (payload) => {
      console.log('[Room] Room expired:', payload);
      clearCurrentRoomState();
    };

    const onRoomEnded = (payload) => {
      console.log('[Room] Room ended:', payload);
      clearCurrentRoomState();
    };

    const onKicked = (payload) => {
      console.log('[Room] Current device was kicked:', payload);
      clearCurrentRoomState();
    };

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('room-lock-changed', onRoomLockChanged);
    socket.on('room-expired', onRoomExpired);
    socket.on('room-ended', onRoomEnded);
    socket.on('kicked', onKicked);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('room-lock-changed', onRoomLockChanged);
      socket.off('room-expired', onRoomExpired);
      socket.off('room-ended', onRoomEnded);
      socket.off('kicked', onKicked);
    };
  }, [socket, applyRoomState]);

  /* ============================================================
     UPDATE ROOM CODE
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
     UPDATE ROLE
  ============================================================ */

  const updateRole = useCallback((value) => {
    roleRef.current = value || null;
    setRole(value || null);
  }, []);

  /* ============================================================
     RESET LOCAL ROOM STATE
     
     Kept for compatibility with existing components.
     Prefer leaveRoom() for a manual leave action.
  ============================================================ */

  const reset = useCallback(() => {
    const currentRoom = roomCodeRef.current;

    console.log('[Room] Resetting local room state:', currentRoom);

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
     LEAVE ROOM
     
     Save room history before clearing local state.
     This does not send a server-side leave event because the
     server's leave event/API is not present in the supplied code.
  ============================================================ */

  const leaveRoom = useCallback(() => {
    const currentRoom = roomCodeRef.current;
    const currentRole = roleRef.current;

    if (currentRoom && currentRole) {
      addRecentRoom(currentRoom, currentRole);
      refreshRecentRooms();
    }

    reset();
  }, [reset, refreshRecentRooms]);

  /* ============================================================
     PREPARE FOR A NEW ROOM
  ============================================================ */

  const prepareForNewRoom = useCallback(() => {
    manualResetRef.current = false;
  }, []);

  /* ============================================================
     REJOIN RECENT ROOM
     
     Uses the existing join-room signaling event. The room must
     still exist and the server must permit this device to join.
  ============================================================ */

  const rejoinRoom = useCallback(
    (targetRoomCode) =>
      new Promise((resolve) => {
        const normalizedCode = String(
          targetRoomCode || ''
        )
          .trim()
          .toUpperCase();

        if (!normalizedCode) {
          resolve({
            success: false,
            message: 'Please select a valid room.',
          });
          return;
        }

        if (joinRequestRef.current) {
          resolve({
            success: false,
            message: 'A room join request is already in progress.',
          });
          return;
        }

        const activeSocket = socketRef.current;

        if (!activeSocket?.connected) {
          resolve({
            success: false,
            message: 'Signaling server is disconnected. Try again.',
          });
          return;
        }

        manualResetRef.current = false;

        const savedRoom = getRecentRooms().find(
          (item) => item.roomCode === normalizedCode
        );

        const savedRole = savedRoom?.role || 'guest';
        const token =
          savedRole === 'host'
            ? getHostToken(normalizedCode)
            : undefined;

        joinRequestRef.current = normalizedCode;

        activeSocket.emit(
          'join-room',
          {
            roomCode: normalizedCode,
            deviceName: deviceNameRef.current,
            deviceInfo: deviceInfoRef.current,
            hostToken: token,
          },
          (res) => {
            joinRequestRef.current = null;

            if (!res?.success) {
              resolve({
                success: false,
                message:
                  res?.message ||
                  'Could not rejoin this room. It may have expired or be full.',
              });
              return;
            }

            const actualRole =
              res.role === 'host' || res.role === 'guest'
                ? res.role
                : savedRole;

            roomCodeRef.current = normalizedCode;
            roleRef.current = actualRole;

            setRoomCode(normalizedCode);
            setRole(actualRole);
            setNavLocked(true);

            if (res.room) {
              applyRoomState(res.room);
            } else {
              setUsers([]);
              setLocked(false);
            }

            addRecentRoom(normalizedCode, actualRole);
            refreshRecentRooms();

            setRejoinNonce((value) => value + 1);

            resolve({
              success: true,
              roomCode: normalizedCode,
              role: actualRole,
              room: res.room || null,
            });
          }
        );
      }),
    [applyRoomState, refreshRecentRooms]
  );

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

      /* Recent rooms / notifications */
      recentRooms,
      refreshRecentRooms,
      addRecentRoom,
      removeRecentRoom,
      rejoinRoom,

      /* Room lifecycle */
      reset,
      leaveRoom,
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
      recentRooms,
      refreshRecentRooms,
      rejoinRoom,
      reset,
      leaveRoom,
      prepareForNewRoom,
    ]
  );

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}
