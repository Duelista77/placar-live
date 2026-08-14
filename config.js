/*
 * ============================================================
 *  ARQUIVO DE CONFIGURACAO — e o unico que voce precisa editar
 * ============================================================
 *
 * Regras pra nao quebrar nada:
 *   - so mude o que esta DEPOIS dos dois pontos
 *   - texto sempre entre "aspas"
 *   - numero nunca leva aspas
 *   - toda linha termina com virgula
 *   - depois de salvar, atualize a fonte no TikTok LIVE Studio
 *     (botao direito na fonte > Atualizar)
 */

window.CONFIG = {

  /* ---------- 1. TITULO NO TOPO DO PLACAR ---------- */
  // Deixe "" (vazio) se nao quiser titulo nenhum.
  title: "COPA DA LIVE",

  /* ---------- 2. OS 6 TIMES ---------- */
  // id      -> numero que o espectador digita no chat (nao repita)
  // name    -> nome que aparece na tela
  // color   -> cor da barra, em codigo hexadecimal (#RRGGBB)
  // initials-> 1 a 3 letras do escudo desenhado
  // badge   -> OPCIONAL. Caminho de uma imagem de escudo,
  //            ex: "times/flamengo.png". Se preencher, ela
  //            substitui as iniciais.
  teams: [
    { id: 1, name: "Time 1", color: "#e2342f", initials: "T1", badge: "" },
    { id: 2, name: "Time 2", color: "#1f6fd0", initials: "T2", badge: "" },
    { id: 3, name: "Time 3", color: "#1f9d55", initials: "T3", badge: "" },
    { id: 4, name: "Time 4", color: "#e8a317", initials: "T4", badge: "" },
    { id: 5, name: "Time 5", color: "#7c4dcc", initials: "T5", badge: "" },
    { id: 6, name: "Time 6", color: "#d94f9c", initials: "T6", badge: "" },
  ],

  /* ---------- 3. COMO O ESPECTADOR ESCOLHE O TIME ---------- */
  // "chat"     -> ele digita 1, 2, 3... (ou !1, time 3, o nome do time)
  //               no chat e DEPOIS manda o presente. O presente conta
  //               pro time que ele escolheu.
  // "gift"     -> cada presente pertence a um time fixo. Quem manda
  //               Rosa soma no Time 1, quem manda Sorvete soma no
  //               Time 2, e assim por diante (definido no item 4).
  // "both"     -> se o presente tem time proprio, vale o do presente.
  //               Se nao tem, vale o time que a pessoa escolheu no chat.
  mode: "chat",

  // Quanto tempo (em minutos) a escolha do espectador continua valendo
  // depois que ele digita no chat. 0 = vale a live inteira.
  choiceExpiryMinutes: 0,

  /* ---------- 4. TABELA DE PONTOS DOS PRESENTES ---------- */
  //
  //  "nome do presente": { points: X, team: Y, effect: "Z" }
  //
  //  points -> quantos pontos aquele presente vale
  //  team   -> OPCIONAL. So use no modo "gift" ou "both".
  //            E o numero (id) do time dono desse presente.
  //            Deixe 0 pra dizer "esse presente nao tem dono".
  //  effect -> animacao disparada na tela. Opcoes prontas:
  //            "pulse" (leve), "shake" (medio), "flash" (forte),
  //            "" (nenhuma)
  //
  //  O nome tem que ser IGUAL ao que a TikTok usa, mas nao importa
  //  maiusculo/minusculo. Se errar o nome, cai na regra do item 5.
  gifts: {
    "rose":         { points: 5,  team: 0, effect: "pulse" },
    "gg":           { points: 5,  team: 0, effect: "pulse" },
    "ice cream":    { points: 10, team: 0, effect: "pulse" },
    "finger heart": { points: 10, team: 0, effect: "shake" },
    "hand hearts":  { points: 20, team: 0, effect: "shake" },
    "sunglasses":   { points: 20, team: 0, effect: "shake" },
    "galaxy":       { points: 50, team: 0, effect: "flash" },
    "universe":     { points: 50, team: 0, effect: "flash" },
  },

  /* ---------- 5. PRESENTE QUE NAO ESTA NA TABELA ACIMA ---------- */
  // "ignore"  -> nao pontua nada
  // "default" -> vale sempre a quantidade de unknownGiftPoints
  // "diamond" -> vale o proprio valor do presente em moedas,
  //              multiplicado por diamondRate (recomendado: e justo
  //              e nunca deixa presente novo de fora)
  unknownGift: "diamond",
  unknownGiftPoints: 1,
  diamondRate: 1,

  /* ---------- 6. APARENCIA ---------- */
  // sortByScore -> true reordena os times, quem lidera sobe pro topo
  sortByScore: true,
  // showBars    -> true desenha a barra de progresso atras do nome
  showBars: true,
  // showSender  -> true mostra "fulano +50" por 3 segundos a cada presente
  showSender: true,
  // scale       -> tamanho geral. 1 = padrao. 1.3 = 30% maior.
  scale: 1,

  /* ---------- 7. QUEM PODE ZERAR O PLACAR PELO CHAT ---------- */
  // Digite o @ do dono da live (sem o @). Quem estiver nesta lista
  // pode escrever  !zerar  no chat e o placar volta pra zero.
  owners: [],

  /* ---------- 8. AVANCADO ---------- */
  // Endereco do TikFinity na sua propria maquina. So mude se voce
  // trocou a porta dentro do TikFinity.
  tikfinityUrl: "ws://localhost:21213/",
  // true = placar zera toda vez que a fonte recarrega.
  // Deixe false. E o que impede de perder o placar no meio da live.
  resetOnLoad: false,
};
