FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source (see .dockerignore for what's excluded).
COPY src ./src

# Persistent per-guild state (data/guilds.json). Mount a volume here in Coolify
# so it survives redeploys.
RUN mkdir -p /app/data && chown -R node:node /app
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV BOT_STORE_PATH=/app/data/guilds.json

USER node

CMD ["node", "src/index.js"]
