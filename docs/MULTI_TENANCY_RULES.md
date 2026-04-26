# Auditoria de Multi-Tenancy (Multi-Condomínio)

A arquitetura do CRM utiliza um modelo de **Shared Database, Shared Schema**, isolando de forma lógica os dados (Row-Level Isolation) através da chave obrigatória `condominiumId`.

## 1. Estratégia Adotada

- O modelo foi eleito pela simplicidade de manutenção do MVP (evitar shards e múltiplos bancos).
- O isolamento ocorre primariamente **no backend**. O frontend renderiza visualmente a limitação, mas a segurança em si reside no servidor NestJS.
- **Perfil de Super Admin:** Permissões globais (lógica baseada na ausência da cláusula condicional ou privilégio explícito no RoleGuard).
- **Usuários Comuns (Síndicos, Moradores, Zeladores):** Cada token JWT porta o `condominiumId`. Os repositórios forçam automaticamente que o filtro seja apensado nas cláusulas `where: { condominiumId: req.user.condominiumId }`.

---

## 2. Tabelas com Isolamento Explícito (`condominium_id`)

Estas entidades pertencem ou são originadas de um condomínio. Todo CRUD atrelado a elas **exige** a injeção condicional no `where`:
- `Condominium` (Raiz)
- `Block`
- `Unit`
- `Resident`
- `InternalUser`
- `OccurrenceCategory`
- `Conversation`
- `Message` (Isolado indiretamente via Conversation + CondominiumId)
- `Occurrence`
- `OccurrenceTimeline`
- `Alert`
- `AuditLog`
- `BusinessHour`
- `EscalationRule`
- `DispatchGroup`
- `DispatchGroupMember`

---

## 3. Tabelas sem `condominium_id`

No escopo atual, quase a totalidade das tabelas operacionais da infraestrutura possuem relacionamento com o Condomínio. As únicas exceções sistêmicas são globais ou transitórias, embora o modelo contemple o ID nas chaves filhas:

- Exceção Teórica: A entidade Raiz `InternalUser` com o `Role.SUPER_ADMIN` pode ter seu próprio `condominiumId` setado como `null`.
- **Análise de Risco:** Nulo (O sistema entende a ausência em um internal user com Role compatível como permissão global, ou bloqueia estritamente caso seja uma request comum).

---

## 4. Regra Obrigatória para Novos Endpoints

Todo novo módulo do CRM **deve** obedecer à seguinte restrição protocolar:

1. **Nenhum endpoint operacional** deve ser capaz de expor ou iterar dados de um condomínio que não seja o atrelado ao `req.user.condominiumId`.
2. O **Backend é a barreira**. O frontend pode conter lógicas para ocultar abas/menus, mas jamais deverá ser confiado para proteger dados. Toda request de lista (`GET`) deve interpolar silenciosamente o filtro pelo Condomínio.
3. Ao construir Controller e Services, utilize o modelo de injeção das infos do Guard:
   ```typescript
   // Exemplo do padrão seguro:
   findAll(user: UserContext) {
     const whereClause = user.role === 'SUPER_ADMIN' ? {} : { condominiumId: user.condominiumId };
     return this.prisma.entity.findMany({ where: whereClause });
   }
   ```
4. **Criação Segura:** Endpoints `POST` de entidades não podem aceitar injetar explicitamente o `condominiumId` pelo corpo da requisição (`Body`) caso o usuário não seja Admin; deve-se extrair diretamente do Token JWT `req.user.condominiumId`.
