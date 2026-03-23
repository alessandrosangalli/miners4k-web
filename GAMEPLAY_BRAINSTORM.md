# 🧠 Brainstorm: Melhorias de Mecânica e Comportamento — Miners4k Improved

> Baseado na conversão do código original em Java para Web/TypeScript e no estado atual do projeto.
> Data: 2026-03-22

---

## ⛏️ 1. Comportamento dos Mineradores

### 1.1 Inteligência de Navegação
- **Pathfinding Básico**: Atualmente os mineradores andam aleatoriamente e só mudam de direção ao bater em paredes. Podemos dar preferência para eles se moverem em direção ao ouro mais próximo.
- **Seguir Escavações do Jogador**: Quando o jogador abre um túnel com o mouse, os mineradores poderiam "sentir" o caminho aberto e priorizá-lo.
- **Memória de Caminho**: Mineradores que já encontraram ouro antes poderiam lembrar o caminho e voltar por ali mais rápido.

### 1.2 Escalada e Movimento Vertical
- **Escalar Paredes**: No jogo atual, os mineradores pulam para subir. Podemos adicionar um comportamento de "escalada lenta" em paredes verticais, onde eles sobem pixel a pixel agarrados na parede.
- **Cordas/Escadas Automáticas**: Mineradores poderiam construir cordas ao descer em poços profundos, facilitando a subida de outros mineradores depois.
- **Queda com Dano Gradual**: Em vez de morte instantânea acima de 100 pixels de queda, implementar dano progressivo — quedas médias deixam o minerador mais lento por um tempo.

### 1.3 Interação entre Mineradores
- **Trabalho em Equipe**: Dois mineradores no mesmo bloco de rocha poderiam minerar mais rápido juntos.
- **Resgate**: Um minerador saudável poderia "carregar" um minerador ferido de volta à base.
- **Formação de Fila**: Quando há um gargalo (túnel estreito), os mineradores poderiam formar fila ordenada em vez de empilhar.

---

## 💎 2. Sistema de Ouro e Recursos

### 2.1 Tipos de Ouro
- **Pepitas Pequenas** (1 ponto): O ouro atual, abundante e perto da superfície.
- **Veios de Ouro** (3 pontos): Formações maiores e mais profundas, com uma cor dourada mais brilhante.
- **Diamantes** (10 pontos): Raríssimos, cor azul ciano, só aparecem nas camadas mais profundas.
- **Ouro Encapsulado**: Blocos de ouro cercados por rocha dura que exigem mais trabalho para extrair.

### 2.2 Economia e Entrega
- **Multiplicador de Combo**: Entregas rápidas (dentro de X segundos) ganham bônus de pontos.
- **Carroças/Trilhas de Mineração**: O jogador poderia colocar trilhos que automatizam o transporte de ouro entre a mina e a base.
- **Capacidade de Carga**: Mineradores mais experientes (que já entregaram X ouro) poderiam carregar 2 pepitas de uma vez.

---

## 🎮 3. Ferramentas e Poderes do Jogador

### 3.1 Ferramentas de Mineração (Mouse)
- **Picareta Básica** (clique esquerdo): O que temos hoje — remove 1 pixel por clique.
- **Dinamite** (clique direito): Explosão controlada que abre um buraco grande, mas pode matar mineradores próximos.
- **Suporte de Madeira**: Coloca uma viga de madeira que impede desabamentos e cria plataformas para os mineradores andarem.
- **Tocha**: Coloca uma fonte de luz fixa no mapa, iluminando permanentemente uma área.

### 3.2 Construção
- **Pontes**: O jogador pode desenhar pontes sobre buracos para os mineradores atravessarem.
- **Escadas**: Desenhar escadas em paredes verticais para os mineradores subirem.
- **Barreiras Anti-Slime**: Muros especiais que bloqueiam a propagação do slime.

### 3.3 Gestão de Trabalho
- **Bandeiras/Waypoints**: O jogador coloca bandeiras no mapa e os mineradores se dirigem até elas.
- **Zonas de Proibição**: Marcar áreas perigosas (próximas ao slime) onde os mineradores não devem entrar.
- **Sino de Retirada**: Um botão que faz todos os mineradores largarem o que estão fazendo e voltarem para a base.

