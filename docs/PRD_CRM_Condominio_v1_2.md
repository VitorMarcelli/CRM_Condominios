# PRD Técnico — CRM para Condomínios
**Versão:** 1.1  
**Data:** 17/04/2026  
**Status:** Planejamento técnico do MVP + base de execução

---

## 1. Resumo Executivo

Este documento detalha o PRD técnico do projeto **CRM para Condomínios**, uma plataforma web voltada à centralização do atendimento, gestão de moradores, registro de ocorrências, comunicação integrada e automação de alertas para situações críticas.

O MVP foi concebido para resolver um problema recorrente em condomínios: a dependência de comunicação descentralizada e informal, principalmente via WhatsApp, sem histórico estruturado, SLA operacional, rastreabilidade e mecanismos inteligentes de acionamento em casos urgentes.

A proposta do produto é transformar o canal de contato do condomínio em uma **central operacional estruturada**, com capacidade de triagem, classificação, roteamento, auditoria e escalonamento de ocorrências, inclusive fora do horário comercial.

---

## 2. Visão do Produto

### 2.1 Problema
Hoje, muitos condomínios operam sua comunicação com moradores por meio de:
- WhatsApp sem controle de fila;
- atendimento manual dependente de pessoas específicas;
- ausência de histórico consolidado;
- demora na resposta a emergências;
- falta de rastreabilidade sobre quem recebeu, tratou ou ignorou uma ocorrência.

### 2.2 Solução
Criar uma plataforma CRM especializada para condomínio, capaz de:
- centralizar atendimentos e interações;
- registrar moradores, unidades e responsáveis;
- abrir e acompanhar ocorrências;
- responder e triar mensagens automaticamente;
- detectar eventos críticos;
- acionar responsáveis com regras de escalonamento;
- manter histórico consultável e auditável.

### 2.3 Objetivo principal
Criar uma central inteligente de relacionamento e operação para condomínios, com foco em organização, velocidade de resposta, rastreabilidade e escalabilidade.

---

## 3. Objetivos do MVP

1. Estruturar o cadastro de condomínios, blocos, unidades e moradores.
2. Centralizar o histórico de atendimentos e ocorrências.
3. Permitir tratamento operacional com status, prioridade e responsável.
4. Integrar o fluxo de comunicação ao WhatsApp.
5. Automatizar triagem e atendimento fora do horário comercial.
6. Identificar situações críticas e acionar responsáveis automaticamente.
7. Preparar a base técnica para expansão futura.

---

## 4. Escopo do MVP

### 4.1 Módulos incluídos
- Gestão de condomínios
- Gestão de blocos, unidades e moradores
- Gestão de usuários internos e responsáveis operacionais
- CRM de atendimentos e histórico de contatos
- Gestão de ocorrências
- Integração inicial com WhatsApp
- Automação de triagem fora do horário comercial
- Motor de alerta e escalonamento
- Dashboard administrativo
- Configurações operacionais por condomínio

### 4.2 Itens fora do MVP
- aplicativo mobile nativo;
- billing e cobrança SaaS;
- BI avançado;
- IA generativa avançada;
- OCR e leitura documental;
- integração com ERP condominial;
- omnichannel completo com voz e e-mail.

---

## 5. Perfis de Usuário

| Perfil | Papel no sistema | Permissões principais |
|---|---|---|
| Administrador | Gestão global da plataforma | Configuração geral, cadastro, regras, relatórios, auditoria |
| Síndico | Gestor da operação do condomínio | Visualizar ocorrências, receber alertas, aprovar ações |
| Zelador | Operação local | Atualizar ocorrências, registrar ações, tratar demandas |
| Atendente/Portaria | Primeiro nível de atendimento | Registrar contatos, abrir chamados, responder moradores |
| Responsável operacional | Pessoa acionável em emergências | Receber alerta, assumir e atualizar tratativa |
| Morador | Usuário final | Reportar ocorrências e receber retorno |

---

## 6. Requisitos Funcionais

