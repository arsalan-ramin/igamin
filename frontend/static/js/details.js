const backendBaseUrl = window.APP_CONFIG.backendBaseUrl;
const appId = window.APP_CONFIG.appId;

const title = document.getElementById("app-title");
const meta = document.getElementById("app-meta");
const capabilities = document.getElementById("capabilities");
const dependencies = document.getElementById("dependencies");
const documents = document.getElementById("documents");

function renderList(container, values) {
  container.innerHTML = "";
  if (!values || !values.length) {
    const li = document.createElement("li");
    li.textContent = "No data available.";
    container.appendChild(li);
    return;
  }

  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    container.appendChild(li);
  });
}

async function loadApplicationDetails() {
  try {
    const response = await fetch(`${backendBaseUrl}/api/applications/${appId}`);
    if (!response.ok) {
      throw new Error("Application not found");
    }

    const app = await response.json();
    title.textContent = app.name;
    meta.innerHTML = `
      <p><strong>Domain:</strong> ${app.domain}</p>
      <p>${app.description}</p>
      <p><strong>Tags:</strong> ${app.tags.join(", ") || "None"}</p>
    `;

    renderList(capabilities, app.capabilities);
    renderList(dependencies, app.dependencies);
    renderList(documents, app.documents);
  } catch (error) {
    meta.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

loadApplicationDetails();
