# All We Core — site institucional

Site estático (HTML, CSS e JavaScript puro), sem etapa de build.

## Estrutura

```
index.html        página única
css/style.css     estilos (tema escuro, verde #C6FF00)
js/nav.js         menu: hover das letras, barra fixa, botão "Fale com a gente"
js/hero.js        animação da teia + rede de partículas do topo
js/services.js    roda 3D de serviços controlada pela rolagem
js/ui.js          botão voltar ao topo, pausa de animações fora da tela
assets/           logo, fotos de serviços, equipe e clientes
vercel.json       cache e cabeçalhos de segurança
```

## Rodar localmente

Qualquer servidor estático serve. Com Python:

```bash
python -m http.server 8000
```

Depois abra http://localhost:8000.

## Publicar

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel, clique em **Add New → Project**, importe o repositório e mantenha
   **Framework Preset: Other** (sem comando de build, diretório raiz `/`).
3. A cada `git push` na branch principal a Vercel publica automaticamente.
