// --- VALIDATION FUNCTIONS (Pure: no global side effects) ---
function validatePhone(text) {
    const phoneRegex = /^\+?\d{7,15}$/; // General international phone, adjust if needed
    // const phoneRegex = /^\+994\d{9}$/; // Specific for Azerbaijan +994XXXXXXXXX
    return phoneRegex.test(text);
}

function validateEmail(text) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
}

document.addEventListener('DOMContentLoaded', async () => {
    // No global validationErr needed here if we check on save.
    // let validationErr = false; // This variable is no longer the primary control for saving.

    // --- DATA ---
    const localData = localStorage.getItem('userData');
    if (localData) {
        userData = JSON.parse(localData);
    } else {
        try {
            const res = await fetch('data.json');
            if (!res.ok) throw new Error('Failed to fetch data.json');
            userData = await res.json();
        } catch (err) {
            console.error("Error loading user data:", err);
            userData = {}; // Fallback to empty object to prevent crashes
        }
    }
    
    let isEditing = false; // Keep isEditing state within DOMContentLoaded

    // --- RENDER FUNCTIONS ---
    const createList = (array, iconPath = "") => {
        return array.map(item => {
            // Use icon property for more reliable type detection
            const isPhone = item.icon === "phone.png";
            const isEmail = item.icon === "email.png";
            const isAddress = item.icon === "location.png"; // Example for address

            let className = '';
            if (isPhone) className = 'phone';
            else if (isEmail) className = 'email';
            else if (isAddress) className = 'address-field'; // Use a class for address if it's a p

            if (isPhone || isEmail) { // Phone and Email are inputs
                return `
                    <div class="editable">
                        <img src="photos/${iconPath}${item.icon}" alt="${className}" class="icon">
                        <input type="text" class="${className}" value="${item.text}" ${!isEditing ? 'disabled' : ''} />
                    </div>
                `;
            } else { // Address and other items (e.g. social media) are P tags
                return `
                    <p class="editable ${className}" contenteditable="${isEditing}">
                        <img src="photos/${iconPath}${item.icon}" alt="icon" class="icon">
                        ${item.text}
                    </p>
                `;
            }
        }).join('');
    };
    
    // Simpler create functions, contenteditable will be managed by editBtn
    const createEducation = (array) => array.map(item => `<p><strong>${item.period}</strong><br>${item.school}</p>`).join('');
    const createSkills = (array) => `<ul style="list-style-type: none;">${array.map(skill => `<li>${skill}</li>`).join('')}</ul>`;
    const createWork = (array) => array.map(job => `<div><p><strong>${job.title}</strong></p><ul style="list-style-type: none;">${job.details.map(d => `<li>${d}</li>`).join('')}</ul></div>`).join('');
    const createCertifications = (array) => array.map(cert => `<div><p><strong>${cert.name}</strong></p><p>${cert.description}</p></div>`).join('');
    const createProjects = (array) => array.map(project => `<div><p><strong>${project.name}</strong></p><p>${project.description}</p></div>`).join('');

    function renderPageContent() {
        document.getElementById('userName').innerHTML = userData.name;
        document.getElementById('userTitle').textContent = userData.title;

        document.getElementById('contactInfo').innerHTML = createList(userData.contact);
        document.getElementById('socialMedia').innerHTML = createList(userData.socialMedia);
        document.getElementById('educationInfo').innerHTML = createEducation(userData.education);
        document.getElementById('skillsInfo').innerHTML = createSkills(userData.skills);
        document.getElementById('languagesInfo').innerHTML = createSkills(userData.languages);
        document.getElementById('profileInfo').innerHTML = `<p>${userData.profile}</p>`;
        document.getElementById('workExperience').innerHTML = createWork(userData.workExperience);
        document.getElementById('referenceInfo').innerHTML = `<p>${userData.reference}</p>`;
        document.getElementById('certificationsInfo').innerHTML = createCertifications(userData.certifications);
        document.getElementById('projectsInfo').innerHTML = createProjects(userData.projects);
        
        // Apply current editing state to all elements after rendering
        updateEditableState();
    }
    
    function updateEditableState() {
        const allContentEditableElements = document.querySelectorAll(
            'h1#userName, h3#userTitle, #profileInfo p, #educationInfo p, #educationInfo p strong, #skillsInfo li, #languagesInfo li, #workExperience p, #workExperience li, #referenceInfo p, #certificationsInfo p, #projectsInfo p, #contactInfo p.editable, #socialMedia p.editable'
        );
        allContentEditableElements.forEach(el => {
            el.setAttribute('contenteditable', isEditing.toString());
        });

        const allInputElements = document.querySelectorAll('#contactInfo input, #socialMedia input'); // Add other input query selectors if any
        allInputElements.forEach(input => {
            input.disabled = !isEditing;
            // Apply visual styling for disabled state if desired (e.g., a class)
            input.classList.toggle('disabled-look', !isEditing); 
            if (!isEditing) {
                input.classList.remove('valid', 'invalid'); // Clear validation styles when not editing
                 // input.style.color = 'inherit'; // Reset direct style if used
            }
        });

        // If entering edit mode, trigger validation styling for relevant inputs
        if (isEditing) {
            const phoneInput = document.querySelector('#contactInfo input.phone');
            const emailInput = document.querySelector('#contactInfo input.email');
            if (phoneInput) {
                phoneInput.style.color = (phoneInput.value.trim() === "" || validatePhone(phoneInput.value.trim())) ? 'inherit' : 'red';
            }
            if (emailInput) {
                 emailInput.style.color = (emailInput.value.trim() === "" || validateEmail(emailInput.value.trim())) ? 'inherit' : 'red';
            }
        }
    }


    // --- UI INTERACTIONS (Accordion, Edit/Save) ---
    const editBtn = document.getElementById('editBtn');
    const resetBtn = document.getElementById('resetBtn');
    const accordionBtns = document.querySelectorAll('.accordion-btn');

    accordionBtns.forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.nextElementSibling;
            panel.classList.toggle('active');
        });
    });

    resetBtn.addEventListener('click', () => {
        localStorage.clear();
        alert('Sıfırlandı.')
        location.reload();
    });

    editBtn.addEventListener('click', () => {
        isEditing = !isEditing;
        editBtn.textContent = isEditing ? 'Save' : 'Edit';

        if (isEditing) { // Entering Edit mode
            accordionBtns.forEach(btn => {
                const panel = btn.nextElementSibling;
                if (!panel.classList.contains('active')) {
                    panel.classList.add('active');
                }
            });
        }
        
        updateEditableState();

        if (!isEditing) { // Exiting Edit mode (Save action)
            let canSaveChanges = true;
            const phoneInput = document.querySelector('#contactInfo input.phone');
            const emailInput = document.querySelector('#contactInfo input.email');
            
            if (phoneInput) {
                const phoneValue = phoneInput.value.trim();
                if (phoneValue !== "" && !validatePhone(phoneValue)) { // Error if not empty AND invalid
                    canSaveChanges = false;
                    phoneInput.style.color = 'red';
                } else {
                    phoneInput.style.color = 'inherit'; // Valid or empty
                }
            }
            if (emailInput) {
                const emailValue = emailInput.value.trim();
                if (emailValue !== "" && !validateEmail(emailValue)) { // Error if not empty AND invalid
                    canSaveChanges = false;
                    emailInput.style.color = 'red';
                } else {
                    emailInput.style.color = 'inherit'; // Valid or empty
                }
            }

            if (canSaveChanges) {
                editBtn.textContent = 'Saved to localStorage';
                setTimeout(() => {
                    editBtn.textContent = 'Edit';
                }, 2000);
                saveToLocalStorage();
            } else {
                alert("Form validasiya xətası. Qırmızı rəngli xanaları düzəldin.");
                isEditing = true; 
                editBtn.textContent = 'Save';
                updateEditableState();
            }
        }
    });
    
    resetBtn.addEventListener('click', () => {
        userData = JSON.parse(JSON.stringify(initialUserData)); // Reset to initial data
        renderPageContent();
        isEditing = false;
        editBtn.textContent = 'Edit';
        updateEditableState();
    });
    
    // Add a new line on Enter key
    panels = document.querySelectorAll('.accordion-panel'); // `panels` was not declared with const/let
    panels.forEach(panel => {
        panel.addEventListener('keydown', e => {
            if (!isEditing || e.key !== 'Enter') return;
            const targetElement = e.target;
            if (targetElement.tagName === 'INPUT') { // Prevent enter in any input
                 e.preventDefault(); 
                 return;
            }
            if (targetElement.isContentEditable) { // Allow in contenteditable p/li etc.
                e.preventDefault();
                document.execCommand('insertHTML', false, '<br>'); // Single line break is usually <br>
            }
        });
    });

    // --- LOCALSTORAGE & DOWNLOAD ---
    async function downloadFiles() {
        const zip = new JSZip(); // Ensure JSZip is loaded
        // ... (rest of your downloadFiles function, ensure paths are correct) ...
        // Add HTML file
        const html = document.documentElement.outerHTML;
        zip.file("index.html", html);

        // Add CSS file (simplified error handling)
        try {
            const cssResponse = await fetch("style.css");
            if (cssResponse.ok) zip.file("style.css", await cssResponse.text());
            else console.warn("CSS file not fetched for ZIP:", cssResponse.statusText);
        } catch (err) { console.warn("Error fetching style.css for ZIP:", err); }
        
        // Add JS file
        try {
            const jsResponse = await fetch("script.js");
            if (jsResponse.ok) zip.file("script.js", await jsResponse.text());
            else console.warn("JS file not fetched for ZIP:", jsResponse.statusText);
        } catch (err) { console.warn("Error fetching script.js for ZIP:", err); }


        // Add photos
        const images = [...document.querySelectorAll("img")];
        for (let img of images) {
            const src = img.getAttribute('src'); // Use getAttribute
            if (src && !src.startsWith("blob:")) {
                try {
                    const res = await fetch(src);
                    if(res.ok){
                        const blob = await res.blob();
                        const name = src.split("/").pop() || 'unnamed_image';
                        zip.file(`photos/${name}`, blob);
                    } else {
                        console.warn(`Image not fetched for ZIP (${src}):`, res.statusText);
                    }
                } catch (err) {
                    console.warn(`Error fetching image ${src} for ZIP:`, err);
                }
            }
        }

        // Download ZIP
        zip.generateAsync({ type: "blob" }).then(content => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'cv.zip';
            document.body.appendChild(a); // Required for Firefox
            a.click();
            document.body.removeChild(a); // Clean up
            URL.revokeObjectURL(a.href);
        }).catch(err => console.error("Error generating ZIP:", err));
    }

    function saveToLocalStorage() {
        const getCleanText = (element) => {
            if (!element) return "";
            let text = "";
            element.childNodes.forEach(node => { // Get only direct text nodes
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            });
            return text.trim();
        };

        const updatedData = {
            name: document.getElementById('userName').innerHTML,
            title: document.getElementById('userTitle').textContent,
            contact: Array.from(document.querySelectorAll('#contactInfo .editable')).map(el => {
                const img = el.querySelector('img');
                const input = el.querySelector('input');
                return {
                    icon: img ? img.getAttribute('src')?.replace('photos/', '') || '' : '',
                    text: input ? input.value.trim() : getCleanText(el) // Use getCleanText for <p>
                };
            }),
            socialMedia: Array.from(document.querySelectorAll('#socialMedia .editable')).map(el => {
                 const img = el.querySelector('img');
                 const input = el.querySelector('input'); // If social media can be inputs
                 return {
                    icon: img ? img.getAttribute('src')?.replace('photos/', '') || '' : '',
                    text: input ? input.value.trim() : getCleanText(el) 
                 };
            }),
            education: Array.from(document.querySelectorAll('#educationInfo p')).map(p => {
                const period = p.querySelector('strong')?.textContent.trim() || '';
                let school = '';
                const strongEl = p.querySelector('strong');
                if (strongEl) {
                    let Sibling = strongEl.nextSibling;
                    while(Sibling){
                        if(Sibling.nodeName === "BR") { 
                            Sibling = Sibling.nextSibling; 
                            while(Sibling){ school += Sibling.textContent; Sibling = Sibling.nextSibling;}
                            break; 
                        }
                        if (Sibling.nodeType === Node.TEXT_NODE) school += Sibling.textContent; // Text between strong and BR
                        Sibling = Sibling.nextSibling;
                    }
                } else { // No strong tag
                    school = p.textContent.trim();
                }
                return { period, school: school.trim() };
            }),
            skills: Array.from(document.querySelectorAll('#skillsInfo li')).map(li => li.textContent.trim()),
            languages: Array.from(document.querySelectorAll('#languagesInfo li')).map(li => li.textContent.trim()),
            profile: document.querySelector('#profileInfo p')?.textContent.trim() || '',
            workExperience: Array.from(document.querySelectorAll('#workExperience > div')).map(div => ({ // Assuming each work item is wrapped in a div
                title: div.querySelector('p > strong')?.textContent.trim() || div.querySelector('p')?.textContent.trim() || '',
                details: Array.from(div.querySelectorAll('ul li')).map(li => li.textContent.trim())
            })),
            reference: document.querySelector('#referenceInfo p')?.textContent.trim() || '',
            certifications: Array.from(document.querySelectorAll('#certificationsInfo > div')).map(div => ({ // Assuming each cert item is wrapped in a div
                name: div.querySelector('p:first-of-type > strong')?.textContent.trim() || div.querySelector('p:first-of-type')?.textContent.trim() || '',
                description: div.querySelector('p:last-of-type')?.textContent.trim() || ''
            })),
            projects: Array.from(document.querySelectorAll('#projectsInfo > div')).map(div => ({ // Assuming each project item is wrapped in a div
                name: div.querySelector('p:first-of-type > strong')?.textContent.trim() || div.querySelector('p:first-of-type')?.textContent.trim() || '',
                description: div.querySelector('p:last-of-type')?.textContent.trim() || ''
            }))
        };
    
        localStorage.setItem('userData', JSON.stringify(updatedData));
    }

    // --- LIVE VALIDATION (Input event listener) ---
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!isEditing) return; // Only validate if in edit mode

        if (target.classList.contains('phone') && target.closest('#contactInfo')) {
            const value = target.value; // No trim here, let validation handle it
            target.style.color = (value.trim() === "" || validatePhone(value.trim())) ? 'inherit' : 'red';
        }

        if (target.classList.contains('email') && target.closest('#contactInfo')) {
            const value = target.value;
            target.style.color = (value.trim() === "" || validateEmail(value.trim())) ? 'inherit' : 'red';
        }
    });

    // --- INITIAL PAGE LOAD ---
    renderPageContent(); // Initial render

});