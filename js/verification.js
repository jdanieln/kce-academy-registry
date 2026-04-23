document.addEventListener('DOMContentLoaded', () => {
    const searchPanel = document.getElementById('search-panel');
    const resultPanel = document.getElementById('result-panel');
    const verifyForm = document.getElementById('verify-form');
    const certIdInput = document.getElementById('cert-id-input');
    const errorMessage = document.getElementById('error-message');
    const btnDownload = document.getElementById('btn-download');
    const btnNewSearch = document.getElementById('btn-new-search');

    // DOM Elements for Certificate
    const certContainer = document.getElementById('certificate-container');
    const renderType = document.getElementById('render-type');
    const renderStudent = document.getElementById('render-student');
    const renderCourse = document.getElementById('render-course');
    const renderHours = document.getElementById('render-hours');
    const renderInstructorSig = document.getElementById('render-instructor-sig');
    const renderInstructorName = document.getElementById('render-instructor-name');
    const renderInstructorRole = document.getElementById('render-instructor-role');
    const renderId = document.getElementById('render-id');
    const renderDate = document.getElementById('render-date');

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get('id');

    if (certId) {
        verifyCertificate(certId);
    } else {
        searchPanel.style.display = 'flex';
        resultPanel.style.display = 'none';
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = certIdInput.value.trim().toUpperCase();
            if (id) {
                window.location.href = `./verification.html?id=${id}`;
            }
        });
    }

    if (btnNewSearch) {
        btnNewSearch.addEventListener('click', () => {
            window.location.href = './verification.html';
        });
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            generatePDF();
        });
    }

    async function verifyCertificate(id) {
        try {
            // Load DBs
            const [certsRes, coursesRes, instRes, stdRes] = await Promise.all([
                fetch('./data/certificates.json'),
                fetch('./data/courses.json'),
                fetch('./data/instructors.json'),
                fetch('./data/students.json')
            ]);

            const certificates = await certsRes.json();
            const courses = await coursesRes.json();
            const instructors = await instRes.json();
            const students = await stdRes.json();

            // Find Cert
            const cert = certificates.find(c => c.id === id);

            if (!cert) {
                searchPanel.style.display = 'flex';
                resultPanel.style.display = 'none';
                errorMessage.style.display = 'block';
                return;
            }

            // Find Relations
            const student = students.find(s => s.id === cert.student_id);
            const course = courses.find(c => c.id === cert.course_id);
            const instructor = instructors.find(i => i.id === (cert.instructor_id || 'inst_001'));

            if (!student || !course || !instructor) {
                throw new Error("Datos relacionales incompletos en la base de datos.");
            }

            renderCertificate(cert, course, instructor, student);

            searchPanel.style.display = 'none';
            resultPanel.style.display = 'block';

        } catch (error) {
            console.error("Error al verificar certificado:", error);
            searchPanel.style.display = 'flex';
            resultPanel.style.display = 'none';
            errorMessage.textContent = "Error interno al verificar el certificado.";
            errorMessage.style.display = 'block';
        }
    }

    function renderCertificate(cert, course, instructor, student) {
        // Theme
        certContainer.setAttribute('data-type', cert.type);
        
        // Texts
        renderType.textContent = cert.type === 'aprobacion' ? 'Certificado de Aprobación' : 'Certificado de Participación';
        renderStudent.textContent = student.name;
        renderCourse.textContent = course.title;
        renderHours.textContent = course.hours;
        
        renderInstructorName.textContent = instructor.name;
        renderInstructorRole.textContent = instructor.role;
        renderInstructorSig.textContent = instructor.signature || instructor.name;
        
        renderId.textContent = cert.id;
        renderDate.textContent = cert.issue_date;
        
        const currentUrl = window.location.href.split('?')[0] + '?id=' + cert.id;

        // Generate QR
        new QRious({
            element: document.getElementById('qr-code'),
            value: currentUrl,
            size: 70,
            background: 'white',
            foreground: '#041230'
        });
    }

    function generatePDF() {
        const element = document.getElementById('certificate-container');
        
        // html2pdf options specifically tuned for A4 landscape
        const opt = {
            margin:       0,
            filename:     `Certificado-${certId}.pdf`,
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'px', format: [1122, 793], orientation: 'landscape' }
        };

        btnDownload.innerText = 'Generando PDF...';
        btnDownload.disabled = true;

        html2pdf().set(opt).from(element).save().then(() => {
            btnDownload.innerText = 'Descargar en PDF';
            btnDownload.disabled = false;
        });
    }
});
