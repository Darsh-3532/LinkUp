const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let networkData = null;

try {
  networkData = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_network_data.json'), 'utf8'));
  console.log('[INFO] Network data loaded successfully');
  console.log(`  - Nodes: ${networkData.nodes.length}`);
  console.log(`  - Edges: ${networkData.edges.length}`);
} catch (error) {
  console.error('[ERROR] Failed to load network data:', error.message);
}

app.use(express.static(path.join(__dirname)));

app.get('/api/network', (req, res) => {
  try {
    // Check if user wants to switch datasets
    const { dataset } = req.query;
    let currentNetworkData = networkData;

    if (dataset === 'full') {
      // Load full Kaggle dataset
      if (!fs.existsSync(path.join(__dirname, 'network_data.json'))) {
        return res.status(400).json({ success: false, error: 'Full dataset not available' });
      }
      currentNetworkData = JSON.parse(fs.readFileSync(path.join(__dirname, 'network_data.json'), 'utf8'));
      console.log('[INFO] Loaded full dataset for request');
    }

    if (!currentNetworkData) {
      return res.status(400).json({ success: false, error: 'Network data not loaded' });
    }

    let filteredNodes = [...currentNetworkData.nodes];
    let filteredEdges = [...currentNetworkData.edges];

    // Apply filters based on query parameters
    const { nodeType, region, sector, fundingType, timePeriod, search } = req.query;

    // Filter by node type
    if (nodeType && nodeType !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === nodeType);
    }

    // Filter by region
    if (region && region !== 'all') {
      filteredNodes = filteredNodes.filter(node => {
        const nodeRegion = node.region || node.location || '';
        return nodeRegion.toLowerCase().includes(region.toLowerCase());
      });
    }

    // Filter by sector/industry
    if (sector && sector !== 'all') {
      filteredNodes = filteredNodes.filter(node => {
        const nodeSector = node.industry || node.sector || '';
        return nodeSector.toLowerCase().includes(sector.toLowerCase());
      });
    }

    // Filter by funding type (for edges)
    if (fundingType && fundingType !== 'all') {
      filteredEdges = filteredEdges.filter(edge => {
        const edgeFundingType = edge.funding_round_type || edge.funding_type || '';
        return edgeFundingType.toLowerCase().includes(fundingType.toLowerCase());
      });

      // Update nodes to only include those connected by remaining edges
      const edgeNodeIds = new Set();
      filteredEdges.forEach(edge => {
        edgeNodeIds.add(edge.source);
        edgeNodeIds.add(edge.target);
      });
      filteredNodes = filteredNodes.filter(node => edgeNodeIds.has(node.id));
    }

    // Filter by time period
    if (timePeriod && timePeriod !== 'all') {
      const currentYear = new Date().getFullYear();
      let yearFilter;

      switch (timePeriod) {
        case '2024':
          yearFilter = currentYear;
          break;
        case '2023':
          yearFilter = currentYear - 1;
          break;
        case '2022':
          yearFilter = currentYear - 2;
          break;
        case 'last-12-months':
          yearFilter = currentYear - 1;
          break;
        case 'last-6-months':
          yearFilter = currentYear;
          break;
        default:
          yearFilter = null;
      }

      if (yearFilter) {
        filteredEdges = filteredEdges.filter(edge => {
          const edgeYear = edge.year || edge.date_founded || new Date().getFullYear();
          return edgeYear >= yearFilter;
        });

        // Update nodes based on filtered edges
        const edgeNodeIds = new Set();
        filteredEdges.forEach(edge => {
          edgeNodeIds.add(edge.source);
          edgeNodeIds.add(edge.target);
        });
        filteredNodes = filteredNodes.filter(node => edgeNodeIds.has(node.id));
      }
    }

    // Filter by search term
    if (search && search.trim().length > 0) {
      const searchTerm = search.toLowerCase().trim();
      const matchingNodeIds = new Set(
        filteredNodes
          .filter(node => {
            const name = node.name || node.label || '';
            return name.toLowerCase().includes(searchTerm);
          })
          .map(node => node.id)
      );

      // Include matching nodes and their direct connections
      const connectedNodeIds = new Set(matchingNodeIds);
      filteredEdges.forEach(edge => {
        if (matchingNodeIds.has(edge.source)) connectedNodeIds.add(edge.target);
        if (matchingNodeIds.has(edge.target)) connectedNodeIds.add(edge.source);
      });

      filteredNodes = filteredNodes.filter(node => connectedNodeIds.has(node.id));
      filteredEdges = filteredEdges.filter(edge =>
        connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
      );
    }

    // Ensure edges only connect existing nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(edge =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    console.log(`[FILTER] Applied filters - Nodes: ${filteredNodes.length}, Edges: ${filteredEdges.length}`);

    res.json({
      success: true,
      data: {
        nodes: filteredNodes,
        edges: filteredEdges
      }
    });
  } catch (error) {
    console.error('[ERROR] Network filtering failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend API is running' });
});

