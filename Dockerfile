FROM node:24-alpine
WORKDIR /srv
COPY . .
EXPOSE 3000
RUN ls -l
RUN npm install
CMD npm run dev