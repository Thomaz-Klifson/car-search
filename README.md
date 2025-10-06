# Car Search

Protótipo de buscador e marketplace de carros. Esta versão contém uma UI em Next.js e lógica de chat com integração a um modelo generativo (Gemini), além de um backend/infra para preparação de índices e gerenciamento de dados.

## Visão geral
Este repositório contém o frontend principal em `app/` (Next.js), componentes React, e um pequeno backend para preparação de índices (pasta `backend/`). Os dados de exemplo estão em `data/cars.json`.

## Deploy atual
- Deploy (feito via Vercel CLI): https://car-search-pmv3192le-thomazklifsons-projects.vercel.app

> Observação: verifique as variáveis de ambiente no painel do Vercel para habilitar integrações com Gemini e Supabase (ver abaixo).

## Como rodar localmente
1. Na raiz do repositório:

```powershell
# Instale dependências (usa pnpm no projeto, mas npm também funciona)
pnpm install
pnpm --filter "car-marketplace (1)" dev
```

2. Backend (Python)  se for usar a preparação de índice:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python prepare_index.py
```

## Variáveis de ambiente importantes
- `GEMINI_API_KEY` (obrigatório para chat com o modelo)  defina no Vercel como variável de ambiente de produção; nunca use `NEXT_PUBLIC_` para chaves secretas.
- `NEXT_PUBLIC_SUPABASE_URL`  endpoint do Supabase (se usar imagens/armazenamento)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  chave anônima para chamadas públicas do Supabase

## Notas sobre produção
- Confirme as variáveis acima no Vercel (Project  Settings  Environment Variables).
- Se usar o Gemini em produção, garanta que a chave `GEMINI_API_KEY` esteja configurada apenas no ambiente server (não pública).

## Plano de Negócios

Abaixo está uma proposta curta e prática para lançar este buscador no mercado.

### 1) Modelo de negócios
- Produto principal: buscador / marketplace de carros que conecta compradores e vendedores (particulares e concessionárias), com filtros avançados e recomendações.
- Modelo freemium + comissões: acesso gratuito às buscas básicas; recursos premium (destaque de anúncios, relatórios aprofundados, alertas personalizados, validação de histórico do veículo) por assinatura mensal. Cobrança de comissão fixa/percentual sobre vendas intermediadas pela plataforma para concessionárias e revendedores.

### 2) Como atrair os primeiros usuários
- Estratégia de aquisição:
  - Parcerias com pequenas concessionárias e lojas locais para listar inventário gratuito por um período inicial.
  - Campanhas locais pagas (Facebook/Instagram/Google) segmentadas por intenção (pessoas buscando por "comprar carro usado" na mesma cidade).
  - Conteúdo orgânico: SEO para consultas de compra de carros (guias de compra, comparativos), e criação de artigos e vídeos curtos com dicas.
  - Programas de indicação: incentivo (crédito na plataforma) para usuários que indicarem vendedores ou compradores.

### 3) Estimativa de CAC (Custo de Aquisição de Cliente)
- Premissas (exemplo simples):
  - Canais pagos (Google/Facebook): CPC médio de $0.50 a $1.50 por clique; taxa de conversão para cadastro/lead: 25%.
  - Conversão de lead para usuário ativo: 30%.
  - Considerando mix de canais e custo médio, estimativa inicial de CAC por usuário ativo: US$1040.
  - Para concessionárias (B2B), CAC será maior (vendas diretas/SDR): US$200600 por conta, dependendo da taxa de sucesso.

### 4) Proposta de LTV (Lifetime Value) e como maximizar
- Exemplo de cálculo conservador:
  - Usuário premium: ARPU (receita média por usuário) $5/mês; churn mensal 5%  LTV  $100 (arredondado).
  - Vendedores/revendas: receita média por conta (subscriptions + comissões) pode ser de $200$1.000+ anualmente.

- Estratégias para maximizar LTV:
  - Aumentar retenção com notificações personalizadas (alertas de preço/novos anúncios), melhoria contínua de recomendação e UX.
  - Upsell de serviços (destaque, integração com logística, verificações de histórico do veículo).
  - Acordos B2B recorrentes com concessionárias para pacotes de listagem premium.

### 5) Formas de monetização viáveis
- Assinaturas (B2C e B2B) para recursos avançados.
- Comissões por venda intermediada ou serviços adicionais (financiamento, seguros, inspeção).
- Anúncios e anúncios patrocinados/destaque para vendedores.
- Venda de relatórios/insights de mercado para concessionárias (dados de demanda e preços).

### 6) Estratégias de retenção
- Notificações e alertas personalizados por e-mail/app para novos anúncios que batam com os filtros do usuário.
- Programa de fidelidade e créditos para listar/impulsionar anúncios.
- Simplificação do processo de compra: integrações com financiamento/inspeção/entrega para reduzir atrito pós-contato.
- Engajamento contínuo via conteúdo relevante (boletins com tendências locais, guias de manutenção, histórico de preços).

### Observações finais
Esta seção é uma visão estratégica inicial. Para transformar isso em plano operacional é preciso: validar suposições com entrevistas com usuários, medir custos reais de aquisição em campanhas-piloto, e priorizar recursos com maior impacto em retenção e monetização.