### 6.1 Cadastros e estrutura
- **RF-001** Cadastrar múltiplos condomínios.
- **RF-002** Cadastrar blocos por condomínio.
- **RF-003** Cadastrar unidades por bloco.
- **RF-004** Cadastrar moradores vinculados a unidades.
- **RF-005** Cadastrar usuários internos com perfil e permissões.
- **RF-006** Cadastrar responsáveis operacionais e grupos de acionamento.

### 6.2 Atendimento e CRM
- **RF-007** Registrar mensagens recebidas por canal integrado.
- **RF-008** Manter histórico por morador, unidade e telefone.
- **RF-009** Criar atendimentos manual ou automaticamente.
- **RF-010** Criar ocorrências classificadas por tipo.
- **RF-011** Definir status, prioridade e responsável.
- **RF-012** Registrar timeline com data, hora, usuário e ação.
- **RF-013** Pesquisar histórico por nome, unidade, telefone e protocolo.

### 6.3 Comunicação e automação
- **RF-014** Integrar-se ao WhatsApp via provedor/API compatível.
- **RF-015** Detectar mensagens fora do horário administrativo.
- **RF-016** Responder automaticamente fora do horário.
- **RF-017** Apresentar opções de triagem automatizada.
- **RF-018** Solicitar complemento da ocorrência (texto, foto, vídeo).
- **RF-019** Classificar urgência por regra configurável.
- **RF-020** Disparar alertas automáticos para responsáveis.
- **RF-021** Registrar envio, leitura e andamento do alerta.
- **RF-022** Aplicar escalonamento por horário, tipo e criticidade.

### 6.4 Painel e administração
- **RF-023** Exibir dashboard operacional com indicadores.
- **RF-024** Filtrar atendimentos e ocorrências por múltiplos critérios.
- **RF-025** Configurar horário comercial por condomínio.
- **RF-026** Configurar regras de urgência e grupos de acionamento.
- **RF-027** Exibir logs de auditoria para eventos sensíveis.

---

## 7. Requisitos Não Funcionais

- **RNF-001 Arquitetura:** solução web modular, orientada a serviços e preparada para evolução.
- **RNF-002 Segurança:** autenticação segura, autorização por perfil, trilha de auditoria e segregação de acesso.
- **RNF-003 Escalabilidade:** preparada para múltiplos condomínios e crescimento de volume de interações.
- **RNF-004 Disponibilidade:** recepção de mensagens e automações críticas devem funcionar continuamente.
- **RNF-005 Performance:** consultas operacionais principais devem ter boa responsividade.
- **RNF-006 Observabilidade:** logs, erros de integração, alertas e métricas devem ser monitoráveis.
- **RNF-007 LGPD:** controle de acesso, rastreabilidade e política de dados compatíveis com boas práticas.
- **RNF-008 Manutenibilidade:** código padronizado, testável e documentado.

---

## 8. Regras de Negócio

- **RN-001** Toda interação relevante deve gerar histórico consultável.
- **RN-002** Fora do horário comercial, deve existir triagem automatizada obrigatória.
- **RN-003** Ocorrências críticas não podem depender exclusivamente de ação humana.
- **RN-004** Cada ocorrência deve possuir status e prioridade.
- **RN-005** O sistema deve permitir múltiplos responsáveis por categoria ou condomínio.
- **RN-006** Regras de urgência devem ser configuráveis e auditáveis.
- **RN-007** Todo alerta crítico deve gerar rastreabilidade completa.
- **RN-008** O morador não precisa conhecer a estrutura interna para reportar uma urgência.
- **RN-009** Cada condomínio poderá possuir sua própria configuração operacional.

---

## 9. Fluxos Principais

### 9.1 Atendimento em horário comercial
1. Morador envia mensagem.
2. Sistema registra contato e identifica remetente.
3. Atendente visualiza ou assume o atendimento.
4. Ocorrência é criada/classificada.
5. Responsável é atribuído.
6. Atendimento evolui até resolução.
7. Histórico fica disponível para consulta.

