# Mask Studio

Gerador de composições no estilo da identidade Softplan: uma foto revelada através de
uma grade de furos **softpoint** (dois cantos opostos arredondados em 30%), com o
recorte da pessoa tendo a própria grade — é assim que ela escapa dos furos sem parecer
um PNG colado por cima.


## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

## Deploy na Vercel

O projeto é um Vite + React padrão, detectado automaticamente:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Basta importar o repositório na Vercel — nenhuma variável de ambiente é necessária,
já que tudo roda no browser e nada é enviado para servidor nenhum.

## Como usar a ferramenta

**1. Foto dentro dos furos** — a imagem que aparece recortada pela grade.
Zoom e posição ajustam o enquadramento dentro do quadro inteiro, não célula a célula.

**2. Recorte por cima** — um PNG sem fundo da mesma pessoa, no mesmo enquadramento.
Esta camada é o que faz a figura ultrapassar os limites dos furos.

Acima do palco há três modos:

| Modo | O que o clique faz |
| --- | --- |
| Furos da foto | abre e fecha os furos da grade de fundo |
| Furos do recorte | escolhe por onde a pessoa aparece; o resto dela é cortado |
| Mover texto | arrasta os blocos de texto pelo quadro |

Atalhos sobre o palco:

- **shift+clique** percorre as formas do furo — softpoint, softpoint invertido,
  arredondado, quadrado — e termina no vazio, apagando o furo.
- **alt+clique** joga o furo para a frente da pessoa, sobrepondo o recorte. É o que
  cria o entrelaçamento entre grade e figura.

Células vizinhas selecionadas se fundem num bloco só: o canto só arredonda quando é
borda externa da seleção, então a figura nunca fica furada por dentro.

## Exportação

- **PNG** em 1×, 2× ou 3× da resolução do quadro.
- **SVG** com as camadas separadas (`mb` fundo, `me` recorte, `mf` frente) e as imagens
  embutidas em base64. Os furos saem como `path` de verdade, sem rasterização.

## Estrutura

```
src/MaskStudio.jsx   componente único, sem dependências além do React
src/main.jsx         ponto de entrada
standalone/          versão HTML autocontida, sem build — abre direto no browser
```

O CSS vai dentro do componente, prefixado com `.ms`, então ele pode ser colado em
qualquer projeto sem configuração. Para plugar no design system, sobrescreva as
variáveis no bloco `.ms { --ink … --accent … }`.

## Referência de forma

O furo softpoint segue o `path` da marca: retângulo com os cantos superior-esquerdo e
inferior-direito curvados em 275,14 sobre 914,8 de altura — 30,1%, que é o padrão do
slider "Curva do canto".
