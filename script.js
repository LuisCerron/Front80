// --- script.js (Código que se ejecuta en tu navegador - Frontend) ---
// --- VERSIÓN 4.1: CORRECCIÓN DE LOGOUT Y UNIFICACIÓN DE EVENTOS ---

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM cargado. Inicializando script v4.1...");

    // --- REFERENCIAS GLOBALES ---
    const API_BASE_URL = window.location.origin + '/api';

    // Elementos del DOM
    const contentSections = document.querySelectorAll('.content-section');
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const parkingTableBody = document.getElementById('parkingTableBody');
    const userTableBody = document.getElementById('userTableBody');
    const spacesTableBody = document.getElementById('spacesTableBody');
    const vehicleTableBody = document.getElementById('vehicleTableBody');
    const detailsContent = document.getElementById('detailsContent');
    const reportResultContainer = document.getElementById('reportResultContainer');
    const reportsGrid = document.querySelector('.reports-grid');

    // Modales
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');
    const vehicleModal = document.getElementById('vehicleModal');
    const reservationModal = document.getElementById('reservationModal');

    // --- 1. INICIALIZACIÓN DE LA APLICACIÓN ---
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!userData) {
        alert("Por favor, inicie sesión primero.");
        window.location.href = 'login.html';
        return;
    }

    setupHeader(userData);
    setupEventListeners();
    configurarVistaPorRol(userData.rol); 

    // --- 2. LÓGICA DE ACTUALIZACIÓN EN TIEMPO REAL ---
    console.log("✅ Activando actualizaciones en tiempo real (cada 7 segundos)...");
    setInterval(() => {
        const activeSection = document.querySelector('.content-section.active');
        if (!activeSection) return;

        switch(activeSection.id) {
            case 'dashboard':
                cargarRegistrosEstacionamiento();
                break;
            case 'espacios':
                if (userData.rol === 'admin' || userData.rol === 'administrador') {
                    renderSpaces();
                }
                break;
        }
    }, 7000);

    // ==========================================================
    // === SECCIÓN DE CONFIGURACIÓN DE EVENTOS ==================
    // ==========================================================
    
    function setupEventListeners() {
    // Navegación del menú lateral (se mantiene igual)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', handleMenuClick);
    });

    // Configuración de modales (se mantiene igual)
    setupModal(addUserModal, document.getElementById('add-user-btn'), document.getElementById('formNuevoUsuario'), agregarNuevoUsuario);
    setupModal(editUserModal, null, document.getElementById('editUserForm'), actualizarUsuario);
    setupModal(vehicleModal, document.getElementById('add-vehicle-btn'), document.getElementById('vehicleForm'), handleVehicleFormSubmit);
    setupModalReservation();

    // --- CORRECCIÓN DE LOGOUT --- (se mantiene igual)
    document.querySelectorAll('.btn-logout').forEach(button => {
        button.addEventListener('click', logout);
    });
    
    // --- ¡LÓGICA DE BÚSQUEDA EN TIEMPO REAL! ---
    // Reemplaza la antigua lógica del formulario.
    const searchInput = document.getElementById('plateSearchInput'); // Apuntamos al campo de texto
    if (searchInput) {
        let debounceTimeout;

        // Escuchamos el evento 'input', que se dispara cada vez que el usuario escribe.
        searchInput.addEventListener('input', () => {
            // Limpiamos el temporizador anterior para reiniciar la espera.
            clearTimeout(debounceTimeout);

            // Creamos un nuevo temporizador. La búsqueda solo se ejecutará
            // 400ms después de que el usuario deje de escribir.
            debounceTimeout = setTimeout(() => {
                handleUserSearch(searchInput.value);
            }, 400); // 400ms de espera (puedes ajustar este valor)
        });
    }
    
    // Eventos para la sección de reportes (se mantiene igual)
    document.getElementById('reportes')?.addEventListener('click', handleReportLinkClick);
}
 const imageModal = document.getElementById('imagePreviewModal');
    if (imageModal) {
        const closeBtn = imageModal.querySelector('.image-modal-close-button');
        closeBtn.addEventListener('click', closeImageModal);
        imageModal.addEventListener('click', (event) => {
            if (event.target === imageModal) {
                closeImageModal();
            }
        });
    }

    
    // ==========================================================
    // === FUNCIONES GENERALES Y DE UTILIDAD ==================
    // ==========================================================

    function setupHeader(user) {
        document.getElementById('userName').textContent = user.codigo;
        document.getElementById('userRole').textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
        const inicial = user.codigo ? user.codigo.charAt(0).toUpperCase() : 'U';
        document.getElementById('userAvatar').src = `https://placehold.co/40x40/667eea/ffffff?text=${inicial}`;
    }

    function configurarVistaPorRol(rol) {
    const esAdmin = rol === 'admin' || rol === 'administrador';
    
    // Ocultar todas las secciones de contenido al principio para evitar parpadeos
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    // Quitar 'active' de todos los items del menú
    document.querySelectorAll('.sidebar-menu li').forEach(item => item.classList.remove('active'));
    
    // Vistas específicas de la sección "Estado en Tiempo Real"
    const adminEspaciosView = document.getElementById('admin-espacios-view');
    const userEspaciosView = document.getElementById('user-espacios-view');

    if (esAdmin) {
        // ===== VISTA PARA ADMINISTRADOR =====
        
        // 1. Mostrar todos los menús
        document.getElementById('menu-dashboard').style.display = 'block';
        document.getElementById('menu-espacios').style.display = 'block';
        document.getElementById('menu-usuarios').style.display = 'block';
        document.getElementById('menu-vehiculos').style.display = 'block';
        document.getElementById('menu-reportes').style.display = 'block';
        document.getElementById('menu-configuracion').style.display = 'block';

        // 2. Mostrar la vista de admin en la sección "Espacios"
        if (adminEspaciosView) adminEspaciosView.style.display = 'block';
        if (userEspaciosView) userEspaciosView.style.display = 'none';

        // 3. Establecer el Dashboard como vista inicial activa
        document.getElementById('dashboard').classList.add('active');
        document.getElementById('menu-dashboard').classList.add('active');

        // 4. Cargar los datos iniciales para el admin
        cargarRegistrosEstacionamiento(); 

    } else {
        // ===== VISTA PARA ESTUDIANTE / DOCENTE / PERSONAL =====

        // 1. Ocultar menús de admin
        document.getElementById('menu-dashboard').style.display = 'none'; // ¡Ocultamos el Dashboard!
        document.getElementById('menu-usuarios').style.display = 'none';
        document.getElementById('menu-vehiculos').style.display = 'none';
        document.getElementById('menu-reportes').style.display = 'none';
        document.getElementById('menu-configuracion').style.display = 'none';
        
        // 2. Mostrar solo el menú de "Estado en Tiempo Real"
        document.getElementById('menu-espacios').style.display = 'block';

        // 3. Mostrar la vista de usuario en la sección "Espacios"
        if (adminEspaciosView) adminEspaciosView.style.display = 'none';
        if (userEspaciosView) userEspaciosView.style.display = 'block';

        // 4. Establecer "Estado en Tiempo Real" (id: espacios) como la vista inicial activa
        document.getElementById('espacios').classList.add('active');
        document.getElementById('menu-espacios').classList.add('active');

        // 5. Cargar los datos iniciales para el usuario
        cargarMapaDeEstacionamiento();
    }
}

    function handleMenuClick(event) {
        event.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        contentSections.forEach(section => section.classList.remove('active'));
        menuItems.forEach(item => item.classList.remove('active'));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
        this.parentElement.classList.add('active');

        switch(targetId) {
            case 'dashboard': cargarRegistrosEstacionamiento(); break;
            case 'usuarios': renderUserTable(); break;
            case 'espacios': 
                if(userData.rol === 'admin' || userData.rol === 'administrador') {
                    renderSpaces();
                } else {
                    cargarMapaDeEstacionamiento();
                }
                break;
            case 'vehiculos': renderVehicleTable(); break;
            case 'reportes': showReportDashboard(); break;
        }
    }

    async function apiCall(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.error || data.message || `Error HTTP ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('Error en la llamada a la API:', url, error);
            throw error;
        }
    }

    function setupModal(modal, openBtn, form, submitHandler) {
        if (!modal) return;
        const closeBtn = modal.querySelector('.close-button');
        if (openBtn) openBtn.addEventListener('click', () => modal.style.display = 'flex');
        if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });
        if (form) form.addEventListener('submit', submitHandler);
    }
    
    // --- RESTO DE FUNCIONES COMPLETAS ---
    
    function logout() {
        if (confirm("¿Estás seguro de que quieres cerrar la sesión?")) {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        }
    }
    
    // --- DASHBOARD (VEHÍCULOS ESTACIONADOS) ---
    async function cargarRegistrosEstacionamiento() {
        if (!parkingTableBody) return;
        try {
            const registros = await apiCall(`${API_BASE_URL}/registros-estacionamiento`);
            parkingTableBody.innerHTML = '';
            if (registros.length === 0) {
                parkingTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay vehículos estacionados.</td></tr>';
                return;
            }
            registros.forEach((registro, index) => {
                const row = parkingTableBody.insertRow();
                row.innerHTML = `<td>${index + 1}</td><td>${registro.placa}</td><td>${registro.tipo_vehiculo}</td><td>${registro.nombre_propietario} ${registro.apellido_propietario}</td><td>${new Date(registro.hora_ingreso).toLocaleString()}</td><td>${registro.ubicacion_espacio}</td><td class="action-buttons"><button class="btn-delete">Salida</button></td>`;
                row.querySelector('.btn-delete').onclick = () => {
                    if (confirm(`¿Registrar salida del vehículo ${registro.placa}?`)) {
                        eliminarRegistroAcceso(registro.id_acceso);
                    }
                };
            });
        } catch (error) {
            console.error("Error en Dashboard:", error.message);
        }
    }

    async function eliminarRegistroAcceso(idAcceso) {
        try {
            const data = await apiCall(`${API_BASE_URL}/accesos/${idAcceso}`, { method: 'DELETE' });
            alert(data.message);
            cargarRegistrosEstacionamiento();
            renderSpaces();
        } catch (error) {
            alert(`No se pudo registrar la salida: ${error.message}`);
        }
    }

    async function renderSpaces() {
    // Referencias a los contenedores del HTML
    console.log('>>> renderSpaces() LLAMADA');
    const summaryContainer = document.getElementById('summary-cards-container');
    const zonesContainer = document.getElementById('parking-zones-container');
    
    // Si los contenedores no existen en la página, no hace nada.
    if (!summaryContainer || !zonesContainer) return;
    
    // Solo renderizar si los contenedores están vacíos o no ha sido renderizado aún
    if (renderSpaces.wasRendered) {
        console.log('>>> renderSpaces() YA FUE RENDERIZADO, saltando...');
        return;
    }
    renderSpaces.wasRendered = true;

    try {
        // 1. Obtiene los datos de los espacios desde el backend
        const spaces = await apiCall(`${API_BASE_URL}/espacios`);

        // 2. Calcula los totales para las tarjetas de resumen
        let total = spaces.length;
        let ocupados = spaces.filter(s => s.estado === 'ocupado').length;
        let disponibles = spaces.filter(s => s.estado === 'disponible').length;
        let reservados = spaces.filter(s => s.estado === 'reservado').length;

        // 3. Renderiza las tarjetas de resumen en el HTML
        summaryContainer.innerHTML = `
            <div class="summary-card">
                <div class="card-info">
                    <h3>Total de Espacios</h3>
                    <p class="count">${total}</p>
                </div>
                <div class="card-icon icon-total"><i class="fas fa-parking"></i></div>
            </div>
            <div class="summary-card">
                <div class="card-info">
                    <h3>Ocupados</h3>
                    <p class="count">${ocupados}</p>
                </div>
                <div class="card-icon icon-ocupado"><i class="fas fa-car-side"></i></div>
            </div>
            <div class="summary-card">
                <div class="card-info">
                    <h3>Disponibles</h3>
                    <p class="count">${disponibles}</p>
                </div>
                <div class="card-icon icon-disponible"><i class="fas fa-check-circle"></i></div>
            </div>
            <div class="summary-card">
                <div class="card-info">
                    <h3>Reservados</h3>
                    <p class="count">${reservados}</p>
                </div>
                <div class="card-icon icon-reservado"><i class="fas fa-clock"></i></div>
            </div>
        `;

        // 4. Agrupa los espacios por su tipo (Auto, Moto, etc.)
        const groupedSpaces = spaces.reduce((acc, space) => {
            const type = (space.tipo_espacio || 'General').trim();
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(space);
            return acc;
        }, {});

        console.log('>>> Tipos agrupados:', Object.keys(groupedSpaces));
        console.log('>>> Normal count:', groupedSpaces['Normal'] ? groupedSpaces['Normal'].length : 0);
        console.log('>>> Moto count:', groupedSpaces['Moto'] ? groupedSpaces['Moto'].length : 0);

        // 5. Renderiza el mapa de estacionamiento, creando una sección por cada tipo de vehículo
        zonesContainer.innerHTML = ''; // Limpia la vista anterior
        for (const tipo in groupedSpaces) {
            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'parking-zone';

            let iconClass = 'fa-car';
            if (tipo.toLowerCase() === 'moto') iconClass = 'fa-motorcycle';
            if (tipo.toLowerCase() === 'discapacitado') iconClass = 'fa-wheelchair';
            
            // Se genera el HTML sin el 'onclick' directo
            zoneDiv.innerHTML = `
                <h3><i class="fas ${iconClass}"></i> Espacios para ${tipo}</h3>
                <div class="space-grid">
                    ${groupedSpaces[tipo].map(space => `
                        <div class="parking-spot ${space.estado.toLowerCase()}" 
                             title="Espacio: ${space.ubicacion} - Estado: ${space.estado}"
                             data-id="${space.id_espacio}"
                             data-estado="${space.estado}">
                            ${space.ubicacion.split('-').pop()}
                        </div>
                    `).join('')}
                </div>
            `;
            zonesContainer.appendChild(zoneDiv);
            console.log(`>>> Appended zone '${tipo}' with ${groupedSpaces[tipo].length} spaces`);

            // CORRECCIÓN: Se añaden los eventos de clic después de crear los elementos
            zoneDiv.querySelectorAll('.parking-spot').forEach(spot => {
                spot.addEventListener('click', () => {
                    const id = spot.dataset.id;
                    const estado = spot.dataset.estado;
                    // Se llama a la función que ya existe en el script
                    mostrarDetallesEspacio(id, estado);
                });
            });
        }

    } catch (error) {
        console.error("Error al renderizar los espacios:", error);
        summaryContainer.innerHTML = '<p style="color: red;">Error al cargar los datos del dashboard.</p>';
        renderSpaces.wasRendered = false; // Permitir reintento
    }
}

/**
 * AÑADE o REEMPLAZA esta función en tu script.js.
 * Se encarga de mostrar el modal con la información del ocupante.
 */
async function mostrarDetallesEspacio(idEspacio, estado) {
    if (estado === 'disponible') {
        openNewAccessModal(idEspacio);
        return;
    }

    const modal = document.getElementById('space-details-modal');
    const modalContent = document.getElementById('space-details-content');
    if (!modal || !modalContent) {
        console.error('Error: El HTML del modal de detalles del espacio (space-details-modal) no se encontró.');
        return;
    }

    modalContent.innerHTML = '<p>Cargando información...</p>';
    modal.style.display = 'flex';

    try {
        const detalles = await apiCall(`${API_BASE_URL}/espacios/${idEspacio}/ocupante`);
        
        // Determina la etiqueta correcta para la fecha y el título
        let fechaLabel = 'Hora del Evento';
        if (detalles.tipo_detalle === 'Ocupado') {
            fechaLabel = 'Hora de Ingreso';
        } else if (detalles.tipo_detalle === 'Reservado') {
            fechaLabel = 'Hora de Reserva';
        }

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Detalles del Espacio: ${detalles.placa || ''}</h2>
                <button class="close-modal-btn" onclick="document.getElementById('space-details-modal').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                <ul class="details-list">
                    <li><strong>Estado:</strong> <span>${detalles.tipo_detalle}</span></li>
                    <li><strong>Propietario:</strong> <span>${detalles.nombre} ${detalles.apellido}</span></li>
                    <li><strong>Rol:</strong> <span>${detalles.rol}</span></li>
                    <hr>
                    <li><strong>Tipo de Vehículo:</strong> <span>${detalles.tipo_vehiculo}</span></li>
                    <li><strong>${fechaLabel}:</strong> <span>${new Date(detalles.hora_evento).toLocaleString('es-PE')}</span></li>
                </ul>
            </div>
        `;
    } catch (error) {
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Información no Disponible</h2>
                <button class="close-modal-btn" onclick="document.getElementById('space-details-modal').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                <p>No se pudo cargar la información para este espacio.</p>
            </div>
        `;
    }
}


    async function updateDetailsPanel(space) {
        if (!detailsContent) return;
        detailsContent.innerHTML = `<p class="placeholder">Cargando detalles...</p>`;
        if (space && (space.estado.toLowerCase() === 'ocupado' || space.estado.toLowerCase() === 'reservado')) {
            try {
                const ocupante = await apiCall(`${API_BASE_URL}/espacios/${space.id_espacio}/ocupante`);
                detailsContent.innerHTML = `<ul class="details-list"><li><strong>Espacio:</strong> <span>${space.ubicacion}</span></li><li><strong>Ocupado desde:</strong> <span>${space.fecha_hora_ocupacion ? new Date(space.fecha_hora_ocupacion).toLocaleString('es-PE') : 'No registrado'}</span></li><hr><li><strong>Nombre:</strong> <span>${ocupante.nombre} ${ocupante.apellido}</span></li><li><strong>Rol:</strong> <span>${ocupante.rol || 'No especificado'}</span></li><li><strong>Código:</strong> <span>${ocupante.codigo || 'N/A'}</span></li><li><strong>Placa Vehículo:</strong> <span>${ocupante.placa}</span></li><li><strong>Tipo Vehículo:</strong> <span>${ocupante.tipo_vehiculo}</span></li></ul>`;
            } catch (error) {
                detailsContent.innerHTML = `<ul class="details-list"><li><strong>Espacio:</strong> <span>${space.ubicacion}</span></li><li><strong>Estado:</strong> <span class="estado estado-${space.estado.toLowerCase()}">${space.estado.toUpperCase()}</span></li></ul><hr><p class="placeholder">No se encontró información del ocupante.</p>`;
            }
        } else if (space) {
            detailsContent.innerHTML = `<ul class="details-list"><li><strong>Espacio:</strong> <span>${space.ubicacion}</span></li><li><strong>Estado:</strong> <span class="estado estado-disponible">${space.estado.toUpperCase()}</span></li></ul><p class="placeholder">Este espacio se encuentra disponible.</p>`;
        } else {
            detailsContent.innerHTML = `<p class="placeholder">Seleccione un espacio para ver los detalles.</p>`;
        }
    }
    
    // --- GESTIÓN DE USUARIOS ---
    async function renderUserTable() {
        if (!userTableBody) return;
        userTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando usuarios...</td></tr>';
        try {
            const usuarios = await apiCall(`${API_BASE_URL}/usuarios`);
            userTableBody.innerHTML = '';
            usuarios.forEach((user, index) => {
                const row = userTableBody.insertRow();
                const isActive = user.activo === 1;
                row.innerHTML = `<td>${index + 1}</td><td>${user.nombre}</td><td>${user.apellido}</td><td>${user.rol}</td><td>${user.email}</td><td><span class="status ${isActive ? 'status-inside' : 'status-outside'}">${isActive ? "Activo" : "Inactivo"}</span></td><td class="action-buttons"><button class="btn-edit"><i class="fas fa-edit"></i> Editar</button><button class="btn-delete"><i class="fas fa-trash-alt"></i> Eliminar</button></td>`;
                row.querySelector('.btn-edit').onclick = () => openEditUserModal(user.id_usuario);
                row.querySelector('.btn-delete').onclick = () => handleDeleteUser(user.id_usuario, `${user.nombre} ${user.apellido}`);
            });
        } catch (error) {
            userTableBody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Error: ${error.message}</td></tr>`;
        }
    }

    async function agregarNuevoUsuario(event) {
        event.preventDefault();
        const nuevoUsuario = {
            codigo_utp: document.getElementById('newUsuarioCodigoUtp').value || null,
            nombre: document.getElementById('newUsuarioNombre').value,
            apellido: document.getElementById('newUsuarioApellido').value,
            rol: document.getElementById('newUsuarioRol').value,
            email: document.getElementById('newUsuarioEmail').value,
            telefono: document.getElementById('newUsuarioTelefono').value || null,
            activo: document.getElementById('newUsuarioActivo').checked ? 1 : 0
        };
        try {
            await apiCall(`${API_BASE_URL}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoUsuario) });
            alert('¡Usuario agregado exitosamente!');
            renderUserTable();
            addUserModal.style.display = 'none';
            document.getElementById('formNuevoUsuario').reset();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function openEditUserModal(userId) {
        try {
            const user = await apiCall(`${API_BASE_URL}/usuarios/${userId}`);
            document.getElementById('editUserId').value = user.id_usuario;
            document.getElementById('editUserCodigoUtp').value = user.codigo_utp || '';
            document.getElementById('editUserName').value = user.nombre;
            document.getElementById('editUserApellido').value = user.apellido;
            document.getElementById('editUserRol').value = user.rol;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserTelefono').value = user.telefono || '';
            document.getElementById('editUserActivo').checked = user.activo === 1;
            editUserModal.style.display = 'flex';
        } catch (error) {
            alert(error.message);
        }
    }

    async function actualizarUsuario(event) {
        event.preventDefault();
        const userId = document.getElementById('editUserId').value;
        const datosActualizados = {
            codigo_utp: document.getElementById('editUserCodigoUtp').value || null,
            nombre: document.getElementById('editUserName').value,
            apellido: document.getElementById('editUserApellido').value,
            rol: document.getElementById('editUserRol').value,
            email: document.getElementById('editUserEmail').value,
            telefono: document.getElementById('editUserTelefono').value || null,
            activo: document.getElementById('editUserActivo').checked ? 1 : 0
        };
        try {
            await apiCall(`${API_BASE_URL}/usuarios/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosActualizados) });
            alert('¡Usuario actualizado exitosamente!');
            renderUserTable();
            editUserModal.style.display = 'none';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function handleDeleteUser(userId, userName) {
        if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}?`)) {
            try {
                await apiCall(`${API_BASE_URL}/usuarios/${userId}`, { method: 'DELETE' });
                alert('Usuario eliminado con éxito.');
                renderUserTable();
            } catch (error) {
                alert(`No se pudo eliminar el usuario: ${error.message}`);
            }
        }
    }

   // --- GESTIÓN DE VEHÍCULOS (VERSIÓN ACTUALIZADA CON PREVISUALIZACIÓN DE IMAGEN) ---

/**
 * 1. Función para renderizar la tabla de vehículos, ahora con la columna "Imagen".
 */
async function renderVehicleTable() {
    const vehicleTableBody = document.getElementById('vehicleTableBody');
    if (!vehicleTableBody) return;
    // Se ajusta el colspan a 9 para la nueva columna
    vehicleTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Cargando vehículos...</td></tr>';
    try {
        // La llamada a la API debe devolver la columna 'imagen_url' desde la base de datos
        const vehiculos = await apiCall(`${API_BASE_URL}/vehiculos`);
        vehicleTableBody.innerHTML = '';
        
        vehiculos.forEach((vehiculo, index) => {
            const row = vehicleTableBody.insertRow();
            
            // Botón condicional para ver la imagen.
            // Se muestra solo si 'imagen_url' no es nulo o vacío.
            const imageButton = vehiculo.imagen_url
                ? `<button class="btn-view" onclick="openImageModal('${vehiculo.imagen_url}', '${vehiculo.placa}')"><i class="fas fa-eye"></i> Ver</button>`
                : '<span>N/A</span>';

            // Se añade la nueva columna <td> para el botón de la imagen
            // Y se envuelven los botones de acción en un div para que no se separen
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.tipo_vehiculo}</td>
                <td>${vehiculo.marca || 'N/A'}</td>
                <td>${vehiculo.modelo || 'N/A'}</td>
                <td>${vehiculo.color || 'N/A'}</td>
                <td>${vehiculo.id_usuario}</td>
                <td>${imageButton}</td>
                <td class="columna-acciones">
                    <div class="action-buttons">
                        <button class="btn-edit"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn-delete"><i class="fas fa-trash-alt"></i> Eliminar</button>
                    </div>
                </td>`;
            
            row.querySelector('.btn-edit').onclick = () => openVehicleModal(vehiculo);
            row.querySelector('.btn-delete').onclick = () => handleDeleteVehicle(vehiculo.id_vehiculo, vehiculo.placa);
        });
    } catch (error) {
        // Se ajusta el colspan a 9 para el mensaje de error
        vehicleTableBody.innerHTML = `<tr><td colspan="9" style="color: red; text-align: center;">Error: ${error.message}</td></tr>`;
    }
}

