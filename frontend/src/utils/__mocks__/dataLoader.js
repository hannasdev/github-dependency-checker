export class DataLoader {
  // __mocks__/dataLoader.js
  loadData = jest.fn().mockResolvedValue({ nodes: [], links: [] });
}
