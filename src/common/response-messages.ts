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
      CURRENT: 'Current session retrieved successfully',
      NO_ACTIVE: 'No active session',
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
    },
  },
};
