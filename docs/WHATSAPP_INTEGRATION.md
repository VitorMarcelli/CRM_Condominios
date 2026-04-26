# Integração com WhatsApp (Mock & Webhook)

## Estrutura do Webhook Mockado

A fase atual (Fase 9) utiliza um webhook mockado focado em imitar o padrão oficial do **WhatsApp Cloud API** da Meta. O NestJS processa essa estrutura em `/webhooks/whatsapp`.

### Identificação do Condomínio
Como estamos no MVP sem um provedor consolidado (Evolution/Z-API), a descoberta do escopo do condomínio (Multi-Tenancy) no recebimento de uma mensagem do Webhook ocorre via dupla checagem:
1. **Pelo Telefone do Remetente:** O banco busca um morador ativo correspondente ao `from`. Se encontrado, atrela ao `condominiumId` do morador.
2. **Fallback pelo Header:** Caso seja um contato desconhecido, o endpoint procura o header HTTP `x-condominium-id`. Isso simula uma configuração de webhook individualizada por instância/número na Cloud API.

### Normalização de Telefones
Foi construído o utilitário `PhoneNormalizationUtil.normalize(phone: string)`.
- **Regra:** Limpa símbolos (parênteses, traços). 
- **Compatibilidade:** Caso receba 10 ou 11 dígitos, injeta automaticamente o DDI do Brasil (`55`). Isso garante a paridade de comparação entre `(11) 99999-9999` gravado no banco e `5511999999999` recebido via WhatsApp.

### Triagem e Automação Fora do Horário
O `AfterHoursTriageService` é executado a cada inbound message:
- Checa o calendário operacional do condomínio associado (`BusinessHoursService`).
- Executa varredura de urgência (`classifyMessageUrgency`) buscando palavras-chave como `assalto`, `portão travado`, `vazamento`.
- Transforma a gravidade em prioridade técnica (`critical`, `high`, `medium`).
- Dispara a abertura sistêmica silenciosa de uma **Ocorrência** automática caso haja urgência, atrelando a Timeline sem intervenção humana.
- Responde nativamente injetando um `outbound/system message` alertando que a prioridade foi engatilhada.

### Estratégia Futura para Identificação do Condomínio (Produção)
Para a próxima fase de integração com provedores reais (Evolution, Z-API, ou WhatsApp Cloud API):
- No mock atual, o condomínio pode ser identificado via header `x-condominium-id`.
- Em produção, a melhor estratégia é mapear o `phone_number_id` (ou `instance_id` dependendo do provedor) recebido no webhook diretamente para a tabela de configuração do condomínio.
- A inferência puramente pelo telefone do morador não é recomendada como única estratégia em produção, pois falha ao receber contatos desconhecidos (ex: visitantes, fornecedores).
- O provedor real deverá possuir uma tabela/configuração de `ContactChannel` ou `Instances` atrelados a cada condomínio, garantindo que o destino seja 100% isolado por número receptor.