### 9.2 Atendimento fora do horário comercial
1. Morador envia mensagem fora do horário.
2. Sistema detecta indisponibilidade operacional.
3. Resposta automática é enviada.
4. Fluxo de triagem coleta o tipo da ocorrência.
5. Sistema solicita complemento se necessário.
6. Regra de urgência avalia criticidade.
7. Se crítica, alerta é disparado.
8. Se não crítica, registro fica para atendimento posterior.

### 9.3 Alerta emergencial
1. Mensagem classificada como crítica.
2. Prioridade elevada para alta/crítica.
3. Grupo ou responsável configurado é acionado.
4. Sistema registra disparo, horário e destinatários.
5. Tratativa continua com rastreabilidade.

---

## 10. Situações Críticas Prioritárias

O MVP deve contemplar regras iniciais para:
- problemas no portão;
- incidentes de segurança;
- risco operacional;
- falhas críticas na estrutura;
- emergências relatadas por moradores.

Essas categorias devem ser configuráveis para evolução futura.

---

## 11. KPIs do Produto

### KPIs operacionais
- Tempo médio de primeira resposta
- Tempo médio de resolução
- Quantidade de ocorrências por prioridade
- Quantidade de alertas críticos disparados
- Quantidade de atendimentos fora do horário comercial
- Taxa de ocorrências resolvidas dentro do SLA

### KPIs de uso
- Número de moradores ativos por condomínio
- Volume de interações por canal
- Quantidade de ocorrências por categoria
- Responsáveis mais acionados
- Taxa de reabertura de ocorrência

---

## 12. Backlog Inicial — Épicos e Features

### Épico 1 — Base de plataforma e autenticação
- Gestão de usuários internos
- Controle de perfis e permissões
- Login seguro
- Recuperação de senha
- Auditoria de acesso

### Épico 2 — Estrutura condominial
- Cadastro de condomínios
- Cadastro de blocos
- Cadastro de unidades
- Cadastro de moradores
- Associação morador-unidade

### Épico 3 — CRM e histórico de atendimento
- Registro de contatos
- Abertura de atendimento
- Histórico por morador
- Timeline de interações
- Busca e filtros operacionais

### Épico 4 — Gestão de ocorrências
- Classificação por tipo
- Status e prioridade
- Responsável por ocorrência
- Comentários internos
- Encerramento e reabertura

### Épico 5 — Integração com WhatsApp
- Entrada de mensagens
- Saída de mensagens
- Identificação de remetente
- Persistência de mídia e anexos
- Registro do canal

### Épico 6 — Automação fora do horário
- Configuração de horário comercial
- Resposta automática
- Triagem automatizada
- Solicitação de complemento
- Criação automática de ocorrência

### Épico 7 — Alerta e escalonamento
- Motor de regras
- Classificação de urgência
- Grupo de acionamento
- Escalonamento por tempo e criticidade
- Histórico de alertas

### Épico 8 — Painel administrativo
- Dashboard operacional
- Lista de atendimentos
- Lista de ocorrências
- Filtros avançados
- Logs de auditoria

---

## 13. User Stories Iniciais

### US-001
Como **administrador**, quero cadastrar condomínios para organizar múltiplas operações em uma mesma plataforma.

**Critérios de aceite**
- Permitir criar, editar e inativar condomínio.
- Cada condomínio deve possuir configuração própria.
- Deve haver validação de campos obrigatórios.

### US-002
Como **atendente**, quero localizar rapidamente um morador por nome, unidade ou telefone para consultar o histórico antes de responder.

**Critérios de aceite**
- Busca por nome, telefone, unidade e bloco.
- Resultado exibindo dados resumidos e histórico recente.
- Acesso respeitando permissão do usuário.

### US-003
Como **morador**, quero registrar uma ocorrência pelo WhatsApp para comunicar problemas sem depender de ligação ou atendimento manual.

**Critérios de aceite**
- Mensagem recebida deve ser persistida.
- Sistema deve tentar vincular remetente ao cadastro.
- Caso não identifique, deve registrar atendimento como contato não associado.

### US-004
Como **síndico**, quero ser alertado quando houver ocorrência crítica fora do horário para não depender apenas do celular principal do condomínio.

