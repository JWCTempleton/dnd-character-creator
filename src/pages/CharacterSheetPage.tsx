// frontend/src/pages/CharacterSheetPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import apiClient from "../services/apiClient";
import {
  fetchApiDetails,
  type RaceDetails,
  type ClassDetails,
  type ApiListItem,
  fetchClassLevelInfo,
} from "../services/dndApi";
import LevelUpModal from "../components/LevelUpModal";
import { type Ability, ABILITIES, calculateModifier } from "../lib/helpers";
import toast from "react-hot-toast";

// Interface for our saved character data from the backend
interface CharacterData {
  _id: string;
  name: string;
  race: string;
  characterClass: string;
  stats: Record<Ability, number>;
  proficiencies: string[];
  spells: string[];
  background: string;
  alignment: string;
  level: number;
  maxHp: number;
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
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [levelFeatures, setLevelFeatures] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    let isActive = true; // Flag to handle component unmounting

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch the core character data first. This is the only request that must be sequential.
        const { data: savedChar } = await apiClient.get<CharacterData>(
          `/characters/${id}`
        );

        // If the component has unmounted while we were fetching, abort.
        if (!isActive) return;

        // 2. Now, create an array of ALL other promises that depend on savedChar data.
        const raceDetailsPromise = fetchApiDetails<RaceDetails>(
          `/api/races/${savedChar.race}`
        );
        const classDetailsPromise = fetchApiDetails<ClassDetails>(
          `/api/classes/${savedChar.characterClass}`
        );
        const levelInfoPromise = fetchClassLevelInfo(savedChar.characterClass);
        const proficiencyPromises = savedChar.proficiencies.map((p) =>
          fetchApiDetails<ApiListItem>(`/api/proficiencies/${p}`)
        );
        const spellPromises = savedChar.spells.map((s) =>
          fetchApiDetails<ApiListItem>(`/api/spells/${s}`)
        );

        // 3. Resolve all promises concurrently.
        const [
          raceData,
          classData,
          levelData,
          resolvedProficiencies,
          resolvedSpells,
        ] = await Promise.all([
          raceDetailsPromise,
          classDetailsPromise,
          levelInfoPromise,
          Promise.all(proficiencyPromises), // These are nested promises
          Promise.all(spellPromises), // These are nested promises
        ]);

        // If the component has unmounted, abort before setting state.
        if (!isActive) return;

        // 4. Process the level data to get feature details.
        const featureUrls: string[] = [];
        levelData
          .filter((l) => l.level <= savedChar.level)
          .forEach((l) => l.features.forEach((f) => featureUrls.push(f.url)));

        const featureDetails = await Promise.all(
          featureUrls.map((url) => fetchApiDetails<any>(url))
        );

