import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const Timer = () => {
  const { state } = useGame();
  const [timeLeft, setTimeLeft] = useState(state.timer);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  useEffect(() => {
    setTimeLeft(state.timer);
  }, [state.timer]);

  return (
    <div className="timer">
      Temps restant: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </div>
  );
};

export default Timer;