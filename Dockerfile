FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY sample ./sample

ENV CSV_FILE_PATH=sample/large-sample.csv

CMD ["npm", "start"]
