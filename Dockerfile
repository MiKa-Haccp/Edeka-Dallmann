# 1. Wir nutzen Node.js (Version 20)
FROM node:20-slim

# 2. Wir erstellen einen Arbeitsordner auf dem Server
WORKDIR /app

# 3. Wir kopieren die Paketlisten (Zutatenliste)
COPY package.json ./

# 4. Wir installieren die Programme, die deine App braucht
RUN npm install

# 5. Wir kopieren den restlichen Code von Replit in den Container
COPY . .

# 6. Wir sagen dem Container, auf welchem Port er funken soll
EXPOSE 5173

# 7. Der Startbefehl für deine App
CMD ["npm", "run", "dev", "--", "--host"]
