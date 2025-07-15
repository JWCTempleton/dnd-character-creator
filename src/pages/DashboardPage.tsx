// frontend/src/components/CharacterCreator.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
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
  CANTRIP_COUNTS,
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
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null
  );
  const [proficiencyChoices, setProficiencyChoices] = useState<any[]>([]);
  const [selectedProficiencies, setSelectedProficiencies] = useState<
    Set<string>
  >(new Set());
  const [cantrips, setCantrips] = useState<ApiListItem[]>([]);
  const [selectedCantrips, setSelectedCantrips] = useState<Set<string>>(
    new Set()
  );

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
    setSelectedProficiencies(new Set());
    setSelectedCantrips(new Set());
    setCantrips([]);
    setProficiencyChoices([]);

    try {
      // Fetch the full class details just once
      const fullClassDetails = await fetchApiDetails<any>(classItem.url);

      if (!fullClassDetails) throw new Error("Class details not found");

      setSelectedClass(fullClassDetails);
      setProficiencyChoices(fullClassDetails.proficiency_choices || []);

      // Now, fetch the spell list using the index from the details we just got
      const spellListData = await fetchApiDetails<{ results: ApiListItem[] }>(
        `/api/classes/${fullClassDetails.index}/spells`
      );

      if (spellListData && spellListData.results.length > 0) {
        const spellDetailPromises = spellListData.results.map((spell) =>
          fetchApiDetails<any>(spell.url)
        );
        const allSpellDetails = await Promise.all(spellDetailPromises);
        const levelZeroSpells = allSpellDetails.filter(
          (spell) => spell && spell.level === 0
        );
        setCantrips(levelZeroSpells);
      } else {
        setCantrips([]);
      }
    } catch (error) {
      toast.error("Could not fetch class details.");
      console.error("Failed to fetch class details:", error);
    }
  };

  const handleStandardArray = () => {
    alert("Standard Array is not yet implemented. Please use Roll for Stats.");
    // A great place for a future feature!
  };

  const handleDeleteCharacter = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      try {
        await apiClient.delete(`/characters/${id}`);
        setSavedCharacters(savedCharacters.filter((char) => char._id !== id));
        toast.success("Character deleted."); // <-- ADD SUCCESS NOTIFICATION
      } catch (error) {
        console.error("Failed to delete character", error);
        toast.error("Could not delete character."); // <-- REPLACE ALERT
      }
    }
  };

  const handleStartEdit = async (character: SavedCharacter) => {
    // Set the editing ID immediately to change the UI state (e.g., the "Update" button text)
    setEditingCharacterId(character._id);
    setCharacterName(character.name);

    // Fetch the full character data from our backend to get the saved stats
    try {
      const { data: charDetails } = await apiClient.get(
        `/characters/${character._id}`
      );
      setStats(charDetails.stats);

      // Use the character's race/class index to fetch full details from the D&D API
      const raceDetailsToEdit = await fetchApiDetails<RaceDetails>(
        `/api/races/${charDetails.race}`
      );
      const classDetailsToEdit = await fetchApiDetails<ClassDetails>(
        `/api/classes/${charDetails.characterClass}`
      );

      // Set the state for the selected race and class to update the UI
      setSelectedRace(raceDetailsToEdit);
      setSelectedClass(classDetailsToEdit);

      // Scroll to the top of the page for a better user experience
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to fetch character details for editing.", error);
      toast.error("Could not load character data to edit.");
    }
  };

  const handleCancelEdit = () => {
    setEditingCharacterId(null);
    setCharacterName("");
    setSelectedRace(null);
    setSelectedClass(null);
    setStats({
      // Reset stats to the default initial state
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    });
    setProficiencyChoices([]);
    setSelectedProficiencies(new Set());
    setCantrips([]);
    setSelectedCantrips(new Set());
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
      toast.error("Please enter a name and select a race and class.");
      return;
    }
    const payload = {
      name: characterName,
      race: selectedRace.name.toLowerCase(),
      characterClass: selectedClass.name.toLowerCase(),
      stats: stats,
      proficiencies: Array.from(selectedProficiencies),
      spells: Array.from(selectedCantrips),
    };
    try {
      let savedCharacter: SavedCharacter;
      let successMessage: string;

      if (editingCharacterId) {
        // UPDATE LOGIC
        const { data } = await apiClient.put(
          `/characters/${editingCharacterId}`,
          payload
        );
        savedCharacter = data;
        setSavedCharacters(
          savedCharacters.map((c) =>
            c._id === editingCharacterId ? savedCharacter : c
          )
        );
        successMessage = "Character updated successfully!";
      } else {
        // CREATE LOGIC
        const { data } = await apiClient.post("/characters", payload);
        savedCharacter = data;
        setSavedCharacters([...savedCharacters, savedCharacter]);
        successMessage = "Character saved successfully!";
      }

      // Reset fields for the next character
      setEditingCharacterId(null);
      setCharacterName("");
      setStats(initialStats);
      setSelectedRace(null);
      setSelectedClass(null);
      toast.success(successMessage);
    } catch (error) {
      console.error("Failed to save character", error);
      toast.error("Failed to save character.");
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(char);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded ml-4 transition-colors"
                >
                  Edit
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
            {editingCharacterId ? "Update Character" : "Save Character"}
          </button>
          {editingCharacterId && (
            <button
              onClick={handleCancelEdit}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel Edit
            </button>
          )}
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
          {/* --- Proficiency Choices Section (Conditionally Rendered) --- */}
          {selectedClass && proficiencyChoices.length > 0 && (
            <section className="bg-slate-800 p-4 rounded-lg h-fit md:col-span-2">
              {" "}
              {/* <-- SPANS 2 COLUMNS */}
              <h2 className="text-3xl font-semibold mb-4 text-amber-300">
                Skill Choices
              </h2>
              {proficiencyChoices.map((choice, index) => (
                <div key={index} className="mb-4">
                  <p className="text-slate-300 mb-2">{choice.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {choice.from.options.map((option: any) => (
                      <label
                        key={option.item.index}
                        className="flex items-center space-x-2 bg-slate-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox bg-slate-600 text-sky-500"
                          checked={selectedProficiencies.has(option.item.index)}
                          onChange={() => {
                            const newProficiencies = new Set(
                              selectedProficiencies
                            );
                            if (newProficiencies.has(option.item.index)) {
                              newProficiencies.delete(option.item.index);
                            } else {
                              if (newProficiencies.size >= choice.choose) {
                                toast.error(
                                  `You can only choose ${choice.choose} skill(s)`
                                );
                                return;
                              }
                              newProficiencies.add(option.item.index);
                            }
                            setSelectedProficiencies(newProficiencies);
                          }}
                        />
                        <span>{option.item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* --- Cantrip Choices Section (Conditionally Rendered) --- */}
          {selectedClass && cantrips.length > 0 && (
            <section className="bg-slate-800 p-4 rounded-lg h-fit md:col-span-1">
              <h2 className="text-3xl font-semibold mb-4 text-amber-300">
                Cantrips
              </h2>

              {/* NEW: Display how many cantrips can be chosen */}
              <p className="text-slate-300 mb-2">
                Choose {CANTRIP_COUNTS[selectedClass.index ?? ""] || 0}:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {cantrips.map((cantrip) => {
                  // Determine the maximum number of cantrips for the selected class
                  const maxCantrips =
                    CANTRIP_COUNTS[selectedClass.index ?? ""] || 0;

                  return (
                    <label
                      key={cantrip.index}
                      className="flex items-center space-x-2 bg-slate-700 p-2 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox bg-slate-600 text-sky-500"
                        checked={selectedCantrips.has(cantrip.index)}
                        onChange={() => {
                          const newCantrips = new Set(selectedCantrips);
                          if (newCantrips.has(cantrip.index)) {
                            newCantrips.delete(cantrip.index);
                          } else {
                            // Enforce the selection limit
                            if (newCantrips.size >= maxCantrips) {
                              toast.error(
                                `You can only choose ${maxCantrips} cantrip(s)`
                              );
                              return;
                            }
                            newCantrips.add(cantrip.index);
                          }
                          setSelectedCantrips(newCantrips);
                        }}
                      />
                      <span>{cantrip.name}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
