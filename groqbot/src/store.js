// src/store.js
// ---------------------------------------------------------------------------
// Lightweight in-memory store for sessions and messages.
// A "session" looks like:
//   { id: string, title: string, model: string, createdAt: number,
//     messages: Array<{ id, role, content, ts }> }
// ---------------------------------------------------------------------------

let _sessions = [];          // ordered newest-first
let _activeId  = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid  = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now  = () => Date.now();

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function createSession(model, title = 'New Chat') {
  const session = { id: uid(), title, model, createdAt: now(), messages: [] };
  _sessions = [session, ..._sessions];
  _activeId  = session.id;
  return session;
}
export function getSessions()         { return _sessions; }
export function getActiveId()         { return _activeId; }
export function setActiveId(id)       { _activeId = id; }

export function getSession(id) {
  return _sessions.find(s => s.id === id) ?? null;
}

export function getActiveSession() {
  return getSession(_activeId);
}

export function renameSession(id, title) {
  _sessions = _sessions.map(s => s.id === id ? { ...s, title } : s);
}

export function changeModel(id, model) {
  _sessions = _sessions.map(s => s.id === id ? { ...s, model } : s);
}

export function deleteSession(id) {
  _sessions = _sessions.filter(s => s.id !== id);
  if (_activeId === id) {
    _activeId = _sessions[0]?.id ?? null;
  }
}

export function clearSessionMessages(id) {
  _sessions = _sessions.map(s => s.id === id ? { ...s, messages: [] } : s);
}
// ─── Messages ─────────────────────────────────────────────────────────────────

export function addMessage(sessionId, role, content) {
  const msg = { id: uid(), role, content, ts: now() };
  _sessions = _sessions.map(s =>
    s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s
  );
  return msg;
}

export function getMessages(sessionId) {
  return getSession(sessionId)?.messages ?? [];
}

export function updateLastAssistantMessage(sessionId, content) {
  _sessions = _sessions.map(s => {
    if (s.id !== sessionId) return s;
    const msgs   = [...s.messages];
    const lastIdx = msgs.length - 1;
    if (msgs[lastIdx]?.role === 'assistant') {
      msgs[lastIdx] = { ...msgs[lastIdx], content };
    }
    return { ...s, messages: msgs };
  });
}