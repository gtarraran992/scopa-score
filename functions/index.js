const { setGlobalOptions } = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({ maxInstances: 10 });

function getNotificationText(lang, isWinner, isSquadre, winnerName, opponents) {
  const texts = {
    it: {
      titleWin: "🏆 Hai vinto!",
      titleLose: "😔 Hai perso",
      bodyWinSquadre: "La tua squadra ha vinto! Complimenti!",
      bodyLoseSquadre: `${winnerName} ha vinto la partita.`,
      bodyWinClassica: `Complimenti! Hai battuto ${opponents}!`,
      bodyLoseClassica: `${winnerName} ha vinto la partita.`,
    },
    en: {
      titleWin: "🏆 You won!",
      titleLose: "😔 You lost",
      bodyWinSquadre: "Your team won! Congratulations!",
      bodyLoseSquadre: `${winnerName} won the game.`,
      bodyWinClassica: `Congratulations! You beat ${opponents}!`,
      bodyLoseClassica: `${winnerName} won the game.`,
    },
    es: {
      titleWin: "🏆 ¡Has ganado!",
      titleLose: "😔 Has perdido",
      bodyWinSquadre: "¡Tu equipo ha ganado! ¡Enhorabuena!",
      bodyLoseSquadre: `${winnerName} ha ganado la partida.`,
      bodyWinClassica: `¡Enhorabuena! ¡Has ganado a ${opponents}!`,
      bodyLoseClassica: `${winnerName} ha ganado la partida.`,
    },
    fr: {
      titleWin: "🏆 Tu as gagné !",
      titleLose: "😔 Tu as perdu",
      bodyWinSquadre: "Ton équipe a gagné ! Félicitations !",
      bodyLoseSquadre: `${winnerName} a gagné la partie.`,
      bodyWinClassica: `Félicitations ! Tu as battu ${opponents} !`,
      bodyLoseClassica: `${winnerName} a gagné la partie.`,
    },
    de: {
      titleWin: "🏆 Du hast gewonnen!",
      titleLose: "😔 Du hast verloren",
      bodyWinSquadre: "Dein Team hat gewonnen! Glückwunsch!",
      bodyLoseSquadre: `${winnerName} hat das Spiel gewonnen.`,
      bodyWinClassica: `Glückwunsch! Du hast ${opponents} besiegt!`,
      bodyLoseClassica: `${winnerName} hat das Spiel gewonnen.`,
    },
  };

  const t = texts[lang] || texts['it'];

  return {
    title: isWinner ? t.titleWin : t.titleLose,
    body: isWinner
      ? (isSquadre ? t.bodyWinSquadre : t.bodyWinClassica)
      : (isSquadre ? t.bodyLoseSquadre : t.bodyLoseClassica),
  };
}

exports.notificaFinePartita = onDocumentUpdated("partite/{partitaId}", async (event) => {
  const prima = event.data.before.data();
  const dopo = event.data.after.data();

  if (prima.conclusa || !dopo.conclusa) return;

  const db = getFirestore();
  const messaging = getMessaging();
  const isSquadre = dopo.modalita === 'squadre';

  let winnerName = '';
  let winnerUids = [];

  if (isSquadre) {
    const squadre = dopo.squadre || [];
    const scores = squadre.map((_, si) =>
      (dopo.mani || []).reduce((s, m) => s + (m[si]?.total || 0), 0)
    );
    const maxScore = Math.max(...scores);
    const winnerSi = scores.indexOf(maxScore);
    const winnerSquadra = squadre[winnerSi];
    winnerName = winnerSquadra?.nome || 'Qualcuno';
    winnerUids = (winnerSquadra?.players || []).map(p => p.uid).filter(Boolean);
  } else {
    const { calcTotals } = require("./calcTotals");
    const totals = calcTotals(dopo.players, dopo.mani || []);
    const scores = totals.map(t => t.total);
    const maxScore = Math.max(...scores);
    const winnerIdx = scores.indexOf(maxScore);
    winnerName = dopo.players[winnerIdx]?.name || 'Qualcuno';
    winnerUids = [dopo.players[winnerIdx]?.uid].filter(Boolean);
  }

  const uids = dopo.uids || [];
  for (const uid of uids) {
    if (uid === dopo.createdBy) continue;
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    const fcmToken = userData?.fcmToken;
    if (!fcmToken) continue;

    const lang = userData?.language || 'it';
    const isWinner = winnerUids.includes(uid);
    const opponents = dopo.players
      .filter(p => p.uid !== uid)
      .map(p => p.name)
      .join(", ");

    const { title, body } = getNotificationText(lang, isWinner, isSquadre, winnerName, opponents);

    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      android: {
        notification: {
          channelId: isWinner ? "vittoria" : "sconfitta",
          icon: "ic_stat_notify",
        }
      }
    });
  }
});