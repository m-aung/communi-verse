
'use server';
/**
 * @fileOverview A Genkit flow to generate a "vibe check" tagline for a chat room.
 *
 * - getRoomVibe - A function that calls the Genkit flow to generate a room vibe.
 * - RoomVibeInput - The input type for the flow.
 * - RoomVibeOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RoomVibeInputSchema = z.object({
  roomName: z.string().describe('The name of the chat room.'),
});
export type RoomVibeInput = z.infer<typeof RoomVibeInputSchema>;

const RoomVibeOutputSchema = z.object({
  vibe: z.string().describe('A short, fun, and trendy "vibe check" or tagline for the room.'),
});
export type RoomVibeOutput = z.infer<typeof RoomVibeOutputSchema>;

export async function getRoomVibe(input: RoomVibeInput): Promise<RoomVibeOutput> {
  return roomVibeFlow(input);
}

const roomVibePrompt = ai.definePrompt({
  name: 'roomVibePrompt',
  input: { schema: RoomVibeInputSchema },
  output: { schema: RoomVibeOutputSchema },
  prompt: `You are a super chill and trendy AI that helps set the vibe for online chat rooms.
You are an expert at crafting short, catchy taglines that resonate with Gen Z.
For the chat room named '{{{roomName}}}', generate a very short (5-10 words max), fun, and catchy 'vibe check' or tagline.
Keep it light, positive, and engaging. Use emojis sparingly if they fit the vibe.

Examples:
- Room Name: Cosmic Cafe -> Vibe: 🌠 Zero-gravity chill zone. Sip, chat, float.
- Room Name: Coding Corner -> Vibe: 💻 Bugs, bytes, & breakthroughs!
- Room Name: Study Squad -> Vibe: 📚 Grind time! Let's ace this.
- Room Name: Gamer's Nexus -> Vibe: 🎮 Level up your chat game.
- Room Name: Art Alley -> Vibe: 🎨 Unleash your inner creative.

Room Name: {{{roomName}}}
`,
});

const roomVibeFlow = ai.defineFlow(
  {
    name: 'roomVibeFlow',
    inputSchema: RoomVibeInputSchema,
    outputSchema: RoomVibeOutputSchema,
  },
  async (input) => {
    const { output } = await roomVibePrompt(input);
    if (!output) {
        // Fallback in case the model doesn't return structured output as expected
        return { vibe: "Just vibin' ✨" };
    }
    return output;
  }
);
    