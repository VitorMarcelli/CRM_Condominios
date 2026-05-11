# Premium UI Overhaul Plan

## Goal
Aplicar a nova identidade visual "Gut Punch" (geometria orgânica extrema, paleta estrita Azul/Noir, animações fluidas Framer Motion e zero clichês) a todos os módulos restantes do CRM.

## Tasks

- [x] **Task 1: Módulo de Ocorrências**
  - Refatorar `dashboard/occurrences/page.tsx` (lista) e `[id]/page.tsx` (detalhes).
  - Substituir tabelas chatas por listas de cards expansíveis ou grids com `rounded-3xl` e `hover:scale`.
  - Aplicar animações de *stagger* na entrada.
  - *Verify*: Página de ocorrências e detalhes fluem suavemente na tela sem bordas duras.

- [x] **Task 2: Módulo de Alertas**
  - Refatorar `dashboard/alerts/page.tsx`.
  - Criar interface estilo "Central de Monitoramento" com dark mode agressivo e botões de acknowledge de alto impacto.
  - *Verify*: Alertas ativos têm peso visual imediato.

- [x] **Task 3: Módulo de Moradores**
  - Refatorar `dashboard/residents/page.tsx`.
  - Exibição em formato de cards flexíveis (`grid-cols-2` ou `3`) com foto/iniciais, status ativo/inativo estilizado.
  - *Verify*: Navegação fluida entre lista de moradores.

- [ ] **Task 4: Módulo de Conversas (Chat WhatsApp)**
  - Refatorar `dashboard/conversations/page.tsx`.
  - Aplicar estilo moderno de chat (bolhas orgânicas, sombras suaves, sem caixas com bordas 1px `slate-200`).
  - *Verify*: Tela de chat parece um aplicativo nativo moderno (estilo iMessage/Telegram Modern).

- [ ] **Task 5: Páginas Administrativas (Condomínios, Auditoria, Regras de Escalonamento, Grupos)**
  - [x] Grupos de Acionamento (Listagem, Novo, Editar)
  - [x] Regras de Escalonamento (Listagem, Nova, Editar)
  - [x] Auditoria Avançada (Logs)
  - [x] Condomínios (Listagem, Novo, Editar)
  - Padronizar layouts de listas e formulários (`next/form` se aplicável).
  - Trocar tabelas genéricas por `cards` listados ou DataTables premium sem bordas internas.
  - *Verify*: Experiência coesa do início ao fim do painel.

## Done When
- [ ] Nenhum módulo do dashboard possui os antigos cantos duros (`rounded-md` ou ausência de border-radius).
- [ ] Todas as listas e grids de dados entram com transições suaves.
- [ ] O roxo/violeta foi completamente erradicado em favor do Azul Vibrante/Preto Noir.
- [ ] O usuário navega por todo o CRM sem sentir que saiu do ambiente "Premium".
