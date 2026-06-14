import * as admin from "firebase-admin";

admin.initializeApp();

export { sendScheduledJobAlerts } from "./jobAlerts";