/**
 * Session-based conversation memory manager.
 * Maintains per-session message arrays, trimmed to the last k exchanges.
 */

const K = 10;
const sessionMemories = new Map();

/**
 * Get the message history for a given session.
 * @param {string} sessionId - The unique session identifier.
 * @returns {Array} The array of message objects for this session.
 */
export function getSessionMessages(sessionId) {
  if (!sessionMemories.has(sessionId)) {
    sessionMemories.set(sessionId, []);
  }
  return sessionMemories.get(sessionId);
}

/**
 * Append a user message and assistant response to the session history.
 * Trims to the last k exchanges (2*k messages) to bound memory usage.
 * @param {string} sessionId - The unique session identifier.
 * @param {string} userMessage - The user's input text.
 * @param {string} assistantMessage - The assistant's response text.
 */
export function addExchange(sessionId, userMessage, assistantMessage) {
  const messages = getSessionMessages(sessionId);
  messages.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantMessage }
  );

  const maxMessages = K * 2;
  if (messages.length > maxMessages) {
    const trimmed = messages.slice(messages.length - maxMessages);
    sessionMemories.set(sessionId, trimmed);
  }
}

/**
 * Clear the conversation history for a given session.
 * @param {string} sessionId - The unique session identifier.
 */
export function clearSession(sessionId) {
  sessionMemories.delete(sessionId);
}
