const backendBaseUrl = window.APP_CONFIG.backendBaseUrl;

const diagramContainer = document.getElementById("diagram-container");
const diagramFallback = document.getElementById("diagram-fallback");
const selectedAppPanel = document.getElementById("selected-app");
const selectedAppName = document.getElementById("selected-app-name");
const selectedAppSummary = document.getElementById("selected-app-summary");
const selectedAppDomain = document.getElementById("selected-app-domain");
const selectedAppTags = document.getElementById("selected-app-tags");
const selectedOpenLink = document.getElementById("selected-open-link");
const searchInput = document.getElementById("app-search");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const askButton = document.getElementById("ask-button");
const questionInput = document.getElementById("copilot-question");
const answerContainer = document.getElementById("copilot-answer");

const appById = new Map();
const graphNodeMeta = new Map();
let currentGraphData = { nodes: [], edges: [] };
let currentSelectedNodeId = null;

async function fetchApplications(query = "") {
  const url = new URL(`${backendBaseUrl}/api/applications`);
  if (query.trim()) {
    url.searchParams.set("q", query.trim());
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load applications");
  }
  return response.json();
}

async function fetchRelationships() {
  const response = await fetch(`${backendBaseUrl}/api/relationships`);
  if (!response.ok) {
    throw new Error("Failed to load relationships");
  }
  return response.json();
}

async function fetchApplicationDetail(id) {
  const response = await fetch(`${backendBaseUrl}/api/applications/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to load details for ${id}`);
  }
  return response.json();
}

