'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FileNode, DependencyLink, RepositoryData } from '../types';

interface ForceGraphProps {
  data: RepositoryData;
  onNodeSelect: (node: FileNode | null) => void;
}

export default function ForceGraph({ data, onNodeSelect }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = 800;
    const height = 600;

    // Clear existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
        container.attr('transform', event.transform.toString());
      });

    svg.call(zoom as any);

    // Create container for zoomable content
    const container = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow marker
    svg.append('defs').selectAll('marker')
      .data(['dependency'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw links with arrows
    const links = container.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight))
      .attr('marker-end', d => d.type === 'imports' ? 'url(#dependency)' : null);

    // Create node groups
    const nodeGroups = container.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(drag(simulation) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect(d);
      });

    // Add circles to node groups
    nodeGroups.append('circle')
      .attr('r', d => d.type === 'directory' ? 12 : 8)
      .attr('fill', d => d.type === 'directory' ? '#ff7f0e' : '#1f77b4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add icons to nodes
    nodeGroups.append('text')
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .text(d => d.type === 'directory' ? '📁' : '📄')
      .style('font-size', '12px');

    // Add labels
    nodeGroups.append('text')
      .text(d => d.name)
      .attr('x', 16)
      .attr('y', 5)
      .attr('class', 'text-sm')
      .style('pointer-events', 'none');

    // Add hover effect
    nodeGroups
      .on('mouseover', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d => (d.type === 'directory' ? 15 : 10));
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d => (d.type === 'directory' ? 12 : 8));
      });

    // Clear selection when clicking on empty space
    svg.on('click', () => onNodeSelect(null));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, onNodeSelect]);

  // Drag behavior
  function drag(simulation: d3.Simulation<any, undefined>) {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 z-10">
        <p className="text-sm text-gray-600">Scale: {transform.k.toFixed(2)}x</p>
      </div>
      <svg ref={svgRef} className="border border-gray-200 rounded-lg"></svg>
    </div>
  );
}