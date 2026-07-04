export const IPC = {
  // File operations
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:save-as',
  FILE_READ: 'file:read',
  FILE_GET_RECENT: 'file:get-recent',
  FILE_ADD_RECENT: 'file:add-recent',

  // Image upload
  IMAGE_UPLOAD: 'image:upload',
  IMAGE_UPLOAD_ALL: 'image:upload-all',
  IMAGE_GET_CONFIG: 'image:get-config',
  IMAGE_SET_CONFIG: 'image:set-config',
  IMAGE_TEST_UPLOAD: 'image:test-upload',
  IMAGE_WRITE_TEMP: 'image:write-temp',

  // Theme
  THEME_LIST: 'theme:list',
  THEME_LOAD: 'theme:load',
  THEME_GET_CURRENT: 'theme:get-current',
  THEME_SET_CURRENT: 'theme:set-current',

  // Window
  WINDOW_SET_TITLE: 'window:set-title',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Menu events (main → renderer)
  MENU_ACTION: 'menu:action',

  // Preferences
  PREF_GET: 'pref:get',
  PREF_SET: 'pref:set',

  // Export
  EXPORT_HTML: 'export:html',
  EXPORT_PDF: 'export:pdf',
  EXPORT_FEISHU: 'export:feishu',
  EXPORT_DOC: 'export:doc',

  // Dialog
  DIALOG_CONFIRM: 'dialog:confirm',

  // AI Chat
  AI_CHAT_SEND: 'ai:chat-send',
  AI_CHAT_STOP: 'ai:chat-stop',
  AI_LIST_CONVERSATIONS: 'ai:list-conversations',
  AI_GET_CONVERSATION: 'ai:get-conversation',
  AI_DELETE_CONVERSATION: 'ai:delete-conversation',
  AI_GET_PROVIDERS: 'ai:get-providers',
  AI_SET_PROVIDERS: 'ai:set-providers',
  AI_TEST_CONNECTION: 'ai:test-connection',

  // AI Events (main → renderer)
  AI_CHUNK: 'ai:chunk',
  AI_DONE: 'ai:done',
  AI_ERROR: 'ai:error',

  // Claude CLI management
  CLAUDE_SPAWN: 'claude:spawn',
  CLAUDE_SEND_PROMPT: 'claude:send-prompt',
  CLAUDE_KILL: 'claude:kill',
  CLAUDE_KILL_ALL: 'claude:kill-all',
  CLAUDE_LIST: 'claude:list',
  CLAUDE_OUTPUT: 'claude:output',
  CLAUDE_ERROR_OUTPUT: 'claude:error-output',
  CLAUDE_EXITED: 'claude:exited',
  CLAUDE_SYSTEM_STATUS: 'claude:system-status',
  CLAUDE_QUEUE_STATUS: 'claude:queue-status',

  // Git
  GIT_STATUS: 'git:status',
  GIT_COMMIT: 'git:commit',
  GIT_COMMIT_ALL: 'git:commit-all',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_LOG: 'git:log',
  GIT_INIT: 'git:init',
  GIT_DIFF: 'git:diff'
} as const