function toTitleFromSlug(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function buildNodeLabel(id, fallback = "Component") {
  const labels = {
    "adobe-campaign-cloud": "Adobe Campaign Cloud",
    "spa-website": "SPA Website",
    "freshservice": "FreshService",
    "service-now": "ServiceNow",
    "moveit-sftp": "MoveIT SFTP",
    "itrak": "iTrak",
    "olp-utility": "OLPM Utility",
    "lottery-gateway": "Lottery Gateway",
    "lottery-transaction-services": "Lottery Transaction Services",
    "corporate-location-finder": "Corporate Location Finder",
    "retail-location-finder": "Retail Location Finder",
    "websphere-public-data": "WebSphere Public Data Services",
    "pas-db-app": "PAS DB and Application",
    "pas-esb": "PAS ESB Services",
    "sftp-file-share": "File Share"
  };

  return labels[id] || fallback;
}

function buildLayoutPositions() {
  // Left-to-right flow: Inputs (left) → Player Platform (center) → Outputs (right)
  // Using full canvas space: 1150 wide x 800 tall
  // Minimum spacing: 100px between node centers to avoid overlap (nodes are 62px tall)
  return {
    // LEFT: Input/Source Systems (x: 130, y: evenly distributed)
    "google-analytics": { x: 130, y: 70 },
    "adobe-campaign-cloud": { x: 130, y: 160 },
    "spa-website": { x: 130, y: 250 },
    "apple-store": { x: 130, y: 340 },
    "google-play": { x: 130, y: 430 },
    "paysafe": { x: 130, y: 520 },
    "canada-post": { x: 130, y: 610 },

    // CENTER: Core Platform (x: 450, y: middle)
    "player-platform": { x: 450, y: 360 },

    // RIGHT-MAIN: Immediate Outputs (x: 750, y: evenly spaced)
    "sports-betting": { x: 750, y: 70 },
    "betbuddy": { x: 750, y: 160 },
    "bede-lotto": { x: 750, y: 250 },
    "spine-apis": { x: 750, y: 430 },

    // RIGHT-ENTERPRISE: Enterprise Integration (x: 920-1020)
    "olga-p-link": { x: 920, y: 160 },
    "ms-dynamics": { x: 1020, y: 340 },

    // Supporting/Auxiliary systems on RIGHT-BOTTOM area (spread across x: 750-1050, y: 520-710)
    "olp-utility": { x: 450, y: 70 },
    "lottery-gateway": { x: 920, y: 70 },
    "lottery-transaction-services": { x: 1020, y: 70 },
    
    // Lower tier supporting systems (y: 520+)
    "corporate-location-finder": { x: 600, y: 530 },
    "retail-location-finder": { x: 750, y: 530 },
    "websphere-public-data": { x: 900, y: 530 },
    "itrak": { x: 750, y: 620 },
    "moveit-sftp": { x: 900, y: 620 },
    "pas-db-app": { x: 1050, y: 620 },
    "freshservice": { x: 750, y: 710 },
    "service-now": { x: 900, y: 710 },
    "pas-esb": { x: 1050, y: 710 }
  };
}

function formatEdgeLabel(value) {
  return String(value || "integrates")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildGraphData(applications, relationships) {
  const positions = buildLayoutPositions();
  const appMap = new Map(applications.map((app) => [app.id, app]));
  const nodes = [];
  const nodeById = new Map();

  const ensureNode = (id) => {
    if (nodeById.has(id)) {
      return nodeById.get(id);
    }

    const app = appMap.get(id);
    const label = app ? app.name : buildNodeLabel(id, toTitleFromSlug(id));
    const kind = app ? "app" : "external";
    const basePosition = positions[id] || null;
    const index = nodes.length;
    const node = {
      id,
      kind,
      label,
      domain: app?.domain || "Supporting System",
      x: basePosition?.x || 180 + (index % 6) * 140,
      y: basePosition?.y || 120 + Math.floor(index / 6) * 110
    };
    nodes.push(node);
    nodeById.set(id, node);
    return node;
  };

  applications.forEach((app) => ensureNode(app.id));

  relationships.forEach((relationship) => {
    ensureNode(relationship.source);
    ensureNode(relationship.target);
  });

  const edges = relationships.map((relationship) => ({
    id: `${relationship.source}->${relationship.target}`,
    source: relationship.source,
    target: relationship.target,
    label: formatEdgeLabel(relationship.relation || "integrates")
  }));

  return { nodes, edges };
}

function renderSelectedApplication(appId) {
  const app = appById.get(appId);
  if (!app) {
    return;
  }

  currentSelectedNodeId = appId;
  selectedAppPanel.hidden = false;
  selectedAppName.textContent = app.name;
  selectedAppSummary.textContent = app.description || app.short_description;
  selectedAppDomain.textContent = `Domain: ${app.domain}`;
  selectedAppTags.textContent = `Tags: ${(app.tags || []).join(", ") || "None"}`;
  selectedOpenLink.href = `/applications/${app.id}`;
  selectedOpenLink.hidden = false;
  selectedOpenLink.textContent = "Open details";
}

function renderSelectedExternal(nodeMeta) {
  currentSelectedNodeId = nodeMeta.id;
  selectedAppPanel.hidden = false;
  selectedAppName.textContent = nodeMeta.label;
  selectedAppSummary.textContent =
    "This is an external or supporting system shown in the architecture diagram.";
  selectedAppDomain.textContent = "Domain: External/Supporting Component";
  selectedAppTags.textContent = `Component key: ${nodeMeta.id}`;
  selectedOpenLink.hidden = true;
}

function renderGraph(graphData, selectedNodeId = null) {
  graphNodeMeta.clear();
  graphData.nodes.forEach((node) => graphNodeMeta.set(node.id, node));

  const activeConnections = new Set();
  const activeNodes = new Set();

  if (selectedNodeId) {
    activeNodes.add(selectedNodeId);
    graphData.edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        activeConnections.add(edge.id);
        activeNodes.add(edge.source);
        activeNodes.add(edge.target);
      }
    });
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1150 800");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
      <path d="M0,0 L10,4 L0,8 Z" fill="#0d7b69"></path>
    </marker>
  `;
  svg.appendChild(defs);

  const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  edgeLayer.setAttribute("class", "edge-layer");

  graphData.edges.forEach((edge) => {
    const source = graphNodeMeta.get(edge.source);
    const target = graphNodeMeta.get(edge.target);
    if (!source || !target) {
      return;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const curveOffset = Math.min(120, Math.max(40, Math.abs(dx) * 0.18));
    const c1x = source.x + dx * 0.35;
    const c1y = source.y + dy * 0.15 - curveOffset;
    const c2x = source.x + dx * 0.65;
    const c2y = source.y + dy * 0.15 + curveOffset;
    const pathData = `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;
    path.setAttribute("d", pathData);
    path.setAttribute("class", `edge ${activeConnections.has(edge.id) ? "active" : selectedNodeId ? "dimmed" : ""}`.trim());
    path.setAttribute("marker-end", "url(#arrowhead)");
    edgeLayer.appendChild(path);

    const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labelGroup.setAttribute("class", "edge-label-group");

    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("class", "edge-label");
    labelText.setAttribute("text-anchor", "middle");
    labelText.setAttribute("dominant-baseline", "middle");
    labelText.textContent = escapeXml(edge.label);

    const labelWidth = Math.max(100, edge.label.length * 7 + 28);
    const labelHeight = 28;
    const labelPathLength = path.getTotalLength();
    const midLength = labelPathLength / 2;
    
    const labelPoint = path.getPointAtLength(midLength);
    const nearbyDist = Math.min(30, labelPathLength / 8);
    const beforePoint = path.getPointAtLength(Math.max(0, midLength - nearbyDist));
    const afterPoint = path.getPointAtLength(Math.min(labelPathLength, midLength + nearbyDist));
    
    // Calculate tangent direction
    const tangentX = afterPoint.x - beforePoint.x;
    const tangentY = afterPoint.y - beforePoint.y;
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    
    // Perpendicular direction (rotate 90 degrees)
    const perpX = tangentLen > 0 ? -tangentY / tangentLen : 0;
    const perpY = tangentLen > 0 ? tangentX / tangentLen : 0;
    
    // Moderate offset to keep labels near the edge
    const offsetDist = 24;
    const labelX = labelPoint.x + perpX * offsetDist;
    const labelY = labelPoint.y + perpY * offsetDist;

    const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    labelBg.setAttribute("class", "edge-label-bg");
    labelBg.setAttribute("x", labelX - labelWidth / 2);
    labelBg.setAttribute("y", labelY - labelHeight / 2);
    labelBg.setAttribute("width", labelWidth);
    labelBg.setAttribute("height", labelHeight);
    labelBg.setAttribute("rx", 12);
    labelBg.setAttribute("ry", 12);

    labelText.setAttribute("x", labelX);
    labelText.setAttribute("y", labelY + 1);

    labelGroup.appendChild(labelBg);
    labelGroup.appendChild(labelText);
    edgeLayer.appendChild(labelGroup);
  });

  svg.appendChild(edgeLayer);

  const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodeLayer.setAttribute("class", "node-layer");

  graphData.nodes.forEach((node) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `node ${selectedNodeId === node.id ? "selected" : selectedNodeId && activeNodes.has(node.id) ? "active" : selectedNodeId ? "dimmed" : ""}`.trim());
    group.setAttribute("data-node-id", node.id);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const width = 170;
    const height = 62;
    rect.setAttribute("x", node.x - width / 2);
    rect.setAttribute("y", node.y - height / 2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    group.appendChild(rect);

    const pill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pill.setAttribute("class", "node-pill");
    pill.setAttribute("x", node.x - width / 2 + 10);
    pill.setAttribute("y", node.y - height / 2 + 10);
    pill.setAttribute("width", 10);
    pill.setAttribute("height", 10);
    pill.setAttribute("rx", 3);
    pill.setAttribute("ry", 3);
    group.appendChild(pill);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", node.x);
    label.setAttribute("y", node.y - 4);
    label.setAttribute("text-anchor", "middle");
    label.textContent = escapeXml(node.label.length > 22 ? `${node.label.slice(0, 22)}…` : node.label);
    group.appendChild(label);

    const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sublabel.setAttribute("x", node.x);
    sublabel.setAttribute("y", node.y + 16);
    sublabel.setAttribute("class", "node-subtext");
    sublabel.setAttribute("text-anchor", "middle");
    sublabel.textContent = escapeXml(node.kind === "app" ? node.domain : "Supporting system");
    group.appendChild(sublabel);

    group.addEventListener("click", () => {
      if (node.kind === "app") {
        renderSelectedApplication(node.id);
      } else {
        renderSelectedExternal(node);
      }
      renderGraph(currentGraphData, node.id);
    });

    nodeLayer.appendChild(group);
  });

  svg.appendChild(nodeLayer);
  diagramContainer.innerHTML = "";
  diagramContainer.appendChild(svg);
  diagramContainer.classList.add("ready");
}

