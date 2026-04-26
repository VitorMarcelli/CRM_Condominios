# Regras de Automação e Alertas (Fase 10)

## 1. Triagem Fora do Horário (Webhook Mock)
O `AfterHoursTriageService` analisa mensagens recebidas via WhatsApp:
- **Fora do horário / Não urgente:** Gera resposta automática informando horário de atendimento.
- **Urgente (High):** Cria ocorrência silenciosa. Prioridade `high`.
- **Crítico (Critical):** Cria ocorrência, adiciona metadados na timeline e engatilha **Alerta Crítico**.

## 2. Alertas
- Quando a triagem ou uma criação manual sinaliza urgência `critical`, um `Alert` é gerado.
- Status do alerta: `triggered` -> `acknowledged` -> `closed`.

## 3. Regras de Escalonamento e Grupos
- O serviço `AlertsService` busca as regras (`EscalationRule`) ativas para o condomínio.
- Cada regra possui `triggerKeywords` e está associada a um `DispatchGroup`.
- Os membros do grupo de acionamento (`DispatchGroupMember`) tornam-se `AlertRecipient`s (destinatários) com status inicial `pending`.

## 4. Auditoria
Todas as transições de status geram entrada em `AuditLog`, registrando o ator (`system` ou `user`) e os metadados (status antigo e novo).
