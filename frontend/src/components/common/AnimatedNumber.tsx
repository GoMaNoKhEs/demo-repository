import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

/**
 * Composant pour animer les nombres avec un effet de compteur
 * Utilise Framer Motion useSpring pour une animation fluide
 */
export const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1000,
}: AnimatedNumberProps) => {
  // Créer un spring animé pour le nombre
  const spring = useSpring(value, {
    duration,
    bounce: 0,
  });

  // Transformer le spring en nombre formaté
  const display = useTransform(spring, (current) =>
    decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString()
  );

  // Mettre à jour le spring quand la valeur change
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};
