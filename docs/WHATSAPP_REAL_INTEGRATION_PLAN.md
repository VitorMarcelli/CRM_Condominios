# Plano de Integração Real com WhatsApp (Fase 11+)

Este documento estabelece a arquitetura e os requisitos necessários para substituir o *Mock Webhook* atual por uma integração real e em produção com a WhatsApp API.

## 1. Estratégia de Provedor Recomendada

Para um cenário Multi-Tenant (Múltiplos Condomínios), a melhor estratégia é adotar um provedor que suporte múltiplas instâncias/sessões sem a necessidade de hospedar centenas de contêineres de conexão.

**Recomendação Primária:** Z-API ou Evolution API.
- Eles permitem a criação de instâncias isoladas (uma por condomínio).
- Fornecem um `instance_id` ou `phone_number_id` no payload do Webhook, o que facilita o roteamento exato.

**Recomendação Secundária:** WhatsApp Cloud API (Oficial Meta).
- Exige aprovação de BSP ou registro individual.
- Mais burocrático, porém mais estável. Retorna o `phone_number_id`.

## 2. Diferença Estrutural (Mock vs Produção)

### Mock Atual:
- Usa o telefone de origem (`from`) para "adivinhar" o condomínio buscando o residente.
- Se o número não existe, tenta ler um header manual (`x-condominium-id`).
- Não envia mensagens reais de volta para a rede.

### Produção:
- O payload de entrada possui um `instance_id`.
- O banco de dados precisará de uma tabela `ContactChannel` (já presente no Prisma) que mapeie o `instance_id` ao `CondominiumId`.
- O sistema sabe EXATAMENTE para qual condomínio a mensagem pertence, MESMO QUE o remente seja um número desconhecido (visitante/fornecedor).

## 3. Idempotência e Tratamento de Duplicatas

Webhooks reais costumam falhar e re-tentar o envio (Retry Policy). Isso pode duplicar alertas críticos.

**Regra de Idempotência:**
- O payload real traz o ID único da mensagem (`externalMessageId`, ex: `wamid.HBg...`).
- Antes de processar (Triagem, Ocorrência, Alerta), o sistema DEVE fazer um `upsert` na tabela `messages` buscando o `externalReference` = `externalMessageId`.
- Se a mensagem já existir, o endpoint de webhook retorna `200 OK` e ignora o processamento silenciosamente, evitando a duplicação de Alertas.

## 4. Arquitetura de Adaptador (Provider Agnostic)

O backend deve implementar o padrão **Factory / Adapter**.

```typescript
export interface WhatsAppProvider {
  sendMessage(to: string, body: string, instanceId: string): Promise<any>;
  sendMedia(to: string, url: string, instanceId: string): Promise<any>;
}

// Implementações:
export class ZApiProvider implements WhatsAppProvider { ... }
export class EvolutionProvider implements WhatsAppProvider { ... }
export class MockWhatsAppProvider implements WhatsAppProvider { ... }
```

A injeção de dependência do NestJS usará uma chave no `.env` (ex: `WHATSAPP_PROVIDER=ZAPI`) para instanciar a classe correta em runtime. O sistema permanece o mesmo, mudando apenas a ponte final.

## 5. Variáveis de Ambiente Necessárias (Futuro)

```env
WHATSAPP_PROVIDER=ZAPI # ou CLOUD_API, MOCK
ZAPI_WEBHOOK_SECRET=token_de_validacao_de_seguranca
ZAPI_BASE_URL=https://api.z-api.io/instances
```

## 6. Fila e Assincronicidade (Processamento)

Para não dar timeout no Webhook da Meta (que exige resposta em poucos segundos), o endpoint principal (`POST /webhooks/whatsapp`) deve:
1. Validar assinatura e salvar payload bruto no banco.
2. Colocar o job numa fila (BullMQ / Redis).
3. Responder `200 OK` imediatamente.
4. Um worker em background consumirá a fila: Triagem -> Ocorrência -> Alerta -> Disparo.