/**
 * 2. Tus funciones para el modal de edición se mantienen igual.
 */
function openVehicleModal(vehiculo = null) {
    const vehicleModal = document.getElementById('vehicleModal'); // Asegúrate que la variable esté disponible
    const modalTitle = vehicleModal.querySelector('h2');
    const vehicleForm = document.getElementById('vehicleForm');
    vehicleForm.reset();
    document.getElementById('vehicleId').value = '';
    if(vehiculo) {
        modalTitle.textContent = 'Editar Vehículo';
        document.getElementById('vehicleId').value = vehiculo.id_vehiculo;
        document.getElementById('vehicleUserId').value = vehiculo.id_usuario;
        document.getElementById('vehiclePlaca').value = vehiculo.placa;
        document.getElementById('vehicleType').value = vehiculo.tipo_vehiculo;
        document.getElementById('vehicleMarca').value = vehiculo.marca || '';
        document.getElementById('vehicleModelo').value = vehiculo.modelo || '';
        document.getElementById('vehicleColor').value = vehiculo.color || '';
        document.getElementById('vehicleActivo').checked = vehiculo.activo === 1;
    } else {
        modalTitle.textContent = 'Agregar Vehículo';
    }
    vehicleModal.style.display = 'flex';
}

async function handleVehicleFormSubmit(event) {
    event.preventDefault();
    const vehicleModal = document.getElementById('vehicleModal');
    const vehicleId = document.getElementById('vehicleId').value;
    const isEditing = !!vehicleId;
    const vehicleData = {
        id_usuario: parseInt(document.getElementById('vehicleUserId').value),
        placa: document.getElementById('vehiclePlaca').value,
        tipo_vehiculo: document.getElementById('vehicleType').value,
        marca: document.getElementById('vehicleMarca').value || null,
        modelo: document.getElementById('vehicleModelo').value || null,
        color: document.getElementById('vehicleColor').value || null,
        activo: document.getElementById('vehicleActivo').checked ? 1 : 0
    };
    const url = isEditing ? `${API_BASE_URL}/vehiculos/${vehicleId}` : `${API_BASE_URL}/vehiculos`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
        await apiCall(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicleData) });
        alert(`Vehículo ${isEditing ? 'actualizado' : 'agregado'} con éxito.`);
        renderVehicleTable();
        vehicleModal.style.display = 'none';
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function handleDeleteVehicle(vehicleId, vehiclePlaca) {
     if (confirm(`¿Estás seguro de que quieres eliminar el vehículo con placa ${vehiclePlaca}?`)) {
         try {
             await apiCall(`${API_BASE_URL}/vehiculos/${vehicleId}`, { method: 'DELETE' });
             alert('Vehículo eliminado con éxito.');
             renderVehicleTable();
         } catch (error) {
             alert(`No se pudo eliminar el vehículo: ${error.message}`);
         }
     }
}

