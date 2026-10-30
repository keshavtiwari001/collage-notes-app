const REQUIRED = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SESSION_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
];

let checked = false;

export function checkEnv() {
  if (checked) return;
  checked = true;

  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `\n⚠️  Academica: Missing environment variables:\n` +
      missing.map(k => `   • ${k}`).join('\n') +
      `\n   Copy .env.example to .env.local and fill in the values.\n`
    );
  }
}
