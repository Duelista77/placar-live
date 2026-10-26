
/*
 * PLACAR DA LIVE — MESSI VS CRISTIANO RONALDO
 * Rosa = Messi +1 ponto
 * Rosa branca = Cristiano Ronaldo +1 ponto
 */

window.CONFIG = {

  /* TITULO */
  title: "QUEM VOCÊ PREFERE?",

  /* TIMES */
  teams: [
    {
      id: 1,
      name: "MESSI",
      color: "#35B8F4",
      initials: "MES",
      badge: ""
    },
    {
      id: 2,
      name: "CRISTIANO RONALDO",
      color: "#FFFFFF",
      initials: "CR7",
      badge: ""
    },
  ],

  /* PONTUACAO AUTOMATICA POR PRESENTE */
  mode: "gift",
  choiceExpiryMinutes: 0,

  /* PRESENTES */
  gifts: {
    "rose": {
      points: 1,
      team: 1,
      effect: "pulse"
    },

    "white rose": {
      points: 1,
      team: 2,
      effect: "pulse"
    },
  },

  /* IGNORAR PRESENTES NAO CONFIGURADOS */
  unknownGift: "ignore",
  unknownGiftPoints: 1,
  diamondRate: 1,

  /* APARENCIA */
  sortByScore: true,
  showBars: true,
  showSender: true,
  scale: 1,

  /* PERMISSAO PARA ZERAR O PLACAR */
  owners: [],

  /* CONEXAO COM TIKFINITY */
  tikfinityUrl: "ws://localhost:21213/",

  /* NAO ZERAR AO ATUALIZAR A FONTE */
  resetOnLoad: false,
};
