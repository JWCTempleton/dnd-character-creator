// frontend/src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiClient from "../services/apiClient";
import {
  fetchRaces,
  fetchClasses,
  fetchApiDetails,
  fetchBackgrounds,
  fetchAlignments,
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
  stats: Record<Ability, number>; // Keep this for fetching/displaying
}

const DashboardPage = () => {
  // --- State Management ---
  const [races, setRaces] = useState<ApiListItem[]>([]);
  const [classes, setClasses] = useState<ApiListItem[]>([]);
  const [backgrounds, setBackgrounds] = useState<ApiListItem[]>([]);
  const [alignments, setAlignments] = useState<ApiListItem[]>([]);

  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null
  );

  // Form State
  const [characterName, setCharacterName] = useState("");
  const [selectedRace, setSelectedRace] = useState<RaceDetails | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [selectedBackground, setSelectedBackground] =
    useState<ApiListItem | null>(null);
  const [selectedAlignment, setSelectedAlignment] =
    useState<ApiListItem | null>(null);

  // Dynamic Choices State
  const [recommendedClasses, setRecommendedClasses] = useState<Set<string>>(
    new Set()
  );
  const [proficiencyChoices, setProficiencyChoices] = useState<any[]>([]);
  const [selectedProficiencies, setSelectedProficiencies] = useState<
    Set<string>
  >(new Set());
  const [cantrips, setCantrips] = useState<ApiListItem[]>([]);
  const [selectedCantrips, setSelectedCantrips] = useState<Set<string>>(
    new Set()
  );

  // Stat Assignment State (The Corrected System)
  const [statMode, setStatMode] = useState<"roll" | "array" | null>(null);
  const [statPool, setStatPool] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<
    Record<Ability, number | null>
  >({
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  });

  // --- Data Loading Effects ---
  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const [racesData, classesData, backgroundsData, alignmentsData] =
          await Promise.all([
            fetchRaces(),
            fetchClasses(),
            fetchBackgrounds(),
            fetchAlignments(),
          ]);
        setRaces(racesData);
        setClasses(classesData);
        setBackgrounds(backgroundsData);
        setAlignments(alignmentsData);
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
      }
    };
    loadPublicData();
    loadUserCharacters();
  }, []);

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

  // --- Form Reset Logic ---
  const resetForm = () => {
    setEditingCharacterId(null);
    setCharacterName("");
    setSelectedRace(null);
    setSelectedClass(null);
    setSelectedBackground(null);
    setSelectedAlignment(null);
    setProficiencyChoices([]);
    setSelectedProficiencies(new Set());
    setCantrips([]);
    setSelectedCantrips(new Set());
    setStatMode(null);
    setStatPool([]);
    setAssignments({
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    });
  };

  // --- Event Handlers ---
  const handleSelectRace = async (raceItem: ApiListItem) => {
    const details = await fetchApiDetails<RaceDetails>(raceItem.url);
    setSelectedRace(details);
  };

  const handleSelectClass = async (classItem: ApiListItem) => {
    resetForm(); // Reset everything when class changes to avoid mismatched data
    setCharacterName(characterName); // but keep the name they might have typed
    setSelectedRace(selectedRace); // and the race

    try {
      const fullClassDetails = await fetchApiDetails<any>(classItem.url);
      if (!fullClassDetails) throw new Error("Class details not found");
      setSelectedClass(fullClassDetails);
      setProficiencyChoices(fullClassDetails.proficiency_choices || []);

      const spellListData = await fetchApiDetails<{ results: ApiListItem[] }>(
        `/api/classes/${fullClassDetails.index}/spells`
      );
      if (spellListData?.results.length) {
        const spellDetailPromises = spellListData.results.map((spell) =>
          fetchApiDetails<any>(spell.url)
        );
        const allSpellDetails = await Promise.all(spellDetailPromises);
        setCantrips(
          allSpellDetails.filter((spell) => spell && spell.level === 0)
        );
      } else {
        setCantrips([]);
      }
    } catch (error) {
      toast.error("Could not fetch class details.");
      console.error(error);
    }
  };

  const handleSetStatMode = (mode: "array" | "roll") => {
    setStatMode(mode);
    setAssignments({
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    });
    setStatPool(
      mode === "array"
        ? [15, 14, 13, 12, 10, 8]
        : ABILITIES.map(() => rollForStat())
    );
  };

  const handleAssignIndex = (ability: Ability, indexString: string) => {
    const newIndex = indexString === "null" ? null : Number(indexString);
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      if (newIndex !== null) {
        for (const key in newAssignments) {
          if (newAssignments[key as Ability] === newIndex) {
            newAssignments[key as Ability] = null;
          }
        }
      }
      newAssignments[ability] = newIndex;
      return newAssignments;
    });
  };

  const handleStartEdit = async (character: SavedCharacter) => {
    resetForm();
    try {
      const { data: charDetails } = await apiClient.get<SavedCharacter>(
        `/characters/${character._id}`
      );

      setEditingCharacterId(charDetails._id);
      setCharacterName(charDetails.name);

      const [raceData, classData] = await Promise.all([
        fetchApiDetails<RaceDetails>(`/api/races/${charDetails.race}`),
        fetchApiDetails<ClassDetails>(
          `/api/classes/${charDetails.characterClass}`
        ),
      ]);
      setSelectedRace(raceData);
      setSelectedClass(classData);

      // Treat the saved stats as a "standard array" for editing.
      const savedStatValues = ABILITIES.map(
        (ability) => charDetails.stats[ability]
      );
      setStatMode("array"); // Or a custom 'edit' mode, 'array' is simplest.
      setStatPool(savedStatValues);

      // Pre-assign all stats based on the new pool.
      setAssignments({
        strength: savedStatValues.findIndex(
          (v) => v === charDetails.stats.strength
        ),
        dexterity: savedStatValues.findIndex(
          (v) => v === charDetails.stats.dexterity
        ),
        constitution: savedStatValues.findIndex(
          (v) => v === charDetails.stats.constitution
        ),
        intelligence: savedStatValues.findIndex(
          (v) => v === charDetails.stats.intelligence
        ),
        wisdom: savedStatValues.findIndex(
          (v) => v === charDetails.stats.wisdom
        ),
        charisma: savedStatValues.findIndex(
          (v) => v === charDetails.stats.charisma
        ),
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error("Could not load character data to edit.");
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      try {
        await apiClient.delete(`/characters/${id}`);
        setSavedCharacters(savedCharacters.filter((char) => char._id !== id));
        toast.success("Character deleted.");
      } catch (error) {
        toast.error("Could not delete character.");
      }
    }
  };

  const handleSaveCharacter = async () => {
    const isFullyAssigned = Object.values(assignments).every(
      (val) => val !== null
    );
    if (
      !isFullyAssigned ||
      !characterName ||
      !selectedRace ||
      !selectedClass ||
      !selectedBackground ||
      !selectedAlignment
    ) {
      toast.error("Please complete all selections before saving.");
      return;
    }

    const finalStats = Object.fromEntries(
      Object.entries(assignments).map(([ability, index]) => [
        ability,
        statPool[index!],
      ])
    ) as Record<Ability, number>;

    const payload = {
      name: characterName,
      race: selectedRace.index,
      characterClass: selectedClass.index,
      background: selectedBackground.index,
      alignment: selectedAlignment.index,
      proficiencies: Array.from(selectedProficiencies),
      spells: Array.from(selectedCantrips),
      stats: finalStats,
      hitDie: selectedClass.hit_die,
    };

    try {
      let successMessage: string;
      if (editingCharacterId) {
        const { data: updatedChar } = await apiClient.put(
          `/characters/${editingCharacterId}`,
          payload
        );
        setSavedCharacters(
          savedCharacters.map((c) =>
            c._id === editingCharacterId ? updatedChar : c
          )
        );
        successMessage = "Character updated successfully!";
      } else {
        const { data: newChar } = await apiClient.post("/characters", payload);
        setSavedCharacters([...savedCharacters, newChar]);
        successMessage = "Character saved successfully!";
      }
      resetForm();
      toast.success(successMessage);
    } catch (error) {
      toast.error("Failed to save character.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-[100rem] mx-auto">
      {/* --- SIDEBAR: Saved Characters (1 Column) --- */}
      <aside className="bg-slate-900/50 p-6 rounded-2xl h-fit lg:col-span-1">
        <h2 className="text-2xl font-bold mb-6 text-amber-300">
          My Characters
        </h2>
        <ul className="space-y-3">
          {savedCharacters.map((char) => (
            <li key={char._id} className="group">
              <div className="bg-slate-800 p-4 rounded-lg border border-transparent group-hover:border-sky-500 transition-all duration-200">
                <Link to={`/character/${char._id}`} className="block">
                  <p className="font-bold text-lg text-sky-400 truncate">
                    {char.name}
                  </p>
                  <p className="capitalize text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {char.race} {char.characterClass}
                  </p>
                </Link>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => handleStartEdit(char)}
                    className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md w-full transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(char._id)}
                    className="text-xs bg-red-600/80 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md w-full transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* --- MAIN CREATOR AREA (4 Columns) --- */}
      <main className="lg:col-span-4">
        <section className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Enter Character Name..."
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full sm:w-auto flex-grow text-lg p-3 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              onClick={handleSaveCharacter}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              {editingCharacterId ? "Update Character" : "Save Character"}
            </button>
            {editingCharacterId && (
              <button
                onClick={resetForm}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:col-span-2 gap-8">
              <section className="bg-slate-800 p-6 rounded-2xl h-fit">
                <h3 className="text-2xl font-bold mb-4 text-amber-300">Race</h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {races.map((race) => (
                    <li
                      key={race.index}
                      onClick={() => handleSelectRace(race)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-150 ${
                        selectedRace?.index === race.index
                          ? "bg-sky-600 border-sky-500"
                          : "bg-slate-700/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {race.name}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="bg-slate-800 p-6 rounded-2xl h-fit">
                <h3 className="text-2xl font-bold mb-4 text-amber-300">
                  Class
                </h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {classes.map((c) => (
                    <li
                      key={c.index}
                      onClick={() => handleSelectClass(c)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-150 flex justify-between items-center ${
                        selectedClass?.index === c.index
                          ? "bg-sky-600 border-sky-500"
                          : "bg-slate-700/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <span>{c.name}</span>
                      {recommendedClasses.has(c.index) && (
                        <span className="text-xs bg-emerald-500/80 px-2 py-1 rounded-full font-semibold">
                          Rec.
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <section className="bg-slate-800 p-6 rounded-2xl h-fit lg:col-span-1">
              <h3 className="text-2xl font-bold mb-4 text-amber-300">
                Ability Scores
              </h3>
              {!statMode ? (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => handleSetStatMode("roll")}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Roll for Stats
                  </button>
                  <button
                    onClick={() => handleSetStatMode("array")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Use Standard Array
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-slate-300 font-semibold">
                      {statMode === "roll" ? "Assign Rolled:" : "Assign Array:"}
                    </p>
                    <button
                      onClick={() => setStatMode(null)}
                      className="text-sm text-sky-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  {statMode === "roll" && (
                    <button
                      onClick={() => handleSetStatMode("roll")}
                      className="w-full bg-sky-700 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4"
                    >
                      Re-roll
                    </button>
                  )}
                  <ul className="space-y-3">
                    {ABILITIES.map((ability) => {
                      const assignedIndices = new Set(
                        Object.values(assignments).filter((val) => val !== null)
                      );
                      return (
                        <li
                          key={ability}
                          className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md"
                        >
                          <span className="capitalize font-semibold text-slate-300">
                            {ability}
                          </span>
                          <select
                            value={assignments[ability] ?? "null"}
                            onChange={(e) =>
                              handleAssignIndex(ability, e.target.value)
                            }
                            className="bg-slate-900 text-white font-mono text-lg p-1 rounded-md border-2 border-slate-600 focus:border-sky-500 outline-none"
                          >
                            <option value="null">--</option>
                            {statPool.map((score, index) => {
                              const isAssignedToMe =
                                assignments[ability] === index;
                              const isDisabled =
                                assignedIndices.has(index) && !isAssignedToMe;
                              return (
                                <option
                                  key={index}
                                  value={index}
                                  disabled={isDisabled}
                                >
                                  {score}
                                </option>
                              );
                            })}
                          </select>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <section className="bg-slate-800 p-6 rounded-2xl h-fit">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-amber-300">
                  Background
                </h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {backgrounds.map((bg) => (
                    <li
                      key={bg.index}
                      onClick={() => setSelectedBackground(bg)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-150 ${
                        selectedBackground?.index === bg.index
                          ? "bg-sky-600 border-sky-500"
                          : "bg-slate-700/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {bg.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-amber-300">
                  Alignment
                </h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {alignments.map((al) => (
                    <li
                      key={al.index}
                      onClick={() => setSelectedAlignment(al)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-150 ${
                        selectedAlignment?.index === al.index
                          ? "bg-sky-600 border-sky-500"
                          : "bg-slate-700/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {al.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {selectedClass && (
            <section className="bg-slate-800 p-6 rounded-2xl h-fit">
              <h3 className="text-2xl font-bold mb-4 text-amber-300">
                Proficiencies & Spells
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <h4 className="font-semibold text-lg text-slate-300 mb-3">
                    Skill Choices
                  </h4>
                  {proficiencyChoices.length > 0 ? (
                    proficiencyChoices.map((choice, index) => (
                      <div key={index} className="mb-4">
                        <p className="text-slate-400 mb-2">{choice.desc}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {choice.from.options.map((option: any) => {
                            if (!option.item) return null;
                            return (
                              <label
                                key={option.item.index}
                                className="flex items-center space-x-3 bg-slate-700/80 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedProficiencies.has(
                                    option.item.index
                                  )}
                                  onChange={() => {
                                    const newProficiencies = new Set(
                                      selectedProficiencies
                                    );
                                    if (
                                      newProficiencies.has(option.item.index)
                                    ) {
                                      newProficiencies.delete(
                                        option.item.index
                                      );
                                    } else {
                                      if (
                                        newProficiencies.size >= choice.choose
                                      ) {
                                        toast.error(
                                          `You can only choose ${choice.choose} skill(s)`
                                        );
                                        return;
                                      }
                                      newProficiencies.add(option.item.index);
                                    }
                                    setSelectedProficiencies(newProficiencies);
                                  }}
                                  className="w-5 h-5 bg-slate-600 text-sky-500 border-slate-500 rounded focus:ring-sky-600"
                                />
                                <span>{option.item.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">
                      No skill choices for this class.
                    </p>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-lg text-slate-300 mb-3">
                    Cantrips
                  </h4>
                  {cantrips.length > 0 ? (
                    <div>
                      <p className="text-slate-400 mb-2">
                        Choose {CANTRIP_COUNTS[selectedClass?.index ?? ""] || 0}
                        :
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {cantrips.map((cantrip) => {
                          const maxCantrips =
                            CANTRIP_COUNTS[selectedClass!.index] || 0;
                          return (
                            <label
                              key={cantrip.index}
                              className="flex items-center space-x-3 bg-slate-700/80 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCantrips.has(cantrip.index)}
                                onChange={() => {
                                  const newCantrips = new Set(selectedCantrips);
                                  if (newCantrips.has(cantrip.index)) {
                                    newCantrips.delete(cantrip.index);
                                  } else {
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
                                className="w-5 h-5 bg-slate-600 text-sky-500 border-slate-500 rounded focus:ring-sky-600"
                              />
                              <span>{cantrip.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">
                      This class has no cantrips.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
