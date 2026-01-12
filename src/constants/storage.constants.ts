const AZURE_STORAGE_CONTAINERS = {
  TEMP: 'temp',
  PROPERTIES_IMAGES: 'properties-images',
} as const;

// File validation constants
const FILE_VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
} as const;

export { AZURE_STORAGE_CONTAINERS, FILE_VALIDATION };
