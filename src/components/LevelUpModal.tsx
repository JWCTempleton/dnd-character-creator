// src/components/LevelUpModal.tsx
import React from "react";

interface LevelUpModalProps {
  hitDie: number;
  conModifier: number;
  onConfirm: (hpRoll: number) => void;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  hitDie,
  conModifier,
  onConfirm,
  onClose,
}) => {
  // Simulate rolling the hit die
  const hpRoll = Math.floor(Math.random() * hitDie) + 1;
  const totalGain = hpRoll + conModifier;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md relative text-center">
        <h2 className="text-3xl font-bold mb-4 text-amber-300">Level Up!</h2>
        <p className="text-slate-300 mb-6">You are now Level 2!</p>

        <div className="bg-slate-700 p-6 rounded-lg">
          <p className="text-lg">
            You rolled a{" "}
            <strong className="text-2xl text-white">{hpRoll}</strong> on your d
            {hitDie}.
          </p>
          <p className="text-lg">
            With your Constitution modifier of{" "}
            <strong className="text-2xl text-white">
              {conModifier > 0 ? `+${conModifier}` : conModifier}
            </strong>
            ,
          </p>
          <p className="mt-4 text-xl">Your Hit Points increase by:</p>
          <p className="text-6xl font-bold text-sky-400 my-2">{totalGain}</p>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(hpRoll)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
