# Use Node.js as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (for backend)
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Install dependencies separately before building
WORKDIR /app/evoting-frontend
RUN npm install --force
RUN npm run build

# Copy backend files
COPY . .

# Build the frontend
ENV NODE_OPTIONS="--openssl-legacy-provider"
WORKDIR /app/evoting-frontend
RUN npm install --force --legacy-peer-deps
RUN npm run build

# Set environment variable to fix OpenSSL issues
ENV NODE_OPTIONS="--openssl-legacy-provider"


# Move frontend build to backend public folder (optional)
WORKDIR /app
RUN mkdir -p public && cp -r evoting-frontend/build/* public/

# Expose backend API port
EXPOSE 3000

# Start the backend server
CMD ["node", "server/server.js"]
