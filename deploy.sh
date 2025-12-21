#!/bin/bash

# Script de Deploy - Passback
# Execute: bash deploy.sh

set -e

echo "=========================================="
echo "  PASSBACK - Deploy Automatico"
echo "=========================================="

cd /var/www/passback

echo "[1/6] Baixando alteracoes do GitHub..."
if [ -d ".git" ]; then
    git fetch origin master
    git reset --hard origin/master
else
    echo "Inicializando repositorio git..."
    git init
    git remote add origin https://github.com/lucaspalermo/passback.git
    git fetch origin master
    git reset --hard origin/master
fi

echo "[2/6] Instalando dependencias..."
npm install --production=false

echo "[3/6] Gerando cliente Prisma..."
npx prisma generate

echo "[4/6] Sincronizando banco de dados..."
npx prisma db push --accept-data-loss

echo "[5/6] Construindo aplicacao..."
npm run build

echo "[6/6] Reiniciando servidor..."
pm2 restart passback || pm2 start ecosystem.config.js

echo "=========================================="
echo "  Deploy concluido com sucesso!"
echo "  Site: https://passback.com.br"
echo "=========================================="
