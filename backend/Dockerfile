# Production Dockerfile for VEAYOS Homoeopathy ClinicalOS Backend API

FROM node:20-alpine

# Use non-root working directory
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY src/ ./src/
COPY server.js ./

# Switch to standard non-root node user for hardened container security
USER node

# Expose backend API port
EXPOSE 5000

# Health check using native wget in alpine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
