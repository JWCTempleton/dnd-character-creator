const BASE_URL = "https://www.dnd5eapi.co";

// This defines the shape of the objects we expect back from the list endpoints
export interface ApiListItem {
  index: string;
  name: string;
  url: string;
}

export interface RaceDetails {
  name: string;
  speed: number;
  ability_bonuses: {
    ability_score: ApiListItem;
    bonus: number;
  }[];
  size_description: string;
}

export interface ClassDetails {
  index: string;
  name: string;
  hit_die: number;
  proficiencies: ApiListItem[];
}

// A generic fetch function to get a list of items (like races or classes)
async function fetchApiList(endpoint: string): Promise<ApiListItem[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}`);
    }
    const data = await response.json();
    // The API returns an object with a 'results' property containing the array
    return data.results;
  } catch (error) {
    console.error(error);
    return []; // Return an empty array on error
  }
}

export async function fetchApiDetails<T>(url: string): Promise<T | null> {
  // The 'url' from the list is like '/api/races/elf'
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch details from ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const fetchRaces = () => fetchApiList("races");
export const fetchClasses = () => fetchApiList("classes");
