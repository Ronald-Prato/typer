"use client";

import { motion } from "framer-motion";
import { Text } from "../Typography";

interface Metrics {
  errors: number;
  timeMs: number;
  accuracy?: number;
  wpm?: number;
}

interface GameMetricsProps {
  phraseMetrics?: Metrics;
  wordsMetrics?: Metrics;
  lettersAndSymbolsMetrics?: Metrics;
  holdsMetrics?: Metrics;
  className?: string;
}

const formatTime = (timeMs: number) => {
  const seconds = timeMs / 1000;
  return `${seconds.toFixed(1)}s`;
};

const formatWPM = (wpm?: number) => {
  if (!wpm) return "N/A";
  return `${Math.round(wpm)}`;
};

const formatAccuracy = (accuracy?: number) => {
  if (!accuracy) return "N/A";
  return `${Math.round(accuracy)}%`;
};

export const GameMetrics = ({
  phraseMetrics,
  wordsMetrics,
  lettersAndSymbolsMetrics,
  holdsMetrics,
  className = "",
}: GameMetricsProps) => {
  const steps = [
    {
      name: "Frase",
      metrics: phraseMetrics,
      icon: "📝",
    },
    {
      name: "Palabras",
      metrics: wordsMetrics,
      icon: "🔤",
    },
    {
      name: "Caracteres",
      metrics: lettersAndSymbolsMetrics,
      icon: "⌨️",
    },
    {
      name: "Holds",
      metrics: holdsMetrics,
      icon: "🎯",
    },
  ];

  const allMetrics = [
    phraseMetrics,
    wordsMetrics,
    lettersAndSymbolsMetrics,
    holdsMetrics,
  ].filter(Boolean);
  const totalTime = allMetrics.reduce((sum, m) => sum + (m?.timeMs || 0), 0);
  const totalErrors = allMetrics.reduce((sum, m) => sum + (m?.errors || 0), 0);
  const avgAccuracy =
    allMetrics.length > 0
      ? Math.round(
          allMetrics.reduce((sum, m) => sum + (m?.accuracy || 0), 0) /
            allMetrics.length
        )
      : 0;
  const avgWPM =
    allMetrics.length > 0
      ? Math.round(
          allMetrics.reduce((sum, m) => sum + (m?.wpm || 0), 0) /
            allMetrics.length
        )
      : 0;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <Text variant="h5" className="text-center text-white font-medium">
          Estadísticas
        </Text>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex justify-between text-xs text-white border-b border-gray-700 pb-2 bg-gradient-to-r from-red-500 to-orange-500 rounded px-3 py-2">
          <Text variant="caption" className="font-semibold">
            Tiempo: {formatTime(totalTime)}
          </Text>
          <Text variant="caption" className="font-semibold">
            Errores: {totalErrors}
          </Text>
          <Text variant="caption" className="font-semibold">
            Precisión: {formatAccuracy(avgAccuracy)}
          </Text>
          <Text variant="caption" className="font-semibold">
            WPM: {formatWPM(avgWPM)}
          </Text>
        </div>
      </motion.div>

      {/* Individual Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">{step.icon}</span>
              <Text variant="caption" className="text-gray-300">
                {step.name}
              </Text>
            </div>

            {step.metrics ? (
              <div className="flex items-center space-x-4 text-gray-400">
                <span>{formatTime(step.metrics.timeMs)}</span>
                <span>{step.metrics.errors} err</span>
                <span>{formatAccuracy(step.metrics.accuracy)}</span>
                <span>{formatWPM(step.metrics.wpm)} wpm</span>
              </div>
            ) : (
              <Text variant="caption" className="text-gray-600">
                No completado
              </Text>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
