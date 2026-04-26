# Guia de Implantação (Deployment)

Este documento descreve as duas principais estratégias homologadas para implantar o CRM Inteligente para Condomínios em produção.

## 1. Variáveis de Ambiente Necessárias

Independente da estratégia escolhida, você precisará das seguintes variáveis configuradas no ambiente do **Backend**:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@host:5432/crm_condominios?schema=public"

# Segurança
JWT_SECRET="sua-chave-secreta-muito-forte-em-producao"
JWT_EXPIRES_IN="1d"

# Configuração da Aplicação
APP_PORT=3001
APP_ENV=production
CORS_ORIGINS="https://crm.seusite.com.br"
FRONTEND_URL="https://crm.seusite.com.br"
```

No **Frontend**, o arquivo `.env` (ou variáveis da plataforma de hospedagem) deve conter:

```env
NEXT_PUBLIC_API_URL="https://api.crm.seusite.com.br"
```

---

## Estratégia 2.1: Deploy Único em VPS com Docker (Recomendado para início rápido)

Esta arquitetura empacota Banco de Dados, Backend e Frontend na mesma máquina virtual (DigitalOcean, Hetzner, AWS EC2).

### Requisitos
- Máquina Virtual Linux (Ubuntu 22.04 LTS recomendado)
- Min. 2GB RAM / 1 vCPU
- Docker e Docker Compose instalados.

### Passos de Execução
1. **Clonar o Repositório**: Faça o login na VPS e clone este repositório.
2. **Configurar Variáveis**: Crie um arquivo `.env` na raiz do projeto copiando o `.env.example` e preenchendo as chaves com valores de produção.
3. **Subir os Contêineres**:
   ```bash
   docker compose up -d --build
   ```
4. **Executar Migrations e Seeds**:
   ```bash
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npx prisma db seed
   ```
5. **Configurar Proxy Reverso**: Recomendamos o uso de Nginx ou Traefik para mapear os domínios (ex: `crm.seudominio.com` -> porta do frontend, `api.seudominio.com` -> porta do backend) e garantir HTTPS via Let's Encrypt.
6. **Backups**: Implemente um cronjob diário que execute um `pg_dump` no contêiner do PostgreSQL e faça upload para o S3.

---

## Estratégia 2.2: Deploy Separado / Cloud Nativo (Recomendado para escalabilidade)

Nesta arquitetura, separamos o Frontend, Backend e o Banco de Dados em serviços SaaS otimizados.

### Componentes
- **Frontend:** Implantado na **Vercel** ou **Netlify**.
- **Backend:** Implantado no **Render**, **Railway**, ou App Platform da DigitalOcean.
- **Banco de Dados:** PostgreSQL Gerenciado (AWS RDS, Supabase, Neon).

### Vantagens
- Sem necessidade de gerenciar sistema operacional ou Docker.
- Autoscaling automático.
- CDN global nativa para o painel de gestão.

### Passos de Execução

**1. Banco de Dados**
Crie um banco PostgreSQL no provedor de preferência. Guarde a URL de conexão (URI).

**2. Backend (Render / Railway)**
- Conecte o repositório do GitHub.
- Defina o root directory como `backend/` (ou configure o comando: `cd backend && npm install`).
- Comandos de Build: `npm run build && npx prisma generate && npx prisma migrate deploy`
- Comando de Start: `npm run start:prod`
- Insira as variáveis de ambiente, garantindo que o `FRONTEND_URL` contenha a URL final que a Vercel vai gerar, para a proteção de CORS.

**3. Frontend (Vercel)**
- Conecte o repositório na Vercel.
- Defina o framework como Next.js e o Root Directory como `frontend`.
- Adicione a variável `NEXT_PUBLIC_API_URL` apontando para o link público gerado para o Backend.
- Faça o deploy.

---

## Checklist de Produção (Security & Ops)
- [ ] Mudar todas as senhas padrão geradas no ambiente de testes.
- [ ] O `JWT_SECRET` precisa ser uma string longa e aleatória (use `openssl rand -base64 32`).
- [ ] O banco de dados em produção **nunca** deve rodar os scripts de seed (`db seed`) de modo indiscriminado. Eles contém dados mockados (admin/admin). Se necessário, utilize um script SQL inicial para criar apenas o Super Admin real da operação.
- [ ] CORS do backend deve estar obrigatoriamente restrito à URL de produção do frontend.
