FROM mhart/alpine-node:latest

WORKDIR /app
COPY package.json package-lock.json ./
COPY server.js ./

ADD public ./public
ADD uploads ./uploads

RUN npm ci --prod
EXPOSE 9001
CMD ["node", "server.js"]