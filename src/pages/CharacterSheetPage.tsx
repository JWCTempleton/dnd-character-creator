// src/pages/CharacterSheetPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import apiClient from "../services/apiClient";
import {
  fetchApiDetails,
  type RaceDetails,
  type ClassDetails,
} from "../services/dndApi";
import { type Ability, ABILITIES } from "../lib/helpers";

interface CharacterData {
  name: string;
  race: string;
  characterClass: string;
  stats: Record<Ability, number>;
}

const CharacterSheetPage = () => {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [raceDetails, setRaceDetails] = useState<RaceDetails | null>(null);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch our saved character data
        const { data: savedChar } = await apiClient.get(`/characters/${id}`);
        setCharacter(savedChar);

        // 2. Use that data to fetch details from D&D API
        const [raceData, classData] = await Promise.all([
          fetchApiDetails<RaceDetails>(`/api/races/${savedChar.race}`),
          fetchApiDetails<ClassDetails>(
            `/api/classes/${savedChar.characterClass}`
          ),
        ]);

        setRaceDetails(raceData);
        setClassDetails(classData);
      } catch (err) {
        setError("Failed to load character data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="text-center text-white">Loading Character Sheet...</div>
    );
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!character || !raceDetails || !classDetails)
    return (
      <div className="text-center text-white">
        Character data could not be loaded.
      </div>
    );

  return (
    <div>
      <RouterLink
        to="/"
        className="text-sky-400 hover:underline mb-6 inline-block"
      >
        ← Back to Dashboard
      </RouterLink>
      <div className="bg-slate-800 rounded-lg p-6">
        <h1 className="text-5xl font-bold text-amber-300">{character.name}</h1>
        <h2 className="text-3xl capitalize text-slate-300 mt-1">
          {raceDetails.name} {classDetails.name}
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {/* Stats Column */}
          <div className="md:col-span-1 bg-slate-700 p-4 rounded">
            <h3 className="text-2xl font-bold mb-4 text-sky-400">
              Ability Scores
            </h3>
            <ul className="space-y-3">
              {ABILITIES.map((ability) => (
                <li key={ability} className="flex justify-between items-center">
                  <span className="capitalize text-lg">{ability}</span>
                  <span className="font-mono text-2xl bg-slate-900 px-3 py-1 rounded">
                    {character.stats[ability]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 bg-slate-700 p-4 rounded space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-sky-400">Racial Traits</h3>
              <p>
                <strong className="text-slate-300">Speed:</strong>{" "}
                {raceDetails.speed} ft.
              </p>
              <p>
                <strong className="text-slate-300">Size:</strong>{" "}
                {raceDetails.size_description}
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-sky-400">
                Class Features
              </h3>
              <p>
                <strong className="text-slate-300">Hit Die:</strong> d
                {classDetails.hit_die}
              </p>
              <div>
                <strong className="text-slate-300">Proficiencies:</strong>
                <ul className="list-disc list-inside ml-4">
                  {classDetails.proficiencies.map((p) => (
                    <li key={p.index}>{p.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetPage;
