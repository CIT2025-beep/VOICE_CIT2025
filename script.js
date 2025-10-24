window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none";
});
setTimeout(() => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none";
}, 4000);
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const complaintSection = document.getElementById("complaint-section");
const adminPanel = document.getElementById("admin-panel");
const anonymousBtn = document.getElementById("anonymous-btn");
const complaintsList = document.getElementById("complaints-list");
const studentComplaintsList = document.getElementById("student-complaints-list");
const studentLogoutBtn = document.querySelector("#complaint-section #logout-btn");
const adminLogoutBtn = document.querySelector("#admin-panel #logout-btn");
let currentUser = "";
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "admin") {
    currentUser = "admin";
    loginSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    loadComplaints();
  } else if (username && password) {
    currentUser = username;
    loginSection.classList.add("hidden");
    complaintSection.classList.remove("hidden");
    loadStudentComplaints(currentUser);
  } else {
    alert("Please enter valid credentials.");
  }
});
anonymousBtn.addEventListener("click", () => {
  currentUser = "Anonymous";
  loginSection.classList.add("hidden");
  complaintSection.classList.remove("hidden");
  loadStudentComplaints(currentUser);
});
if (studentLogoutBtn) {
  studentLogoutBtn.addEventListener("click", () => {
    currentUser = "";
    complaintSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
    document.getElementById("login-form").reset();
  });
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", () => {
    currentUser = "";
    adminPanel.classList.add("hidden");
    loginSection.classList.remove("hidden");
    document.getElementById("login-form").reset();
  });
}
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
const complaintForm = document.getElementById("complaint-form");
complaintForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("category").value;
  const details = document.getElementById("details").value.trim();
  const evidenceFile = document.getElementById("evidence").files[0];

  if (!category || !details) return alert("Please complete all fields.");

  let evidenceData = "No file";
  if (evidenceFile) {
    evidenceData = await toBase64(evidenceFile);
  }

  const complaintData = {
    name: currentUser,
    email: currentUser === "Anonymous" ? "" : `${currentUser}@cit.edu`,
    complaint: `[${category}] ${details}`,
    evidence: evidenceData,
    status: "Submitted",
    statusTime: new Date().toLocaleString(),
  };

  try {
    const res = await fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaintData),
    });

    if (res.ok) {
      alert("Complaint submitted successfully!");
      complaintForm.reset();
      loadStudentComplaints(currentUser);
    } else {
      alert("Failed to submit complaint.");
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
});
async function loadComplaints() {
  complaintsList.innerHTML = "Loading complaints...";
  try {
    const res = await fetch("http://localhost:3000/complaints");
    const complaints = await res.json();

    if (!complaints.length) {
      complaintsList.innerHTML = "<p>No complaints submitted yet.</p>";
      return;
    }

    complaintsList.innerHTML = "";
    complaints.forEach(c => {
      const div = document.createElement("div");
      div.classList.add("complaint-card");

      const imageHTML = c.evidence && c.evidence !== "No file"
        ? `<img src="${c.evidence}" alt="Evidence" class="evidence-img" />`
        : "<p><em>No evidence provided</em></p>";

      let color;
      switch (c.status) {
        case "Submitted": color = "blue"; break;
        case "In Review": color = "red"; break;
        case "Pending": color = "orange"; break;
        case "Resolved": color = "green"; break;
        default: color = "black";
      }

      div.innerHTML = `
        <p><strong>From:</strong> ${c.name || "Anonymous"}</p>
        <p><strong>Complaint:</strong> ${c.complaint}</p>
        <p>
          <strong>Status:</strong>
          <select class="status-select" data-id="${c._id}">
            <option ${c.status==="Submitted"?"selected":""}>Submitted</option>
            <option ${c.status==="In Review"?"selected":""}>In Review</option>
            <option ${c.status==="Pending"?"selected":""}>Pending</option>
            <option ${c.status==="Resolved"?"selected":""}>Resolved</option>
          </select>
          <span style="color:${color}">(${c.statusTime || ""})</span>
        </p>
        ${imageHTML}
        <hr>
      `;
      complaintsList.appendChild(div);
    });
    document.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async (e) => {
        const id = e.target.getAttribute("data-id");
        const status = e.target.value;
        const statusTime = new Date().toLocaleString();

        await fetch(`http://localhost:3000/complaints/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, statusTime }),
        });

        loadComplaints();
        loadStudentComplaints(currentUser); 
      });
    });
    document.querySelectorAll(".evidence-img").forEach(img => {
      img.addEventListener("click", () => {
        const lightbox = document.createElement("div");
        lightbox.id = "lightbox-overlay";
        lightbox.innerHTML = `<img src="${img.src}" alt="Evidence Preview" />`;
        document.body.appendChild(lightbox);
        lightbox.style.display = "flex";
        lightbox.addEventListener("click", () => lightbox.remove());
      });
    });

  } catch (err) {
    console.error(err);
    complaintsList.innerHTML = "<p>Error loading complaints.</p>";
  }
}
async function loadStudentComplaints(studentName) {
  if (!studentName) return;
  studentComplaintsList.innerHTML = "Loading your complaints...";
  try {
    const res = await fetch("http://localhost:3000/complaints");
    const complaints = await res.json();

    const userComplaints = complaints.filter(
      c => c.name === studentName || (studentName === "Anonymous" && c.name === "Anonymous")
    );

    if (!userComplaints.length) {
      studentComplaintsList.innerHTML = "<p>No complaints submitted yet.</p>";
      return;
    }

    studentComplaintsList.innerHTML = "";
    userComplaints.forEach(c => {
      const div = document.createElement("div");
      div.classList.add("student-complaint-card");

      const imageHTML = c.evidence && c.evidence !== "No file"
        ? `<img src="${c.evidence}" alt="Evidence" class="evidence-img" />`
        : "<p><em>No evidence provided</em></p>";

      let color;
      switch (c.status) {
        case "Submitted": color = "blue"; break;
        case "In Review": color = "red"; break;
        case "Pending": color = "orange"; break;
        case "Resolved": color = "green"; break;
        default: color = "black";
      }

      div.innerHTML = `
        <p><strong>Complaint:</strong> ${c.complaint}</p>
        <p><strong>Status:</strong> <span style="color:${color}; font-weight:bold;">${c.status}</span> (${c.statusTime || ""})</p>
        ${imageHTML}
        <hr>
      `;
      studentComplaintsList.appendChild(div);
    });
    document.querySelectorAll(".evidence-img").forEach(img => {
      img.addEventListener("click", () => {
        const lightbox = document.createElement("div");
        lightbox.id = "lightbox-overlay";
        lightbox.innerHTML = `<img src="${img.src}" alt="Evidence Preview" />`;
        document.body.appendChild(lightbox);
        lightbox.style.display = "flex";
        lightbox.addEventListener("click", () => lightbox.remove());
      });
    });

  } catch (err) {
    console.error(err);
    studentComplaintsList.innerHTML = "<p>Error loading complaints.</p>";
  }
}
setInterval(() => {
  if (currentUser === "admin") {
    loadComplaints();
  } else if (currentUser) {
    loadStudentComplaints(currentUser);
  }
}, 5000);





