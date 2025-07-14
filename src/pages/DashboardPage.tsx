// frontend/src/components/CharacterCreator.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/apiClient";
import {
  fetchRaces,
  fetchClasses,
  fetchApiDetails,
  type ApiListItem,
  type RaceDetails,
  type ClassDetails,
} from "../services/dndApi";
import {
  CLASS_PRIMARY_STATS,
  ABILITY_SCORE_MAP,
  ABILITIES,
  type Ability,
  rollForStat,
} from "../lib/helpers";

interface SavedCharacter {
  _id: string;
  name: string;
  race: string;
  characterClass: string;
}

// The default state for our stats
const initialStats: Record<Ability, number> = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const CharacterCreator = () => {
  // --- State Management ---
  const [races, setRaces] = useState<ApiListItem[]>([]);
  const [classes, setClasses] = useState<ApiListItem[]>([]);
  const [selectedRace, setSelectedRace] = useState<RaceDetails | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [recommendedClasses, setRecommendedClasses] = useState<Set<string>>(
    new Set()
  );
  const [characterName, setCharacterName] = useState("");
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [stats, setStats] = useState<Record<Ability, number>>(initialStats);

  // --- Data Loading Effect ---
  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const [racesData, classesData] = await Promise.all([
          fetchRaces(),
          fetchClasses(),
        ]);
        setRaces(racesData);
        setClasses(classesData);
      } catch (error) {
        console.error("Failed to load public D&D data", error);
      }
    };

    const loadUserCharacters = async () => {
      try {
        const { data } = await apiClient.get<SavedCharacter[]>("/characters");
        setSavedCharacters(data);
      } catch (error) {
        console.error("Could not fetch user characters.", error);
        setSavedCharacters([]);
      }
    };

    loadPublicData();
    loadUserCharacters();
  }, []);

  // --- Recommendation Engine Effect ---
  useEffect(() => {
    if (!selectedRace) {
      setRecommendedClasses(new Set());
      return;
    }
    const raceBonuses = new Set(
      selectedRace.ability_bonuses.map(
        (b) => ABILITY_SCORE_MAP[b.ability_score.name]
      )
    );
    const newRecommended = new Set<string>();
    classes.forEach((c) => {
      const primaryStats = CLASS_PRIMARY_STATS[c.index] || [];
      if (primaryStats.some((stat) => raceBonuses.has(stat))) {
        newRecommended.add(c.index);
      }
    });
    setRecommendedClasses(newRecommended);
  }, [selectedRace, classes]);

  // --- Event Handlers ---
  const handleSelectRace = async (raceItem: ApiListItem) => {
    const details = await fetchApiDetails<RaceDetails>(raceItem.url);
    setSelectedRace(details);
  };

  const handleSelectClass = async (classItem: ApiListItem) => {
    const details = await fetchApiDetails<ClassDetails>(classItem.url);
    setSelectedClass(details);
  };

  const handleStandardArray = () => {
    alert("Standard Array is not yet implemented. Please use Roll for Stats.");
    // A great place for a future feature!
  };

  const handleDeleteCharacter = async (id: string) => {
    // Confirmation prompt is a crucial UX feature
    if (
      window.confirm(
        "Are you sure you want to delete this character? This cannot be undone."
      )
    ) {
      try {
        await apiClient.delete(`/characters/${id}`);
        // Remove the character from the local state to update the UI instantly
        setSavedCharacters(savedCharacters.filter((char) => char._id !== id));
      } catch (error) {
        console.error("Failed to delete character", error);
        alert("Could not delete character.");
      }
    }
  };

  const handleRollStats = () => {
    const newStats = { ...initialStats };
    ABILITIES.forEach((ability) => {
      newStats[ability] = rollForStat();
    });
    setStats(newStats);
  };

  const handleSaveCharacter = async () => {
    if (!characterName || !selectedRace || !selectedClass) {
      alert("Please enter a name and select a race and class.");
      return;
    }
    try {
      const payload = {
        name: characterName,
        race: selectedRace.name.toLowerCase(),
        characterClass: selectedClass.name.toLowerCase(),
        stats: stats, // Add stats to the save payload
      };
      const { data: newCharacter } = await apiClient.post<SavedCharacter>(
        "/characters",
        payload
      );
      setSavedCharacters([...savedCharacters, newCharacter]);

      // Reset fields for the next character
      setCharacterName("");
      setStats(initialStats);
      setSelectedRace(null);
      setSelectedClass(null);
    } catch (error) {
      console.error("Failed to save character", error);
      alert("Failed to save character.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[90rem] mx-auto">
      {/* Column 1: Saved Characters */}
      <section className="bg-slate-800 p-4 rounded-lg h-fit lg:col-span-1">
        <h2 className="text-3xl font-semibold mb-4 text-amber-300">
          My Characters
        </h2>
        <ul className="space-y-2">
          {savedCharacters.length > 0 ? (
            savedCharacters.map((char) => (
              <div
                key={char._id}
                className="bg-slate-700 p-3 rounded flex justify-between items-center"
              >
                <Link to={`/character/${char._id}`} className="flex-grow">
                  <div className="hover:bg-slate-600 rounded -m-3 p-3 transition-colors">
                    <p className="font-bold text-lg text-sky-400">
                      {char.name}
                    </p>
                    <p className="capitalize text-sm text-slate-300">
                      {char.race} {char.characterClass}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when clicking the button
                    handleDeleteCharacter(char._id);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded ml-4 transition-colors"
                >
                  Del
                </button>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No characters saved yet.</p>
          )}
        </ul>
      </section>

      {/* Main Creator Area */}
      <div className="lg:col-span-3">
        <div className="bg-slate-800 p-4 rounded-lg mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Enter Character Name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full sm:w-auto flex-grow p-2 rounded bg-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <button
            onClick={handleSaveCharacter}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Save Character
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Races List */}
          <section className="bg-slate-800 p-4 rounded-lg h-fit">
            <h2 className="text-3xl font-semibold mb-4 text-amber-300">
              Races
            </h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {races.map((race) => (
                <li
                  key={race.index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedRace?.name === race.name
                      ? "bg-sky-600"
                      : "hover:bg-slate-700"
                  }`}
                  onClick={() => handleSelectRace(race)}
                >
                  {race.name}
                </li>
              ))}
            </ul>
          </section>

          {/* Classes List */}
          <section className="bg-slate-800 p-4 rounded-lg h-fit">
            <h2 className="text-3xl font-semibold mb-4 text-amber-300">
              Classes
            </h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {classes.map((c) => (
                <li
                  key={c.index}
                  className={`p-2 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    selectedClass?.name === c.name
                      ? "bg-sky-600"
                      : "hover:bg-slate-700"
                  }`}
                  onClick={() => handleSelectClass(c)}
                >
                  {c.name}
                  {recommendedClasses.has(c.index) && (
                    <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full font-semibold">
                      Rec.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Ability Scores Section */}
          <section className="bg-slate-800 p-4 rounded-lg h-fit">
            <h2 className="text-3xl font-semibold mb-4 text-amber-300">
              Ability Scores
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleRollStats}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded transition-colors"
              >
                Roll for Stats
              </button>
              <button
                onClick={handleStandardArray}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded transition-colors cursor-not-allowed"
                disabled
              >
                Use Standard Array
              </button>
            </div>
            <ul className="space-y-2">
              {ABILITIES.map((ability) => (
                <li
                  key={ability}
                  className="flex justify-between items-center bg-slate-700 p-2 rounded"
                >
                  <span className="capitalize font-bold text-slate-300">
                    {ability}
                  </span>
                  <span className="font-mono text-xl text-white bg-slate-900 px-3 py-1 rounded">
                    {stats[ability]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
