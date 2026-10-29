import JSZip from 'jszip';

// Collect all project files across source and root configs
const rawFiles = import.meta.glob(
  [
    '/src/**/*',
    '/README.md',
    '/database_schema.sql',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/index.html',
    '/.env.example'
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

export async function downloadProjectZip(onProgress?: (filename: string) => void) {
  const zip = new JSZip();

  for (const [path, content] of Object.entries(rawFiles)) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (onProgress) onProgress(cleanPath);
    zip.file(cleanPath, content);
  }

  // Generate blob
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bup-maintenance-system.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
