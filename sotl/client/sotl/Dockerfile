# Stage 1: Build the application
FROM node:18-alpine AS build

WORKDIR /app

# Copy only package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 3000

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
