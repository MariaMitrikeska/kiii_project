FROM node:20-alpine

WORKDIR /app

# Копирај package files и инсталирај dependencies
COPY package*.json ./
RUN npm install --production

# Копирај го изворниот код
COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
