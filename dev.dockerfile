ARG NODE_VERSION=20.13

FROM node:${NODE_VERSION}

WORKDIR /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD npm run start:dev
