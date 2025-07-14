// src/components/CharacterCreator.tsx
import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import {
  fetchRaces,
  fetchClasses,
  fetchApiDetails,
  type ApiListItem,
  type RaceDetails,
  type ClassDetails,
} from "../services/dndApi";
import { CLASS_PRIMARY_STATS, ABILITY_SCORE_MAP } from "../lib/helpers";

interface SavedCharacter {
  _id: string;
  name: string;
  race: string;
  characterClass: string;
}

const CharacterCreator = () => {
  // D&D API Data State
  const [races, setRaces] = useState<ApiListItem[]>([]);
  const [classes, setClasses] = useState<ApiListItem[]>([]);

  // Selection State
  const [selectedRace, setSelectedRace] = useState<RaceDetails | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [recommendedClasses, setRecommendedClasses] = useState<Set<string>>(
    new Set()
  );

  // NEW: User's Character Data State
  const [characterName, setCharacterName] = useState("");
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  useEffect(() => {
    const loadPublicData = async () => {
      // Fetch public D&D data that doesn't require login.
      const [racesData, classesData] = await Promise.all([
        fetchRaces(),
        fetchClasses(),
      ]);
      setRaces(racesData);
      setClasses(classesData);
    };

    const loadUserCharacters = async () => {
      // Fetch private user data that requires a valid login cookie.
      try {
        const { data } = await apiClient.get<SavedCharacter[]>("/characters");
        setSavedCharacters(data);
      } catch (error) {
        console.error(
          "Could not fetch user characters, session might be invalid.",
          error
        );
        // If this fails, we don't want to crash the whole component.
        // The user might just need to log in again.
        // We can optionally clear the saved characters list.
        setSavedCharacters([]);
      }
    };
    loadPublicData();
    loadUserCharacters();
  }, []);

  useEffect(() => {
    // Logic to update recommended classes based on race selection (from previous increment)
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

  const handleSelectRace = async (raceItem: ApiListItem) => {
    const details = await fetchApiDetails<RaceDetails>(raceItem.url);
    setSelectedRace(details);
  };

  const handleSelectClass = async (classItem: ApiListItem) => {
    const details = await fetchApiDetails<ClassDetails>(classItem.url);
    setSelectedClass(details);
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
        // stats will be added later
      };
      const { data: newCharacter } = await apiClient.post(
        "/characters",
        payload
      );
      setSavedCharacters([...savedCharacters, newCharacter]);
      setCharacterName(""); // Clear name field
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
          {savedCharacters.map((char) => (
            <li key={char._id} className="bg-slate-700 p-3 rounded">
              <p className="font-bold text-lg text-sky-400">{char.name}</p>
              <p className="capitalize text-sm text-slate-300">
                {char.race} {char.characterClass}
              </p>
            </li>
          ))}
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
            className="w-full sm:w-auto flex-grow p-2 rounded bg-slate-700 text-white"
          />
          <button
            onClick={handleSaveCharacter}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Save Character
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 2: Races List */}
          <section className="bg-slate-800 p-4 rounded-lg h-fit">
            <h2 className="text-3xl font-semibold mb-4 text-amber-300">
              Races
            </h2>
            <ul className="space-y-2">
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

          {/* Column 3: Classes List */}
          <section className="bg-slate-800 p-4 rounded-lg h-fit">
            <h2 className="text-3xl font-semibold mb-4 text-amber-300">
              Classes
            </h2>
            <ul className="space-y-2">
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
                    <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full">
                      Rec.
                    </span>
                  )}
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
