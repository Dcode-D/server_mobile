import admin from "../config/firebase_config.js";
import { getMessaging } from "firebase-admin/messaging";

export default async function fcmSend(data, registrationTokens) {
  if (registrationTokens.length === 0) {
    console.log("Empty token");
    return;
  }
  let message = {
    data: data,
    token: registrationTokens,
  };

  await admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}
