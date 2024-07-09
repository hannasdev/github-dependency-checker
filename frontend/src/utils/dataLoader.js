export class DataLoader {
  async loadData() {
    try {
      const response = await fetch("/dependencies.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.nodes || !data.links) {
        throw new Error("Invalid data structure in dependencies.json");
      }
      return data;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  }
}
