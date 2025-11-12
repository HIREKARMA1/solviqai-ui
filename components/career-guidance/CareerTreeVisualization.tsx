"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Rocket, Lightbulb, Brain, Trophy, Target, TrendingUp, Sparkles, Maximize2, Download, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TreeNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  layer: number;
  children?: string[];
}

interface TreeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Props {
  nodes: any[];
  edges: any[];
}

export default function CareerTreeVisualization({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  // Memoized particles - generate once
  const particles = useMemo(() => 
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2
    })), []
  );

  // Deterministic layout with collision avoidance
  const treeNodes: TreeNode[] = useMemo(() => {
    if (nodes.length === 0) return [];

    // Group by explicit layers based on y-coordinate
    const layers: { [key: number]: any[] } = {};
    
    nodes.forEach(node => {
      const y = node.position?.y || 0;
      const layer = Math.floor(y / 75); // More precise layering
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(node);
    });

    const layerKeys = Object.keys(layers).map(Number).sort((a, b) => a - b);
    const layoutedNodes: TreeNode[] = [];
    
    layerKeys.forEach((layerKey, layerIndex) => {
      const nodesInLayer = layers[layerKey];
      const layerY = layerIndex * 160 + 80;
      
      // Simple collision avoidance - sort by original x, then add spacing
      nodesInLayer.sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));
      
      const nodeWidth = 240;
      const minSpacing = 280;
      let currentX = 150;
      
      nodesInLayer.forEach((node) => {
        // Check for collision and adjust
        const proposedX = currentX;
        
        layoutedNodes.push({
          id: node.id,
          type: node.data?.type || 'unknown',
          label: node.data?.label || '',
          description: node.data?.description || '',
          color: node.data?.color || '#3b82f6',
          icon: node.data?.icon || '✨',
          x: proposedX,
          y: layerY,
          layer: layerIndex,
          children: edges
            .filter((e: any) => e.source === node.id)
            .map((e: any) => e.target)
        });
        
        currentX += minSpacing;
      });
    });

    return layoutedNodes;
  }, [nodes, edges]);

  const getIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'start': return <Rocket className={iconClass} aria-hidden="true" />;
      case 'interest': return <Lightbulb className={iconClass} aria-hidden="true" />;
      case 'technology': return <span role="img" aria-label="technology">💻</span>;
      case 'skill': return <Brain className={iconClass} aria-hidden="true" />;
      case 'tool': return <span role="img" aria-label="tool">🔧</span>;
      case 'value': return <Trophy className={iconClass} aria-hidden="true" />;
      case 'project': return <span role="img" aria-label="project">🚀</span>;
      case 'career': return <Target className={iconClass} aria-hidden="true" />;
      case 'company': return <span role="img" aria-label="company">🏢</span>;
      case 'roadmap': return <TrendingUp className={iconClass} aria-hidden="true" />;
      default: return <Sparkles className={iconClass} aria-hidden="true" />;
    }
  };

  const getGradient = (type: string) => {
    // Professional, sober color palette - suitable for corporate/professional environments
    switch (type) {
      case 'start': return 'from-slate-700 to-slate-800';           // Deep professional gray
      case 'interest': return 'from-blue-700 to-blue-800';          // Deep professional blue
      case 'technology': return 'from-indigo-700 to-slate-700';     // Indigo with slate
      case 'skill': return 'from-slate-600 to-gray-700';            // Sophisticated gray
      case 'tool': return 'from-blue-800 to-indigo-800';            // Deep technical blue
      case 'value': return 'from-gray-700 to-slate-800';            // Professional charcoal
      case 'project': return 'from-slate-700 to-indigo-700';        // Slate to indigo
      case 'career': return 'from-indigo-800 to-blue-900';          // Deep career blue
      case 'company': return 'from-gray-800 to-slate-800';          // Enterprise gray
      case 'roadmap': return 'from-blue-900 to-slate-900';          // Deep professional navy
      default: return 'from-gray-700 to-gray-800';
    }
  };

  // Get hex colors for SVG download
  const getGradientColors = (type: string): { from: string; to: string } => {
    switch (type) {
      case 'start': return { from: '#334155', to: '#1e293b' };        // slate-700 to slate-800
      case 'interest': return { from: '#1d4ed8', to: '#1e40af' };     // blue-700 to blue-800
      case 'technology': return { from: '#4338ca', to: '#334155' };   // indigo-700 to slate-700
      case 'skill': return { from: '#475569', to: '#374151' };        // slate-600 to gray-700
      case 'tool': return { from: '#1e40af', to: '#3730a3' };         // blue-800 to indigo-800
      case 'value': return { from: '#374151', to: '#1e293b' };        // gray-700 to slate-800
      case 'project': return { from: '#334155', to: '#4338ca' };      // slate-700 to indigo-700
      case 'career': return { from: '#3730a3', to: '#1e3a8a' };       // indigo-800 to blue-900
      case 'company': return { from: '#1f2937', to: '#1e293b' };      // gray-800 to slate-800
      case 'roadmap': return { from: '#1e3a8a', to: '#0f172a' };      // blue-900 to slate-900
      default: return { from: '#374151', to: '#1f2937' };             // gray-700 to gray-800
    }
  };

  // ResizeObserver instead of window resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger re-render if needed
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Add scroll-to-zoom functionality with smooth animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0005; // Reduced sensitivity for smoother control
      setScale(prev => {
        const newScale = prev + delta;
        return Math.min(Math.max(newScale, 0.3), 2);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle mouse drag to pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag with left mouse button, avoid text selection
      if (e.button !== 0) return;
      
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, offset]);

  // Calculate viewBox with extra top padding to avoid header overlap
  const padding = 100;
  const topPadding = 180; // Extra padding for header
  const allX = treeNodes.map(n => n.x);
  const allY = treeNodes.map(n => n.y);
  const minX = (allX.length > 0 ? Math.min(...allX) : 0) - padding;
  const minY = (allY.length > 0 ? Math.min(...allY) : 0) - topPadding;
  const maxX = (allX.length > 0 ? Math.max(...allX) : 1000) + padding + 280;
  const maxY = (allY.length > 0 ? Math.max(...allY) : 800) + padding + 120;
  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  const handleNodeHover = (nodeId: string, event: React.MouseEvent) => {
    setHoveredNode(nodeId);
    setTooltipPos({ x: event.clientX, y: event.clientY });
  };

  const handleNodeFocus = (nodeId: string, event: React.FocusEvent<HTMLDivElement>) => {
    setHoveredNode(nodeId);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 10 });
  };

  const downloadAsImage = async () => {
    if (!containerRef.current) return;

    try {
      // Helper function to wrap text for SVG
      const wrapText = (text: string, maxChars: number): string[] => {
        if (text.length <= maxChars) return [text];
        
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (testLine.length <= maxChars) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        
        if (currentLine) lines.push(currentLine);
        
        // If still too many lines, truncate
        if (lines.length > 2) {
          lines[1] = lines[1].substring(0, maxChars - 3) + '...';
          return lines.slice(0, 2);
        }
        
        return lines;
      };

      // Create a pure SVG (without foreignObject) for download
      const scaleFactor = 2; // Higher resolution
      const width = viewBoxWidth * scaleFactor;
      const height = viewBoxHeight * scaleFactor;

      // Create SVG string
      let svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}">
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" />
            </linearGradient>
          </defs>
          
          <!-- Background -->
          <rect x="${minX}" y="${minY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#0f172a"/>
          
          <!-- Edges -->
      `;

      // Add edges
      edges.forEach((edge) => {
        const sourceNode = treeNodes.find(n => n.id === edge.source);
        const targetNode = treeNodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const startX = sourceNode.x + 120;
        const startY = sourceNode.y + 50;
        const endX = targetNode.x + 120;
        const endY = targetNode.y + 20;
        const midY = (startY + endY) / 2;
        const path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
        
        svgContent += `<path d="${path}" fill="none" stroke="url(#edge-gradient)" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`;
      });

      // Add nodes as native SVG
      treeNodes.forEach((node) => {
        const gradient = getGradientColors(node.type);
        
        // Wrap text if too long (max 25 chars for single line)
        const labelLines = wrapText(node.label, 25);
        
        svgContent += `
          <g>
            <!-- Node background -->
            <defs>
              <linearGradient id="grad-${node.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${gradient.from}" />
                <stop offset="100%" stop-color="${gradient.to}" />
              </linearGradient>
            </defs>
            <rect x="${node.x}" y="${node.y}" width="240" height="100" rx="12" fill="url(#grad-${node.id})" stroke="white" stroke-width="2" opacity="0.95"/>
            
            <!-- Node label (multi-line support) -->`;
        
        if (labelLines.length === 1) {
          // Single line - centered vertically
          svgContent += `
            <text x="${node.x + 120}" y="${node.y + 45}" font-family="Inter, sans-serif" font-size="15" font-weight="600" fill="white" text-anchor="middle">${labelLines[0]}</text>`;
        } else {
          // Multiple lines - adjust positioning
          labelLines.forEach((line, idx) => {
            const yOffset = node.y + 35 + (idx * 16);
            svgContent += `
            <text x="${node.x + 120}" y="${yOffset}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle">${line}</text>`;
          });
        }
        
        svgContent += `
            <text x="${node.x + 120}" y="${node.y + 75}" font-family="Inter, sans-serif" font-size="11" fill="white" fill-opacity="0.7" text-anchor="middle">${node.type.toUpperCase()}</text>
          </g>
        `;
      });

      svgContent += '</svg>';

      // Convert to blob and download
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // For PNG conversion
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'career-journey.png';
            a.click();
            URL.revokeObjectURL(pngUrl);
          }
        });
        
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        console.error('Failed to load SVG image');
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setScale(1); // Reset zoom when toggling fullscreen
  };

  return (
    <div className={`relative bg-gradient-to-br from-slate-950 via-slate-900 to-gray-900 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full'}`}>
      {/* Close button for fullscreen */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-[10000] p-3 bg-slate-900/90 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-slate-800 transition-colors shadow-2xl"
          aria-label="Exit fullscreen"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      
      <div ref={containerRef} className={`relative ${isFullscreen ? 'w-screen h-screen' : 'w-full h-full'}`}>
      {/* Simplified background particles */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
            />
          ))}
        </div>
      )}

      {/* Single transformed container for SVG and HTML nodes */}
      <div 
        className="w-full h-full relative"
        style={{ 
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' // Smooth easing
        }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Elbow edges - vertical then horizontal */}
          {edges.map((edge, idx) => {
            const sourceNode = treeNodes.find(n => n.id === edge.source);
            const targetNode = treeNodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            const startX = sourceNode.x + 120;
            const startY = sourceNode.y + 50;
            const endX = targetNode.x + 120;
            const endY = targetNode.y + 20;
            
            // Elbow path
            const midY = (startY + endY) / 2;
            const path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
            
            return (
              <motion.path
                key={edge.id}
                d={path}
                fill="none"
                stroke="url(#edge-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={shouldReduceMotion ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : idx * 0.05 }}
              />
            );
          })}

          {/* Render nodes inside SVG using foreignObject for perfect alignment */}
          {treeNodes.map((node, idx) => (
            <foreignObject
              key={node.id}
              x={node.x}
              y={node.y}
              width="240"
              height="100"
            >
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  delay: shouldReduceMotion ? 0 : idx * 0.05
                }}
                whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
                onMouseEnter={(e) => handleNodeHover(node.id, e)}
                onMouseLeave={() => setHoveredNode(null)}
                onFocus={(e) => handleNodeFocus(node.id, e)}
                onBlur={() => setHoveredNode(null)}
                tabIndex={0}
                role="button"
                aria-label={`${node.label} - ${node.type}`}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl"
              >
                <div
                  className={`
                    px-5 py-3 rounded-xl shadow-lg border border-white/30
                    bg-gradient-to-br ${getGradient(node.type)}
                    text-white backdrop-blur-sm
                    hover:border-white/50 transition-colors duration-200
                  `}
                >
                  <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-white/95 text-[10px] font-semibold rounded-md text-gray-800 shadow">
                    {node.icon}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/25 rounded-lg flex-shrink-0">
                      {getIcon(node.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs leading-tight line-clamp-2">{node.label}</div>
                      {node.description && (
                        <div className="text-[10px] opacity-80 line-clamp-1 mt-0.5">{node.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </foreignObject>
          ))}
        </svg>
      </div>

      {/* Portal-based tooltip - no layout impact */}
      {hoveredNode && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, 8px)'
            }}
          >
            {(() => {
              const node = treeNodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              
              return (
                <div className="bg-gray-900/98 backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl border border-white/20 max-w-xs">
                  <div className="text-white text-xs font-semibold">{node.label}</div>
                  {node.description && (
                    <div className="text-gray-300 text-[10px] mt-0.5">{node.description}</div>
                  )}
                  <div className="text-gray-400 text-[10px] mt-1">{node.icon} {node.type}</div>
                </div>
              );
            })()}
            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/98 rotate-45 border-l border-t border-white/20" />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Cleaner header */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none z-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 backdrop-blur-md border border-white/25 rounded-xl px-4 py-2.5 shadow-lg pointer-events-auto inline-flex items-center gap-2"
        >
          <div className="p-2 bg-white/15 rounded-lg">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Career Journey</h3>
            <p className="text-white/70 text-xs">{treeNodes.length} nodes • {edges.length} paths</p>
          </div>
        </motion.div>
      </div>

      {/* Functional zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-20">
        <button 
          onClick={() => setScale(prev => Math.min(prev + 0.2, 2))}
          className="p-2.5 bg-slate-900/85 backdrop-blur-md border border-white/25 rounded-lg text-white hover:bg-slate-800 transition-colors text-lg font-bold shadow-lg"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          onClick={() => setScale(prev => Math.max(prev - 0.2, 0.3))}
          className="p-2.5 bg-slate-900/85 backdrop-blur-md border border-white/25 rounded-lg text-white hover:bg-slate-800 transition-colors text-lg font-bold shadow-lg"
          aria-label="Zoom out"
        >
          −
        </button>
        <button 
          onClick={() => setScale(1)}
          className="p-2.5 bg-slate-900/85 backdrop-blur-md border border-white/25 rounded-lg text-white hover:bg-slate-800 transition-colors text-sm shadow-lg"
          aria-label="Reset zoom"
        >
          ⤢
        </button>
      </div>

      {/* Fullscreen and Download controls */}
      <div className={`${isFullscreen ? 'fixed' : 'absolute'} bottom-4 right-4 flex flex-col gap-1.5 ${isFullscreen ? 'z-[9999]' : 'z-20'}`}>
        <button 
          onClick={toggleFullscreen}
          className="p-2.5 bg-slate-900/85 backdrop-blur-md border border-white/25 rounded-lg text-white hover:bg-slate-800 transition-colors shadow-lg group"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen view"}
        >
          {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        <button 
          onClick={downloadAsImage}
          className="p-2.5 bg-slate-900/85 backdrop-blur-md border border-white/25 rounded-lg text-white hover:bg-slate-800 transition-colors shadow-lg group"
          aria-label="Download as image"
          title="Download career map"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
    </div>
  );
}
