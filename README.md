# English AI Tutor

Aplicativo web de **estudo guiado de inglês com inteligência artificial** para iniciantes. Em cada aula, o aluno aprende vocabulário, resolve exercícios com gabarito e pratica por texto com um tutor de IA que orienta a conversa e explica correções em português. A IA roda no navegador em dispositivos compatíveis.

## Status

MVP em fase inicial. As instruções de instalação e execução serão incluídas com a primeira versão executável.

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

## Licença

[MIT](LICENSE)