        // 5. Set all state at once.
        if (isActive) {
          setCharacter(savedChar);
          setRaceDetails(raceData);
          setClassDetails(classData);
          setLevelFeatures(featureDetails.filter((f) => f !== null));
          setProficiencyDetails(
            resolvedProficiencies.filter((p) => p !== null)
          );
          setSpellDetails(resolvedSpells.filter((s) => s !== null));
        }
      } catch (err) {
        if (isActive) {
          setError("Failed to load character data.");
        }
        console.error(err);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to run when the component unmounts
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleLevelUpConfirm = async (hpRoll: number) => {
    if (!character) return;
    try {
      // 1. Level up the character on the backend
      const { data: updatedCharacter } = await apiClient.post<CharacterData>(
        `/characters/${character._id}/levelup`,
        { hpRoll }
      );

      // 2. Re-fetch the entire leveling table for the class
      const allLevelData = await fetchClassLevelInfo(
        updatedCharacter.characterClass
      );

      // 3. Re-calculate all features up to the NEW level
      const featureUrls: string[] = [];
      allLevelData
        .filter((l) => l.level <= updatedCharacter.level)
        .forEach((l) => l.features.forEach((f) => featureUrls.push(f.url)));

      const featureDetails = await Promise.all(
        featureUrls.map((url) => fetchApiDetails<any>(url))
      );

      // 4. Update both the character and the features state at the same time
      setCharacter(updatedCharacter);
      setLevelFeatures(featureDetails.filter((f) => f !== null));

      toast.success(`Leveled up to Level ${updatedCharacter.level}!`);
    } catch (error) {
      toast.error("Failed to level up.");
      console.error(error);
    } finally {
      setIsLevelUpOpen(false);
    }
  };

  if (loading)
    return (
      <div className="text-center text-white p-10">
        Loading Character Sheet...
      </div>
    );
  if (error)
    return <div className="text-center text-red-500 p-10">{error}</div>;
  if (!character || !raceDetails || !classDetails)
    return (
      <div className="text-center text-white p-10">
        Character data could not be loaded.
      </div>
    );

  const dexModifier = Math.floor((character.stats.dexterity - 10) / 2);
  const initiative = calculateModifier(character.stats.dexterity);
  const armorClass = 10 + dexModifier;

  return (
    <div>
      <RouterLink
        to="/"
        className="text-sky-400 hover:underline mb-6 inline-block"
      >
        ← Back to Dashboard
      </RouterLink>

      <div className="bg-slate-800 rounded-2xl p-6 md:p-8">
        {/* --- HEADER: Name, Class, and Combat Stats (FIXED) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-6 border-b border-slate-700">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-300">
              {character.name}
            </h1>
            <h2 className="text-2xl md:text-3xl capitalize text-slate-300 mt-1">
              {raceDetails.name} {classDetails.name}
            </h2>
            <p className="capitalize text-lg text-slate-400 mt-1">
              {character.alignment} | {character.background}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center mt-4 sm:mt-0">
            <div className="bg-slate-900/70 p-3 rounded-lg w-28">
              <p className="text-sm font-bold text-slate-400">Level</p>
              <p className="text-4xl font-bold">{character.level}</p>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg w-28">
              <p className="text-sm font-bold text-slate-400">Hit Points</p>
              <p className="text-4xl font-bold">{character.maxHp}</p>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg w-28">
              <p className="text-sm font-bold text-slate-400">Armor Class</p>
              <p className="text-4xl font-bold">{armorClass}</p>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg w-28">
              <p className="text-sm font-bold text-slate-400">Initiative</p>
              <p className="text-4xl font-bold">{initiative}</p>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID: Stats and Details --- */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-xl">
            <h3 className="text-2xl font-bold mb-4 text-sky-400">
              Ability Scores
            </h3>
            <ul className="space-y-3">
              {ABILITIES.map((ability) => (
                <li key={ability} className="flex justify-between items-center">
                  <span className="capitalize text-lg font-semibold">
                    {ability}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-slate-400">
                      ({calculateModifier(character.stats[ability])})
                    </span>
                    <span className="font-mono text-2xl bg-slate-900/70 px-3 py-1 rounded-md w-14 text-center">
                      {character.stats[ability]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2 bg-slate-700/50 p-4 rounded-xl space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-sky-400 mb-2">
                Racial Traits
              </h3>
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
              <h3 className="text-2xl font-bold text-sky-400 mb-2">
                Class Features
              </h3>
              <p>
                <strong className="text-slate-300">Hit Die:</strong> d
                {classDetails.hit_die}
              </p>
              <div className="mt-2">
                <strong className="text-slate-300">Proficiencies:</strong>
                <ul className="list-disc list-inside ml-4">
                  {proficiencyDetails.map((p) => (
                    <li key={p.index}>{p.name}</li>
                  ))}
                </ul>
              </div>
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
              <div className="mt-4 space-y-3">
                {levelFeatures.map((feature) => (
                  <div key={feature.index}>
                    <strong className="text-slate-300">{feature.name}</strong>
                    {/* The API uses 'desc' which is an array of strings */}
                    {feature.desc.map((d: string, i: number) => (
                      <p key={i} className="text-sm mt-1">
                        {d}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {character.level < 20 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLevelUpOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Level Up!
            </button>
          </div>
        )}
      </div>

      {isLevelUpOpen && (
        <LevelUpModal
          hitDie={classDetails.hit_die}
          conModifier={Math.floor((character.stats.constitution - 10) / 2)}
          onConfirm={handleLevelUpConfirm}
          onClose={() => setIsLevelUpOpen(false)}
        />
      )}
    </div>
  );
};

export default CharacterSheetPage;
