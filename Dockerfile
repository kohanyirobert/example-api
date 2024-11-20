FROM node:23-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV HOST=0.0.0.0
ENV PORT=5000
EXPOSE $PORT
CMD ["node", "index.js"]
