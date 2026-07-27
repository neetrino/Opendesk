# Vercel Environment Variables (Production)

## REQUIRED
DATABASE_URL=
SESSION_SECRET=

## RECOMMENDED (Neon pooler + serverless)
DATABASE_CONNECTION_LIMIT=1
DATABASE_SESSION_OPTIONS=false
APP_URL=

# NODE_ENV ставит Vercel сам
# DATABASE_URL: Neon pooled URL с sslmode=require
# SESSION_SECRET: openssl rand -hex 32
# TLS verify включён по умолчанию; DATABASE_SSL_REJECT_UNAUTHORIZED=false только как escape hatch
