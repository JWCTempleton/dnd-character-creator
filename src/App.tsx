import { useState, useEffect } from "react";
import {
  fetchRaces,
  fetchClasses,
  fetchApiDetails,
  type ApiListItem,
  type RaceDetails,
  type ClassDetails,
} from "./services/dndApi";
import { CLASS_PRIMARY_STATS, ABILITY_SCORE_MAP } from "./lib/helpers";

function App() {
  // State for the lists of races and classes
  const [races, setRaces] = useState<ApiListItem[]>([]);
  const [classes, setClasses] = useState<ApiListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // State for the user's selections and the detailed data
  const [selectedRace, setSelectedRace] = useState<RaceDetails | null>(null);
  const [selectedRaceUrl, setSelectedRaceUrl] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [selectedClassUrl, setSelectedClassUrl] = useState<string | null>(null);

  // State for loading indicators
  const [detailsLoading, setDetailsLoading] = useState(false);

  // State to hold the set of recommended class indexes
  const [recommendedClasses, setRecommendedClasses] = useState<Set<string>>(
    new Set()
  );

  // Effect to load the initial race and class lists when the app starts
  useEffect(() => {
    const loadInitialData = async () => {
      setListLoading(true);
      const [racesData, classesData] = await Promise.all([
        fetchRaces(),
        fetchClasses(),
      ]);
      setRaces(racesData);
      setClasses(classesData);
      setListLoading(false);
    };
    loadInitialData();
  }, []); // Empty dependency array means this runs only once on mount

  // Effect to update class recommendations whenever a new race is selected
  useEffect(() => {
    if (!selectedRace) {
      setRecommendedClasses(new Set());
      return;
    }

    // Get the ability scores that the selected race provides bonuses for
    const raceBonuses = new Set(
      selectedRace.ability_bonuses.map(
        (bonus) => ABILITY_SCORE_MAP[bonus.ability_score.name]
      )
    );

    const newRecommended = new Set<string>();
    // Loop through all available classes to see if they have synergy
    for (const c of classes) {
      const primaryStats = CLASS_PRIMARY_STATS[c.index] || [];
      const hasSynergy = primaryStats.some((stat) => raceBonuses.has(stat));
      if (hasSynergy) {
        newRecommended.add(c.index);
      }
    }
    setRecommendedClasses(newRecommended);
  }, [selectedRace, classes]); // This effect re-runs if selectedRace or the classes list changes

  // Handler for when a user clicks on a race
  const handleSelectRace = async (raceItem: ApiListItem) => {
    setDetailsLoading(true);
    setSelectedRaceUrl(raceItem.url); // Highlight the selection immediately
    const details = await fetchApiDetails<RaceDetails>(raceItem.url);
    setSelectedRace(details);
    setDetailsLoading(false);
  };

  // Handler for when a user clicks on a class
  const handleSelectClass = async (classItem: ApiListItem) => {
    setDetailsLoading(true);
    setSelectedClassUrl(classItem.url); // Highlight the selection immediately
    const details = await fetchApiDetails<ClassDetails>(classItem.url);
    setSelectedClass(details);
    setDetailsLoading(false);
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4 sm:p-8 text-white font-sans">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-bold text-sky-400">
          D&D Character Creator
        </h1>
      </header>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Column 1: Races List */}
        <section className="bg-slate-800 p-4 rounded-lg h-fit">
          <h2 className="text-3xl font-semibold mb-4 text-amber-300">Races</h2>
          {listLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {races.map((race) => (
                <li
                  key={race.index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedRaceUrl === race.url
                      ? "bg-sky-600"
                      : "hover:bg-slate-700"
                  }`}
                  onClick={() => handleSelectRace(race)}
                >
                  {race.name}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Column 2: Classes List */}
        <section className="bg-slate-800 p-4 rounded-lg h-fit">
          <h2 className="text-3xl font-semibold mb-4 text-amber-300">
            Classes
          </h2>
          {listLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {classes.map((c) => (
                <li
                  key={c.index}
                  className={`p-2 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    selectedClassUrl === c.url
                      ? "bg-sky-600"
                      : "hover:bg-slate-700"
                  }`}
                  onClick={() => handleSelectClass(c)}
                >
                  {c.name}
                  {/* Recommendation Badge */}
                  {recommendedClasses.has(c.index) && (
                    <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full font-semibold">
                      Rec.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Column 3: Details Pane */}
        <section className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-3xl font-semibold mb-4 text-amber-300">
            Details
          </h2>
          {detailsLoading ? (
            <p>Loading details...</p>
          ) : (
            <div className="space-y-6">
              {/* Race Details */}
              {selectedRace && (
                <div>
                  <h3 className="text-2xl text-sky-400">{selectedRace.name}</h3>
                  <p>
                    <strong>Speed:</strong> {selectedRace.speed} ft.
                  </p>
                  <p className="mt-1">
                    <strong>Size:</strong> {selectedRace.size_description}
                  </p>
                  <p className="font-bold mt-2">Ability Bonuses:</p>
                  <ul className="list-disc list-inside">
                    {selectedRace.ability_bonuses.map((bonus) => (
                      <li key={bonus.ability_score.index}>
                        {bonus.ability_score.name} +{bonus.bonus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Class Details */}
              {selectedClass && (
                <div>
                  <h3 className="text-2xl text-sky-400">
                    {selectedClass.name}
                  </h3>
                  <p>
                    <strong>Hit Die:</strong> d{selectedClass.hit_die}
                  </p>
                  <p className="font-bold mt-2">Proficiencies:</p>
                  <ul className="list-disc list-inside">
                    {selectedClass.proficiencies.map((p) => (
                      <li key={p.index}>{p.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!selectedRace && !selectedClass && !detailsLoading && (
                <p className="text-slate-400">
                  Select a race and class to see details.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
