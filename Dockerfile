# Build the client, then serve every file through the Google access gate.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
