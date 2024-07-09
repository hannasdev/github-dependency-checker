export class GraphRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
  }

  centerOnNode = jest.fn();
  zoomIn = jest.fn();
  zoomOut = jest.fn();
  resetZoom = jest.fn();
  render = jest.fn();
}
