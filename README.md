# English AI Tutor

Aplicativo web de **estudo guiado de inglês com inteligência artificial** para iniciantes. Em cada aula, o aluno aprende vocabulário, resolve exercícios com gabarito e pratica por texto com um tutor de IA que orienta a conversa e explica correções em português. A IA roda no navegador em dispositivos compatíveis.

## Status

O app tem a primeira aula interativa e a configuração inicial da IA local. A Aula 01 apresenta vocabulário, exemplos e dois exercícios corrigidos pelo gabarito. O progresso é salvo no navegador e pode ser retomado após recarregar a página. A conversa guiada entra com a integração do chat.

## Executar localmente

Requisitos: Node.js 20.19+ na série 20, ou 22.12+, e npm.

```sh
npm ci
npm run dev
```

Abra a URL exibida pelo Vite. Use `npm run typecheck` para verificar os contratos TypeScript, `npm run build` para gerar o pacote em `dist/` e `npm run preview` para conferir o build localmente. Em hospedagem estática, configure o fallback para `index.html` nas rotas do app.

Na primeira visita, escolha **Verificar dispositivo** ou **Escolher manualmente** para testar um modelo local. O download só começa após clicar em **Autorizar download e testar**. Os modelos disponíveis são experimentais. Escolha **Estudar sem IA** para abrir a Aula 01 diretamente. Você pode voltar a esse fluxo pelo ícone de Configurações.

O [Qwen3-4B](https://huggingface.co/mlc-ai/Qwen3-4B-q4f16_1-MLC) está disponível como candidato principal para avaliação, com download de cerca de 2,28 GB. O Qwen2.5 0.5B continua disponível como opção de download menor. A escolha do modelo padrão depende da avaliação pedagógica.

## MVP

- Aulas em JSON com vocabulário, explicações e exercícios.
- Conversa guiada nas aulas e prática livre com inferência no navegador via WebLLM e WebGPU.
- Histórico e progresso salvos no navegador com IndexedDB.
- Acesso às aulas e aos exercícios em dispositivos sem IA compatível.

## Tecnologias

| Tecnologia | Papel no projeto |
| --- | --- |
| React e TypeScript | Interface web e lógica da aplicação |
| Vite | Ambiente de desenvolvimento e build |
| Tailwind CSS, shadcn/ui e Lucide React | Estilos, componentes e ícones |
| WebLLM e WebGPU | Execução do modelo de IA no navegador |
| IndexedDB | Armazenamento local de histórico e progresso |
| JSON | Conteúdo e gabaritos das aulas |

## Compatibilidade do tutor local

A prova de conceito executou [WebLLM 0.2.89](https://github.com/mlc-ai/web-llm) em um Web Worker no Chrome 158.0.8127.37 (macOS 26.6.2, MacBook Air M1, 8 GB de RAM). O Chrome disponibilizou WebGPU com o adaptador Apple Metal 3 e suporte a `shader-f16`.

| Modelo testado | Arquivos em cache | Primeiro carregamento | Até o primeiro texto | Geração |
| --- | ---: | ---: | ---: | ---: |
| [SmolLM2-360M-Instruct-q4f16_1-MLC](https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC) | 212,5 MB | 24,7 s | 2,57 s | 17,2 tokens/s |
| [Qwen2.5-0.5B-Instruct-q4f16_1-MLC](https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC) | 290,9 MB | 77,1 s | 1,14 s | 15,4 tokens/s |

Cada linha representa uma execução com cache inicialmente vazio. O tamanho é a soma dos arquivos de modelo, configuração e runtime armazenados no navegador. O tempo até o primeiro texto começa no envio do pedido, com o modelo já carregado. Os modelos base usam Apache 2.0. [SmolLM2](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) · [Qwen2.5](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)

Os dois modelos geraram texto com a rede desativada no Chrome DevTools após o carregamento. No teste com WebGPU indisponível simulado, o protótipo bloqueou o download e informou a alternativa de estudar sem IA. Os resultados se aplicam ao dispositivo testado e à inferência após o carregamento.

Os dois modelos erraram a tradução de “Good morning”. O SmolLM2 corrigiu “She go to school” sem explicar a regra, e o Qwen2.5 removeu o sujeito. A escolha do modelo padrão continua pendente de avaliação pedagógica.

## Licença

[MIT](LICENSE)
