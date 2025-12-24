export const MESSAGE = {
  SUCCESS: {
    CREATE: (module: string) => `${module} created successfully`,
    UPDATE: (module: string) => `${module} updated successfully`,
    DELETE: (module: string) => `${module} deleted successfully`,
    RETRIEVE: (module: string) => `${module} retrieved successfully`,
    AUTH: {
      SIGNIN: 'Authentication successful',
    },
  },
  ERROR: {
    NOT_FOUND: (module: string) => `${module} not found`,
    ALREADY_EXISTS: (module: string) => `${module} already exists`,
    INVALID_DATA: (module: string) => `Invalid ${module.toLowerCase()} data`,
  },
};
