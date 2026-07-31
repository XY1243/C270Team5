FROM node:20-alpine

WORKDIR /app

# bcrypt needs a native build toolchain on alpine; removed after install to keep the image small
RUN apk add --no-cache --virtual .build-deps python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev && apk del .build-deps

COPY . .

RUN mkdir -p uploads/banners

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
