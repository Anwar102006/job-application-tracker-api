# ==============================================================================
# Multi-stage Production Dockerfile for Job Application Tracker API
# ==============================================================================

# Stage 1: Install production dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only and clean npm cache
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Minimal, secure production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Run as non-root node user (built into official node:alpine image)
USER node

# Copy dependencies from builder stage
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Copy package.json and application source code
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/

EXPOSE 5000

# Built-in container health check querying public health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# Production startup command
CMD ["node", "src/server.js"]
