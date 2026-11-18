# StudyHub — Plataforma de Estudos Premium

Projeto React + Vite + Tailwind CSS + Framer Motion, design premium estilo "Kimi".

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

## Estrutura

- `src/components/Navbar.jsx` — navegação glassmorphism
- `src/components/Hero.jsx` — hero interativo com parallax e formas que reagem ao mouse
- `src/components/SubjectCards.jsx` — grid de matérias com tilt 3D no hover
- `src/components/TiltCard.jsx` — wrapper de inclinação 3D
- `src/components/ChatAI.jsx` — tutor IA em modal overlay com blur
- `src/pages/Reading.jsx` — leitura com blocos que deslizam (whileInView) + botão flutuante
- `src/pages/Quiz.jsx` — quiz com microinterações e feedback semântico

Dados de Chat e Quiz são mocks, prontos para integração com APIs de IA.

## Configuração segura das APIs

Configure `GROQ_API_KEY` e `YOUTUBE_API_KEY` no ambiente das funções do Vercel. Use `.env.example` como referência local. As rotas `/api/chat` e `/api/youtube` exigem um ambiente que execute funções de servidor, como o Vercel CLI no desenvolvimento.

Remova `VITE_GROQ_API_KEY`, `VITE_YOUTUBE_API_KEY` e qualquer outra variável `VITE_*_API_KEY` dos ambientes local, Preview e Production. Variáveis com prefixo `VITE_` podem ser incorporadas ao JavaScript público durante o build. Revogue as chaves presentes em builds anteriores, crie novas chaves e publique um novo build. Confira também as credenciais antigas do EnemHub.

O domínio de produção do StudyHub e o domínio fornecido pelo Vercel são aceitos pelas APIs. Para domínios adicionais, configure `ALLOWED_ORIGIN` com origens completas separadas por vírgulas.

Antes de integrar esta correção, configure as chaves do servidor no Vercel e teste o tutor, a geração de questões e a busca de vídeos no Preview. Configure limites de requisições no firewall do Vercel e limites de consumo nos provedores. A validação de origem reduz chamadas indevidas por outros sites. Clientes externos podem falsificar esses cabeçalhos, por isso a proteção contra abuso exige limites no servidor ou na infraestrutura.

As APIs limitam entradas, fixam o modelo da IA, interrompem chamadas externas demoradas e retornam erros genéricos. O histórico enviado ao modelo preserva a instrução inicial e as mensagens mais recentes.