**Critérios de aceite**
- Regra deve detectar horário e criticidade.
- Sistema deve notificar responsável configurado.
- Histórico do alerta deve ficar salvo.

### US-005
Como **zelador**, quero atualizar o status de uma ocorrência para que todos acompanhem a evolução do atendimento.

**Critérios de aceite**
- Alteração de status deve ser registrada na timeline.
- Deve armazenar usuário, data e hora.
- Histórico não pode ser apagado.

### US-006
Como **administrador**, quero configurar grupos de acionamento por categoria de problema para direcionar alertas corretamente.

**Critérios de aceite**
- Criar grupo com múltiplos responsáveis.
- Vincular grupo a tipo de ocorrência.
- Permitir alterar regra sem apagar histórico anterior.

---

## 14. Arquitetura Sugerida

### 14.1 Visão geral
Arquitetura web modular com separação clara entre frontend, backend, banco de dados, integrações e motor de automação.

### 14.2 Componentes principais
- **Frontend Web Admin:** painel administrativo e operacional.
- **Backend API:** autenticação, regras de negócio, CRUDs, dashboards e logs.
- **Banco relacional:** persistência transacional do domínio.
- **Serviço de mensageria:** integração com WhatsApp.
- **Motor de automação:** triagem, classificação, alerta e escalonamento.
- **Serviço de notificação:** envio de alertas para responsáveis.
- **Storage de arquivos:** armazenamento de mídia/anexos.
- **Monitoramento:** logs, métricas e auditoria.

### 14.3 Fluxo técnico resumido
1. Mensagem entra pelo provedor de WhatsApp.
2. Backend recebe webhook.
3. Sistema identifica condomínio, remetente e contexto.
4. Motor de automação aplica regras.
5. Evento é persistido.
6. Se necessário, gera ocorrência e alerta.
7. Dashboard passa a refletir o novo estado.

---

## 15. Sugestão de Stack Técnica

### Opção recomendada
- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS + TypeScript
- **Banco:** PostgreSQL
- **ORM:** Prisma ou TypeORM
- **Autenticação:** JWT + refresh token + RBAC
- **Mensageria:** integração com API de WhatsApp
- **Fila/Jobs:** Redis + BullMQ
- **Storage:** S3 compatível
- **Infraestrutura:** Docker + VPS
- **Observabilidade:** logs estruturados + monitoramento de jobs

### Alternativa viável
- **Frontend:** React/Next.js
- **Backend:** Laravel
- **Banco:** PostgreSQL
- **Fila:** Redis + queues do Laravel

---

## 16. Modelagem Inicial de Domínio

### Entidades principais
- Condominium
- Block
- Unit
- Resident
- InternalUser
- ContactChannel
- Conversation
- Message
- Ticket
- Occurrence
- OccurrenceCategory
- Attachment
- Alert
- AlertRecipient
- EscalationRule
- DispatchGroup
- BusinessHour
- AuditLog

### Relacionamentos principais
- Um condomínio possui muitos blocos.
- Um bloco possui muitas unidades.
- Uma unidade pode possuir muitos moradores.
- Um morador pode ter múltiplos canais de contato.
- Uma conversa possui muitas mensagens.
- Uma ocorrência pode nascer de uma conversa.
- Uma ocorrência possui categoria, prioridade, status e responsável.
- Um alerta pertence a uma ocorrência.
- Um grupo de acionamento possui muitos responsáveis.
- Uma regra de escalonamento pode apontar para um grupo.

---

## 17. Modelo de Dados Inicial (visão textual)

### condominium
- id
- name
- document
- status
- created_at
- updated_at

### block
- id
- condominium_id
- name
- code

### unit
- id
- condominium_id
- block_id
- number
- floor
- status

### resident
- id
- condominium_id
- unit_id
- full_name
- phone
- email
- status

### internal_user
- id
- condominium_id
- full_name
- email
- phone
- role
- password_hash
- status

