type ConfettiModule = typeof import("canvas-confetti");
type ConfettiFn = ConfettiModule["default"];
type ConfettiOptions = Parameters<ConfettiFn>[0];

let loader: Promise<ConfettiFn> | null = null;

export function launchConfetti(options?: ConfettiOptions) {
  if (typeof window === "undefined") return;

  if (!loader) {
    loader = import("canvas-confetti").then((module) => module.default);
  }

  loader
    .then((confetti) => {
      confetti({
        spread: 70,
        particleCount: 240,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
        ...options,
      });
    })
    .catch((error) => {
      console.error("Failed to load confetti", error);
    });
}