/**
 * 3. AÑADE ESTAS NUEVAS FUNCIONES para manejar el modal de la imagen.
 */
function openImageModal(imageUrl, plate) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    // Construimos la URL completa a la imagen
    modalImage.src = `/modelos-de-carros/${imageUrl}`; // Carpeta configurada en el backend con express.static
    modalCaption.textContent = `Placa: ${plate}`;
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imagePreviewModal');
    modal.style.display = 'none';
}



// 4. Tu función `handleDeleteVehicle` se mantiene igual.
async function handleDeleteVehicle(vehicleId, vehiclePlaca) {
     if (confirm(`¿Estás seguro de que quieres eliminar el vehículo con placa ${vehiclePlaca}?`)) {
         try {
             await apiCall(`${API_BASE_URL}/vehiculos/${vehicleId}`, { method: 'DELETE' });
             alert('Vehículo eliminado con éxito.');
             renderVehicleTable();
         } catch (error) {
             alert(`No se pudo eliminar el vehículo: ${error.message}`);
         }
     }
}

// 5. AÑADE ESTAS NUEVAS FUNCIONES para manejar el modal de la imagen.
function openImageModal(imageUrl, plate) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    // Construimos la URL completa a la imagen
    modalImage.src = `/modelos-de-carros/${imageUrl}`; // Carpeta configurada en el backend con express.static
    modalCaption.textContent = `Placa: ${plate}`;
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imagePreviewModal');
    modal.style.display = 'none';
}

    // --- SECCIÓN DE REPORTES ---
    function handleReportLinkClick(event) {
        const target = event.target.closest('a[data-report]');
        if (!target) return;
        event.preventDefault();
        const reportType = target.dataset.report;
        if (reportsGrid) reportsGrid.style.display = 'none';
        if (reportResultContainer) reportResultContainer.style.display = 'block';

        switch (reportType) {
            case 'ocupacion-zonas': generarReporteOcupacionZonas(); break;
            case 'horas-pico': generarReporteHorasPico(); break;
            case 'historial-placa': generarReporteHistorialPlaca(); break;
            case 'uso-por-rol': generarReporteUsoPorRol(); break;
            default: showReportDashboard();
        }
    }
    
    function showReportDashboard() {
        if (reportsGrid) reportsGrid.style.display = 'grid';
        if (reportResultContainer) {
            reportResultContainer.style.display = 'none';
            reportResultContainer.innerHTML = '';
        }
    }

    function renderReportResults(title, content) {
        if (!reportResultContainer) return;
        reportResultContainer.innerHTML = `<div class="report-header"><button id="backToReportsBtn" class="btn-back"><i class="fas fa-arrow-left"></i> Volver</button><h2><i class="fas fa-chart-bar"></i> ${title}</h2></div><div class="report-content">${content}</div>`;
        document.getElementById('backToReportsBtn').addEventListener('click', showReportDashboard);
    }

    // En tu script.js

