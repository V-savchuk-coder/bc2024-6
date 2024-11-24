

ARG NODE_VERSION=20.15.1


FROM node:${NODE_VERSION}-alpine


# Use production node environment by default.
WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on
EXPOSE 3000

# Run the application.
CMD npx nodemon -L --inspect=0.0.0.0:9229 server.js --host 0.0.0.0 --port 3000 --cache cache
