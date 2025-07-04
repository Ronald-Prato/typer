import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export const useBotMatch = () => {
  const currentGame = useQuery(api.game.getGameData);
  const setStepDoneBot = useMutation(api.game.setStepDoneBot);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(0);

  const steps = ["phrase", "words", "lettersAndSymbols", "holds"];
  const stepDelays = [10000, 12000, 8000, 18000]; // Tiempos específicos para cada step

  useEffect(() => {
    // Verificar si es un match contra bot
    if (!currentGame?.game?.againstBot) {
      return;
    }

    // Encontrar el bot en los players
    const botPlayer = currentGame.game.players.find((playerId) => {
      return (
        playerId === currentGame.opponent?._id &&
        currentGame.opponent?.authId === "imabot"
      );
    });

    if (!botPlayer) {
      return;
    }

    // Verificar si el bot ya completó todos los steps
    const botProgress = currentGame.game.progress?.[botPlayer];
    if (
      botProgress?.phraseDone &&
      botProgress?.wordsDone &&
      botProgress?.lettersAndSymbolsDone &&
      botProgress?.holdsDone
    ) {
      return;
    }

    // Función para enviar el siguiente step del bot
    const sendBotStep = async () => {
      const currentStep = steps[currentStepRef.current];

      if (!currentStep) {
        return;
      }

      // Generar métricas aleatorias para el bot
      const timeMs = Math.floor(Math.random() * 5000) + 3000; // 3-8 segundos
      const errors = Math.floor(Math.random() * 3); // 0-2 errores
      const accuracy = Math.max(85, 100 - errors * 5); // 85-100% precisión
      const wpm = Math.floor(Math.random() * 20) + 30; // 30-50 WPM

      try {
        await setStepDoneBot({
          step: currentStep as any,
          metrics: {
            timeMs,
            errors,
            accuracy,
            wpm,
          },
        });

        console.log(`🤖 Bot completed step: ${currentStep}`);
        currentStepRef.current++;

        // Si completó todos los steps, limpiar el timeout
        if (currentStepRef.current >= steps.length) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }

        // Programar el siguiente step con su tiempo específico
        const nextDelay = stepDelays[currentStepRef.current];
        timeoutRef.current = setTimeout(sendBotStep, nextDelay);
      } catch (error) {
        console.error("Error sending bot step:", error);
      }
    };

    // Iniciar el primer step con su tiempo específico
    const firstDelay = stepDelays[currentStepRef.current];
    timeoutRef.current = setTimeout(sendBotStep, firstDelay);

    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    currentGame?.game?.againstBot,
    currentGame?.game?.progress,
    setStepDoneBot,
  ]);

  return {
    isBotMatch: !!currentGame?.game?.againstBot,
    botProgress: currentGame?.opponent?._id
      ? currentGame?.game?.progress?.[currentGame.opponent._id]
      : undefined,
  };
};
