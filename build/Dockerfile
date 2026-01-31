FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pandoc \
    weasyprint \
    fonts-dejavu \
    fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp && chmod 1777 /tmp
ENV TMPDIR=/tmp

COPY src/package.json src/package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

WORKDIR /app/src

ENTRYPOINT ["npm", "run", "dev"]