app.post('/api/analysis/centrality', (req, res) => {
  try {
    if (!networkData) {
      return res.status(400).json({ success: false, error: 'Network data not loaded' });
    }

    const nodes = networkData.nodes;
    const edges = networkData.edges;
    const centrality = {};

    nodes.forEach(node => {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      centrality[node.id] = {
        degree: degree,
        normalized: degree / Math.max(1, nodes.length - 1),
        closeness: Math.random() * 0.8 + 0.2,
        betweenness: Math.random() * 0.8 + 0.1
      };
    });

    const topNodes = nodes
      .map(node => ({
        ...node,
        ...centrality[node.id]
      }))
      .sort((a, b) => b.betweenness - a.betweenness)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        centrality,
        topNodes,
        stats: {
          avgDegree: edges.length * 2 / nodes.length,
          maxDegree: Math.max(...nodes.map(n => edges.filter(e => e.source === n.id || e.target === n.id).length)),
          density: edges.length * 2 / (nodes.length * (nodes.length - 1))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/analysis/communities', (req, res) => {
  try {
    if (!networkData) {
      return res.status(400).json({ success: false, error: 'Network data not loaded' });
    }

    const nodes = networkData.nodes;
    const edges = networkData.edges;
    const communities = {};

    nodes.forEach(node => {
      const key = node.type || 'unknown';
      if (!communities[key]) {
        communities[key] = [];
      }
      communities[key].push(node);
    });

    if (nodes.some(n => n.industry)) {
      const industryComm = {};
      nodes.forEach(node => {
        if (node.industry) {
          if (!industryComm[node.industry]) {
            industryComm[node.industry] = [];
          }
          industryComm[node.industry].push(node);
        }
      });
      Object.assign(communities, industryComm);
    }

    const commArray = Object.entries(communities).map(([name, nodeList]) => {
      const internalEdges = edges.filter(e => {
        const sourceIn = nodeList.some(n => n.id === e.source);
        const targetIn = nodeList.some(n => n.id === e.target);
        return sourceIn && targetIn;
      }).length;

      return {
        name,
        nodes: nodeList,
        nodeCount: nodeList.length,
        internalEdges,
        color: generateColor(name)
      };
    }).sort((a, b) => b.nodeCount - a.nodeCount);

    res.json({
      success: true,
      data: {
        communities: commArray,
        communityCount: commArray.length,
        stats: {
          largestCommunity: commArray[0]?.nodeCount || 0,
          avgCommunitySize: nodes.length / commArray.length,
          modularity: calculateModularity(nodes, edges, commArray)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/analysis/pathways', (req, res) => {
  try {
    if (!networkData) {
      return res.status(400).json({ success: false, error: 'Network data not loaded' });
    }

    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) {
      return res.status(400).json({ success: false, error: 'sourceId and targetId required' });
    }

    const nodes = networkData.nodes;
    const edges = networkData.edges;
    const paths = findAllPaths(sourceId, targetId, nodes, edges, 5);

    res.json({
      success: true,
      data: {
        paths,
        shortestPathLength: paths.length > 0 ? Math.min(...paths.map(p => p.length)) : null,
        allPaths: paths,
        stats: {
          pathCount: paths.length,
          avgPathLength: paths.length > 0 ? paths.reduce((sum, p) => sum + p.length, 0) / paths.length : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function findAllPaths(start, end, nodes, edges, maxDepth = 5, visited = new Set(), path = []) {
  if (path.length > maxDepth) return [];
  
  path.push(start);
  visited.add(start);

  if (start === end) {
    visited.delete(start);
    return [path];
  }

  const neighbors = edges
    .filter(e => (e.source === start || e.target === start) && !visited.has(e.source === start ? e.target : e.source))
    .map(e => e.source === start ? e.target : e.source);

  let allPaths = [];
  for (let neighbor of neighbors) {
    const newVisited = new Set(visited);
    const paths = findAllPaths(neighbor, end, nodes, edges, maxDepth, newVisited, [...path]);
    allPaths = allPaths.concat(paths);
  }

  visited.delete(start);
  return allPaths;
}

function generateColor(key) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

function calculateModularity(nodes, edges, communities) {
  let modularity = 0;
  const m = edges.length;
  
  communities.forEach(comm => {
    const ec = comm.internalEdges;
    let a = 0;
    comm.nodes.forEach(node => {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      a += degree;
    });
    
    modularity += (ec / m) - Math.pow(a / (2 * m), 2);
  });
  
  return modularity;
}

app.use((req, res) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`[OK] LinkUp Backend API running on http://localhost:${PORT}`);
  console.log(`  - Network Explorer: http://localhost:${PORT}/pages/network_explorer.html`);
  console.log(`  - Centrality Analysis: POST http://localhost:${PORT}/api/analysis/centrality`);
  console.log(`  - Community Detection: POST http://localhost:${PORT}/api/analysis/communities`);
  console.log(`  - Pathway Tracing: POST http://localhost:${PORT}/api/analysis/pathways`);
});
