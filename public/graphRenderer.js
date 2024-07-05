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
  }

  render() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => this.zoomed(event));

    this.svg.call(this.zoom);

    this.g = this.svg.append("g");

    const nodeMap = new Map(this.data.nodes.map((node) => [node.id, node]));
    const links = this.data.links.map((link) => ({
      ...link,
      source: nodeMap.get(link.source) || link.source,
      target: nodeMap.get(link.target) || link.target,
    }));

    this.link = this.g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
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
      .append("g");

    this.node
      .append("circle")
      .attr("r", (d) => 5 + (d.count || 1) * 2)
      .attr("fill", (d) => d3.schemeCategory10[d.depth || 0]);

    this.node
      .append("text")
      .text((d) => d.id)
      .attr("x", 6)
      .attr("y", 3)
      .style("font-size", "10px")
      .style("font-family", "Arial");

    this.node.append("title").text((d) => d.id);

    this.simulation = d3
      .forceSimulation(this.data.nodes)
      .force(
        "link",
        d3
          .forceLink(links)
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

    this.simulation.alpha(1).restart();
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

  centerOnNode(nodeName) {
    const node = this.data.nodes.find((n) => n.id === nodeName);
    if (node && node.x !== undefined && node.y !== undefined) {
      const scale = 2;
      const svgBounds = this.svg.node().getBoundingClientRect();
      const transform = d3.zoomIdentity
        .translate(svgBounds.width / 2, svgBounds.height / 2)
        .scale(scale)
        .translate(-node.x, -node.y);

      this.svg.transition().duration(750).call(this.zoom.transform, transform);
    } else {
      console.warn(`Node "${nodeName}" not found or position not initialized.`);
    }
  }

  zoom(scale) {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, scale);
  }

  resetZoom() {
    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
