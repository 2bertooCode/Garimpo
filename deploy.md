# ☁️ Guia de Deploy na Nuvem: Agente "Morning Brew"

Este guia explica como hospedar o agente **Morning Brew** (painel React + servidor Express) na nuvem utilizando plataformas modernas de hospedagem gratuita como **Render** ou **Railway**. 

Como projetamos a aplicação sob uma **Arquitetura Unificada**, o servidor Express serve automaticamente o painel web estático do React compilado em produção. Isso significa que você precisa subir apenas **um único serviço web**, tornando o deploy totalmente compatível com os planos gratuitos!

---

## 🚀 Método 1: Deploy Rápido na Render (Recomendado)

A Render é uma plataforma excelente para hospedar aplicações fullstack de forma gratuita.

### Passo 1: Subir o código no GitHub
Crie um repositório privado no seu GitHub e envie todos os arquivos deste projeto para lá:
```bash
git init
git add .
git commit -m "feat: initial commit morning brew agent"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### Passo 2: Criar um Web Service na Render
1. Acesse o painel da [Render](https://dashboard.render.com) e clique em **New +** > **Web Service**.
2. Conecte sua conta do GitHub e selecione o repositório deste projeto.
3. Configure os campos com as seguintes informações:
   - **Name**: `morning-brew-agent` (ou o nome que preferir)
   - **Region**: Selecione a mais próxima (ex: `Ohio (US East)`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Passo 3: Configurar Variáveis de Ambiente
Na aba **Environment** do serviço na Render, adicione as seguintes chaves:
- `PORT`: `3001` (A Render atribui automaticamente, mas é bom deixar explicitado)
- `NODE_ENV`: `production`
- `GEMINI_API_KEY`: *(Opcional)* Cole sua chave do Gemini aqui. Se preferir não expor nos arquivos, você também poderá colá-la de forma segura diretamente nas configurações do painel web.

Pronto! Clique em **Create Web Service**. O processo de build levará cerca de 2 minutos. Quando terminar, a Render fornecerá uma URL pública do tipo `https://morning-brew-agent.onrender.com`.

---

## ⚡ Método 2: Deploy na Railway

A Railway é extremamente rápida e suporta deploy instantâneo.

1. Acesse a [Railway](https://railway.app) e crie um novo projeto.
2. Selecione **Deploy from GitHub repository** e escolha o repositório.
3. A Railway detectará automaticamente o arquivo `package.json` e executará o build.
4. Adicione as variáveis de ambiente na aba **Variables**:
   - `PORT`: `3001`
   - `GEMINI_API_KEY`: *Sua Chave do Gemini*
5. Na aba **Settings**, gere um domínio público clicando em **Generate Domain**.

---

## 💾 Persistência de Dados em Produção

> [!IMPORTANT]
> **Sobre o Banco de Dados Local (`db.json`):**
> Em serviços de nuvem gratuitos, os sistemas de arquivos são **efêmeros** (ou "voláteis"). Isso significa que toda vez que o servidor for reiniciado (o que a Render faz a cada 24 horas no plano gratuito), os novos canais cadastrados ou resumos gerados serão apagados e a aplicação voltará ao estado inicial.
> 
> Para solucionar isso em produção, você tem duas excelentes alternativas:

### Alternativa A: Usar um Disco Persistente (Render Disk)
Se você estiver utilizando uma conta com suporte a discos (plano pago inicial de $5/mês da Render ou volume persistente na Railway):
1. Crie um **Persistent Disk** com tamanho de `1 GB` (custa menos de $0.25/mês).
2. Monte o disco no caminho: `/opt/render/project/src/src/server/data`
3. Altere o caminho do banco de dados para salvar dentro da pasta montada. Isso garante que o arquivo `db.json` nunca seja perdido!

### Alternativa B: Manter 100% Gratuito (Configuração Base)
Se preferir manter no plano **100% gratuito**:
- Configure os canais que você quer assistir diretamente no código inicial ou apenas adicione-os no painel sabendo que, caso o servidor reinicie, bastará colá-los novamente.
- Configure a chave `GEMINI_API_KEY` direto nas variáveis de ambiente da plataforma de nuvem (Render/Railway), assim você nunca precisará colá-la novamente ao reiniciar!
