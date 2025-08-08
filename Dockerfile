FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Instala netcat-openbsd (implementação do netcat)
RUN apt-get update && apt-get install -y netcat-openbsd

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["/wait-for-it.sh", "db", "5432", "--", "node", "dist/index.js"]
