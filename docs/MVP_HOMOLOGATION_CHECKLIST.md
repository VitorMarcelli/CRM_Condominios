# Checklist de Homologação (MVP Fase 12)

Utilize este checklist antes de qualquer apresentação a clientes ou stakeholders e antes de submeter o MVP ao deploy produtivo.

## 1. Experiência de Uso (Frontend)
- [ ] Login e Logout funcionam corretamente (limpam o token do Zustand/Storage).
- [ ] Redirecionamento correto em caso de rota protegida sem autenticação.
- [ ] Interface não "pisca" na renderização inicial (loading states adequados).
- [ ] Dashboard carrega e não quebra se os arrays de dados estiverem vazios.
- [ ] Mensagens vazias ("Nenhum dado encontrado") existem e são educadas.

## 2. Permissões e Multi-tenant
- [ ] Autenticar como Admin de Condomínio X.
- [ ] Tentar acessar a URL da Ocorrência pertencente ao Condomínio Y. A API deve retornar `403` ou `404`.
- [ ] Autenticar como Síndico. O link "Condomínios" deve estar ausente da Sidebar.

## 3. Gestão e Cadastros
- [ ] O cadastro de um Condomínio está funcional.
- [ ] O cadastro de Blocos e Unidades associa-se corretamente ao Condomínio.
- [ ] É possível criar um Morador e vinculá-lo a uma Unidade.
- [ ] É possível inativar/editar um Morador.

## 4. Comunicação e Triagem
- [ ] Webhook Mock responde HTTP `200 OK`.
- [ ] O payload repetido (mesmo externalId) não cria ocorrências duplicadas.
- [ ] Enviar mensagem "Oi, preciso do boleto" (Horário Comercial) cria Conversa.
- [ ] Enviar "Vazamento Grave!" (Fora de horário ou Urgente) gera uma Ocorrência Crítica automaticamente.

## 5. Escalation e Alertas
- [ ] A Regra de Escalonamento pode ser criada e ativada.
- [ ] O Grupo de Acionamento pode ser vinculado a uma regra.
- [ ] Quando a Triagem define `critical`, o Alerta é materializado na tela `/alerts`.
- [ ] O botão "Reconhecer Alerta" funciona.
- [ ] O botão "Encerrar Alerta" funciona.
- [ ] A lista de Destinatários exibe corretamente os contatos.

## 6. Auditoria (Traceability)
- [ ] A tela de `/dashboard/audit-logs` renderiza a lista de logs.
- [ ] Ações críticas (como `STATUS_CHANGE` ou `ACKNOWLEDGED`) aparecem nos logs em menos de 1 segundo.

## 7. Qualidade de Código e Build
- [ ] `npm run build` no Frontend termina sem erros de TypeScript ou Linter pesados.
- [ ] `npm run build` no Backend compila sem erros.
- [ ] `npx prisma migrate deploy` não acusa divergência com o banco estrutural.
- [ ] Nenhuma credencial de AWS, Z-API, Database ou JWT está hardcoded nos arquivos subidos ao Git.
