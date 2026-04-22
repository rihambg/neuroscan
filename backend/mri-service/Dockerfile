FROM node:20-alpine
RUN apk add --no-cache vips-dev python3 make g++
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p /uploads /uploads/thumbnails
EXPOSE 3003
CMD ["node", "src/index.js"]
