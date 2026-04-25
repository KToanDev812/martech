# Frontend Dockerfile - Local Development
FROM node:20-alpine

# Build-time argument for API URL
ARG VITE_API_URL=http://localhost:3001/api/v1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variable at runtime
ENV VITE_API_URL=${VITE_API_URL}

# Expose port (Vite default)
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]
