FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm ci --prefix backend
RUN npm ci --prefix frontend

COPY frontend frontend
RUN npm run build --prefix frontend

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY backend/package*.json backend/
RUN npm ci --omit=dev --prefix backend && npm cache clean --force
COPY backend/src backend/src
COPY --from=build /app/frontend/dist frontend/dist

EXPOSE 3000
USER node
CMD ["node", "backend/src/index.js"]