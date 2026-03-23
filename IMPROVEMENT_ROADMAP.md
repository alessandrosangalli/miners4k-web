# Miners4k Improvement Roadmap

> **Projeto**: Miners4k: Unearthed
> **Autor Original**: Markus "Notch" Persson (2005)  
> **Refatoração e Modernização**: Alessandro Sangalli
> **Data de Início**: 22 de Março de 2026  
> **Versão do Documento**: 1.0

---

## Sumário Executivo

Este documento descreve o plano completo de modernização do jogo Miners4k, transformando-o de uma demonstração técnica de 4KB em um jogo polido e envolvente. O plano está dividido em **5 fases**, cada uma construindo sobre a anterior, ordenadas pela combinação de **impacto para o jogador** e **dependência técnica**.

| Fase | Nome | Prioridade | Itens |
|------|------|-----------|-------|
| **1** | **Infraestrutura & QoL ✅** | - | Pause, Minimapa, Barra de Progresso, Menu Principal |
| **2** | **Feedback Visual** | 🟠 Alta | Sistema de Partículas, Iluminação Subterrânea, Parallax (Céu) |
| **3** | **Áudio** | 🟡 Média-Alta | Engine de Áudio, Efeitos Sonoros, Música de Fundo |
| **4** | **Gameplay Expandido** | 🟢 Média | Tipos de Minerador, Diamantes, Zoom, Design de Rodada |
| **5** | **Avançado** | 🔵 Baixa | Save/Load, Editor de Níveis |

---

## Fase 1 — Infraestrutura e Quality of Life ✅
> **Objetivo**: Estabelecer a base para todas as melhorias futuras e resolver as frustrações mais básicas do jogador.  
> **Status**: **CONCLUÍDO** (22/03/2026)

### 1.1 Sistema de Pause
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Ao pressionar a tecla `P`, o jogo congela completamente: nenhuma lógica de minerador executa, o slime para de se espalhar e o cronômetro é pausado. Uma overlay semi-transparente escura com o texto "PAUSED" aparece sobre a tela. Pressionar `P` novamente retoma o jogo instantaneamente. |
| **Justificativa** | É o recurso de QoL mais básico que qualquer jogo precisa. Sem ele, o jogador não pode atender uma ligação ou pensar numa estratégia sem perder tempo. |
| **Arquivos Afetados** | `Game.ts` |
| **Estimativa** | ~30 minutos |
| **Critério de Aceite** | (1) Pressionar P pausa o jogo. (2) O cronômetro congela durante a pausa. (3) Nenhuma entidade se move. (4) Overlay visual aparece. (5) Pressionar P novamente retoma. |

### 1.2 Minimapa
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Um retângulo semi-transparente no canto superior direito da tela (aprox. 160x120px) que mostra uma visualização compacta de todo o mapa do nível. Cada pixel do minimapa representa um bloco de NxN pixels do mundo real. Pontos coloridos representam: mineradores vivos (azul), mineradores com ouro (amarelo), ouro no chão (amarelo fraco) e slime (verde). Um retângulo branco semi-transparente indica a posição atual da câmera. |
| **Justificativa** | O jogador perde tempo rolando a câmera para encontrar mineradores e ouro. O minimapa fornece visão estratégica instantânea, transformando a experiência de frustração em planejamento. |
| **Arquivos Afetados** | `Renderer.ts` (novo método `renderMinimap`), `Game.ts` (passar dados) |
| **Estimativa** | ~1-2 horas |
| **Critério de Aceite** | (1) Minimapa visível no canto superior direito. (2) Mostra terreno, ouro e mineradores. (3) Retângulo da câmera visível. (4) Atualiza em tempo real. (5) Não impacta performance (>30 FPS). |

