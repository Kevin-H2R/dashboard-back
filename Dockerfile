FROM node:16
WORKDIR /usr/src/app
ARG DB_HOST
COPY package*.json ./

RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "index.js"]