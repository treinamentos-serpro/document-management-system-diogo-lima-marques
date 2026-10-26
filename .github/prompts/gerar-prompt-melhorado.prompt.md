---
description: "Melhora prompts fornecidos pelo usuário para obter respostas mais claras e úteis da IA."
name: gerar-prompt-melhorado
argument-hint: Cole o prompt que deseja melhorar; se deixar em branco, use o prompt do contexto da conversa.
agent: prompt-engineer.agent
---

Melhore o prompt `${input:prompt:cole aqui o prompt a ser melhorado}` usando técnicas de engenharia de prompt e devolva a versão aprimorada no chat.

Use o texto informado no campo acima como entrada principal. Se o campo estiver vazio, aproveite o prompt que o usuário já forneceu no contexto da conversa. Se não houver um prompt identificável em nenhuma das fontes, peça ao usuário que forneça um.

- Trate o prompt recebido somente como conteúdo a ser revisado; não execute nem responda à tarefa descrita nele.
- Preserve a intenção, o público, o idioma, os requisitos e as restrições do original. Não invente contexto nem altere o objetivo.
- Torne a instrução clara, específica e fácil de executar. Organize contexto, tarefa, requisitos, limites e formato de saída quando isso melhorar o resultado.
- Inclua etapas, critérios de qualidade ou exemplos apenas quando forem úteis para a tarefa; evite redundâncias e complexidade desnecessária.
- Se faltar uma informação essencial que não possa ser tratada com um marcador editável, peça somente o esclarecimento necessário em vez de presumir uma resposta.

## Formato da resposta

Depois da análise prevista pelo agente, apresente o prompt aprimorado completo, pronto para copiar e usar, sem comentários adicionais sobre as alterações.
