// frontend/src/pages/CharacterSheetPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import apiClient from "../services/apiClient";
import {
  fetchApiDetails,
  type RaceDetails,
  type ClassDetails,
  type ApiListItem,
} from "../services/dndApi";
import { type Ability, ABILITIES } from "../lib/helpers";

// Interface for our saved character data from the backend
interface CharacterData {
  _id: string;
  name: string;
  race: string;
  characterClass: string;
  stats: Record<Ability, number>;
  proficiencies: string[];
  spells: string[];
}

const CharacterSheetPage = () => {
  const { id } = useParams<{ id: string }>();

  // State for all our different data sources
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [raceDetails, setRaceDetails] = useState<RaceDetails | null>(null);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [proficiencyDetails, setProficiencyDetails] = useState<ApiListItem[]>(
    []
  );
  const [spellDetails, setSpellDetails] = useState<ApiListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch our saved character data from our backend
        const { data: savedChar } = await apiClient.get<CharacterData>(
          `/characters/${id}`
        );
        setCharacter(savedChar);

        // 2. Fetch the primary details for race and class in parallel
        const [raceData, classData] = await Promise.all([
          fetchApiDetails<RaceDetails>(`/api/races/${savedChar.race}`),
          fetchApiDetails<ClassDetails>(
            `/api/classes/${savedChar.characterClass}`
          ),
        ]);
        setRaceDetails(raceData);
        setClassDetails(classData);

        // 3. Fetch the details for each selected proficiency and spell in parallel
        const proficiencyPromises = savedChar.proficiencies.map((profIndex) =>
          fetchApiDetails<ApiListItem>(`/api/proficiencies/${profIndex}`)
        );
        const spellPromises = savedChar.spells.map((spellIndex) =>
          fetchApiDetails<ApiListItem>(`/api/spells/${spellIndex}`)
        );

        const [resolvedProficiencies, resolvedSpells] = await Promise.all([
          Promise.all(proficiencyPromises),
          Promise.all(spellPromises),
        ]);

        // Filter out any nulls from failed fetches and set state
        setProficiencyDetails(
          resolvedProficiencies.filter((p): p is ApiListItem => p !== null)
        );
        setSpellDetails(
          resolvedSpells.filter((s): s is ApiListItem => s !== null)
        );
      } catch (err) {
        setError(
          "Failed to load character data. The character may not exist or you may not have permission to view it."
        );
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
          <div className="md:col-span-2 bg-slate-700 p-4 rounded space-y-6">
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

              {/* --- UPDATED PROFICIENCIES SECTION --- */}
              <div>
                <strong className="text-slate-300">Proficiencies:</strong>
                <ul className="list-disc list-inside ml-4">
                  {proficiencyDetails.map((p) => (
                    <li key={p.index}>{p.name}</li>
                  ))}
                </ul>
              </div>

              {/* --- NEW SPELLS/CANTRIPS SECTION --- */}
              {spellDetails.length > 0 && (
                <div className="mt-4">
                  <strong className="text-slate-300">Cantrips Known:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {spellDetails.map((s) => (
                      <li key={s.index}>{s.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetPage;