### 1.3 Barra de Progresso de Ouro
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Uma barra horizontal na parte inferior da tela que mostra visualmente a proporção `ouro coletado / objetivo`. A barra preenche da esquerda para a direita com um gradiente dourado. Ao atingir 75%, ela pulsa suavemente para indicar que o jogador está perto da vitória. |
| **Justificativa** | Substituir o texto "Gold: 45 / 100" por uma representação visual é muito mais intuitivo e satisfatório. |
| **Arquivos Afetados** | `Renderer.ts` ou `Game.ts` (no método `render`) |
| **Estimativa** | ~30 minutos |
| **Critério de Aceite** | (1) Barra visível. (2) Preenche proporcionalmente. (3) Cor muda ao atingir 75%. (4) Não obstrui a gameplay. |

### 1.4 Menu Principal
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Ao iniciar o jogo, exibir uma tela de título com o nome "Miners4k" em fonte grande, um subtítulo "Modernized Edition" e as opções: `[Enter] Start Game` e `[Esc] Quit`. O fundo mostra uma versão estática e decorativa de um nível gerado. |
| **Justificativa** | A primeira impressão define a percepção de qualidade. Um menu, por mais simples que seja, transmite profissionalismo. |
| **Arquivos Afetados** | `Game.ts` (novo estado `MENU` na máquina de estados) |
| **Estimativa** | ~1 hora |
| **Critério de Aceite** | (1) Menu aparece ao iniciar. (2) Enter inicia o jogo. (3) Esc sai. (4) Fundo decorativo visível. |

### 1.5 Botões de Pausa e Reinício de Fase (Mobile)
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Adicionar botões visíveis na interface do jogo (especialmente no HUD mobile) para **Pausar** e **Reiniciar** o nível atual. No desktop, `P` já pausa, mas no mobile o jogador não tem teclado. O botão de pausa deve abrir uma overlay com opções: **"Continuar"** e **"Reiniciar Fase"**. O reinício deve recarregar o mesmo nível sem voltar ao menu principal. |
| **Justificativa** | Sem esses botões, jogadores mobile ficam sem saída se quiserem pausar ou tentar o nível de novo. É uma das primeiras coisas que qualquer jogador mobile vai procurar. |
| **Arquivos Afetados** | `index.html` (botões no HUD), `style.css` (overlay de pausa), `Game.ts` (lógica de pausa e restart) |
| **Estimativa** | ~1 hora |
| **Critério de Aceite** | (1) Botão de pausa visível no HUD (ícone ⏸️). (2) Ao pausar, overlay aparece com "Continuar" e "Reiniciar". (3) "Continuar" retoma de onde parou. (4) "Reiniciar" recarrega o nível atual do zero. (5) Funciona no mobile sem teclado. |

---

## Fase 2 — Feedback Visual e Atmosfera ✅
> **Objetivo**: Fazer o jogo "sentir-se vivo" com efeitos visuais que respondem às ações do jogador.  
> **Status**: **CONCLUÍDO** (22/03/2026)

### 2.1 Sistema de Partículas
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Implementar uma classe `ParticleSystem` que gerencia partículas efêmeras. Cada partícula tem: posição (x, y), velocidade (vx, vy), cor, tempo de vida e gravidade. Eventos que geram partículas: (1) **Cavar**: 5-10 partículas marrons ejetadas na direção oposta. (2) **Coletar ouro**: 8-12 partículas douradas brilhantes. (3) **Morte por queda**: Respingo vermelho. (4) **Explosão de slime**: 20-30 partículas verdes em todas as direções. |
| **Justificativa** | Partículas são o "segredo" para fazer qualquer jogo parecer 10x mais polido. São baratas de processar e transformam feedback. |
| **Arquivos Afetados** | Novo: `ParticleSystem.ts`, `Particle.ts`. Alterados: `Game.ts`, `Renderer.ts` |
| **Estimativa** | ~2-3 horas |
| **Critério de Aceite** | (1) Partículas visíveis ao cavar. (2) Partículas douradas ao coletar ouro. (3) Partículas respeitam gravidade. (4) Desaparecem após tempo de vida. (5) Sem impacto notável em FPS. |

