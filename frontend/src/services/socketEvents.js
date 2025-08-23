const SOCKET_EVENTS = {
  // connection
  JOIN: "join",
  DISCONNECT: "disconnect",
  GET_ONLINE_USERS: "get_online_users",
  ONLINE_USERS: "online_users",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",

  // chat
  GET_OR_CREATE_CHAT: "get_or_create_chat",
  CHAT_READY: "chat_ready",
  JOIN_CHAT: "join_chat",
  LEAVE_CHAT: "leave_chat",

  // messages
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",

  EDIT_MESSAGE: "edit_message",
  RECEIVE_EDITED_MESSAGE: "receive_edited_message",

  DELETE_MESSAGE: "delete_message",
  MESSAGE_DELETED: "message_deleted",

  READ_MESSAGES: "read_messages",
  MESSAGES_READ: "messages_read",
};

export default SOCKET_EVENTS;