function renderSearchResults(applications) {
  searchResults.innerHTML = "";

  if (!applications.length) {
    const empty = document.createElement("li");
    empty.textContent = "No applications found.";
    searchResults.appendChild(empty);
    return;
  }

  applications.forEach((app) => {
    const item = document.createElement("li");
    item.style.cursor = "pointer";
    item.innerHTML = `
      <a href="/applications/${app.id}">${app.name}</a>
      <p>${app.domain} - ${app.short_description}</p>
    `;
    
    // Add click handler to select in diagram
    item.addEventListener("click", (e) => {
      if (e.target.tagName !== "A") {
        e.preventDefault();
        // Select the application in the diagram
        renderSelectedApplication(app.id);
        renderGraph(currentGraphData, app.id);
      }
    });
    
    searchResults.appendChild(item);
  });
}

async function runSearch() {
  try {
    const apps = await fetchApplications(searchInput.value);
    renderSearchResults(apps);
  } catch (error) {
    searchResults.innerHTML = `<li>${error.message}</li>`;
  }
}

async function askCopilot() {
  const question = questionInput.value.trim();
  if (!question) {
    answerContainer.textContent = "Please enter a question first.";
    return;
  }

  answerContainer.textContent = "Thinking...";

  try {
    const response = await fetch(`${backendBaseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const payload = await response.json();
    answerContainer.innerHTML = `
      <p>${payload.answer}</p>
      <p><strong>Supporting applications:</strong> ${payload.supporting_applications.join(", ") || "None"}</p>
      <p><strong>Supporting documents:</strong> ${payload.supporting_documents.join(", ") || "None"}</p>
    `;
  } catch (error) {
    answerContainer.textContent = error.message;
  }
}

async function initDiagram() {
  try {
    const [summaries, relationships] = await Promise.all([
      fetchApplications(),
      fetchRelationships()
    ]);

    const details = await Promise.all(summaries.map((summary) => fetchApplicationDetail(summary.id)));
    details.forEach((app) => appById.set(app.id, app));

    currentGraphData = buildGraphData(details, relationships);
    renderGraph(currentGraphData, details[0]?.id || null);

    if (details.length) {
      renderSelectedApplication(details[0].id);
    }

    renderSearchResults(summaries);
  } catch (error) {
    diagramContainer.classList.remove("ready");
    diagramContainer.innerHTML = "";
    diagramFallback.style.display = "grid";
    diagramFallback.innerHTML = `<h3>Unable to render architecture diagram</h3><p class="error">${error.message}</p>`;
  }
}

searchButton.addEventListener("click", runSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});
askButton.addEventListener("click", askCopilot);

initDiagram();