### conversation
- id
- condominium_id
- resident_id nullable
- channel
- external_reference
- status
- started_at
- last_message_at

### message
- id
- conversation_id
- direction
- sender_name
- sender_phone
- body
- media_url nullable
- sent_at
- raw_payload json

### occurrence
- id
- condominium_id
- resident_id nullable
- conversation_id nullable
- category_id
- title
- description
- status
- priority
- assigned_user_id nullable
- opened_at
- closed_at nullable

### alert
- id
- condominium_id
- occurrence_id
- trigger_type
- urgency_level
- status
- triggered_at

### escalation_rule
- id
- condominium_id
- category_id nullable
- trigger_keywords json
- active_hours json
- urgency_level
- dispatch_group_id

### audit_log
- id
- condominium_id
- entity_type
- entity_id
- action
- actor_type
- actor_id nullable
- metadata json
- created_at

---

## 18. Segurança e Governança

- Autenticação com expiração de sessão e refresh token
- Autorização por papéis e permissões
- Auditoria de ações sensíveis
- Criptografia de credenciais e dados sensíveis
- Controle de acesso por condomínio
- Rastreabilidade de alertas e alterações
- Política de retenção e anonimização futura
- Cuidados aderentes à LGPD

---

## 19. Estratégia de Entrega do MVP

### Sprint 1
- Setup do projeto
- Autenticação
- Perfis e permissões
- Cadastros base

### Sprint 2
- Condomínio, bloco, unidade e morador
- Usuários internos
- Estrutura de listagem e filtros

### Sprint 3
- Atendimento, conversa e mensagens
- Histórico do morador
- Timeline

### Sprint 4
- Ocorrências, prioridade, status e responsável
- Dashboard operacional inicial

### Sprint 5
- Integração com WhatsApp
- Persistência de mídia
- Registro automático de contato

### Sprint 6
- Horário comercial
- Triagem fora do horário
- Alerta e escalonamento

### Sprint 7
- Auditoria
- Ajustes de UX
- Homologação do MVP

---

## 20. Riscos e Atenções Técnicas

- Dependência do provedor de WhatsApp e suas limitações
- Configuração inadequada de regras de urgência
- Alto volume de mensagens sem fila e processamento assíncrono
- Necessidade de isolamento por condomínio
- Evolução futura para multi-tenant mais robusto
- Possível necessidade de SLA e escalonamento mais complexo

---

## 21. Critérios de Aceite do MVP

O MVP será considerado pronto quando:
1. for possível cadastrar condomínios, blocos, unidades, moradores e usuários internos;
2. mensagens recebidas por canal integrado forem registradas corretamente;
3. ocorrências puderem ser abertas, classificadas e atribuídas;
4. o sistema responder automaticamente fora do horário comercial;
5. alertas críticos puderem ser disparados com rastreabilidade;
6. o dashboard operacional refletir o estado real dos atendimentos;
7. o sistema possuir base técnica consistente para expansão.

---

## 22. Ordem Tier 4 para Agente de Programação

