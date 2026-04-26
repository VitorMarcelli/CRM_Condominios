# Escopo de Apresentação ao Cliente

Este documento direciona a comunicação executiva e comercial da entrega do Produto Viável Mínimo (MVP).

## 1. Nome do Projeto
**CRM Inteligente para Condomínios**

## 2. Objetivo da Plataforma
A plataforma foi concebida para atuar como o **cérebro operacional do condomínio**. Ela centraliza o atendimento aos moradores, cataloga históricos em ocorrências rastreáveis e automatiza a identificação e acionamento de alertas em emergências críticas.

## 3. O Problema Resolvido
Atualmente, as portarias e administrações sofrem com:
- Mensagens dispersas no WhatsApp dos porteiros, sem organização.
- Ausência total de histórico e perda de contexto na troca de turnos.
- Dificuldade de rastrear ocorrências (solicitações que nunca são fechadas).
- Extrema dependência de atendimento manual, inclusive de madrugada.
- **Risco severo em situações críticas**, onde uma demora de leitura pode resultar em perigo (invasões, incêndios, inundações).

## 4. Solução Entregue no MVP
A Versão 1 (MVP) já entrega um painel de controle executivo abrangente:
- **Painel Administrativo (Gestão Completa):** Cadastro de blocos, unidades e moradores.
- **Gestão de Ocorrências:** Rastreabilidade de chamados, status, níveis de prioridade e responsáveis.
- **Central de Conversas (Atendimento):** Recepção de mensagens centralizadas (prontas para integração com o WhatsApp oficial).
- **Triagem Inteligente (Fora de Horário):** O sistema lê as mensagens em tempo real e detecta palavras de emergência.
- **Alertas e Regras de Escalonamento:** Ao identificar um risco ("vazamento", "assalto"), o sistema eleva a prioridade, cria a ocorrência sozinho e emite um alerta pulsante para o grupo de segurança cadastrado.
- **Auditoria Absoluta:** Nenhuma ação é invisível. Quem reconheceu o alerta, quando encerrou e por que tomou a decisão fica registrado.

## 5. Diferenciais de Mercado
- **Rastreabilidade Fim a Fim:** Cada mensagem do Whatsapp pode virar uma Ocorrência, que pode virar um Alerta. Tudo conectado.
- **Automação Pró-ativa:** O sistema não espera o porteiro acordar para decidir se uma mensagem é urgente.
- **Multi-condomínio:** Uma única central pode operar 50 condomínios, cada síndico vendo apenas os dados de sua propriedade, com segurança garantida.
- **Redução de Risco Operacional:** Menos chance de processos por negligência na resposta a eventos críticos de segurança.

## 6. Limitações Atuais (Transparência Comercial)
Para alinhar expectativas antes da homologação final, ressaltamos que neste estágio MVP:
- **Integração Real de WhatsApp:** A demonstração usa um "motor interno" (Mock) que simula o WhatsApp. A ligação com o provedor real (ex: Meta/Z-API) está mapeada para a próxima etapa contratual.
- **Notificações Push / SMS Outbound:** Serão implementadas em paralelo com a integração oficial do provedor.
- **App Mobile do Morador e Pagamentos SaaS:** Não compõem este escopo primário e entram no roadmap futuro.

## 7. Próximas Evoluções (Roadmap)
- Conexão do canal WhatsApp Oficial.
- Disparo de notificações de SMS para eventos críticos.
- Aplicativo Mobile dedicado para o Morador (reservas e autorizações de entrada).
- Dashboard de BI Operacional com cálculos de SLA de atendimento.

---

# Roteiro de Demonstração (Guia Prático)

*Para o apresentador utilizar na reunião com os stakeholders:*

1. **Abertura:** Fazer login com usuário Super Admin (`admin@crmcondominios.com`).
2. **Visão Executiva:** Mostrar o Dashboard exibindo os cards dinâmicos (Ocorrências Críticas vs Alertas Pendentes).
3. **Gestão:** Navegar para o menu de Moradores, demonstrando a facilidade de acesso às unidades e telefones.
4. **Organização:** Mostrar a tela de Ocorrências (Kanban/Lista) – enfatizar as "etiquetas" (Prioridade e Status).
5. **Comunicação:** Abrir a tela de Conversas. Mostrar que todo o chat fica guardado.
6. **Simulação Crítica (Ponto Alto da Demo):** 
   - Utilizar a ferramenta interna (Insomnia/Postman/cURL) para enviar um Webhook (Mock) simulando uma mensagem do morador de madrugada: *"Estou vendo uma pessoa tentando pular o muro da garagem!"*
7. **Automação:** Voltar para a tela de Conversas e mostrar a mensagem chegando.
8. **Rastreabilidade:** Mostrar que a Ocorrência foi aberta automaticamente, sem toque humano.
9. **O Alerta:** Navegar para a tela de Alertas e mostrar o alarme ativo na cor vermelha.
10. **Escalonamento:** Mostrar que o "Grupo de Segurança / Ronda" foi selecionado como Destinatário para lidar com a situação.
11. **Responsabilidade:** Clicar em "Reconhecer Alerta" e, depois, "Encerrar".
12. **A Prova:** Abrir o menu de Auditoria para mostrar o relatório imutável do sistema comprovando o tempo de resposta da equipe.
13. **Fechamento:** Explicar o plano de próximos passos para integrar tudo ao número oficial de WhatsApp da administradora.
