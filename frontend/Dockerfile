# Multi-stage Production Dockerfile for VEAYOS Homoeopathy ClinicalOS Frontend PWA

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing layer caching)
COPY package*.json ./
RUN npm ci || npm install

# Copy source files
COPY . .

# Build argument to configure API backend endpoint at build time
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with lightweight Nginx web server
FROM nginx:alpine AS runner

# Copy custom Nginx configuration with SPA fallback & PWA headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check to monitor Nginx web server uptime
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