```text
Você atuará como arquiteto de software, engenheiro fullstack sênior e líder técnico responsável por iniciar o desenvolvimento do projeto CRM para Condomínios.

Seu objetivo é estruturar o MVP com qualidade profissional, foco em escalabilidade, clareza arquitetural, segurança e capacidade real de evolução futura.

CONTEXTO DO PRODUTO
Desenvolver um CRM web para condomínios com foco em:
- gestão de condomínios, blocos, unidades e moradores;
- histórico completo de contatos e atendimentos;
- registro e acompanhamento de ocorrências;
- integração com WhatsApp;
- automação de triagem fora do horário comercial;
- alerta automático para situações críticas;
- painel administrativo e operação rastreável.

OBJETIVOS TÉCNICOS
1. Estruturar a base do projeto com arquitetura sólida.
2. Preparar backend e frontend para crescimento futuro.
3. Criar modelagem inicial coerente com o domínio.
4. Implementar autenticação, perfis e permissões.
5. Criar fundação do CRM, ocorrências e automações.
6. Deixar o projeto pronto para integração com WhatsApp e notificações.

STACK PREFERENCIAL
- Frontend: Next.js + React + TypeScript
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- Auth: JWT + RBAC
- Jobs/Filas: Redis + BullMQ
- Infra: Docker
- Storage: S3 compatível

O QUE VOCÊ DEVE FAZER
1. Analisar todo o contexto funcional e técnico do produto.
2. Criar a arquitetura inicial da aplicação.
3. Definir a estrutura de pastas do frontend e backend.
4. Modelar o banco de dados inicial.
5. Criar entidades centrais do domínio.
6. Implementar autenticação e autorização por perfil.
7. Implementar os cadastros principais:
   - condomínio
   - bloco
   - unidade
   - morador
   - usuário interno
8. Criar módulo de atendimento/conversa/mensagem.
9. Criar módulo de ocorrência com:
   - categoria
   - status
   - prioridade
   - responsável
   - timeline
10. Criar base do módulo de alertas e escalonamento.
11. Criar configuração de horário comercial por condomínio.
12. Preparar endpoint/webhook para futura integração com WhatsApp.
13. Criar dashboard inicial com métricas operacionais.
14. Implementar logs de auditoria para ações sensíveis.
15. Documentar decisões técnicas relevantes.

REGRAS DE EXECUÇÃO
- Trabalhe como se este projeto fosse para produção.
- Não use soluções low-code/no-code.
- Priorize código limpo, modular e bem nomeado.
- Evite acoplamento excessivo.
- Separe domínio, aplicação, infraestrutura e interface quando fizer sentido.
- Crie DTOs, validações e tratamento de erro consistente.
- Estruture permissões por papel de usuário.
- Deixe o sistema preparado para multi-condomínio.
- Sempre que possível, já deixe interfaces prontas para integrações futuras.
- Gere arquivos de ambiente de exemplo.
- Documente comandos de execução local.
- Crie seeds iniciais para testes do domínio.

ENTREGÁVEIS ESPERADOS
- estrutura inicial completa do projeto;
- backend funcional com módulos principais;
- frontend administrativo inicial;
- banco modelado;
- autenticação funcionando;
- CRUDs iniciais implementados;
- dashboard base;
- documentação técnica inicial;
- README profissional.

ORDEM DE PRIORIDADE
1. Arquitetura
2. Banco e domínio
3. Auth e perfis
4. Cadastros base
5. Atendimento e ocorrências
6. Alertas e regras
7. Dashboard
8. Documentação

ANTES DE FINALIZAR
- valide dependências;
- revise nomes técnicos e consistência de domínio;
- identifique pontos frágeis;
- proponha próximos passos reais do desenvolvimento.

Ao final, entregue também:
- resumo da arquitetura;
- lista de módulos implementados;
- pendências restantes do MVP;
- recomendações de evolução.
```

---

## 23. Próximos Passos Recomendados

1. Validar este PRD com os stakeholders.
2. Definir o provedor de WhatsApp e estratégia de integração.
3. Fechar o escopo do MVP por sprint.
4. Criar wireframes do painel e fluxos principais.
5. Converter backlog em tarefas técnicas.
6. Iniciar implementação da fundação do projeto.

---

## 24. Endpoints Iniciais da API

### 24.1 Autenticação
- `POST /auth/login` — autenticar usuário interno
- `POST /auth/refresh` — renovar token
- `POST /auth/forgot-password` — solicitar redefinição de senha
- `POST /auth/reset-password` — redefinir senha

### 24.2 Condomínios
- `GET /condominiums`
- `POST /condominiums`
- `GET /condominiums/:id`
- `PUT /condominiums/:id`
- `PATCH /condominiums/:id/status`

### 24.3 Blocos e unidades
- `GET /condominiums/:id/blocks`
- `POST /condominiums/:id/blocks`
- `GET /blocks/:id/units`
- `POST /blocks/:id/units`
- `PUT /units/:id`

### 24.4 Moradores
- `GET /residents`
- `POST /residents`
- `GET /residents/:id`
- `PUT /residents/:id`
- `GET /residents/search?name=&phone=&unit=`

