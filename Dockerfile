FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ARG API_KEY
ENV API_KEY=${API_KEY}
CMD ["npm", "run", "dev"]
EXPOSE 80

