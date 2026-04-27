const { setGlobalOptions } = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({ maxInstances: 10 });

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
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) continue;

    const isWinner = winnerUids.includes(uid);

    let body = '';
    if (isSquadre) {
      body = isWinner
        ? `La tua squadra ha vinto! Complimenti!`
        : `${winnerName} ha vinto la partita.`;
    } else {
      body = isWinner
        ? `Complimenti! Hai battuto ${dopo.players.filter(p => p.uid !== uid).map(p => p.name).join(", ")}!`
        : `${winnerName} ha vinto la partita.`;
    }

    await messaging.send({
      token: fcmToken,
      notification: {
        title: isWinner ? "🏆 Hai vinto!" : "😔 Hai perso",
        body,
      },
      android: {
        notification: {
          channelId: isWinner ? "vittoria" : "sconfitta",
          icon: "ic_stat_notify",
        }
      }
    });
  }
});