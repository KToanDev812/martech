# Backend Dockerfile - Local Development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for nodemon)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start with hot reload using nodemon
CMD ["npm", "run", "dev"]
