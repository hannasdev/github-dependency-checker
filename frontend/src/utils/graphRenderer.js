export class GraphRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.svg = null;
    this.simulation = null;
    this.zoom = null;
    this.g = null;
    this.link = null;
    this.node = null;

    this.simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => 10 + (d.count || 1) * 2)
      );
  }

  render() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.g = this.svg.append("g");

    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => this.zoomed(event));

    this.svg.call(this.zoom);

    this.link = this.g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.data.links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.count));

    this.node = this.g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(this.data.nodes)
      .enter()
      .append("g")
      .call(this.drag());

    this.node
      .append("circle")
      .attr("r", (d) => 5 + (d.count || 1) * 2)
      .attr("fill", (d) => d3.schemeCategory10[d.depth % 10]);

    this.node
      .append("text")
      .text((d) => d.id)
      .attr("x", 6)
      .attr("y", 3)
      .style("font-size", "10px")
      .style("font-family", "Arial");

    this.simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => 10 + (d.count || 1) * 2)
      );

    this.simulation.on("tick", () => this.ticked());
  }

  ticked() {
    this.link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    this.node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  zoomed(event) {
    this.g.attr("transform", event.transform);
  }

  drag(simulation) {
    const dragstarted = (event, d) => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event, d) => {
      if (!event.active) this.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  centerOnNode(nodeName) {
    const node = this.data.nodes.find((n) => n.id === nodeName);
    if (node && node.x !== undefined && node.y !== undefined) {
      const scale = 2;
      const transform = d3.zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(scale)
        .translate(-node.x, -node.y);

      this.svg.transition().duration(750).call(this.zoom.transform, transform);
    }
  }

  zoomIn() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.2);
  }

  zoomOut() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.8);
  }

  resetZoom() {
    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