/**
 * 1. REEMPLAZA tu función generarReporteOcupacionZonas con esta.
 * Ahora crea tarjetas clickables en lugar de solo texto.
 */
async function generarReporteOcupacionZonas() {
    try {
        const data = await apiCall(`${API_BASE_URL}/reportes/ocupacion-zonas`);
        
        // Contenedor principal para los resultados del reporte
        let content = `
            <div id="lista-zonas-reporte" class="reports-grid">
                ${data.length === 0 ? '<p>No hay datos de zonas para mostrar.</p>' : 
                    data.map(zona => {
                        const porcentaje = zona.total_espacios > 0 ? ((zona.espacios_ocupados / zona.total_espacios) * 100).toFixed(1) : 0;
                        // Cada zona es ahora un enlace que llama a la función del gráfico
                        return `
                            <a href="#" class="summary-card-clickable" data-zona="${zona.zona}">
                                <h4>Sótano ${zona.zona}</h4>
                                <p><strong>Ocupados:</strong> ${zona.espacios_ocupados} / ${zona.total_espacios}</p>
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${porcentaje}%;"></div>
                                </div>
                                <p class="percentage">${porcentaje}% Ocupado</p>
                            </a>
                        `;
                    }).join('')
                }
            </div>
            <!-- Contenedor para el gráfico, inicialmente oculto -->
            <div id="grafico-zona-container" style="display: none; height: 400px; margin-top: 2rem;"></div>
        `;

        renderReportResults('Ocupación por Zonas', content);

        // Añadimos los eventos de clic a las nuevas tarjetas
        document.querySelectorAll('.summary-card-clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const zonaId = card.dataset.zona;
                const reportTitle = document.querySelector('#reportResultContainer h2');
                if(reportTitle) reportTitle.innerHTML = `<i class="fas fa-chart-line"></i> Historial de Ingresos - Sótano ${zonaId}`;
                generarGraficoZona(zonaId);
            });
        });

    } catch (error) {
        renderReportResults('Ocupación por Zonas', `<p class="error-message">Error: ${error.message}</p>`);
    }
}


