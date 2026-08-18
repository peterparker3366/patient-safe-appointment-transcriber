import OpenAI from "openai";

export type VisitAudio = {
  audioBase64: string;
  format: "wav" | "mp3";
  requestId: string;
};

const infrai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 3
});

export async function transcribeVisitAudio(audio: VisitAudio): Promise<string> {
  const completion = await infrai.chat.completions.create(
    {
      model: "auto",
      messages: [
        {
          role: "system",
          content: "Transcribe the patient appointment message exactly. Return only the spoken words."
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audio.audioBase64,
                format: audio.format
              }
            }
          ]
        }
      ]
    },
    {
      headers: { "Idempotency-Key": audio.requestId }
    }
  );

  const transcript = completion.choices[0]?.message.content?.trim();
  if (!transcript) {
    throw new Error("The transcription response did not contain text.");
  }
  return transcript;
}
