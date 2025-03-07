export function createStatusOrNotificationUuid (currentInstance, timelineType, timelineValue, notificationId, statusId, quotedBy) {
  return `${currentInstance}/${timelineType}/${timelineValue}/${notificationId || ''}/${statusId || ''}/${quotedBy || ''}`
}