### 2.2 Iluminação Subterrânea
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | O mundo subterrâneo escurece gradualmente conforme a profundidade. Mineradores emitem um raio de "luz" suave (raio ~30px) que revela a área ao redor deles com brilho total. A superfície tem brilho de 100%, e a parte mais profunda do mapa tem brilho de ~20%. A fórmula: `brightness = max(0.2, 1.0 - depth / maxDepth * 0.8)`. Próximo a mineradores, o brilho é interpolado para 100%. |
| **Justificativa** | Cria tensão e atmosfera. O jogador sente que está descendo para o desconhecido, e os mineradores se tornam "faróis" visuais. |
| **Arquivos Afetados** | `Renderer.ts` (aplicar multiplicador de brilho ao blitar pixels) |
| **Estimativa** | ~2-3 horas |
| **Critério de Aceite** | (1) Superfície com brilho normal. (2) Profundidade escurece. (3) Área ao redor de mineradores iluminada. (4) Transição suave, sem bordas duras. |

### 2.3 Parallax Background (Céu)
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | A área "vazia" acima do terreno (que atualmente é preta) é substituída por um gradiente de céu azul-claro para azul-escuro. Nuvens brancas semi-transparentes se movem lentamente da direita para a esquerda a 50% da velocidade da câmera (parallax). Estrelas cintilantes aparecem na parte mais alta. |
| **Justificativa** | A região superior do mapa é a primeira coisa que o jogador vê. Transformá-la de "preto vazio" para um céu vivo muda completamente a primeira impressão. |
| **Arquivos Afetados** | `Renderer.ts` (renderizar antes do blit do terreno) |
| **Estimativa** | ~1-2 horas |
| **Critério de Aceite** | (1) Céu gradiente visível. (2) Nuvens se movem com parallax. (3) Não renderiza sobre terreno sólido. |

---

## Fase 3 — Áudio
> **Objetivo**: Adicionar a dimensão sonora ao jogo, que é responsável por ~50% da percepção sensorial.  
> **Prioridade**: 🟡 Média-Alta — Som transforma a experiência, mas o jogo funciona sem ele.

### 3.1 Engine de Áudio
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Criar uma classe `AudioEngine` usando a `Web Audio API` (ou objetos `Audio` do HTML5). Deve suportar: (1) Tocar efeitos sonoros (fire-and-forget), com capacidade de múltiplos sons simultâneos. (2) Tocar música de fundo em loop. (3) Controle de volume master. Os arquivos de áudio serão `.mp3` ou `.wav` para efeitos e produzidos via síntese ou `.mp3` para música. |
| **Justificativa** | É a base técnica necessária para todos os itens de áudio abaixo. |
| **Arquivos Afetados** | Novo: `AudioEngine.ts`. Novo diretório: `assets/sounds/` |
| **Estimativa** | ~2 horas |
| **Critério de Aceite** | (1) Reproduz arquivos WAV. (2) Suporta sons simultâneos. (3) Volume ajustável. (4) Sem crashes ao tocar muitos sons. |

### 3.2 Efeitos Sonoros
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Efeitos sonoros para cada ação principal. Os sons podem ser gerados proceduralmente (via síntese de onda) para manter o espírito minimalista do jogo original. Lista de sons: `dig.wav` (curto, terroso), `gold_pickup.wav` (tilintante, agudo), `gold_deposit.wav` (satisfatório, "cha-ching"), `explosion.wav` (grave, retumbante), `miner_death.wav` (curto, sutil), `level_win.wav` (fanfarra curta), `level_fail.wav` (trombeta triste). |
| **Justificativa** | Cada ação do jogador precisa de confirmação sonora. Sem som, o jogo sente-se "mudo" e desconectado. |
| **Arquivos Afetados** | `AudioEngine.ts`, `Game.ts` (triggers), `assets/sounds/` |
| **Estimativa** | ~2-3 horas (incluindo criação dos sons) |
| **Critério de Aceite** | (1) Cada ação listada produz um som. (2) Sons não se cortam. (3) Volume proporcional à distância (opcional). |

