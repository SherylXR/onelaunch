// Single source of truth for the app's public URL (permanent ngrok domain).
// Override at build time: VITE_PUBLIC_URL=https://... npm run build
export const PUBLIC_URL =
  import.meta.env.VITE_PUBLIC_URL ?? 'https://designer-unfiled-service.ngrok-free.dev'
