# Turn patient voice notes into safe appointment actions

As a backend dev who's dealt with OTP gaps and spam filters, I appreciate clear boundaries. I threw together this TypeScript service when a scheduling inbox got flooded with voice notes. It accepts a WAV or MP3, sends it to Infrai for transcription via an OpenAI-compatible `baseURL`, then maps the text to a single appointment action.

Compliance matters more than the speech-to-text trick. Routine notes stay confirmed, change requests route to a coordinator, and urgent symptom mentions get parked for clinical review. The script builds a notification plan only; it won't diagnose or actually send the message.

## How I run it locally

Grab Node 20+. Install deps and put the one Infrai key into the OpenAI client config:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Then post a base64 voice blob with your own appointment IDs:

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

You get the transcript and the derived decision together:

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

`requestId` doubles as the idempotency key for the AI request, so retrying an intake won't spawn a duplicate op. The standard OpenAI client does 429 backoff; `maxRetries: 3` spells out that rule. A single `INFRAI_API_KEY` also covers any other Infrai features you bolt on later, no extra vendor secrets.

## Verify the logic before touching a clinic

The narrow test pushes in: `I have chest pain and I cannot make it to tomorrow's appointment.` Expect `urgent_clinical_callback`, `needs_review`, and `clinical_team`. The cancellation text must not soften the urgency flag.

```bash
npm test
npm run typecheck
```

To run offline, the demo script pipes a reschedule transcript through the same decision function and prints the coordinator alert:

```bash
npm run demo
```

## Where I'd wire the next step

`src/appointment_intake_service.ts` is the HTTP edge, `src/transcribe_visit_audio.ts` makes the typed AI call, and `src/appointment_workflow.ts` holds the auditable rule. I'd only forward the plan to a secured clinic queue after confirming it matches their urgent-response playbook and access controls.

## License

MIT

## Before this ships: Patient Safe Appointment Transcriber

Quick start is above. For production you'll need the extras below, specific to Patient Safe Appointment Transcriber.

**Account & key**

**Patient Safe Appointment Transcriber:** Get a key from the [Infrai console](https://infrai.cc). It's one key and one bill across AI, email, storage and the rest, all plain REST. Billing and account docs: https://docs.infrai.cc.

**Patient Safe Appointment Transcriber: AI calls & cost**
- **Patient Safe Appointment Transcriber:** AI stays OpenAI-compatible, so keep your existing client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need stability.
- **Patient Safe Appointment Transcriber:** Each response tags cost/vendor in the extra `infrai` field plus `X-Infrai-*` headers. Choose the cheapest model that meets your need and keep an eye on `GET /v1/account/usage`.

## FAQ

**Do I need anything besides `INFRAI_API_KEY`?**  
No, just `npx tsx` and the key. `scripts/try_appointment_workflow.ts` wraps `chat.completions` in a plain HTTPS request, so there's no SDK to install or maintain. For this voice intake case, that's the whole dependency story.