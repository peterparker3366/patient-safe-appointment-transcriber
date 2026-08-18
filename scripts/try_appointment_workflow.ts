import { planAppointmentNotification } from "../src/appointment_workflow.js";

const transcript = "I need to reschedule my appointment for a different time.";
console.log(JSON.stringify({ transcript, notification: planAppointmentNotification(transcript) }, null, 2));
