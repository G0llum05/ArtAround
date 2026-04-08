# 1. Usiamo l'immagine Node (stessa versione del backend per coerenza)
FROM node:22

# 2. Impostiamo la cartella di lavoro (deve coincidere con il volume nel compose)
WORKDIR /usr/src/app

# 3. Installiamo la CLI di Angular globalmente
RUN npm install -g @angular/cli

# 4. Copiamo i file delle dipendenze
COPY package*.json ./

# 5. Installiamo le dipendenze locali
RUN npm install --legacy-peer-deps

# 6. Copiamo il resto del codice (utile per la prima build)
COPY . .

# 7. Esponiamo la porta di Angular
EXPOSE 4200

# 8. Comando per avviare Angular
# --host 0.0.0.0 è OBBLIGATORIO per vedere l'app dal tuo browser su Arch
# --poll 2000 serve per far funzionare l'Hot Reload dentro i volumi Docker su Linux
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
