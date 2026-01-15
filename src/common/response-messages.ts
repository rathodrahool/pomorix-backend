export const MESSAGE = {
  SUCCESS: {
    CREATE: (module: string) => `${module} created successfully`,
    UPDATE: (module: string) => `${module} updated successfully`,
    DELETE: (module: string) => `${module} deleted successfully`,
    RETRIEVE: (module: string) => `${module} retrieved successfully`,
    AUTH: {
      SIGNIN: 'Authentication successful',
    },
    POMODORO: {
      STARTED: 'Pomodoro session started successfully',
      STARTED_FOCUS: 'Focus session started!',
      STARTED_SHORT_BREAK: 'Short break started. Relax!',
      STARTED_LONG_BREAK: 'Long break started. Take your time!',
      CURRENT: 'Current session retrieved successfully',
      NO_ACTIVE: 'No active session',
      PAUSED: 'Pomodoro session paused successfully',
      RESUMED: 'Pomodoro session resumed successfully',
      COMPLETED: 'Pomodoro session completed successfully',
      COMPLETED_FOCUS: 'Focus completed! Great work.',
      COMPLETED_BREAK: 'Break completed!',
      ABORTED: 'Pomodoro session aborted successfully',
    },
    USER_SETTINGS: {
      RETRIEVED: 'User settings retrieved successfully',
      UPDATED: 'User settings updated successfully',
      RESET: 'User settings reset to defaults successfully',
    },
    STREAK: {
      RETRIEVED: 'Streak retrieved successfully',
      TOTAL_STATS_RETRIEVED: 'Total statistics retrieved successfully',
    },
    BADGE: {
      RETRIEVED: 'Badges retrieved successfully',
      UNLOCKED: 'Badge unlocked!',
      ALL_DEFINITIONS: 'Badge definitions retrieved successfully',
    },
    GLOBAL: {
      FEED_RETRIEVED: 'Global feed retrieved successfully',
      ONLINE_COUNT_RETRIEVED: 'Online count retrieved successfully',
    },
    USER: {
      PROFILE_RETRIEVED: 'User profile retrieved successfully',
    },
    BUG_REPORT: {
      SUBMITTED: 'Bug report submitted successfully. Thank you!',
    },
  },
  ERROR: {
    NOT_FOUND: (module: string) => `${module} not found`,
    ALREADY_EXISTS: (module: string) => `${module} already exists`,
    INVALID_DATA: (module: string) => `Invalid ${module.toLowerCase()} data`,
    AUTH: {
      NO_TOKEN: 'No token provided',
      INVALID_TOKEN: 'Invalid or expired token',
      USER_NOT_FOUND: 'User not found or inactive',
    },
    POMODORO: {
      NO_ACTIVE_TASK: 'No active task found. Please set a task as active first.',
      ACTIVE_SESSION_EXISTS: 'An active Pomodoro session already exists. Please complete or abort it first.',
      NO_ACTIVE_SESSION: 'No active Pomodoro session found',
      ALREADY_PAUSED: 'Session is already paused',
      NOT_PAUSED: 'Session is not paused',
      CANNOT_COMPLETE: 'Only focus sessions can be completed',
      NO_TASKS_FOUND: 'No tasks found. Please create a task first.',
    },
    STREAK: {
      CALCULATION_ERROR: 'Error calculating streak',
    },
    BADGE: {
      NOT_FOUND: 'Badge not found',
      ALREADY_UNLOCKED: 'Badge already unlocked',
    },
    BUG_REPORT: {
      NOT_FOUND: 'Bug report not found',
      INVALID_STATUS: 'Invalid status value',
    },
  },
};