### 24.5 Usuários internos e responsáveis
- `GET /internal-users`
- `POST /internal-users`
- `PUT /internal-users/:id`
- `GET /dispatch-groups`
- `POST /dispatch-groups`

### 24.6 Conversas e mensagens
- `GET /conversations`
- `GET /conversations/:id`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`
- `POST /webhooks/whatsapp` — recepção de eventos do provedor

### 24.7 Ocorrências
- `GET /occurrences`
- `POST /occurrences`
- `GET /occurrences/:id`
- `PUT /occurrences/:id`
- `PATCH /occurrences/:id/status`
- `PATCH /occurrences/:id/priority`
- `PATCH /occurrences/:id/assign`

### 24.8 Alertas e escalonamento
- `GET /alerts`
- `GET /alerts/:id`
- `POST /alerts/trigger`
- `GET /escalation-rules`
- `POST /escalation-rules`
- `PUT /escalation-rules/:id`

### 24.9 Dashboard e auditoria
- `GET /dashboard/overview`
- `GET /dashboard/kpis`
- `GET /audit-logs`
- `GET /business-hours`
- `PUT /business-hours/:id`

---

## 25. Estrutura Inicial de Pastas

### 25.1 Frontend — Next.js
```text
frontend/
  src/
    app/
      (auth)/
      dashboard/
      condominiums/
      residents/
      occurrences/
      conversations/
      settings/
    components/
      ui/
      forms/
      tables/
      charts/
      layout/
    features/
      auth/
      condominiums/
      residents/
      occurrences/
      conversations/
      dashboard/
      settings/
    services/
      api/
      auth/
    hooks/
    lib/
    types/
    styles/
  public/
  tests/
```

### 25.2 Backend — NestJS
```text
backend/
  src/
    modules/
      auth/
      users/
      condominiums/
      blocks/
      units/
      residents/
      conversations/
      messages/
      occurrences/
      alerts/
      escalation-rules/
      dispatch-groups/
      dashboard/
      audit/
      business-hours/
      webhooks/
    common/
      decorators/
      guards/
      filters/
      interceptors/
      pipes/
      dto/
      utils/
    config/
    database/
      prisma/
      seeds/
    jobs/
    integrations/
      whatsapp/
      notifications/
      storage/
    main.ts
  test/
  docker/
