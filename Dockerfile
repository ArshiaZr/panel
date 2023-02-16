FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run pair
CMD ["npm", "run", "start"]