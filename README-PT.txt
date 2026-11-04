ROSSANO AVENTURA FICHIS — PACOTE MULTIJOGADOR COM SALAS E IDIOMAS

O QUE ESTA PASTA CONTÉM
- index.html: jogo com ligação WebSocket, jogadores visíveis, chat e blocos partilhados.
- server.js: servidor HTTP + WebSocket com várias salas separadas.
- package.json: dependência do servidor.
- INICIAR_SERVIDOR_WINDOWS.bat: arranque no Windows.
- world-data.json: criado automaticamente para guardar blocos de cada sala.

IDIOMAS
No menu MULTIJOGADOR podes escolher Português, English ou Español. Nesta versão, a tradução cobre o painel de ligação, sala, estado e chat. O restante jogo continua maioritariamente em português; a tradução integral dos menus, missões e itens é uma etapa separada.

SALAS E LIMITES
- Cada sala tem o seu próprio conjunto de jogadores e alterações de blocos.
- Por configuração inicial: até 50 jogadores por sala e até 500 ligações por instância do servidor.
- Os jogadores podem escrever o mesmo nome de sala (por exemplo, aldeia-1) para se encontrarem. Para jogar noutro grupo, escolhem outro nome (por exemplo, aldeia-2).
- Os limites podem ser ajustados no alojamento com MAX_PLAYERS_PER_ROOM e MAX_TOTAL_PLAYERS. Aumentar os números não aumenta automaticamente a capacidade física do servidor.
- Não é correto prometer 1 milhão de jogadores numa única máquina ou num alojamento gratuito. Um milhão de utilizadores exige várias instâncias/servidores, balanceador, sistema de pub/sub partilhado (por exemplo Redis), base de dados, monitorização, proteção contra abuso e testes de carga profissionais. Esta pasta ainda não implementa essa infraestrutura distribuída.

TESTE NO TEU COMPUTADOR
1. Instala Node.js LTS a partir de https://nodejs.org/ (se ainda não estiver instalado).
2. Extrai esta pasta para uma localização normal, por exemplo Documentos.
3. Faz duplo clique em INICIAR_SERVIDOR_WINDOWS.bat.
4. Na primeira execução, o npm descarrega a biblioteca ws. É necessária ligação à internet apenas para esta instalação.
5. Quando o terminal disser que o servidor está ativo, abre http://localhost:3000 no navegador.
6. No menu do jogo, abre MULTIJOGADOR, escolhe o idioma e o nome da sala. Para testar no mesmo computador, o endereço ws://localhost:3000 funciona.

TESTAR NA MESMA REDE WI-FI
- O outro computador/telemóvel precisa de estar na mesma rede Wi-Fi.
- No computador servidor, descobre o endereço IPv4 local com o comando ipconfig.
- No outro dispositivo, abre http://IP-DO-COMPUTADOR:3000 e liga ao mesmo servidor, usando exatamente o mesmo nome de sala.
- Se o Windows Firewall perguntar, permite Node.js apenas em redes privadas e apenas se reconheces a tua rede. Não desligues o firewall nem o antivírus.

PUBLICAR NA INTERNET
- O Netlify aloja páginas estáticas; não executa este servidor Node.js.
- Publica esta pasta como um serviço Node.js num alojamento que suporte WebSocket, usando `npm install` como instalação e `npm start` como arranque.
- Usa a URL HTTPS/WSS fornecida pelo alojamento. Todos os jogadores devem usar o mesmo endereço WSS e o mesmo nome de sala.
- O plano gratuito pode suspender serviços ou ter limites baixos de CPU/memória/rede. Não anuncies capacidade para centenas de pessoas sem testes e um plano de alojamento adequado.

O QUE ESTA VERSÃO SINCRONIZA
- Jogadores e posições aproximadas dentro da mesma sala.
- Chat simples dentro da mesma sala.
- Colocação/remoção de blocos dentro da mesma sala, guardados no ficheiro world-data.json.
- Inventários, vida, fichis, animais, guardiões, missões e progresso individual continuam locais a cada jogador.
- O mundo gerado naturalmente deve ser compatível entre jogadores; o servidor sincroniza alterações de blocos, não transmite todo o terreno.

SEGURANÇA E ESTADO DOS TESTES
- Não desativa nem contorna o Windows Defender, SmartScreen ou Firewall.
- Esta versão não tem contas, autenticação, moderação, ferramentas de denúncia nem proteção completa contra batota. Faz testes com pessoas conhecidas antes de abrir publicamente.
- A sintaxe JavaScript foi verificada. A dependência `ws` não está instalada neste ambiente e não foi possível fazer um teste real de ligações simultâneas. Testa primeiro com dois dispositivos.
