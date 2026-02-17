FROM node:20-alpine AS builder
WORKDIR /app
# Monorepo root – tsconfig.base.json musí být dostupný
COPY tsconfig.base.json ./
COPY packages/backend/package.json packages/backend/tsconfig.json packages/backend/nest-cli.json ./packages/backend/
WORKDIR /app/packages/backend
RUN npm install
COPY packages/backend/src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY packages/backend/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/packages/backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
