const config = window.APP_CONFIG;
const configured =
  config?.supabaseUrl &&
  config?.supabaseAnonKey &&
  !config.supabaseUrl.includes("TU-PROYECTO") &&
  config.supabaseAnonKey !== "TU_CLAVE_PUBLICA";

const views = {
  auth: document.querySelector("#auth-view"),
  dashboard: document.querySelector("#dashboard-view"),
};
const modal = document.querySelector("#incident-modal");
const recordsList = document.querySelector("#records-list");
const loadingState = document.querySelector("#loading-state");
const emptyState = document.querySelector("#empty-state");
const authMessage = document.querySelector("#auth-message");
const incidentMessage = document.querySelector("#incident-message");
let records = [];
let toastTimer;
let currentUserId = null;

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle("hidden", key !== name);
  });
}

function setMessage(element, text, success = false) {
  element.textContent = text;
  element.style.color = success ? "#1b5949" : "#a23d32";
}

function authErrorMessage(error) {
  if (error?.message?.toLowerCase().includes("email rate limit exceeded")) {
    return "Se han solicitado demasiados enlaces. Espera unos minutos y vuelve a intentarlo.";
  }

  return error?.message ?? "No se pudo completar el acceso.";
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

if (!configured) {
  setMessage(
    authMessage,
    "Falta configurar Supabase. Abre app-config.js e introduce la URL y la clave pública del proyecto."
  );
}
else {
  document.title = `${document.title} · ${config.version}`;
}

const client = configured
  ? supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      db: { schema: "incidencias" },
    })
  : null;

async function loadRecords() {
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  recordsList.innerHTML = "";

  const { data, error } = await client
    .from("registros")
    .select("*")
    .order("fecha_incidencia", { ascending: false })
    .order("created_at", { ascending: false });

  loadingState.classList.add("hidden");

  if (error) {
    showToast(`No se pudo cargar el registro: ${error.message}`);
    return;
  }

  records = data;
  renderRecords();
  updateStats();
}

function filteredRecords() {
  const search = document.querySelector("#search-input").value.trim().toLowerCase();
  const date = document.querySelector("#date-filter").value;

  return records.filter((record) => {
    const matchesText =
      !search ||
      record.aula_ubicacion.toLowerCase().includes(search) ||
      record.nombre_profesor.toLowerCase().includes(search) ||
      record.incidencia.toLowerCase().includes(search);
    const matchesDate = !date || record.fecha_incidencia >= date;
    return matchesText && matchesDate;
  });
}

function renderRecords() {
  const visibleRecords = filteredRecords();
  document.querySelector("#record-summary").textContent =
    `${visibleRecords.length} ${visibleRecords.length === 1 ? "registro visible" : "registros visibles"}`;

  emptyState.classList.toggle("hidden", visibleRecords.length > 0);
  recordsList.innerHTML = visibleRecords
    .map(
      (record) => `
        <article class="record">
          <div>
            <div class="record-location">${escapeHtml(record.aula_ubicacion)}</div>
            <span class="record-date">${formatDate(record.fecha_incidencia)}</span>
          </div>
          <div class="record-meta">
            <strong>${escapeHtml(record.nombre_profesor)}</strong>
            Profesor/a
          </div>
          <div class="record-description">${escapeHtml(record.incidencia)}</div>
          ${
            record.creado_por === currentUserId
              ? `<button class="delete-button" type="button" data-delete-id="${record.id}">
                  Eliminar
                </button>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function updateStats() {
  const today = isoDate();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoIso = isoDate(weekAgo);

  document.querySelector("#total-count").textContent = records.length;
  document.querySelector("#today-count").textContent = records.filter(
    (record) => record.fecha_incidencia === today
  ).length;
  document.querySelector("#week-count").textContent = records.filter(
    (record) => record.fecha_incidencia >= weekAgoIso
  ).length;
}

async function handleSession(session) {
  if (!session) {
    records = [];
    currentUserId = null;
    showView("auth");
    return;
  }

  currentUserId = session.user.id;
  document.querySelector("#user-email").textContent = session.user.email;
  showView("dashboard");
  await loadRecords();
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return;

  if (window.location.protocol === "file:") {
    setMessage(
      authMessage,
      "Para recibir un enlace válido, abre la aplicación publicada en Vercel."
    );
    return;
  }

  setMessage(authMessage, "Enviando el enlace de acceso...", true);
  const { error } = await client.auth.signInWithOtp({
    email: document.querySelector("#login-email").value,
    options: { emailRedirectTo: config.publicUrl },
  });

  if (error) {
    setMessage(authMessage, authErrorMessage(error));
    return;
  }

  setMessage(
    authMessage,
    "Enlace enviado. Revisa tu correo y pulsa el enlace para entrar.",
    true
  );
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await client.auth.signOut();
});

document.querySelector("#open-modal-button").addEventListener("click", () => {
  document.querySelector("#incident-date").value = isoDate();
  setMessage(incidentMessage, "");
  modal.showModal();
});

function closeModal() {
  modal.close();
  document.querySelector("#incident-form").reset();
  setMessage(incidentMessage, "");
}

document.querySelector("#close-modal-button").addEventListener("click", closeModal);
document.querySelector("#cancel-modal-button").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.querySelector("#incident-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(incidentMessage, "Guardando...", true);

  const {
    data: { user },
  } = await client.auth.getUser();
  const { error } = await client.from("registros").insert({
    aula_ubicacion: document.querySelector("#incident-location").value.trim(),
    nombre_profesor: document.querySelector("#incident-teacher").value.trim(),
    incidencia: document.querySelector("#incident-description").value.trim(),
    fecha_incidencia: document.querySelector("#incident-date").value,
    creado_por: user.id,
  });

  if (error) {
    setMessage(incidentMessage, error.message);
    return;
  }

  closeModal();
  showToast("Incidencia registrada.");
  await loadRecords();
});

recordsList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  if (!confirm("¿Quieres eliminar esta incidencia del registro compartido?")) return;

  const { error } = await client.from("registros").delete().eq("id", button.dataset.deleteId);
  if (error) {
    showToast(`No se pudo eliminar: ${error.message}`);
    return;
  }

  showToast("Incidencia eliminada.");
  await loadRecords();
});

document.querySelector("#search-input").addEventListener("input", renderRecords);
document.querySelector("#date-filter").addEventListener("change", renderRecords);

if (client) {
  client.auth.onAuthStateChange((_event, session) => handleSession(session));
  client.auth.getSession().then(({ data }) => handleSession(data.session));
}