```

---

## 26. SQL Inicial de Referência

```sql
CREATE TABLE condominiums (
  id UUID PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  document VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  block_id UUID NOT NULL REFERENCES blocks(id),
  number VARCHAR(20) NOT NULL,
  floor VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE residents (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  unit_id UUID REFERENCES units(id),
  full_name VARCHAR(180) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(180),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE internal_users (
  id UUID PRIMARY KEY,
  condominium_id UUID REFERENCES condominiums(id),
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(30),
  role VARCHAR(40) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  resident_id UUID REFERENCES residents(id),
  channel VARCHAR(30) NOT NULL,
  external_reference VARCHAR(180),
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  direction VARCHAR(10) NOT NULL,
  sender_name VARCHAR(180),
  sender_phone VARCHAR(30),
  body TEXT,
  media_url TEXT,
  raw_payload JSONB,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE occurrence_categories (
  id UUID PRIMARY KEY,
  condominium_id UUID REFERENCES condominiums(id),
  name VARCHAR(120) NOT NULL,
  severity_default VARCHAR(20),
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE occurrences (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  resident_id UUID REFERENCES residents(id),
  conversation_id UUID REFERENCES conversations(id),
  category_id UUID REFERENCES occurrence_categories(id),
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_user_id UUID REFERENCES internal_users(id),
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES condominiums(id),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  trigger_type VARCHAR(40) NOT NULL,
  urgency_level VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'triggered',
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  condominium_id UUID REFERENCES condominiums(id),
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  action VARCHAR(60) NOT NULL,
  actor_type VARCHAR(30) NOT NULL,
  actor_id UUID,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 27. Escopo Executivo para Apresentação ao Cliente

### 27.1 Nome do projeto
**CRM Inteligente para Condomínios**

### 27.2 Objetivo
Desenvolver uma plataforma web para condomínios com foco em centralização do atendimento, organização de contatos, registro de ocorrências, histórico operacional e automação de alertas para situações críticas, especialmente em atendimentos realizados via WhatsApp.

### 27.3 Problema que o projeto resolve
Hoje, muitos condomínios dependem de comunicação informal, atendimento manual e mensagens soltas em aplicativos, o que gera perda de histórico, lentidão no atendimento, falta de rastreabilidade e risco operacional em situações urgentes.

O sistema proposto resolve esse cenário ao criar uma central estruturada de relacionamento e operação, permitindo que cada contato seja registrado, tratado e acompanhado com mais controle e agilidade.

### 27.4 Entrega prevista no escopo
O projeto contempla o desenvolvimento de um sistema web com os seguintes módulos principais:

- cadastro de condomínios;
- cadastro de blocos, unidades e moradores;
- cadastro de síndico, zelador, atendentes e responsáveis operacionais;
- histórico de contatos e atendimentos;
- registro de ocorrências, reclamações, solicitações e avisos;
- painel administrativo para acompanhamento da operação;
- controle de status, prioridade e responsável por ocorrência;
- estrutura de integração com WhatsApp;
- automação de atendimento fora do horário comercial;
- mecanismo de alerta para situações críticas.

### 27.5 Diferenciais do sistema
Os principais diferenciais da solução serão:

- centralização do relacionamento com moradores;
- histórico completo e rastreável de atendimentos;
- redução da dependência exclusiva de atendimento manual;
- triagem automatizada fora do horário comercial;
- alerta inteligente para emergências e ocorrências sensíveis;
- base tecnológica preparada para evolução futura.

### 27.6 Funcionalidade crítica
Um dos pontos centrais do projeto será o mecanismo de identificação e escalonamento de situações críticas, como:

- problemas no portão;
- incidentes de segurança;
- risco operacional;
- falhas graves na estrutura;
- emergências relatadas por moradores.

Quando esse tipo de ocorrência for detectado, o sistema poderá encaminhar alertas automáticos para responsáveis previamente definidos, mantendo histórico completo da tratativa.

### 27.7 Perfis de acesso previstos
O sistema deverá contemplar, inicialmente, os seguintes perfis:

- Administrador
- Síndico
- Zelador
- Atendente/Portaria
- Responsável operacional
- Morador

### 27.8 Formato da solução
A solução será desenvolvida como plataforma web moderna, organizada e escalável, com arquitetura preparada para crescimento futuro, novas integrações e expansão para módulos adicionais.

### 27.9 Itens previstos para evolução futura
A arquitetura já será pensada para suportar, futuramente:

- aplicativo mobile;
- notificações push;
- relatórios gerenciais avançados;
- novos canais de atendimento;
- automações mais inteligentes;
- módulos administrativos complementares.

### 27.10 Resultado esperado
Ao final, o condomínio terá uma central inteligente de atendimento e operação, com mais controle sobre moradores, solicitações e ocorrências, além de mais velocidade e segurança na resposta a situações críticas.

---

## 28. Resumo Comercial de Apresentação

Este projeto prevê o desenvolvimento de um CRM especializado para condomínios, desenhado para organizar o relacionamento com moradores, centralizar o histórico de atendimento, registrar ocorrências e automatizar alertas operacionais.

A proposta é sair de um modelo informal e descentralizado, normalmente dependente de WhatsApp e atendimento manual, para uma operação mais estruturada, rastreável e eficiente. Com isso, o condomínio passa a ter mais controle, agilidade e segurança, inclusive fora do horário comercial.

Além da gestão de contatos e ocorrências, o sistema terá um diferencial estratégico: a capacidade de identificar situações sensíveis e acionar responsáveis automaticamente, reduzindo riscos operacionais e melhorando a resposta em casos urgentes.

O projeto será construído com base moderna e escalável, permitindo crescimento futuro com novas integrações, novos canais e módulos complementares.
