import admin from "../config/firebase_config.js";
import { getMessaging } from "firebase-admin/messaging";

export default async function fcmSend(notification, registrationTokens) {
  if (registrationTokens.length === 0) {
    console.log("Empty token");
    return;
  }
  let message = {
    notification: notification,
    android: {
      notification: {
        clickAction: "transaction",
        sound: "default",
      },
    },
    tokens: registrationTokens,
    data: {
      ...notification,
      icon: "",
    },
  };

  const messaging = getMessaging();
  messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}