---

## 🦠 4. Inimigos e Perigos

### 4.1 Slime (Atual)
- **Slime Mais Inteligente**: Em vez de se espalhar aleatoriamente, o slime poderia seguir mineradores próximos.
- **Velocidade Variável**: Slime mais rápido em níveis avançados.
- **Slime Ácido**: Um tipo especial que corrói a rocha ao redor, criando cavernas perigosas.

### 4.2 Novos Perigos
- **Desabamentos**: Grandes escavações sem suporte poderiam causar desabamentos que soterram mineradores.
- **Inundação**: Bolsões de água subterrânea que, quando perfurados, soltam água que enche os túneis.
- **Gás Tóxico**: Bolsões de gás que explodem se um minerador com tocha passar por cima.
- **Morcegos**: Criaturas que assustam os mineradores e os fazem correr na direção oposta.

---

## 📊 5. Progressão e Meta-jogo

### 5.1 Upgrade de Mineradores
- **Velocidade**: Mineradores ficam mais rápidos a cada nível.
- **Resistência**: Sobrevivem a quedas maiores.
- **Capacidade**: Carregam mais ouro.
- **Visão**: Iluminam uma área maior ao redor deles.

### 5.2 Sistema de Níveis
- **Mapas Temáticos**: Gelo (mineradores escorregam), Lava (áreas letais), Caverna de Cristal (cristais refletem luz).
- **Objetivos Secundários**: "Encontre o artefato escondido", "Salve todos os mineradores", "Complete em menos de X segundos".
- **Boss Levels**: Um nível especial onde um grande slime cresce rápido e você precisa coletar ouro enquanto foge dele.

### 5.3 Placar e Replay
- **Replay do Nível**: Assistir um replay acelerado da rodada com os caminhos dos mineradores.
- **Estatísticas**: Distância total cavada, mineradores perdidos, tempo médio de entrega, etc.
- **High-Score Local**: Persistir os melhores scores por nível.

---

## 🎨 6. Feedback Visual e Sensorial

### 6.1 Animações
- **Partículas de Mineração**: Pedrinhas voando quando o jogador ou minerador cava.
- **Rastro de Pegadas**: Mineradores deixam rastros sutis por onde passam.
- **Brilho do Ouro**: Pepitas de ouro pulsam com um brilho suave para serem mais visíveis.
- **Expressões Faciais**: Mineradores com rostos tristes quando feridos, felizes quando carregando ouro.

### 6.2 Câmera
- **Auto-follow**: Opção de a câmera seguir automaticamente o minerador mais próximo do ouro.
- **Zoom**: Permitir zoom in/out com scroll do mouse.
- **Shake**: Tremor de tela sutil quando uma explosão acontece.

---

## 🏆 7. Priorização (Sugestão)

| Prioridade | Ideia | Impacto | Esforço |
|:---:|---|:---:|:---:|
| 🔴 Alta | Pathfinding básico (ir em direção ao ouro) | ⭐⭐⭐⭐⭐ | Médio |
| 🔴 Alta | Tipos de ouro (pepita, veio, diamante) | ⭐⭐⭐⭐ | Baixo |
| 🔴 Alta | Brilho pulsante do ouro | ⭐⭐⭐ | Baixo |
| 🟡 Média | Dinamite (clique direito) | ⭐⭐⭐⭐ | Baixo |
| 🟡 Média | Tochas fixas no mapa | ⭐⭐⭐ | Baixo |
| 🟡 Média | Desabamentos | ⭐⭐⭐⭐ | Médio |
| 🟡 Média | Screen shake em explosões | ⭐⭐⭐ | Baixo |
| 🟢 Baixa | Waypoints/bandeiras | ⭐⭐⭐⭐ | Médio |
| 🟢 Baixa | Sistema de upgrades | ⭐⭐⭐⭐ | Alto |
| 🟢 Baixa | Mapas temáticos | ⭐⭐⭐⭐⭐ | Alto |
| 🟢 Baixa | Replay | ⭐⭐⭐ | Alto |

---

> **Nota**: As ideias marcadas como **Alta Prioridade** são as que mais impactam a jogabilidade com o menor esforço de implementação. Recomendo começar por elas!
