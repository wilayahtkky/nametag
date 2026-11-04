// https://script.google.com/macros/s/AKfycbzHlhpshcFr1NncAr-bhXPtSU_2dIme025zYQK1DBrd3hAXUaYs_vEehd4JT3hGb-fn/exec

const API_URL = "https://script.google.com/macros/s/AKfycbzHlhpshcFr1NncAr-bhXPtSU_2dIme025zYQK1DBrd3hAXUaYs_vEehd4JT3hGb-fn/exec";

// Master sequence ordered by user requirement
const ORDERED_EVENTS = [
  "Sosialisasi Bulan Keluarga, 20 Nov 2026, Pk. 19.00 - 21.00 WIB",
  "Sakramen Tobat, 08 Des 2026, pk. 18.30 WIB",
  "Sakramen Tobat, 09 Des 2026, pk. 18.30 WIB",
  "Sakramen Tobat, 10 Des 2026, pk. 18.30 WIB",
  "Sakramen Tobat, 11 Des 2026, pk. 18.30 WIB",
  "Misa Malam Natal, 24 Des 2026, Pk. 17.00 WIB",
  "Misa Malam Natal, 24 Des 2026, Pk. 20.30 WIB",
  "Misa Natal Pontifikal, 25 Des 2026, Pk. 08.30 WIB"
];

document.addEventListener("DOMContentLoaded", () => {
  fetchReportData();
});

function fetchReportData() {
  const container = document.getElementById("reportAccordionContainer");
  container.innerHTML = `<p class="loading-text">Memuat rekapitulasi data petugas...</p>`;

  // Remove previous jsonp script tag if existing
  const oldScript = document.getElementById("jsonpReportScript");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "jsonpReportScript";
  script.src = `${API_URL}?action=getReport&callback=handleReportData`;
  
  script.onerror = (err) => {
    console.error("Gagal memuat data report:", err);
    container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat data rekapitulasi. Periksa koneksi atau Apps Script.</p>`;
  };
  
  document.body.appendChild(script);
}

// Global callback function for JSONP
window.handleReportData = function(response) {
  const container = document.getElementById("reportAccordionContainer");
  
  // Normalize data array whether response is wrapped or direct array
  const rawData = Array.isArray(response) ? response : (response.data || response.submissions || []);

  if (!rawData || rawData.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#666;">Belum ada data petugas yang terdaftar.</p>`;
    return;
  }

  // Structure: { [eventName]: { [seksiName]: [ { dutyName, submittedBy, phone } ] } }
  const grouped = {};

  rawData.forEach(row => {
    // Handle both array format [Seksi, Event, NamaPengisi, Phone, NamaPetugas] or Object format
    const seksi = (Array.isArray(row) ? row[0] : row.seksi) || "Lainnya";
    const eventName = (Array.isArray(row) ? row[1] : row.event) || "Lain-lain";
    const submittedBy = (Array.isArray(row) ? row[2] : row.namaPengisi) || "";
    const phone = (Array.isArray(row) ? row[3] : row.phonePengisi) || "";
    const dutyName = (Array.isArray(row) ? row[4] : row.name) || "";

    if (!dutyName) return;

    if (!grouped[eventName]) grouped[eventName] = {};
    if (!grouped[eventName][seksi]) grouped[eventName][seksi] = [];

    grouped[eventName][seksi].push({ dutyName, submittedBy, phone });
  });

  // Sort Event Keys: First according to ORDERED_EVENTS sequence, then any unscheduled remaining events
  const presentEvents = Object.keys(grouped);
  const sortedEvents = ORDERED_EVENTS.filter(e => presentEvents.includes(e));
  
  // Include any events returned by backend that weren't in fixed list
  presentEvents.forEach(e => {
    if (!sortedEvents.includes(e)) sortedEvents.push(e);
  });

  if (sortedEvents.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#666;">Belum ada data petugas yang terdaftar.</p>`;
    return;
  }

  renderReportAccordion(sortedEvents, grouped);
};

function renderReportAccordion(sortedEvents, grouped) {
  const container = document.getElementById("reportAccordionContainer");
  container.innerHTML = "";

  sortedEvents.forEach((eventName, index) => {
    const seksiMap = grouped[eventName];
    
    // Count total people in this event
    let totalPersonsInEvent = 0;
    Object.values(seksiMap).forEach(list => totalPersonsInEvent += list.length);

    const item = document.createElement("div");
    item.className = "accordion-item";

    // Build Seksi / Sub-seksi HTML blocks
    let seksiContentHtml = "";
    Object.keys(seksiMap).sort().forEach(seksiName => {
      const personList = seksiMap[seksiName];
      
      const namesListHtml = personList.map((p, idx) => `
        <li class="person-name-item">
          <span class="person-index">${idx + 1}.</span> <strong>${escapeHtml(p.dutyName)}</strong>
          ${p.submittedBy ? `<span class="submitter-info">(PIC: ${escapeHtml(p.submittedBy)})</span>` : ""}
        </li>
      `).join("");

      seksiContentHtml += `
        <div class="report-seksi-block">
          <div class="report-seksi-title">📌 ${escapeHtml(seksiName)} (${personList.length} orang)</div>
          <ol class="report-person-list">
            ${namesListHtml}
          </ol>
        </div>
      `;
    });

    item.innerHTML = `
      <div class="accordion-header report-header" onclick="toggleReportAccordion(${index})">
        <div>
          <strong>${escapeHtml(eventName)}</strong>
          <span class="badge-count">${totalPersonsInEvent} Petugas</span>
        </div>
        <span id="report-icon-${index}" class="accordion-icon">+</span>
      </div>
      <div class="accordion-content" id="report-content-${index}">
        ${seksiContentHtml}
      </div>
    `;

    container.appendChild(item);
  });
}

function toggleReportAccordion(index) {
  const content = document.getElementById(`report-content-${index}`);
  const icon = document.getElementById(`report-icon-${index}`);
  
  const isActive = content.classList.contains("active");
  content.classList.toggle("active", !isActive);
  icon.textContent = isActive ? "+" : "−";
}

function toggleAllAccordions(expand) {
  const contents = document.querySelectorAll("#reportAccordionContainer .accordion-content");
  const icons = document.querySelectorAll("#reportAccordionContainer .accordion-icon");

  contents.forEach((c) => c.classList.toggle("active", expand));
  icons.forEach((i) => i.textContent = expand ? "−" : "+");
}

function escapeHtml(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}