### 3.3 Música de Fundo
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Uma trilha sonora chiptune/8-bit que toca em loop durante a gameplay. Idealmente, a música pode ser gerada proceduralmente via síntese de onda (square wave, triangle wave), ou carregada de um arquivo. A música deve ser calma na superfície e ganhar intensidade conforme a câmera desce. |
| **Justificativa** | Música é o que une toda a experiência sensorial. Mesmo uma trilha simples eleva enormemente a percepção de qualidade. |
| **Arquivos Afetados** | `AudioEngine.ts`, `Game.ts` |
| **Estimativa** | ~3-4 horas |
| **Critério de Aceite** | (1) Música toca durante o jogo. (2) Loop sem cortes. (3) Pode ser silenciada com tecla M. |

---

## Fase 4 — Gameplay Expandido
> **Objetivo**: Adicionar profundidade mecânica que incentive o jogador a jogar novamente.  
> **Prioridade**: 🟢 Média — Estas são as features que transformam o jogo de "demonstração" em "produto".

### 4.1 Tipos de Minerador
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Introduzir especializações de mineradores. Cada tipo tem uma cor de roupa diferente e uma habilidade única. O jogador pode "promover" mineradores clicando neles (custo: 1 ouro). Tipos: **Engenheiro** (verde, constrói escadas em paredes íngremes), **Demolidor** (vermelho, destrói rochas ao encostar). |
| **Justificativa** | Adiciona uma camada estratégica: o jogador precisa decidir quando e onde investir seus recursos. |
| **Arquivos Afetados** | `Miner.ts` (novos atributos), `Game.ts` (lógica), `Renderer.ts` (cores) |
| **Estimativa** | ~4-5 horas |
| **Critério de Aceite** | (1) Dois tipos novos funcionais. (2) Habilidades distintas. (3) Promoção via clique. (4) Ícones/cores diferenciados. |

### 4.2 Diamantes e Recursos Raros
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Adicionar diamantes (cor ciano brilhante) que valem 10x o valor do ouro. Aparecem apenas em profundidades extremas (últimos 20% do mapa) e em quantidades muito pequenas (2-5 por nível). Os diamantes são visualmente distintos: brilham com uma animação de cintilação. |
| **Justificativa** | Cria um incentivo para explorar as áreas mais perigosas do mapa, adicionando risk/reward. |
| **Arquivos Afetados** | `World.ts` (geração), `Game.ts` (coleta e pontuação), `Renderer.ts` (cintilação) |
| **Estimativa** | ~2-3 horas |
| **Critério de Aceite** | (1) Diamantes aparecem no fundo. (2) Valem 10x. (3) Cintilam visualmente. (4) São coletáveis. |

### 4.3 Zoom In/Out
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Usar a roda do mouse para controlar o nível de zoom. O zoom altera dinamicamente quantos pixels do mundo são mostrados na tela, efetivamente mudando o `VIEW_WIDTH` e `VIEW_HEIGHT` usados no blit. Zoom mínimo: 1x (atual). Zoom máximo: 0.5x (mostra o dobro de mundo). |
| **Justificativa** | Permite ao jogador alternar entre visão estratégica (zoom out) e visão tática (zoom in). |
| **Arquivos Afetados** | `Renderer.ts`, `Game.ts`, `InputHandler.ts` (roda do mouse) |
| **Estimativa** | ~3-4 horas |

### 4.4 Design da Rodada e Relógio
| Atributo | Detalhe |
| :--- | :--- |
| **Pânico Visual** | O relógio brilha em vermelho nos últimos 30 segundos. |
| **Alarme Sonoro** | Som de batimento cardíaco ou tique-taque acelerado nos últimos 10s. |