/**
 * 2. AÑADE esta nueva función completa a tu archivo script.js.
 * Se encarga de buscar los datos y dibujar el gráfico.
 */
async function generarGraficoZona(zonaId) {
    // Ocultamos la lista de zonas y mostramos el contenedor del gráfico
    document.getElementById('lista-zonas-reporte').style.display = 'none';
    const chartContainer = document.getElementById('grafico-zona-container');
    chartContainer.style.display = 'block';
    chartContainer.innerHTML = '<p>Cargando datos del gráfico...</p>';
    
    // Hacemos visible el botón de "Volver"
    const backButton = document.querySelector('#reportResultContainer .btn-back');
    if (backButton) {
        backButton.style.display = 'inline-block';
        backButton.onclick = () => {
            const reportTitle = document.querySelector('#reportResultContainer h2');
            if(reportTitle) reportTitle.innerHTML = `<i class="fas fa-file-alt"></i> Reportes`;
            generarReporteOcupacionZonas();
        };
    }

    try {
        const data = await apiCall(`${API_BASE_URL}/reportes/ocupacion-diaria/${zonaId}`);

        // Preparamos los datos para Chart.js
        const labels = [];
        const dataPoints = [];
        const dateMap = new Map();
        data.forEach(item => {
            const date = new Date(item.dia);
            const correctedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
            dateMap.set(correctedDate.toISOString().split('T')[0], item.cantidad_ingresos);
        });

        // Llenamos los últimos 30 días, poniendo 0 si no hubo ingresos
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }));
            dataPoints.push(dateMap.get(dateString) || 0);
        }

        chartContainer.innerHTML = `<canvas id="ocupacionZonaChart"></canvas>`;

        // Renderizamos el gráfico
        const ctx = document.getElementById('ocupacionZonaChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Ingresos Diarios`,
                    data: dataPoints,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1 // Asegura que el eje Y solo muestre números enteros
                        }
                    } 
                },
                plugins: {
                    legend: {
                        display: false // Oculta la leyenda "Ingresos Diarios"
                    }
                }
            }
        });

    } catch (error) {
        chartContainer.innerHTML = `<p class="error-message">Error al cargar el gráfico: ${error.message}</p>`;
    }
}

    async function generarReporteHorasPico() {
    try {
        const data = await apiCall(`${API_BASE_URL}/reportes/horas-pico`);

        // Filtramos para mostrar solo las horas que tuvieron al menos un ingreso.
        const filteredData = data.filter(item => item.cantidad_ingresos > 0);

        if (filteredData.length === 0) {
            renderReportResults('Ingresos por Hora (Horas Pico)', '<p>No hay registros de ingresos para mostrar en el gráfico.</p>');
            return;
        }

        // Preparamos los datos para el gráfico
        const labels = filteredData.map(item => `${String(item.hora).padStart(2, '0')}:00`);
        const dataPoints = filteredData.map(item => item.cantidad_ingresos);

        // Creamos el contenedor para el gráfico
        const content = `
            <div style="position: relative; height: 450px; width: 100%; max-width: 600px; margin: auto;">
                <canvas id="horasPicoChart"></canvas>
            </div>
        `;
        
        renderReportResults('Ingresos por Hora (Horas Pico)', content);

        // Renderizamos el gráfico de anillo (dona)
        const ctx = document.getElementById('horasPicoChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad de Ingresos',
                    data: dataPoints,
                    backgroundColor: [
                        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
                        '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
                        '#F97316', '#D946EF', '#0EA5E9', '#65A30D'
                    ],
                    hoverOffset: 8,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%', // Controla el grosor del anillo
                plugins: {
                    legend: {
                        position: 'right', // Coloca la leyenda a la derecha como en tu ejemplo
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Ingresos por Hora',
                        font: {
                            size: 18
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                }
            }
        });

    } catch (error) {
        renderReportResults('Ingresos por Hora (Horas Pico)', `<p class="error-message">Error al generar el reporte: ${error.message}</p>`);
    }
}

    
    async function generarReporteHistorialPlaca() {
        const placa = prompt("Por favor, ingrese el número de placa a buscar:");
        if (!placa) { showReportDashboard(); return; }
        try {
            const data = await apiCall(`${API_BASE_URL}/reportes/historial-placa/${placa.trim().toUpperCase()}`);
            let content = `<h3>Historial para la placa: <strong>${placa.toUpperCase()}</strong></h3><table><thead><tr><th>Fecha y Hora</th><th>Ubicación</th><th>Propietario</th></tr></thead><tbody>`;
            if (data.length === 0) content += `<tr><td colspan="3">No se encontraron registros de acceso para esta placa.</td></tr>`;
            else {
                data.forEach(item => {
                    content += `<tr><td>${new Date(item.fecha_hora).toLocaleString()}</td><td>${item.ubicacion}</td><td>${item.nombre} ${item.apellido}</td></tr>`;
                });
            }
            content += '</tbody></table>';
            renderReportResults('Historial de Acceso por Placa', content);
        } catch (error) {
            renderReportResults('Historial de Acceso por Placa', `<p class="error-message">Error: ${error.message}</p>`);
        }
    }
    
    async function generarReporteUsoPorRol() {
    try {
        const data = await apiCall(`${API_BASE_URL}/reportes/uso-por-rol`);

        if (data.length === 0) {
            renderReportResults('Frecuencia de Uso por Tipo de Usuario', '<p>No hay datos de uso por rol para mostrar.</p>');
            return;
        }

        // Preparamos los datos para el gráfico
        const labels = data.map(item => item.rol);
        const dataPoints = data.map(item => item.total_accesos);

        // Creamos el contenedor para el gráfico
        const content = `
            <div style="position: relative; height: 450px; width: 100%; max-width: 550px; margin: auto;">
                <canvas id="usoPorRolChart"></canvas>
            </div>
        `;
        
        renderReportResults('Frecuencia de Uso por Tipo de Usuario', content);

        // Renderizamos el gráfico de torta (pie)
        const ctx = document.getElementById('usoPorRolChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie', // Cambiamos el tipo a 'pie' para una torta completa
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total de Accesos',
                    data: dataPoints,
                    backgroundColor: [ // Paleta de colores variada
                        '#3B82F6', // Azul
                        '#10B981', // Verde
                        '#F59E0B', // Ámbar
                        '#8B5CF6', // Violeta
                        '#EF4444', // Rojo
                        '#EC4899', // Rosa
                    ],
                    hoverOffset: 8,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom', // La leyenda se ve mejor abajo en este tipo de gráfico
                        labels: {
                            padding: 25,
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Accesos por Rol de Usuario',
                        font: {
                            size: 18
                        },
                        padding: {
                            bottom: 25
                        }
                    }
                }
            }
        });

    } catch (error) {
        renderReportResults('Frecuencia de Uso por Tipo de Usuario', `<p class="error-message">Error al generar el reporte: ${error.message}</p>`);
    }
}

    
    // --- LÓGICA PARA RESERVA (VISTA USUARIO NO-ADMIN) ---
    let espacioParaReservar = null;
    
   async function cargarMapaDeEstacionamiento() {
    const container = document.getElementById('parking-map-container');
    if (!container) return;

    try {
        const espacios = await apiCall(`${API_BASE_URL}/espacios`);
        container.innerHTML = ''; // Limpiar la vista anterior

        espacios.forEach(espacio => {
            const spaceDiv = document.createElement('div');
            const tipoEspacio = espacio.tipo_espacio.toLowerCase(); // Convertir a minúsculas
            
            // Añadimos clases para el estado y el TIPO de espacio
            spaceDiv.className = `parking-space ${espacio.estado.toLowerCase()} tipo-${tipoEspacio}`;
            spaceDiv.dataset.id = espacio.id_espacio;
            
            // Asignamos el icono correcto según el tipo de espacio
            let iconClass = 'fa-car'; // Icono por defecto para 'auto' o 'normal'
            if (tipoEspacio === 'moto') {
                iconClass = 'fa-motorcycle';
            } else if (tipoEspacio === 'discapacitado') {
                iconClass = 'fa-wheelchair';
            }
            
            // CORREGIDO: Usamos 'espacio.ubicacion' que es el nombre correcto de la columna
            spaceDiv.innerHTML = `
                <i class="fas ${iconClass} space-icon"></i>
                <span class="space-code">${espacio.ubicacion}</span>
            `;
            
            // Si el espacio está disponible, se le puede hacer clic para reservar
            if (espacio.estado === 'disponible') {
                // CORREGIDO: Pasamos 'espacio.ubicacion' al modal
                spaceDiv.addEventListener('click', () => mostrarModalReserva(espacio.id_espacio, espacio.ubicacion));
            }

            container.appendChild(spaceDiv);
        });
    } catch (error) {
        console.error("Error en cargarMapaDeEstacionamiento:", error);
        container.innerHTML = '<p class="error-message">No se pudo cargar el estado de los espacios.</p>';
    }
}

