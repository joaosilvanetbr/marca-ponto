# PontoGO

PontoGO é um PWA (Progressive Web App) para controle de jornada de trabalho. Registre seus pontos de entrada, intervalo, retorno e saída, acompanhe seu banco de horas e acesse seu histórico mensal de qualquer lugar.

## Como funciona

O app tem três abas principais:

### Ponto
- Veja a hora atual e uma previsão de saída baseada na sua jornada
- Registre seus pontos com um toque: **Entrada**, **Intervalo**, **Retorno** e **Saída**
- Acompanhe o tempo trabalhado e o saldo do dia em tempo real
- Edite ou remova pontos individualmente se precisar ajustar
- Funciona offline: seus registros ficam salvos localmente e sincronizam automaticamente quando a internet voltar

### Histórico
- Navegue por meses anteriores e veja todos os dias do mês
- Veja um resumo com: horas trabalhadas, saldo acumulado, dias trabalhados e média por dia
- Filtre entre todos os registros, dias com ponto e dias faltantes
- Exporte seus dados em CSV para planilha
- Edite ou exclua registros antigos

### Configurações
- Altere sua jornada diária (padrão: 8h)
- Ative ou desative o tema escuro
- Ative notificações para receber lembretes de ponto
- Edite seu nome, email e senha

## Destaques

- **100% offline**: registra pontos mesmo sem internet e sincroniza depois
- **Notificações**: lembretes automáticos para não esquecer de bater o ponto
- **Vibração (haptic feedback)**: confirmação tátil ao registrar ponto
- **App Badge**: badge no ícone mostrando registros pendentes de sincronização
- **Swipe**: deslize entre as abas como em apps nativos
- **Tema escuro**: interface adaptável para dia e noite

## Tecnologias

- React + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL + Realtime)
- Vite + PWA (vite-plugin-pwa)
- Framer Motion (animações)
- TanStack Virtual (scroll otimizado)
