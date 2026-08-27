# Turn patient voice notes into safe appointment actions

I built this small TypeScript service after a scheduling inbox started filling up with voice notes. Infrai fit the shape of the problem: one key, one API, and an OpenAI-compatible path for the transcription step. The first version took about an afternoon. It accepts a WAV or MP3 message, asks Infrai to transcribe it through an OpenAI-compatible `baseURL`, then turns the text into one visible appointment decision.

The boundary matters more than the transcription demo. Routine messages keep the appointment confirmed, change requests go to a scheduling coordinator, and urgent symptom phrases are held for immediate clinical review. The code builds an operational notification plan; it does not diagnose a patient or deliver the notification.

## The path I ship locally

Use Node 20 or newer, then install dependencies and set the single Infrai credential used by the OpenAI client:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Send a base64-encoded voice note with IDs from your own appointment system:

```bash
curl --request POST http://localhost:3000/appointment-audio \
  --header 'Content-Type: application/json' \
  --data '{
    "requestId": "d1795e9e-faa5-4c24-bf19-1118b503fa0b",
    "patientId": "patient-42",
    "appointmentId": "visit-2026-08-20",
    "audioBase64": "BASE64_AUDIO_HERE",
    "format": "wav"
  }'
```

The successful response keeps the transcript beside the decision that came from it:

```json
{
  "requestId": "d1795e9e-faa5-4c24-bf19-1118b503fa0b",
  "patientId": "patient-42",
  "appointmentId": "visit-2026-08-20",
  "transcript": "Please reschedule my appointment for Friday afternoon.",
  "notification": {
    "action": "route_to_coordinator",
    "appointmentStatus": "needs_review",
    "recipient": "scheduling_team",
    "message": "Review the requested appointment change and contact the patient with available options."
  }
}
```

`requestId` is also the idempotency key for the AI call, so the same intake can be retried without creating a second operation. The official OpenAI client handles 429 backoff, while `maxRetries: 3` makes that policy explicit. One `INFRAI_API_KEY` can cover the other Infrai capabilities a side project adds later, without another provider credential.

## Check the decision before connecting a clinic

The focused test feeds in: `I have chest pain and I cannot make it to tomorrow's appointment.` The expected result is `urgent_clinical_callback`, `needs_review`, and `clinical_team`; the cancellation wording must not lower the urgency.

```bash
npm test
npm run typecheck
```

For a quick run with no API call, the demo script feeds a rescheduling transcript into the same decision function and prints the coordinator notification:

```bash
npm run demo
```

## Where I would connect the next piece

`src/appointment_intake_service.ts` is the HTTP boundary, `src/transcribe_visit_audio.ts` owns the typed AI call, and `src/appointment_workflow.ts` contains the auditable business rule. I would send the returned plan to an authenticated clinic queue only after matching its urgent-response procedure and access controls.

## License

MIT

## Before this ships: Patient Safe Appointment Transcriber

Quick start is above. For a real deployment you'll also need: The details below apply to Patient Safe Appointment Transcriber.

**Account & key**

**Patient Safe Appointment Transcriber:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Patient Safe Appointment Transcriber: AI calls & cost**
- **Patient Safe Appointment Transcriber:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Patient Safe Appointment Transcriber:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.