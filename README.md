# Car Search AI

Assistente de vendas automotivo inteligente que utiliza IA para ajudar compradores a encontrar o carro ideal. Construído com Next.js e Gemini AI, oferece uma experiência conversacional personalizada para busca e recomendação de veículos.

## 🎯 Funcionalidades Principais

- **Chat Inteligente**: Interface conversacional que entende linguagem natural e contexto
- **Busca Avançada**: Filtragem por marca, modelo, preço e localização
- **Recomendações Personalizadas**: Sugestões baseadas nas preferências do usuário
- **Visualização de Detalhes**: Modal com informações detalhadas de cada veículo
- **Interface Responsiva**: Adaptada para desktop e dispositivos móveis
- **Temas Claro/Escuro**: Suporte a preferências de tema do usuário

## 🚀 Tecnologias

- Frontend: Next.js 14 com App Router
- UI: Radix UI + Tailwind CSS
- IA: Google Gemini
- Backend: Node.js + Python
- Dados: JSON + Supabase (opcional)

## 💻 Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/car-search.git
cd car-search
```

2. Instale as dependências:
```bash
pnpm install  # ou npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env.local com:
GEMINI_API_KEY=sua_chave_aqui  # Obrigatório para o chat
```

4. Execute o projeto:
```bash
pnpm dev  # ou npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

- `GEMINI_API_KEY`: Chave da API do Google Gemini (obrigatória)
- `NEXT_PUBLIC_SUPABASE_URL`: URL do Supabase (opcional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase (opcional)

### Índice de Busca (Opcional)

Para recriar o índice de busca:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python prepare_index.py
```

## 🧪 Casos de Teste

A aplicação pode ser testada com os seguintes cenários:

1. ✅ Procurar um carro que existe no JSON
2. 🪙 Procurar um carro que existe, mas com um valor abaixo do disponível
3. 🌎 Procurar um carro que existe, mas em outra localidade

## 📦 Deploy

O projeto está configurado para deploy na Vercel:

1. Conecte seu repositório na Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy será automático a cada push na branch main

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
