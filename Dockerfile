# Stage 1: Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /build/labyrinth
COPY labyrinth/package*.json ./
RUN npm install
COPY labyrinth/ ./
# Pass server URL at build time (set via Coolify env var VITE_SERVER_URL)
ARG VITE_SERVER_URL=""
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

# Stage 2: Production Node.js server
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source
COPY server/ ./

# Copy built React app into server/public (served as static files)
COPY --from=frontend /build/labyrinth/dist ./public

EXPOSE 3001
ENV PORT=3001

CMD ["node", "index.js"]
