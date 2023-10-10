import * as admin from "firebase-admin";
import * as serviceAccount from "../e-wallet-1fc69-firebase-adminsdk-frg2w-b76441266c.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
