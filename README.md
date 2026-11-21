# English AI Tutor

Aplicação web para aprender inglês com o auxílio de uma professora virtual baseada em inteligência artificial.

O projeto tem como objetivo oferecer uma experiência de aprendizagem acessível e progressiva para iniciantes, combinando aulas estruturadas, exercícios e conversação em inglês.

### Acesse a aplicação

**[English AI Tutor — Experimentar aplicação](https://paulinhafigueiredodev.github.io/English-AI-Tutor/)**

> **MVP em desenvolvimento — versão experimental.** As respostas e correções geradas pela inteligência artificial podem apresentar imprecisões.

## Funcionalidades

- **Aulas estruturadas:** vocabulário, exemplos e explicações em português.
- **Exercícios interativos:** atividades com correção por gabarito.
- **Conversação guiada:** prática de inglês relacionada ao conteúdo da aula.
- **Chat livre:** conversação com uma professora virtual.
- **Correções de inglês:** sugestões de correção e explicações geradas pela IA.
- **Acompanhamento de progresso:** visualização das atividades realizadas e do avanço na aprendizagem.
- **Histórico de conversas:** armazenamento local das interações, quando habilitado.
- **Configurações:** personalização das preferências de estudo e gerenciamento dos dados locais.

## Tecnologias

| Tecnologia | Responsabilidade |
|---|---|
| React + TypeScript | Interface e lógica da aplicação |
| Vite | Ambiente de desenvolvimento e build |
| Tailwind CSS + shadcn/ui | Estilização e componentes de interface |
| Lucide React | Ícones |
| WebLLM + WebGPU | Execução dos modelos de linguagem no navegador |
| IndexedDB | Armazenamento local de histórico e progresso |
| JSON | Conteúdo estruturado das aulas |

## Como executar localmente

### Pré-requisitos

- Node.js 20.19+ ou 22.12+.
- npm.
- Navegador compatível com WebGPU para utilizar a professora virtual.

### 1. Clone o repositório

```bash
git clone https://github.com/PaulinhaFigueiredoDev/English-AI-Tutor.git

cd English-AI-Tutor
```

### 2. Instale as dependências

```bash
npm ci
```

### 3. Inicie a aplicação

```bash
npm run dev
```

Abra o endereço exibido pelo Vite no terminal.

### 4. Valide o projeto

Para executar a verificação de tipos:

```bash
npm run typecheck
```

Para gerar o build de produção:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

## Como funciona a inteligência artificial

O English AI Tutor utiliza o **WebLLM** para executar modelos de linguagem diretamente no navegador, utilizando WebGPU.

Na primeira utilização, o aluno pode verificar a compatibilidade do dispositivo e selecionar um modelo de IA.

O download é iniciado somente após a autorização do aluno.

Depois de carregado, o modelo pode realizar a inferência localmente, sem enviar as mensagens do chat para uma API de inferência na nuvem.

### Considerações importantes

- A execução local depende da compatibilidade do navegador e do dispositivo com WebGPU.
- O primeiro download do modelo exige conexão com a internet.
- O desempenho pode variar conforme os recursos disponíveis no dispositivo.
- Os modelos podem produzir respostas incorretas ou explicações gramaticais imprecisas.
- As aulas e os exercícios estruturados podem ser utilizados mesmo sem um modelo de IA compatível.

## Armazenamento de dados

O projeto utiliza armazenamento local no navegador para registrar o histórico de conversas e o progresso das atividades, conforme as preferências do aluno.

Não é necessário criar uma conta para utilizar o MVP.

As configurações permitem gerenciar o salvamento do progresso e limpar os dados locais.

## Status do projeto

**MVP em desenvolvimento — versão experimental.**

A versão atual contempla:

- Primeira aula interativa de inglês para iniciantes.
- Exercícios com correção por gabarito.
- Conversação guiada e prática livre.
- Execução local de modelos WebLLM.
- Acompanhamento de progresso.
- Configurações e preferências de estudo.

A qualidade pedagógica das respostas e correções da professora virtual continua em avaliação.

## Licença

Este projeto está disponível sob a licença [MIT](LICENSE).