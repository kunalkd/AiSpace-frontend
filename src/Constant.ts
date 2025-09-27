const CONSTANTS = {
  HOST_URL: import.meta.env.DEV ? 'http://localhost:8080/creators/' : 'https://aispaces.in/creators',
  MEDIA_TYPE: 'image' as 'image' | 'video'
} as const;

export default CONSTANTS;