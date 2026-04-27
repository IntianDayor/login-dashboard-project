// View Resume Script // 

fetch("../api/get-resumes.php")
    .then(res => res.json())
    .then(data => {
        const container = document.querySelector(".resume-content");

        if (data.length === 0) {
            container.innerHTML = "<p>No resume uploaded yet.</p>";
            return;
        }

        const resume = data[0];
        
        container.innerHTML = `
        <h3 style="
            text-align: center; 
            margin: 10px;"
            >
            Christian Dior Feraer's Latest Resume
            </h3>

        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: 100%; 
            height: calc(100vh - 120px);">

            <iframe 
                src="../assets/uploads/resumes/${resume.file_path}" 
                style="
                    width: 100%; 
                    height: 100%; 
                    border: 1px solid #ccc; 
                    border-radius: 12px;">
            </iframe>

        </div>

        <div style="
            text-align: center; 
            margin-top: 10px;">

            <a href="../assets/uploads/resumes/${resume.file_path}" target="_blank"
                style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4a90d9;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 500;
                    transition: background-color 0.3s;"
                    onmouseover="this.style.backgroundColor='#357abd'"
                    onmouseout="this.style.backgroundColor='#4a90d9'"
                    >
                    Open Fullscreen
                    </a>

        </div>
    `;
    })
    .catch(error => {
        alert("Error loading resume");
    });