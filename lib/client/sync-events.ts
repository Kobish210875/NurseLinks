export const CONNECTIONS_CHANGED_EVENT = "nurselinks:connections-changed";

export function notifyConnectionsChanged() {
  window.dispatchEvent(new Event(CONNECTIONS_CHANGED_EVENT));
}
