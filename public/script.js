// Sample Paper Data
const papers = [
  {
    subject: "Operating Systems",
    semester: "SEM 1",
    batch: "2022-2026",
    season: "Summer 2024",
    link: "pdfs/os_summer_2024.pdf"
  },
  {
    subject: "Database Management System",
    semester: "SEM 1",
    batch: "2021-2025",
    season: "Winter 2023",
    link: "pdfs/dbms_winter_2023.pdf"
  }
  // Add more paper entries here
];

// Element selectors
const batchTabs = document.querySelectorAll('.batch-tab');
const semesterTabsWrapper = document.getElementById('semesterTabsWrapper');
const semesterTabs = document.querySelectorAll('.sem-tab');
const papersContainer = document.getElementById('papersContainer');
const instructionText = document.getElementById('instructionText');

// Set tab active style
function setActiveTab(tabs, activeTab) {
  tabs.forEach(tab => tab.classList.remove('bg-indigo-600', 'text-white'));
  activeTab.classList.add('bg-indigo-600', 'text-white');
}

// Display filtered papers
function showPapers(batch, semester) {
  const filtered = papers.filter(p => p.batch === batch && p.semester === semester);
  papersContainer.innerHTML = "";

  if (filtered.length === 0) {
    papersContainer.innerHTML = `<p class="text-gray-400 text-center col-span-2">No papers found.</p>`;
    return;
  }

  filtered.forEach(paper => {
    const card = document.createElement('div');
    card.className = "paper-card bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300";

    card.innerHTML = `
      <h3 class="text-xl font-semibold mb-2 text-indigo-400">${paper.subject}</h3>
      <p class="text-sm text-gray-400 mb-4">${paper.semester} | ${paper.batch} | ${paper.season}</p>
      <div class="flex gap-4">
        <a href="${paper.link}" target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
         View
        </a>
        <a href="${paper.link}" download class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Download
        </a>
      </div>
    `;
    papersContainer.appendChild(card);
  });
}

// Init values
let currentBatch = null;
let currentSem = null;

// Handle batch selection
batchTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    currentBatch = tab.dataset.batch;
    setActiveTab(batchTabs, tab);

    // Show semester tabs
    semesterTabsWrapper.classList.remove('hidden');

    // Reset all semester tabs active states
    semesterTabs.forEach(s => s.classList.remove('bg-indigo-600', 'text-white'));

    // Reset instruction text & papers
    instructionText.textContent = "Select a semester to view papers.";
    papersContainer.innerHTML = "";

    // Important: Do not preselect any semester or load papers yet!
    currentSem = null;
  });
});

// Handle semester selection
semesterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (!currentBatch) {
      instructionText.textContent = "Please select a batch first.";
      return;
    }
    currentSem = tab.dataset.sem;
    setActiveTab(semesterTabs, tab);
    showPapers(currentBatch, currentSem);
  });
});




 // Highlight Active Link FOR MOBILE MENU 
  const currentPage = location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("text-indigo-400", "underline");
    } else {
      link.classList.add("text-gray-200", "hover:text-indigo-400");
    }
  });

//   // Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

    // document.getElementById('uploadForm').addEventListener('submit', function (e) {
    //   e.preventDefault();

    //   const batch = document.getElementById('batch').value;
    //   const semester = document.getElementById('semester').value;
    //   const season = document.getElementById('season').value;
    //   const subject = document.getElementById('subject').value;
    //   const subjectcode = document.getElementById('subject code').value;
    //   const file = document.getElementById('file').files[0];

    //   if (!batch || !semester || !season || !subject || subjectcode || !file) {
    //     alert('Please fill all fields and upload a PDF.');
    //     return;
    //   }

    //   alert(`Paper uploaded:\n${subject} | ${batch} | ${semester} | ${season} | ${subjectcode}`);
    //   // Yaha tum backend API call karke file save karoge
    // });
 
   


  // FORGOT.html
  
document.getElementById('forgotForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const newPassword = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();

      if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword })
        });
        const data = await res.json();

        if (data.success) {
          alert('Password reset successful! You can now login.');
          window.location.href = 'login.html';
        } else {
          alert(data.error || 'Password reset failed');
        }
      } catch (err) {
        alert('Network error');
        console.error(err);
      }
    });
