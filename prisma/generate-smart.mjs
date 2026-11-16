import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const dbUrl = (process.env.DATABASE_URL || '').trim().toLowerCase();
const isPostgres =
  dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const schemaPath = isPostgres
  ? 'prisma/schema.supabase.prisma'
  : 'prisma/schema.prisma';

console.log(
  `[Prisma] Ortam algılandı (${
    isPostgres ? 'PostgreSQL / Supabase' : 'SQLite Yerel'
  }) -> ${schemaPath} üzerinden istemci üretiliyor...`
);

try {
  execSync(`node ./node_modules/prisma/build/index.js generate --schema=${schemaPath}`, {
    stdio: 'inherit',
  });
} catch (err) {
  if (!isPostgres && existsSync('./node_modules/.prisma/client/index.js')) {
    console.warn(
      '[Prisma] Uyarı: Mevcut Prisma istemcisi zaten hazır (çalışan süreç kilidi nedeniyle yeniden yazma atlandı).'
    );
  } else {
    throw err;
  }
}
