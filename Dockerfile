# ---------------------------------------------------------------------------
# Single-image deploy: builds the React client, then runs the Express server
# which serves both the API and the built UI (see server/src/app.js).
#
#   docker build -t study-hub .
#   docker run -p 4000:4000 -v study-data:/data study-hub
#   open http://localhost:4000
# ---------------------------------------------------------------------------

# ---- stage 1: build the client ----
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- stage 2: server + built client ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist
# persistent volume for the SQLite database
RUN mkdir -p /data
ENV DB_FILE=/data/study.db
ENV PORT=4000
EXPOSE 4000
WORKDIR /app/server
CMD ["node", "src/index.js"]
