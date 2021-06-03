FROM node:12.18-alpine

RUN apk update && apk add bash

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production --silent && mv node_modules ../

COPY . .
RUN chmod +x ./wait-for-it.sh

EXPOSE 3000
CMD ["./wait-for-it.sh", "-t", "120", "localhost:3306", "--", "npm", "start"]
