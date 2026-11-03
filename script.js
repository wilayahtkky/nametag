// https://script.google.com/macros/s/AKfycbxS2MZWtUyveEo6FyKHfsL5sNLkWTCIJlCyaPRbtMHmoGrmrOCJXEJWvv4esYBSzsO8/exec

// bu lili : https://script.google.com/macros/s/AKfycbxMlmOLvluWXR8fSP4lh6z4Jy8Fm5PZtpVE3N4hX5r51qw1ARkuHQtbUg4Ku5KQHuM/exec

document.addEventListener('DOMContentLoaded', () => {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxS2MZWtUyveEo6FyKHfsL5sNLkWTCIJlCyaPRbtMHmoGrmrOCJXEJWvv4esYBSzsO8/exec';

  // Tanggal batas pendaftaran: 06 Desember 2026 23:59:59 WIB
  const DEADLINE_DATE = new Date('2026-12-06T23:59:59+07:00');

  const form = document.getElementById('registrationForm');
  const closedMessage = document.getElementById('closedMessage');
  const needNametagRadios = document.querySelectorAll('input[name="needNametag"]');
  const nametagSection = document.getElementById('nametagSection');
  const nameOnTagInput = document.getElementById('nameOnTag');
  const previewText = document.getElementById('previewText');
  const sectionOtherCheckbox = document.getElementById('sectionOtherCheckbox');
  const otherSectionInput = document.getElementById('otherSection');
  const submitBtn = document.getElementById('submitBtn');

  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDetails = document.getElementById('modalDetails');

  // Pengecekan Batas Waktu Pendaftaran
  const now = new Date();
  if (now > DEADLINE_DATE) {
    form.classList.add('hidden');
    closedMessage.classList.remove('hidden');
    return;
  }

  // Toggle Section Name Tag berdasarkan Pilihan Radio
  needNametagRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'YA') {
        nametagSection.classList.remove('hidden');
        nameOnTagInput.required = true;
      } else {
        nametagSection.classList.add('hidden');
        nameOnTagInput.required = false;
        nameOnTagInput.value = '';
        previewText.textContent = '';
      }
    });
  });

  // Toggle Custom Input Seksi
  if (sectionOtherCheckbox) {
    sectionOtherCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        otherSectionInput.classList.remove('hidden');
        otherSectionInput.required = true;
      } else {
        otherSectionInput.classList.add('hidden');
        otherSectionInput.required = false;
        otherSectionInput.value = '';
      }
    });
  }

  // Live Name Tag Text Preview
  if (nameOnTagInput && previewText) {
    nameOnTagInput.addEventListener('input', (e) => {
      previewText.textContent = e.target.value;
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    // Seksi
    const sectionCheckboxes = document.querySelectorAll('input[name="section"]:checked');
    let sectionArray = Array.from(sectionCheckboxes).map(cb => cb.value);
    if (sectionArray.includes('Other')) {
      sectionArray = sectionArray.map(val => val === 'Other' ? otherSectionInput.value : val);
    }
    const finalSection = sectionArray.join(' | ');

    // Jadwal
    const jadwalCheckboxes = document.querySelectorAll('input[name="jadwal"]:checked');
    const jadwalArray = Array.from(jadwalCheckboxes).map(cb => cb.value);
    const finalJadwal = jadwalArray.join(' | ');

    // Need Name Tag
    const needNametagVal = document.querySelector('input[name="needNametag"]:checked')?.value || 'TIDAK';
    const finalNameOnTag = needNametagVal === 'YA' ? nameOnTagInput.value : '-';
    const completeNameVal = document.getElementById('completeName').value;
    const phoneVal = document.getElementById('phone').value;
    const emailVal = document.getElementById('email').value || '-';

    const payload = {
      botField: document.getElementById('botField').value,
      completeName: completeNameVal,
      section: finalSection,
      needNametag: needNametagVal,
      nameOnTag: finalNameOnTag,
      phone: phoneVal,
      jadwal: jadwalArray,
      email: emailVal
    };

    try {
      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        // Tampilkan Rincian Data di Modal Popup
        modalDetails.innerHTML = `
          <p><strong>Nama Lengkap:</strong> ${completeNameVal}</p>
          <p><strong>Seksi / Sub-seksi:</strong> ${finalSection || '-'}</p>
          <p><strong>Memerlukan Name Tag:</strong> ${needNametagVal}</p>
          ${needNametagVal === 'YA' ? `<p><strong>Nama di Name Tag:</strong> ${finalNameOnTag}</p>` : ''}
          <p><strong>No HP / WA:</strong> ${phoneVal}</p>
          <p><strong>Jadwal Tugas:</strong><br>${jadwalArray.length > 0 ? jadwalArray.map(j => `• ${j}`).join('<br>') : '-'}</p>
          <p><strong>Email:</strong> ${emailVal}</p>
        `;

        // Buka PopUp Modal menggunakan showModal()
        if (typeof successModal.showModal === 'function') {
          successModal.showModal();
        } else {
          alert('Registrasi Berhasil!');
        }

        form.reset();
        nametagSection.classList.add('hidden');
        otherSectionInput.classList.add('hidden');
        previewText.textContent = '';
      } else {
        alert('Terjadi kesalahan: ' + result.message);
      }
    } catch (error) {
      alert('Network error. Pastikan Web App URL sudah benar.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Registrasi';
    }
  });

  // Tombol Tutup Modal
  closeModalBtn.addEventListener('click', () => {
    successModal.close();
  });
});