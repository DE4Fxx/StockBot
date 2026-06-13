FROM node:20-alpine

# 1. Install Alpine dependencies for Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/stockbot

# 2. Copy dependency definitions and install them
COPY package*.json ./
RUN npm ci --omit=dev

# 3. Copy EVERYTHING else explicitly
COPY . .

# 4. Make sure permissions are flawless
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]