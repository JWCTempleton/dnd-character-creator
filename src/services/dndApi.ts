const BASE_URL = "https://www.dnd5eapi.co/api";

// This defines the shape of the objects we expect back from the list endpoints
export interface ApiListItem {
  index: string;
  name: string;
  url: string;
}

// A generic fetch function to get a list of items (like races or classes)
async function fetchApiList(endpoint: string): Promise<ApiListItem[]> {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
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

// Specific functions for fetching races and classes
export const fetchRaces = () => fetchApiList("races");
export const fetchClasses = () => fetchApiList("classes");
