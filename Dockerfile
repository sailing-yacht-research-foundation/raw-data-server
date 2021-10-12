FROM node:16-alpine

RUN apk update && apk add make python3

# Install chromium in container instead of letting puppeteer install because there is an issue in docker using puppeteer's chromium
# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
RUN apk add chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "npm-shrinkwrap.json*", "./"]

RUN yarn install --production && mv node_modules ../

COPY . .

EXPOSE 3000
CMD ["yarn", "start"]
