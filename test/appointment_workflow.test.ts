import assert from "node:assert/strict";
import test from "node:test";
import { planAppointmentNotification } from "../src/appointment_workflow.js";

test("an urgent symptom mention is held for clinical review", () => {
  const result = planAppointmentNotification(
    "I have chest pain and I cannot make it to tomorrow's appointment."
  );

  assert.deepEqual(result, {
    action: "urgent_clinical_callback",
    appointmentStatus: "needs_review",
    recipient: "clinical_team",
    message: "Review this message now and contact the patient using the clinic's urgent-response procedure."
  });
});

test("a scheduling request goes to a coordinator", () => {
  const result = planAppointmentNotification("Please reschedule my appointment for a different time.");
  assert.equal(result.action, "route_to_coordinator");
  assert.equal(result.appointmentStatus, "needs_review");
});
