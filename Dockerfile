# Use Node.js as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (for backend)
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend files
COPY . .

# Build the frontend
WORKDIR /app/evoting-frontend
RUN npm install --omit=dev && npm run build

# Move frontend build to backend public folder (optional)
WORKDIR /app
RUN mkdir -p public && cp -r evoting-frontend/build/* public/

# Expose backend API port
EXPOSE 3000

# Start the backend server
CMD ["node", "server/server.js"]
