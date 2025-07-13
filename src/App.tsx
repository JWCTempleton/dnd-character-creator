import { useState, useEffect } from "react";
import { fetchRaces, fetchClasses, type ApiListItem } from "./services/dndApi";

function App() {
  // State to hold our lists of races and classes
  const [races, setRaces] = useState<ApiListItem[]>([]);
  const [classes, setClasses] = useState<ApiListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect runs once when the component mounts
  useEffect(() => {
    // Create an async function inside useEffect to fetch our data
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Fetch both lists in parallel for efficiency
        const [racesData, classesData] = await Promise.all([
          fetchRaces(),
          fetchClasses(),
        ]);
        setRaces(racesData);
        setClasses(classesData);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // The empty array [] means this effect runs only once

  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-bold text-sky-400">
          D&D Character Creator
        </h1>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <section>
          <h2 className="text-3xl font-semibold mb-4 text-amber-300">Races</h2>
          {loading ? (
            <p>Loading races...</p>
          ) : (
            <ul className="bg-slate-800 p-4 rounded-lg">
              {races.map((race) => (
                <li key={race.index} className="p-2 hover:bg-slate-700 rounded">
                  {race.name}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-3xl font-semibold mb-4 text-amber-300">
            Classes
          </h2>
          {loading ? (
            <p>Loading classes...</p>
          ) : (
            <ul className="bg-slate-800 p-4 rounded-lg">
              {classes.map((c) => (
                <li key={c.index} className="p-2 hover:bg-slate-700 rounded">
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
