import confetti from "canvas-confetti";

type ConfettiOptions = Parameters<typeof confetti>[0];

export function launchConfetti(options?: ConfettiOptions) {
  if (typeof window === "undefined") return;

  try {
    confetti({
      spread: 70,
      particleCount: 240,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
      ...options,
    });
  } catch (error) {
    console.error("Failed to launch confetti", error);
  }
}