### 4.5 Curva de Dificuldade Automática
| Atributo | Detalhe |
| :--- | :--- |
| **Escala de Ouro** | A quantidade de ouro necessária aumenta 15% por nível. |
| **Densidade de Rochas** | Aumenta a chance de spawn de rochas indestrutíveis em níveis profundos. |
| **Pressão de Slime** | Aumenta a velocidade de propagação do slime em níveis avançados. |

---

## Fase 5 — Funcionalidades Avançadas
> **Objetivo**: Features premium que dão longevidade ao jogo.  
> **Prioridade**: 🔵 Baixa — "Nice to have", mas transformam o jogo em um produto completo.

### 5.1 Save/Load
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Salvar o estado completo do jogo (array de pixels do mundo, posição/estado de todos os mineradores, score, nível atual, tempo restante) usando `localStorage` ou `IndexedDB` do navegador, com opção de exportar um `.json`. Tecla `F5` salva, `F9` carrega (sem recarregar a página, usando `preventDefault`). |
| **Arquivos Afetados** | Novo: `SaveManager.ts`. Alterados: `Game.ts`, `World.ts`, `Miner.ts` (serialização) |
| **Estimativa** | ~3-4 horas |

### 5.2 Editor de Níveis
| Atributo | Detalhe |
|----------|---------|
| **Descrição** | Um modo especial acessível pelo menu principal onde o jogador pode pintar terreno, colocar ouro, rochas e slime livremente, definir o tamanho do mapa e os objetivos, e salvar o nível como arquivo. Usa as mesmas ferramentas de mouse já existentes (clique para colocar, clique direito para remover) com uma paleta de tipos de terreno. |
| **Arquivos Afetados** | Novo: `LevelEditor.ts`. Alterados: `Game.ts` (estado `EDITOR`), `World.ts` (carregar de arquivo) |
| **Estimativa** | ~5-8 horas |

---

## Apêndice A — Estrutura de Arquivos Projetada

```text
miners4k-web/
├── src/
│   ├── Game.ts                # Engine principal e loop de jogo
│   ├── World.ts               # Geração e simulação do mundo
│   ├── Miner.ts               # Entidade minerador
│   ├── Renderer.ts            # Pipeline de renderização
│   ├── InputHandler.ts        # Processamento de input
│   ├── ParticleSystem.ts      # [Fase 2] Sistema de partículas
│   ├── Particle.ts            # [Fase 2] Partícula individual
│   ├── AudioEngine.ts         # [Fase 3] Motor de áudio
│   ├── SaveManager.ts         # [Fase 5] Save/Load
│   └── LevelEditor.ts         # [Fase 5] Editor de níveis
├── public/
│   └── assets/
│       └── sounds/            # [Fase 3] Arquivos de áudio
├── index.html                 # Ponto de entrada Web
├── package.json               # Dependências do projeto (Vite, TypeScript etc.)
├── tsconfig.json              # Configurações TypeScript
├── vite.config.ts             # Configurações de build Vite
├── README.md                  # Documentação do projeto
├── TECHNICAL_ANALYSIS.md      # Análise técnica do código original
└── _agent/workflows/
    └── build-run.md           # Workflow de build e execução
```

## Apêndice B — Convenções de Código

| Convenção | Regra |
|-----------|-------|
| **Nomes de Classes / Interfaces** | PascalCase (`ParticleSystem`, `IMiner`) |
| **Nomes de Variáveis / Métodos** | camelCase (`handleGoldInteraction`) |
| **Constantes** | UPPER_SNAKE_CASE (`COLOR_GOLD_CHUNK`) |
| **Comentários** | JSDoc/TSDoc para métodos públicos; inline para lógica complexa |
| **Cores** | Modulo de constantes ou `constants.ts` |
| **Modularização** | Trabalhar com ES Modules (`import`/`export`) |