// El resto de tus funciones de reserva se mantienen igual.
function setupModalReservation(){
    const reservationModal = document.getElementById('reservationModal');
    if(reservationModal){
         reservationModal.querySelector('#closeReservationModal').onclick = cerrarModalReserva;
         reservationModal.querySelector('#cancelReservationBtn').onclick = cerrarModalReserva;
         reservationModal.querySelector('#confirmReservationBtn').onclick = confirmarReserva;
    }
}

function mostrarModalReserva(id, ubicacion) {
    espacioParaReservar = id; 
    const modalText = document.getElementById('reservationModalText');
    const reservationModal = document.getElementById('reservationModal');
    modalText.textContent = `¿Estás seguro de que quieres reservar el espacio ${ubicacion}? solo tendra 10 minutos para ingresar al espacio reservado.`;
    reservationModal.style.display = 'block';
}

function cerrarModalReserva() {
    espacioParaReservar = null;
    const reservationModal = document.getElementById('reservationModal');
    if(reservationModal) reservationModal.style.display = 'none';
}

async function confirmarReserva() {
    if (!espacioParaReservar || !userData || !userData.id) {
        alert("Error de sesión o de selección. Por favor, intente de nuevo.");
        return;
    }
    try {
        const vehiculos = await apiCall(`${API_BASE_URL}/vehiculos?userId=${userData.id}`);
        if(vehiculos.length === 0){
            alert("No tiene ningún vehículo registrado para poder realizar una reserva.");
            return;
        }
        const id_vehiculo_principal = vehiculos[0].id_vehiculo;

        const response = await apiCall(`${API_BASE_URL}/espacios/reservar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_espacio: espacioParaReservar,
                id_usuario: userData.id,
                id_vehiculo: id_vehiculo_principal
            })
        });
        alert(response.message);
        cerrarModalReserva();
        cargarMapaDeEstacionamiento();
    } catch (error) {
        alert(`Error: ${error.message}`);
        cerrarModalReserva();
    }
}


    // --- CONFIGURACIÓN ---
    async function handleUserSearch(searchTerm) {
    const resultsBody = document.getElementById('userSearchResultsBody');

    // Si el campo de búsqueda está vacío, limpiamos la tabla y mostramos el mensaje inicial.
    if (!searchTerm.trim()) {
        resultsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Ingrese un término de búsqueda para encontrar un usuario.</td></tr>';
        return;
    }
    
    // Mostramos "Buscando..." solo si hay texto en el input.
    resultsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Buscando...</td></tr>';

    try {
        // La llamada a la API sigue siendo la misma.
        const usersFound = await apiCall(`${API_BASE_URL}/usuarios/buscar/${searchTerm}`);
        
        resultsBody.innerHTML = ''; // Limpiar la tabla

        if (usersFound.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No se encontraron coincidencias.</td></tr>';
            return;
        }

        usersFound.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id_usuario}</td>
                <td>${user.nombre} ${user.apellido}</td>
                <td>${user.rol}</td>
                <td>${user.placa ?? 'N/A'}</td>
                <td>${(user.marca ?? '') + ' ' + (user.modelo ?? '')}</td>
                <td class="columna-acciones">
                    <button class="btn-edit" onclick="openEditUserModal(${user.id_usuario})">
                        <i class="fas fa-edit"></i> Editar Usuario
                    </button>
                </td>
            `;
            resultsBody.appendChild(row);
        });
    } catch (error) {
        resultsBody.innerHTML = `<tr><td colspan="6" class="error-message">Error: ${error.message}</td></tr>`;
    }
}


