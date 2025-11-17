# Multi-stage Dockerfile for Student Questionnaire SPA
# Optimized for Azure deployment with minimal size and security

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Surface backend URL during build so Vite can inline it
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1000 msuser && \
    adduser -D -u 1000 -G msuser msuser && \
    chown -R msuser:msuser /usr/share/nginx/html && \
    chown -R msuser:msuser /var/cache/nginx && \
    chown -R msuser:msuser /var/log/nginx && \
    chown -R msuser:msuser /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R msuser:msuser /var/run/nginx.pid

# Switch to non-root user
USER msuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
