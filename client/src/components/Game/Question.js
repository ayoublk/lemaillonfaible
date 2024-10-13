import React from 'react';

const Question = ({ question, onAnswer, isCurrentPlayer }) => {
  if (!question) return null;

  return (
    <div>
      <h3>{question.question}</h3>
      {isCurrentPlayer && (
        <div>
          {question.reponses.map((reponse, index) => (
            <button key={index} onClick={() => onAnswer(index)}>
              {reponse}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Question;