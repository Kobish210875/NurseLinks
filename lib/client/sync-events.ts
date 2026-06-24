export const CONNECTIONS_CHANGED_EVENT = "nurselinks:connections-changed";
export const INSTITUTION_ACTIVITY_CHANGED_EVENT = "nurselinks:institution-activity-changed";

export function notifyConnectionsChanged() {
  window.dispatchEvent(new Event(CONNECTIONS_CHANGED_EVENT));
}

export function notifyInstitutionActivityChanged() {
  window.dispatchEvent(new Event(INSTITUTION_ACTIVITY_CHANGED_EVENT));
}
