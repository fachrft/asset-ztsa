FROM node:24-bookworm-slim

WORKDIR /app
RUN chown node:node /app
USER node

ENV NEXT_TELEMETRY_DISABLED=1

COPY --chown=node:node package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY --chown=node:node app ./app
COPY --chown=node:node components ./components
COPY --chown=node:node lib ./lib
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
