//https://script.google.com/macros/s/AKfycbzHlhpshcFr1NncAr-bhXPtSU_2dIme025zYQK1DBrd3hAXUaYs_vEehd4JT3hGb-fn/exec

//https://script.google.com/macros/s/AKfycbzHlhpshcFr1NncAr-bhXPtSU_2dIme025zYQK1DBrd3hAXUaYs_vEehd4JT3hGb-fn/exec

const API_URL = "https://script.google.com/macros/s/AKfycbzHlhpshcFr1NncAr-bhXPtSU_2dIme025zYQK1DBrd3hAXUaYs_vEehd4JT3hGb-fn/exec";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Memuat data dari Google Sheet...");
  fetchFormData();
  setupFormSubmit();
  setupSeksiToggle();
});

// Load data using JSONP to bypass CORS on GET requests
function fetchFormData() {
  const script = document.createElement("script");
  script.src = `${API_URL}?callback=handleFormData`;
  
  script.onerror = (err) => {
    console.error("Gagal meload script JSONP:", err);
    document.getElementById("accordionContainer").innerHTML = 
      `<p style="color:red;">Gagal memuat data event. Periksa URL Apps Script.</p>`;
  };
  
  document.body.appendChild(script);
}

// Global callback function for JSONP
window.handleFormData = function(data) {
  console.log("Data berhasil diterima dari Google Sheet:", data);
  if (!data || !data.groups || !data.events) {
    console.error("Format data tidak sesuai:", data);
    return;
  }
  populateGroups(data.groups);
  buildAccordion(data.events);
};

function populateGroups(groups) {
  const select = document.getElementById("seksiSelect");
  
  groups.forEach(group => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    select.appendChild(option);
  });

  // Ensure "Lainnya: (tuliskan)" option exists if not returned by backend sheet
  const hasLainnya = groups.some(g => String(g).toLowerCase().includes("lainnya"));
  if (!hasLainnya) {
    const optionLainnya = document.createElement("option");
    optionLainnya.value = "Lainnya";
    optionLainnya.textContent = "Lainnya: (tuliskan)";
    select.appendChild(optionLainnya);
  }
}

function setupSeksiToggle() {
  const select = document.getElementById("seksiSelect");
  const lainnyaGroup = document.getElementById("seksiLainnyaGroup");
  const lainnyaInput = document.getElementById("seksiLainnya");

  select.addEventListener("change", () => {
    const isLainnya = select.value.toLowerCase().includes("lainnya");
    if (isLainnya) {
      lainnyaGroup.classList.remove("hidden");
      lainnyaInput.required = true;
    } else {
      lainnyaGroup.classList.add("hidden");
      lainnyaInput.required = false;
      lainnyaInput.value = "";
    }
  });
}

function buildAccordion(events) {
  const container = document.getElementById("accordionContainer");
  container.innerHTML = "";

  events.forEach((eventName, index) => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    item.innerHTML = `
      <div class="accordion-header" onclick="toggleAccordion(${index})">
        <span>${eventName}</span>
        <span id="icon-${index}">+</span>
      </div>
      <div class="accordion-content" id="content-${index}">
        <div class="count-input-group">
          <label>Banyak Orang yang bertugas :</label>
          <input type="number" id="count-${index}" min="1" max="100" placeholder="0">
          <button type="button" class="btn-confirm" onclick="generatePersonFields(${index}, '${escapeHtml(eventName)}')">Confirm</button>
        </div>
        <div id="fields-${index}" class="fields-container"></div>
      </div>
    `;

    container.appendChild(item);
  });
}

function toggleAccordion(index) {
  const content = document.getElementById(`content-${index}`);
  const icon = document.getElementById(`icon-${index}`);
  
  const isActive = content.classList.contains("active");
  content.classList.toggle("active", !isActive);
  icon.textContent = isActive ? "+" : "−";
}

function generatePersonFields(index, eventName) {
  const countInput = document.getElementById(`count-${index}`);
  const fieldsContainer = document.getElementById(`fields-${index}`);
  const count = parseInt(countInput.value, 10);

  fieldsContainer.innerHTML = "";

  if (isNaN(count) || count <= 0) {
    if (countInput.value !== "") {
      alert("Masukkan jumlah orang bertugas yang valid (minimal 1).");
    }
    return;
  }

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "person-input";
    div.dataset.event = eventName;
    div.innerHTML = `
      <label>Nama Petugas ${i} :</label>
      <input type="text" class="duty-person-name" placeholder="Nama Petugas ${i}" required>
    `;
    fieldsContainer.appendChild(div);
  }
}

function setupFormSubmit() {
  const form = document.getElementById("registrationForm");
  const responseMsg = document.getElementById("responseMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectValue = document.getElementById("seksiSelect").value;
    const lainnyaVal = document.getElementById("seksiLainnya").value.trim();
    
    // Use custom written text if "Lainnya" is selected
    const seksi = selectValue.toLowerCase().includes("lainnya") && lainnyaVal 
      ? `Lainnya: ${lainnyaVal}` 
      : selectValue;

    const namaPengisi = document.getElementById("namaPengisi").value;
    const rawPhone = document.getElementById("phonePengisi").value;
    const phonePengisi = rawPhone ? `'${rawPhone}` : "";

    const personInputs = document.querySelectorAll(".duty-person-name");
    const entries = [];

    personInputs.forEach(input => {
      const nameVal = input.value.trim();
      const eventName = input.parentElement.dataset.event;
      if (nameVal !== "") {
        entries.push({
          event: eventName,
          name: nameVal
        });
      }
    });

    if (entries.length === 0) {
      alert("Silakan konfirmasi dan isi minimal satu nama petugas pada jadwal event.");
      return;
    }

    const payload = {
      seksi,
      namaPengisi,
      phonePengisi,
      entries
    };

    responseMsg.style.color = "#000";
    responseMsg.textContent = "Mengirim data...";

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        }
      });

      responseMsg.style.color = "green";
      responseMsg.textContent = "Data petugas berhasil disimpan! Terima kasih.";
      form.reset();
      document.getElementById("seksiLainnyaGroup").classList.add("hidden");
      document.querySelectorAll(".fields-container").forEach(c => c.innerHTML = "");
      console.log("Data berhasil dikirim ke spreadsheet.");

    } catch (err) {
      console.error("Error saat submit:", err);
      responseMsg.style.color = "red";
      responseMsg.textContent = "Terjadi kesalahan koneksi. Silakan coba lagi.";
    }
  });
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}