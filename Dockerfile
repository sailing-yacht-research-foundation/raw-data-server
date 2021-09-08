FROM node:16-alpine

RUN apk update && apk add make python3

WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "npm-shrinkwrap.json*", "./"]

RUN yarn install --production && mv node_modules ../

COPY . .

EXPOSE 3000
CMD ["yarn", "start"]