// --- 1. FUNCIONES PARA MANEJAR EL MODAL ---
// Estas funciones deben estar en tu script.

function openImageModal(imageUrl, plate) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    // Asegúrate de que la ruta a tus imágenes sea la correcta
    modalImage.src = `/modelos de carros/${imageUrl}`; 
    modalCaption.textContent = `Placa: ${plate}`;
    
    // Cambiamos el display a 'flex' para que se muestre
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imagePreviewModal');
    modal.style.display = 'none';
}


    // --- LOGOUT ---
    function logout() {
        if (confirm("¿Estás seguro de que quieres cerrar la sesión?")) {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        }
    }


// =============================================================================
// === GESTIÓN DEL MODAL DE NUEVO INGRESO ( Registrar Espacio Libre ) ==========
// =============================================================================

    // Referencia al modal y elementos del DOM
    const newAccessModal = document.getElementById('newAccessModal');
    const btnNewAccess = document.getElementById('btn-new-access');
    const closeNewAccessBtn = document.getElementById('closeNewAccessModal');
    const formNuevoIngreso = document.getElementById('formNuevoIngreso');
    const propietarioInput = document.getElementById('propietario-input');
    const placaInput = document.getElementById('placa');
    const tipoVehiculoInput = document.getElementById('tipo_vehiculo');
    const ubicacionSelect = document.getElementById('ubicacion');
    const datalistPropietarios = document.getElementById('lista-propietarios');

    // Variable para guardar el espacio preseleccionado (si viene del click en el mapa)
    let espacioPreseleccionado = null;

    // --- 1. ABRIR/CERRAR MODAL ---
    function openNewAccessModal(espacioId = null) {
        if (!newAccessModal) return;
        
        espacioPreseleccionado = espacioId;
        
        // Resetear el formulario
        formNuevoIngreso.reset();
        placaInput.value = '';
        tipoVehiculoInput.value = '';
        
        // Cargar espacios disponibles
        cargarEspaciosDisponibles(espacioId);
        
        // Mostrar el modal
        newAccessModal.style.display = 'flex';
    }

    function closeNewAccessModal() {
        if (newAccessModal) {
            newAccessModal.style.display = 'none';
            espacioPreseleccionado = null;
        }
    }

    // Event listeners para abrir/cerrar
    if (btnNewAccess) {
        btnNewAccess.addEventListener('click', () => openNewAccessModal());
    }

    if (closeNewAccessBtn) {
        closeNewAccessBtn.addEventListener('click', closeNewAccessModal);
    }

    // Cerrar al hacer click fuera del modal
    if (newAccessModal) {
        newAccessModal.addEventListener('click', (e) => {
            if (e.target === newAccessModal) {
                closeNewAccessModal();
            }
        });
    }

    // --- 2. CARGAR ESPACIOS DISPONIBLES EN EL SELECT ---
    async function cargarEspaciosDisponibles(espacioId = null) {
        if (!ubicacionSelect) return;
        
        try {
            const espacios = await apiCall(`${API_BASE_URL}/espacios`);
            const disponibles = espacios.filter(e => e.estado === 'disponible');
            
            ubicacionSelect.innerHTML = '<option value="">-- Seleccione un espacio disponible --</option>';
            
            disponibles.forEach(espacio => {
                const option = document.createElement('option');
                option.value = espacio.ubicacion;
                option.textContent = `${espacio.ubicacion} (${espacio.tipo_espacio})`;
                option.dataset.idEspacio = espacio.id_espacio;
                
                // Si hay un espacio preseleccionado, seleccionarlo
                if (espacioId && espacio.id_espacio == espacioId) {
                    option.selected = true;
                }
                
                ubicacionSelect.appendChild(option);
            });
            
            // Si no hay espacios disponibles, mostrar mensaje
            if (disponibles.length === 0) {
                ubicacionSelect.innerHTML = '<option value="">-- No hay espacios disponibles --</option>';
            }
            
        } catch (error) {
            console.error('Error al cargar espacios:', error);
            ubicacionSelect.innerHTML = '<option value="">-- Error al cargar --</option>';
        }
    }

    // --- 3. BUSCAR PROPIETARIOS PARA EL AUTOCOMPLETADO ---
    let searchTimeout = null;

    propietarioInput.addEventListener('input', async () => {
        const termino = propietarioInput.value.trim();
        
        // Limpiar timeout anterior
        if (searchTimeout) clearTimeout(searchTimeout);
        
        // Si el término es muy corto, no buscar
        if (termino.length < 2) {
            datalistPropietarios.innerHTML = '';
            return;
        }
        
        // Esperar 300ms antes de buscar (debounce)
        searchTimeout = setTimeout(async () => {
            try {
                const resultados = await apiCall(`${API_BASE_URL}/usuarios/buscar/${encodeURIComponent(termino)}`);
                
                datalistPropietarios.innerHTML = '';
                
                resultados.forEach(usuario => {
                    if (usuario.placa) {
                        const option = document.createElement('option');
                        option.value = `${usuario.nombre} ${usuario.apellido}`;
                        option.dataset.idUsuario = usuario.id_usuario;
                        option.dataset.placa = usuario.placa;
                        option.dataset.tipoVehiculo = usuario.tipo_vehiculo || 'Auto';
                        option.dataset.marca = usuario.marca || '';
                        option.dataset.modelo = usuario.modelo || '';
                        datalistPropietarios.appendChild(option);
                    }
                });
                
            } catch (error) {
                console.error('Error al buscar propietarios:', error);
            }
        }, 300);
    });

    // --- 4. AUTOCOMPLETAR PLACA Y TIPO CUANDO SE SELECCIONA UN PROPIETARIO ---
    propietarioInput.addEventListener('change', async () => {
        const valorIngresado = propietarioInput.value.trim();
        
        // Buscar la opción seleccionada en el datalist
        const opciones = datalistPropietarios.querySelectorAll('option');
        let opcionSeleccionada = null;
        
        opciones.forEach(option => {
            if (option.value === valorIngresado) {
                opcionSeleccionada = option;
            }
        });
        
        if (opcionSeleccionada) {
            placaInput.value = opcionSeleccionada.dataset.placa;
            tipoVehiculoInput.value = opcionSeleccionada.dataset.tipoVehiculo;
        } else {
            // Si no se encontró exactamente, buscar por nombre parcial
            // Esto maneja el caso donde el usuario selecciona del dropdown
            for (const option of opciones) {
                if (valorIngresado.toLowerCase().includes(option.value.toLowerCase()) ||
                    option.value.toLowerCase().includes(valorIngresado.toLowerCase())) {
                    placaInput.value = option.dataset.placa;
                    tipoVehiculoInput.value = option.dataset.tipoVehiculo;
                    propietarioInput.value = option.value; // Normalizar el nombre
                    break;
                }
            }
        }
    });

    // --- 5. MANEJAR SUBMIT DEL FORMULARIO ---
    formNuevoIngreso.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const propietario = propietarioInput.value.trim();
        const placa = placaInput.value.trim();
        const tipoVehiculo = tipoVehiculoInput.value.trim();
        const ubicacion = ubicacionSelect.value;
        
        // Validaciones
        if (!propietario || !placa || !tipoVehiculo || !ubicacion) {
            alert('Por favor, complete todos los campos correctamente.');
            return;
        }
        
        // Obtener el ID del espacio seleccionado
        const selectedOption = ubicacionSelect.querySelector('option:checked');
        const idEspacio = selectedOption ? selectedOption.dataset.idEspacio : null;
        
        if (!idEspacio) {
            alert('Por favor, seleccione un espacio válido.');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/ingreso-directo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    placa: placa,
                    propietario: propietario,
                    tipo_vehiculo: tipoVehiculo,
                    ubicacion: ubicacion
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                alert(`Error: ${data.error}`);
                return;
            }
            
            alert('✅ ¡Ingreso registrado exitosamente!');
            closeNewAccessModal();
            
            // Recargar los datos de espacios para ver el cambio
            if (typeof renderParkingSpaces === 'function') {
                renderParkingSpaces();
            }
            
        } catch (error) {
            console.error('Error al registrar ingreso:', error);
            alert('No se pudo conectar con el servidor para registrar el ingreso.');
        }
    });


    

}); // --- FIN DEL addEventListener 'DOMContentLoaded' ---

