FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src

ENV PORT=8787
EXPOSE 8787

CMD ["npx", "tsx", "src/node.ts"]
