FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/api-node ./apps/api-node
COPY data ./data

RUN cd packages/shared && npm install && npm run build
RUN cd apps/api-node && npm install && npm run build

EXPOSE 5000

CMD ["node", "apps/api-node/dist/index.js"]
