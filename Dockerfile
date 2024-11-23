# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.15.1
FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY . .

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "main.js", "--host", "0.0.0.0", "--port", "3000", "--cache", "./cache"]