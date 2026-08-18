import express from "express";
import { z } from "zod";
import { planAppointmentNotification } from "./appointment_workflow.js";
import { transcribeVisitAudio } from "./transcribe_visit_audio.js";

const intakeBody = z.object({
  requestId: z.string().uuid(),
  patientId: z.string().min(1).max(100),
  appointmentId: z.string().min(1).max(100),
  audioBase64: z.string().min(1),
  format: z.enum(["wav", "mp3"])
});

export const app = express();
app.use(express.json({ limit: "12mb" }));

app.post("/appointment-audio", async (request, response) => {
  const parsed = intakeBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: "invalid_request",
      details: parsed.error.flatten()
    });
    return;
  }

  try {
    const transcript = await transcribeVisitAudio({
      audioBase64: parsed.data.audioBase64,
      format: parsed.data.format,
      requestId: parsed.data.requestId
    });
    const notification = planAppointmentNotification(transcript);
    response.status(200).json({
      requestId: parsed.data.requestId,
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      transcript,
      notification
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audio processing failed.";
    response.status(502).json({ error: "transcription_failed", message });
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Appointment intake listening on http://localhost:${port}`);
  });
}
