# Endpoints da API

## Padrão de Resposta para Paginação

Todos os endpoints que retornam listas (Condomínios, Moradores, Ocorrências, Conversas, etc.) devem obrigatoriamente seguir a estrutura paginada abaixo:

```json
{
  "data": [
    {
      "id": "123",
      "name": "Exemplo",
      "..." : "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

No frontend (Next.js), o Axios extrai os dados via `res.data`. Portanto, os componentes devem acessar a lista da seguinte forma:
```javascript
const response = await api.get('/endpoint');
const list = response.data.data || [];
```
