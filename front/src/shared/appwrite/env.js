export const env = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

  bucketAvatarsId: import.meta.env.VITE_APPWRITE_BUCKET_AVATARS_ID || "",
  bucketAttachmentsId:
    import.meta.env.VITE_APPWRITE_BUCKET_ATTACHMENTS_ID || "",

  platformAdminsTeamId:
    import.meta.env.VITE_APPWRITE_PLATFORM_ADMINS_TEAM_ID || "",

  fnCreateUserWithProfileId:
    import.meta.env.VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID || "",
  fnEnsureProfileId: import.meta.env.VITE_APPWRITE_FN_ENSURE_PROFILE_ID || "",
  fnCreateGroupWithDefaultsId:
    import.meta.env.VITE_APPWRITE_FN_CREATE_GROUP_WITH_DEFAULTS_ID || "",
  fnInviteToGroupId: import.meta.env.VITE_APPWRITE_FN_INVITE_TO_GROUP_ID || "",
  fnAcceptInvitationId:
    import.meta.env.VITE_APPWRITE_FN_ACCEPT_INVITATION_ID || "",
  fnCronExpireInvitationsId:
    import.meta.env.VITE_APPWRITE_FN_CRON_EXPIRE_INVITATIONS_ID || "",
  fnCronGenerateRemindersId:
    import.meta.env.VITE_APPWRITE_FN_CRON_GENERATE_REMINDERS_ID || "",
  fnSendPushId: import.meta.env.VITE_APPWRITE_FN_SEND_PUSH_ID || "",

  collectionUsersProfileId: import.meta.env
    .VITE_APPWRITE_COLLECTION_USERS_PROFILE_ID,
  collectionGroupsId: import.meta.env.VITE_APPWRITE_COLLECTION_GROUPS_ID,
  collectionGroupMembersId: import.meta.env
    .VITE_APPWRITE_COLLECTION_GROUP_MEMBERS_ID,
  collectionGroupInvitationsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_GROUP_INVITATIONS_ID,
  collectionPermissionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_PERMISSIONS_ID,
  collectionRolesId: import.meta.env.VITE_APPWRITE_COLLECTION_ROLES_ID,
  collectionRolePermissionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_ROLE_PERMISSIONS_ID,
  collectionUserRolesId: import.meta.env.VITE_APPWRITE_COLLECTION_USER_ROLES_ID,
  collectionAuditLogsId: import.meta.env.VITE_APPWRITE_COLLECTION_AUDIT_LOGS_ID,

  collectionCalendarsId: import.meta.env.VITE_APPWRITE_COLLECTION_CALENDARS_ID,
  collectionEventsId: import.meta.env.VITE_APPWRITE_COLLECTION_EVENTS_ID,
  collectionEventAttendeesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_EVENT_ATTENDEES_ID,
  collectionEventRemindersId: import.meta.env
    .VITE_APPWRITE_COLLECTION_EVENT_REMINDERS_ID,
  collectionNotificationsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_NOTIFICATIONS_ID,
  collectionUserSettingsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_USER_SETTINGS_ID,
  collectionPushSubscriptionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_PUSH_SUBSCRIPTIONS_ID,

  appName: import.meta.env.VITE_APP_NAME || "Agenda Pro",
};

export function assertEnv() {
  const required = [
    "endpoint",
    "projectId",
    "databaseId",
    "collectionUsersProfileId",
    "collectionGroupsId",
    "collectionCalendarsId",
    "collectionEventsId",
  ];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing env var: ${k}`);
  }
}
