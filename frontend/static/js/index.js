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
const mermaidNodeMeta = new Map();
let currentSelectedNodeKey = null;

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

function sanitizeNodeId(appId) {
  return `app_${appId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function makeExternalNodeId(rawId) {
  return `ext_${rawId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function toTitleFromSlug(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeMermaidLabel(text) {
  return String(text).replace(/"/g, "\\\"");
}

function classForApp(app) {
  const domain = (app.domain || "").toLowerCase();
  if (domain.includes("core")) return "knownCore";
  if (domain.includes("lottery")) return "knownLottery";
  if (domain.includes("integration") || domain.includes("enterprise")) return "knownIntegration";
  if (domain.includes("payments") || domain.includes("identity") || domain.includes("distribution")) return "knownGateway";
  if (domain.includes("sportsbook")) return "knownSports";
  if (domain.includes("crm")) return "knownExternal";
  return "knownGeneral";
}

function renderSelectedApplication(appId) {
  const app = appById.get(appId);
  if (!app) {
    return;
  }

  currentSelectedNodeKey = sanitizeNodeId(appId);
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
  currentSelectedNodeKey = nodeMeta.nodeId;
  selectedAppPanel.hidden = false;
  selectedAppName.textContent = nodeMeta.displayName;
  selectedAppSummary.textContent =
    "This is an external or supporting system shown in the architecture diagram.";
  selectedAppDomain.textContent = "Domain: External/Supporting Component";
  selectedAppTags.textContent = `Component key: ${nodeMeta.id}`;
  selectedOpenLink.hidden = true;
}

function highlightSelectedNode() {
  const svg = diagramContainer.querySelector("svg");
  if (!svg) {
    return;
  }

  const nodeGroups = svg.querySelectorAll("g.node");

  nodeGroups.forEach((group) => {
    group.classList.remove("is-selected");
    if (currentSelectedNodeKey && group.id.includes(currentSelectedNodeKey)) {
      group.classList.add("is-selected");
    }
  });
}

function nodeMetaFromRenderedNode(nodeGroupId) {
  for (const [mermaidNodeId, nodeMeta] of mermaidNodeMeta.entries()) {
    if (nodeGroupId.includes(mermaidNodeId)) {
      return nodeMeta;
    }
  }
  return null;
}

function bindDiagramNodeEvents() {
  const svg = diagramContainer.querySelector("svg");
  if (!svg) {
    return;
  }

  svg.querySelectorAll("g.node").forEach((group) => {
    group.addEventListener("click", () => {
      const nodeMeta = nodeMetaFromRenderedNode(group.id);
      if (!nodeMeta) {
        return;
      }

      if (nodeMeta.kind === "app") {
        renderSelectedApplication(nodeMeta.id);
      } else {
        renderSelectedExternal(nodeMeta);
      }

      highlightSelectedNode();
    });
  });
}

function buildMermaidDefinition(applications, relationships) {
  mermaidNodeMeta.clear();

  const lines = [
    "flowchart TB",
    "classDef knownGeneral fill:#d9efe8,stroke:#3b7f71,stroke-width:1.2px,color:#143a31;",
    "classDef knownCore fill:#5ea75f,color:#ffffff,stroke:#2f6e30,stroke-width:1.5px;",
    "classDef knownLottery fill:#4f57a8,color:#ffffff,stroke:#2f3577,stroke-width:1.5px;",
    "classDef knownIntegration fill:#3d6da8,color:#ffffff,stroke:#294f7b,stroke-width:1.5px;",
    "classDef knownGateway fill:#8e3f35,color:#ffffff,stroke:#6c2e27,stroke-width:1.4px;",
    "classDef knownSports fill:#cd7ca7,color:#ffffff,stroke:#9d5f80,stroke-width:1.4px;",
    "classDef knownExternal fill:#b45c94,color:#ffffff,stroke:#84406c,stroke-width:1.4px;",
    "classDef external fill:#d7ecff,stroke:#4d7ea6,stroke-dasharray: 5 3,color:#1f4969;",
    "classDef zone fill:#fff6cf,stroke:#d3c98f,stroke-dasharray: 4 3,color:#5f5842;"
  ];

  const appMap = new Map(applications.map((app) => [app.id, app]));
  const relMap = new Map(
    relationships.map((rel) => [`${rel.source}->${rel.target}`, rel.relation])
  );

  const externalNodeLabels = {
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

  const getKnownNode = (id) => {
    const app = appMap.get(id);
    if (!app) return null;
    const nodeId = sanitizeNodeId(app.id);
    const label = escapeMermaidLabel(app.name);
    mermaidNodeMeta.set(nodeId, {
      kind: "app",
      id: app.id,
      nodeId,
      displayName: app.name
    });
    return { nodeId, label, cssClass: classForApp(app) };
  };

  const getExternalNode = (id) => {
    const nodeId = makeExternalNodeId(id);
    const displayName = externalNodeLabels[id] || toTitleFromSlug(id);
    const label = escapeMermaidLabel(displayName);
    mermaidNodeMeta.set(nodeId, {
      kind: "external",
      id,
      nodeId,
      displayName
    });
    return { nodeId, label };
  };

  const nodeDecl = new Set();
  const ensureNode = (nodeId, label, cssClass) => {
    if (!nodeDecl.has(nodeId)) {
      lines.push(`${nodeId}["${label}"]`);
      lines.push(`class ${nodeId} ${cssClass};`);
      nodeDecl.add(nodeId);
    }
  };

  lines.push("subgraph zone_player_device[Player Device]");
  [
    "google-analytics",
    "paysafe",
    "canada-post",
    "apple-store",
    "google-play",
    "sports-betting"
  ].forEach((id) => {
    const node = getKnownNode(id);
    if (node) ensureNode(node.nodeId, node.label, node.cssClass);
  });
  lines.push("end");

  lines.push("subgraph zone_player_platform[Player Platform]");
  ["player-platform", "betbuddy", "bede-lotto", "spine-apis"].forEach((id) => {
    const node = getKnownNode(id);
    if (node) ensureNode(node.nodeId, node.label, node.cssClass);
  });
  const olpm = getExternalNode("olp-utility");
  ensureNode(olpm.nodeId, olpm.label, "external");
  lines.push("end");

  lines.push("subgraph zone_lottery_services[Lottery Services Platform]");
  ["corporate-location-finder", "retail-location-finder", "websphere-public-data"].forEach((id) => {
    const node = getExternalNode(id);
    ensureNode(node.nodeId, node.label, "external");
  });
  lines.push("end");

  lines.push("subgraph zone_lottery_app[Lottery Application]");
  ["lottery-gateway", "lottery-transaction-services"].forEach((id) => {
    const node = getExternalNode(id);
    ensureNode(node.nodeId, node.label, "external");
  });
  lines.push("end");

  lines.push("subgraph zone_reporting[Reporting Platform]");
  ["freshservice", "service-now"].forEach((id) => {
    const node = getExternalNode(id);
    ensureNode(node.nodeId, node.label, "external");
  });
  lines.push("end");

  lines.push("subgraph zone_enterprise[Enterprise and Operations]");
  const pLink = getKnownNode("olga-p-link");
  if (pLink) ensureNode(pLink.nodeId, pLink.label, pLink.cssClass);
  const msDynamics = getKnownNode("ms-dynamics");
  if (msDynamics) ensureNode(msDynamics.nodeId, msDynamics.label, msDynamics.cssClass);
  ["itrak", "moveit-sftp", "pas-db-app", "pas-esb", "sftp-file-share"].forEach((id) => {
    const node = getExternalNode(id);
    ensureNode(node.nodeId, node.label, "external");
  });
  lines.push("end");

  [
    ["google-analytics", "spa-website"],
    ["paysafe", "player-platform"],
    ["canada-post", "player-platform"],
    ["sports-betting", "player-platform"],
    ["sports-betting", "betbuddy"],
    ["player-platform", "bede-lotto"],
    ["player-platform", "spine-apis"],
    ["spine-apis", "olga-p-link"],
    ["olga-p-link", "ms-dynamics"],
    ["google-analytics", "adobe-campaign-cloud"],
    ["bede-lotto", "lottery-gateway"],
    ["lottery-gateway", "lottery-transaction-services"],
    ["olga-p-link", "itrak"],
    ["olga-p-link", "moveit-sftp"],
    ["freshservice", "service-now"],
    ["service-now", "ms-dynamics"]
  ].forEach(([source, target]) => {
    const sourceNode = appMap.has(source)
      ? sanitizeNodeId(source)
      : makeExternalNodeId(source);
    const targetNode = appMap.has(target)
      ? sanitizeNodeId(target)
      : makeExternalNodeId(target);

    if (!nodeDecl.has(sourceNode)) {
      const external = getExternalNode(source);
      ensureNode(sourceNode, external.label, "external");
    }
    if (!nodeDecl.has(targetNode)) {
      const external = getExternalNode(target);
      ensureNode(targetNode, external.label, "external");
    }

    const key = `${source}->${target}`;
    const label = relMap.get(key) || "integrates";
    lines.push(`${sourceNode} -->|${escapeMermaidLabel(label)}| ${targetNode}`);
  });

  lines.push("class zone_player_device,zone_player_platform,zone_lottery_services,zone_lottery_app,zone_reporting,zone_enterprise zone;");

  return lines.join("\n");
}

async function renderMermaidArchitecture(applications, relationships) {
  const graph = buildMermaidDefinition(applications, relationships);

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    flowchart: {
      useMaxWidth: true,
      curve: "basis"
    },
    themeVariables: {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      primaryTextColor: "#113229",
      lineColor: "#1a7a69",
      edgeLabelBackground: "#f3f9f6"
    }
  });

  const renderResult = await mermaid.render("architecture-mermaid", graph);
  diagramContainer.innerHTML = renderResult.svg;
  diagramContainer.classList.add("ready");
  bindDiagramNodeEvents();
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
    item.innerHTML = `
      <a href="/applications/${app.id}">${app.name}</a>
      <p>${app.domain} - ${app.short_description}</p>
    `;
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

    await renderMermaidArchitecture(details, relationships);

    if (details.length) {
      renderSelectedApplication(details[0].id);
      highlightSelectedNode();
    }

    renderSearchResults(summaries);
  } catch (error) {
    diagramContainer.classList.remove("ready");
    diagramContainer.innerHTML = "";
    diagramFallback.style.display = "grid";
    diagramFallback.innerHTML = `<h3>Unable to render Mermaid diagram</h3><p class=\"error\">${error.message}</p>`;
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
