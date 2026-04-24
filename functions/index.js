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

  // Esegui solo quando la partita passa a conclusa
  if (prima.conclusa || !dopo.conclusa) return;

  const db = getFirestore();
  const messaging = getMessaging();

  // Trova il vincitore
  const { calcTotals } = require("./calcTotals");
  const totals = calcTotals(dopo.players, dopo.mani || []);
  const scores = totals.map(t => t.total);
  const maxScore = Math.max(...scores);
  const winnerIdx = scores.indexOf(maxScore);
  const winnerName = dopo.players[winnerIdx]?.name || "Qualcuno";

  // Manda notifica a tutti i giocatori tranne chi ha concluso (createdBy)
  const uids = dopo.uids || [];
  for (const uid of uids) {
    if (uid === dopo.createdBy) continue; // chi ha registrato l'ultima mano la riceve già
    const userSnap = await db.collection("users").doc(uid).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) continue;

    const isWinner = dopo.players.findIndex(p => p.uid === uid) === winnerIdx;

    await messaging.send({
      token: fcmToken,
      notification: {
        title: isWinner ? "🏆 Hai vinto!" : "😔 Hai perso",
        body: isWinner
          ? `Complimenti! Hai battuto ${dopo.players.filter(p => p.uid !== uid).map(p => p.name).join(", ")}!`
          : `${winnerName} ha vinto la partita.`,
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