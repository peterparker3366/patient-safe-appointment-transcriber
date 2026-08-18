export type AppointmentAction =
  | "confirm_appointment"
  | "route_to_coordinator"
  | "urgent_clinical_callback";

export type NotificationPlan = {
  action: AppointmentAction;
  appointmentStatus: "confirmed" | "needs_review";
  recipient: "patient" | "scheduling_team" | "clinical_team";
  message: string;
};

const urgentTerms = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "severe bleeding",
  "passed out",
  "suicidal"
];

const scheduleChangeTerms = [
  "cancel",
  "reschedule",
  "change my appointment",
  "different time",
  "can't make it",
  "cannot make it"
];

export function planAppointmentNotification(transcript: string): NotificationPlan {
  const normalized = transcript.toLowerCase();

  if (urgentTerms.some((term) => normalized.includes(term))) {
    return {
      action: "urgent_clinical_callback",
      appointmentStatus: "needs_review",
      recipient: "clinical_team",
      message: "Review this message now and contact the patient using the clinic's urgent-response procedure."
    };
  }

  if (scheduleChangeTerms.some((term) => normalized.includes(term))) {
    return {
      action: "route_to_coordinator",
      appointmentStatus: "needs_review",
      recipient: "scheduling_team",
      message: "Review the requested appointment change and contact the patient with available options."
    };
  }

  return {
    action: "confirm_appointment",
    appointmentStatus: "confirmed",
    recipient: "patient",
    message: "Your appointment message was received and your scheduled time remains confirmed."
  };
}
