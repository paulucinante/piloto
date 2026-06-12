document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. BASE DE DATOS LOCAL Y MOCK RECORDS
  // ==========================================
  const mockRegistrations = [
    { id: 1, fecha: '02/06/2026 10:15', nombre_apellidos: 'Carlos Martín Gómez', entidad: 'Fundación Inclusión', cargo: 'Preparador Laboral', email: 'carlos.martin@fundacioninclusion.org', telefono: '612345678', provincia: 'Madrid', entrevista: 'Sí', comentarios: 'Interesado en una entrevista corta por la mañana.' },
    { id: 2, fecha: '02/06/2026 11:30', nombre_apellidos: 'Sofía Ruiz Plaza', entidad: 'Asociación Aspadir', cargo: 'Técnica de Empleo', email: 'sofia.ruiz@aspadir.es', telefono: '654321098', provincia: 'Barcelona', entrevista: 'Quiero más información', comentarios: 'Nos gustaría conocer el tipo de preguntas antes de coordinar.' },
    { id: 3, fecha: '02/06/2026 12:45', nombre_apellidos: 'Miguel Ángel Sanz López', entidad: 'Fundación ONCE', cargo: 'Coordinador de Empleo', email: 'miguel.sanz@fundaciononce.es', telefono: '678901234', provincia: 'Valencia', entrevista: 'Sí', comentarios: 'Podemos colaborar facilitando opiniones de varios preparadores.' },
    { id: 4, fecha: '02/06/2026 14:10', nombre_apellidos: 'Lucía Fernández Ocaña', entidad: 'Asociación Autismo Sevilla', cargo: 'Preparadora Laboral', email: 'lucia.fernandez@autismosevilla.org', telefono: '690123456', provincia: 'Sevilla', entrevista: 'Sí', comentarios: 'Disponible para entrevista online en cualquier momento.' }
  ];

  // Obtiene los registros guardados o inicializa con los mock
  function obtenerRegistros() {
    const almacenados = localStorage.getItem('registros_piloto');
    if (!almacenados) {
      localStorage.setItem('registros_piloto', JSON.stringify(mockRegistrations));
      return mockRegistrations;
    }
    try {
      return JSON.parse(almacenados);
    } catch (e) {
      return mockRegistrations;
    }
  }

  // Guarda un nuevo registro
  function guardarRegistro(nuevo) {
    const lista = obtenerRegistros();
    lista.push(nuevo);
    localStorage.setItem('registros_piloto', JSON.stringify(lista));
  }

  // Genera fecha con formato DD/MM/AAAA HH:MM
  function obtenerFechaActualString() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  }

  // Mapea valor de radio de entrevista a texto entendible
  function obtenerEntrevistaTexto(valor) {
    switch(valor) {
      case 'si': return 'Sí';
      case 'mas-info': return 'Quiero más información';
      default: return valor;
    }
  }

  // ==========================================
  // 2. CONFIGURACIÓN DE CONEXIÓN A GOOGLE SHEETS
  // ==========================================
  const webappUrlInput = document.getElementById('input-webapp-url');
  const saveWebappUrlBtn = document.getElementById('btn-save-webapp-url');
  const webappUrlStatus = document.getElementById('webapp-url-status');
  
  // Cargar URL existente al iniciar
  if (webappUrlInput) {
    webappUrlInput.value = localStorage.getItem('google_sheet_webapp_url') || '';
  }
  
  // Guardar URL en localStorage al hacer clic con validación para evitar URL del editor
  if (saveWebappUrlBtn) {
    saveWebappUrlBtn.addEventListener('click', () => {
      const url = webappUrlInput.value.trim();
      if (webappUrlStatus) {
        if (!url) {
          localStorage.setItem('google_sheet_webapp_url', '');
          webappUrlStatus.textContent = 'Enlace eliminado. Los nuevos registros solo se guardarán en este navegador.';
          webappUrlStatus.style.color = 'var(--color-text-muted)';
        } else if (!url.includes('script.google.com/macros/s/') || !url.endsWith('/exec')) {
          webappUrlStatus.textContent = '⚠️ Error: No has copiado la URL correcta. Asegúrate de copiar la URL de la Aplicación Web (que termina en /exec), no la de la barra de direcciones del editor (que termina en /edit).';
          webappUrlStatus.style.color = 'var(--color-error)';
        } else {
          localStorage.setItem('google_sheet_webapp_url', url);
          webappUrlStatus.textContent = '¡Enlace guardado con éxito! Los nuevos registros se enviarán a Google Sheets.';
          webappUrlStatus.style.color = 'var(--color-success)';
        }
        setTimeout(() => { webappUrlStatus.textContent = ''; }, 6000);
      }
    });
  }

  // ==========================================
  // 3. DESPLAZAMIENTO SUAVE Y GESTIÓN DE FOCO
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        // Desplazamiento suave
        target.scrollIntoView({ behavior: 'smooth' });
        
        // Esperamos a que termine la animación de desplazamiento y movemos el foco
        setTimeout(() => {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          
          // Si el destino es el formulario, ponemos el foco en el primer campo
          if (targetId === '#formulario-inscripcion') {
            const firstInput = document.getElementById('nombre_apellidos');
            if (firstInput) {
              firstInput.focus({ preventScroll: true });
            }
          }
        }, 800);
      }
    });
  });

  // ==========================================
  // 4. DIÁLOGOS LEGALES Y ADMIN (MODALES NATIVOS)
  // ==========================================
  const modals = {
    'btn-privacy': document.getElementById('modal-privacy'),
    'btn-legal': document.getElementById('modal-legal'),
    'btn-contact': document.getElementById('modal-contact'),
    'btn-admin': document.getElementById('modal-login') // Abre el login primero
  };

  // Abrir modales
  Object.entries(modals).forEach(([btnId, modal]) => {
    const btn = document.getElementById(btnId);
    if (btn && modal) {
      btn.addEventListener('click', () => {
        modal.showModal();
      });
    }
  });

  // Manejo de Login del Administrador
  const loginForm = document.getElementById('admin-login-form');
  const loginPasswordInput = document.getElementById('login-password');
  const loginErrorSpan = document.getElementById('error-login-password');
  const modalLogin = document.getElementById('modal-login');
  const modalAdmin = document.getElementById('modal-admin');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = loginPasswordInput.value.trim();
      
      // Contraseña del Panel de Control
      if (pwd === 'digitable2026') {
        loginErrorSpan.textContent = '';
        loginPasswordInput.value = '';
        loginPasswordInput.classList.remove('input-invalid');
        
        modalLogin.close();
        renderTablaRegistros(); // Carga los registros en la tabla
        modalAdmin.showModal(); // Abre el panel de control real
      } else {
        loginPasswordInput.classList.add('input-invalid');
        loginErrorSpan.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
      }
    });
    
    // Limpiar error al escribir
    loginPasswordInput.addEventListener('input', () => {
      loginPasswordInput.classList.remove('input-invalid');
      loginErrorSpan.textContent = '';
    });
  }

  // Cerrar modales (botones internos)
  document.querySelectorAll('.modal-close-btn, .modal-close-action').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('dialog');
      if (modal) {
        modal.close();
      }
    });
  });

  // Cerrar haciendo clic en el fondo oscuro (backdrop)
  document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        modal.close();
      }
    });
  });

  // Rellena la tabla del Panel de Control
  const tableBody = document.getElementById('admin-table-body');
  function renderTablaRegistros() {
    const lista = obtenerRegistros();
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    lista.forEach(reg => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: bold; color: var(--color-brand-primary);">${reg.id}</td>
        <td style="white-space: nowrap;">${reg.fecha}</td>
        <td style="font-weight: 700;">${reg.nombre_apellidos}</td>
        <td>${reg.entidad}</td>
        <td>${reg.cargo}</td>
        <td title="${reg.email}" style="color: var(--color-brand-primary);">${reg.email}</td>
        <td>${reg.telefono}</td>
        <td>${reg.provincia}</td>
        <td>${reg.entrevista}</td>
        <td title="${reg.comentarios || ''}">${reg.comentarios || ''}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // ==========================================
  // 5. DESCARGA EXCEL (CSV COMPATIBLE CON BOM)
  // ==========================================
  const downloadBtn = document.getElementById('btn-download-csv');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const lista = obtenerRegistros();
      
      // Encabezados con punto y coma para compatibilidad automática con Excel
      let csvContent = 'ID;Fecha de Registro;Nombre y Apellidos;Entidad u Organización;Cargo o Función;Correo Electrónico;Teléfono;Provincia;¿Participar en entrevista?;Comentarios;Acepta Privacidad;Estado de Contacto;Notas de Seguimiento\r\n';
      
      lista.forEach(reg => {
        const comentariosLimpios = (reg.comentarios || '')
          .replace(/;/g, ',')
          .replace(/\r?\n|\r/g, ' ');

        const fila = [
          reg.id,
          reg.fecha,
          reg.nombre_apellidos.replace(/;/g, ','),
          reg.entidad.replace(/;/g, ','),
          reg.cargo.replace(/;/g, ','),
          reg.email.replace(/;/g, ','),
          reg.telefono.replace(/;/g, ','),
          reg.provincia.replace(/;/g, ','),
          reg.entrevista,
          comentariosLimpios,
          'Sí',
          'Pendiente',
          ''
        ];
        
        csvContent += fila.join(';') + '\r\n';
      });
      
      // Añadimos el prefijo UTF-8 BOM (\uFEFF) para que Excel reconozca tildes e la eñe (ñ) automáticamente
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'base_datos_piloto.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Botón para borrar nuevos registros (restaurar mocks)
  const clearBtn = document.getElementById('btn-clear-data');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres borrar los nuevos registros y restaurar los datos de prueba?')) {
        localStorage.setItem('registros_piloto', JSON.stringify(mockRegistrations));
        renderTablaRegistros();
      }
    });
  }


  // ==========================================
  // 6. VALIDACIÓN DE FORMULARIO Y ENVÍO
  // ==========================================
  const form = document.getElementById('pilot-signup-form');
  const errorSummary = document.getElementById('form-error-summary');
  const successState = document.getElementById('form-success-state');
  const submitButton = document.getElementById('btn-submit-form');
  const btnText = submitButton ? submitButton.querySelector('.btn-text') : null;
  const btnSpinner = submitButton ? submitButton.querySelector('.btn-spinner') : null;

  if (form) {
    // Relacionar dinámicamente inputs con sus campos de error para aria-describedby
    const inputsToValidate = form.querySelectorAll('input[required], textarea[required]');
    inputsToValidate.forEach(input => {
      const errorId = `error-${input.id || input.name}`;
      input.setAttribute('aria-describedby', errorId);
    });

    // Función para mostrar un error en un campo
    function showError(inputElement, message) {
      inputElement.classList.add('input-invalid');
      inputElement.setAttribute('aria-invalid', 'true');
      
      if (inputElement.type === 'radio') {
        const parentFieldset = inputElement.closest('fieldset');
        if (parentFieldset) {
          parentFieldset.querySelectorAll('.custom-radio').forEach(r => r.classList.add('input-invalid'));
          const errorSpan = parentFieldset.querySelector('.field-error');
          if (errorSpan) errorSpan.textContent = message;
        }
      } else if (inputElement.type === 'checkbox') {
        const parentGroup = inputElement.closest('.form-group');
        if (parentGroup) {
          parentGroup.querySelector('.custom-checkbox').classList.add('input-invalid');
          const errorSpan = parentGroup.querySelector('.field-error');
          if (errorSpan) errorSpan.textContent = message;
        }
      } else {
        const errorSpan = document.getElementById(`error-${inputElement.id}`);
        if (errorSpan) {
          errorSpan.textContent = message;
        }
      }
    }

    // Función para limpiar el error de un campo
    function clearError(inputElement) {
      inputElement.classList.remove('input-invalid');
      inputElement.removeAttribute('aria-invalid');
      
      if (inputElement.type === 'radio') {
        const parentFieldset = inputElement.closest('fieldset');
        if (parentFieldset) {
          parentFieldset.querySelectorAll('.custom-radio').forEach(r => r.classList.remove('input-invalid'));
          const errorSpan = parentFieldset.querySelector('.field-error');
          if (errorSpan) errorSpan.textContent = '';
        }
      } else if (inputElement.type === 'checkbox') {
        const parentGroup = inputElement.closest('.form-group');
        if (parentGroup) {
          parentGroup.querySelector('.custom-checkbox').classList.remove('input-invalid');
          const errorSpan = parentGroup.querySelector('.field-error');
          if (errorSpan) errorSpan.textContent = '';
        }
      } else {
        const errorSpan = document.getElementById(`error-${inputElement.id}`);
        if (errorSpan) {
          errorSpan.textContent = '';
        }
      }
    }

    // Limpiar errores en tiempo real al escribir o cambiar valores
    form.addEventListener('input', (e) => {
      if (e.target.hasAttribute('required') || e.target.type === 'radio' || e.target.type === 'checkbox') {
        clearError(e.target);
      }
    });

    // Envío del formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let hasErrors = false;
      errorSummary.style.display = 'none';

      // 1. Validar Nombre y Apellidos
      const nombreApellidos = document.getElementById('nombre_apellidos');
      if (!nombreApellidos.value.trim()) {
        showError(nombreApellidos, 'Escribe tu nombre y apellidos.');
        hasErrors = true;
      } else {
        clearError(nombreApellidos);
      }

      // 2. Validar Entidad
      const entidad = document.getElementById('entidad');
      if (!entidad.value.trim()) {
        showError(entidad, 'Escribe tu entidad u organización.');
        hasErrors = true;
      } else {
        clearError(entidad);
      }

      // 3. Validar Cargo
      const cargo = document.getElementById('cargo');
      if (!cargo.value.trim()) {
        showError(cargo, 'Escribe tu cargo o función.');
        hasErrors = true;
      } else {
        clearError(cargo);
      }

      // 4. Validar Correo
      const email = document.getElementById('email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim()) {
        showError(email, 'Escribe tu correo electrónico.');
        hasErrors = true;
      } else if (!emailRegex.test(email.value.trim())) {
        showError(email, 'Escribe un correo electrónico válido (ejemplo: nombre@correo.com).');
        hasErrors = true;
      } else {
        clearError(email);
      }

      // 5. Validar Teléfono
      const telefono = document.getElementById('telefono');
      const telRegex = /^[0-9\s-+]{9,15}$/;
      if (!telefono.value.trim()) {
        showError(telefono, 'Escribe tu número de teléfono.');
        hasErrors = true;
      } else if (!telRegex.test(telefono.value.trim().replace(/\s/g, ''))) {
        showError(telefono, 'Escribe un teléfono válido de al menos 9 números.');
        hasErrors = true;
      } else {
        clearError(telefono);
      }

      // 6. Validar Provincia
      const provincia = document.getElementById('provincia');
      if (!provincia.value.trim()) {
        showError(provincia, 'Escribe tu provincia.');
        hasErrors = true;
      } else {
        clearError(provincia);
      }



      // 8. Validar ¿Participar en entrevista?
      const entrevistaRadios = form.querySelectorAll('input[name="entrevista"]');
      const entrevistaSelected = Array.from(entrevistaRadios).some(r => r.checked);
      if (!entrevistaSelected) {
        showError(entrevistaRadios[0], 'Selecciona una respuesta.');
        hasErrors = true;
      } else {
        clearError(entrevistaRadios[0]);
      }

      // 9. Validar Checkbox de Privacidad
      const privacidad = document.getElementById('privacidad-ok');
      if (!privacidad.checked) {
        showError(privacidad, 'Debes aceptar las condiciones para enviar el formulario.');
        hasErrors = true;
      } else {
        clearError(privacidad);
      }

      // Gestionar resultado de validación
      if (hasErrors) {
        errorSummary.style.display = 'flex';
        errorSummary.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          errorSummary.focus();
        }, 500);
        return;
      }

      // Procesar registro en BD local
      const listaActual = obtenerRegistros();
      const nuevoReg = {
        id: listaActual.length > 0 ? Math.max(...listaActual.map(r => r.id)) + 1 : 1,
        fecha: obtenerFechaActualString(),
        nombre_apellidos: nombreApellidos.value.trim(),
        entidad: entidad.value.trim(),
        cargo: cargo.value.trim(),
        email: email.value.trim(),
        telefono: telefono.value.trim(),
        provincia: provincia.value.trim(),
        entrevista: obtenerEntrevistaTexto(form.querySelector('input[name="entrevista"]:checked').value),
        comentarios: document.getElementById('comentarios').value.trim() || 'Ninguno indicado.'
      };

      guardarRegistro(nuevoReg);

      // Proceder al envío real o simulado
      enviarDatosFormulario(nuevoReg);
    });

    // Envía los datos
    function enviarDatosFormulario(nuevoReg) {
      if (!submitButton) return;
      submitButton.disabled = true;
      if (btnText) btnText.textContent = 'Enviando...';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      
      const sheetUrl = localStorage.getItem('google_sheet_webapp_url');
      
      if (sheetUrl) {
        // Enviar a Google Sheets usando fetch (modo no-cors con tipo de contenido simple 'text/plain' para evitar que el navegador bloquee la petición por preflight OPTIONS de CORS)
        fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: JSON.stringify(nuevoReg)
        })
        .then(() => {
          console.log('Enviado con éxito a Google Sheets');
          mostrarExitoFormulario();
        })
        .catch((err) => {
          console.error('Error al enviar a Google Sheets:', err);
          // Mostramos éxito igualmente para que la persona con TEA / discapacidad cognitiva no se frustre por fallos de red.
          // Los datos quedan respaldados de todos modos en el localStorage local y se pueden exportar a mano en el panel de control.
          mostrarExitoFormulario();
        });
      } else {
        // Simulación local normal (1.5s delay)
        setTimeout(() => {
          mostrarExitoFormulario();
        }, 1500);
      }
    }

    // Muestra pantalla de éxito
    function mostrarExitoFormulario() {
      form.style.display = 'none';
      if (successState) {
        successState.style.display = 'block';
        successState.setAttribute('tabindex', '-1');
        successState.focus({ preventScroll: true });
        successState.scrollIntoView({ behavior: 'smooth' });
      }
      submitButton.disabled = false;
      if (btnText) btnText.textContent = 'Solicitar entrevista';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  // Botón para restablecer el formulario desde el mensaje de éxito
  const resetBtn = document.getElementById('btn-success-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (form) form.reset();
      
      // Ocultar pantalla de éxito y mostrar formulario nuevamente
      if (successState) successState.style.display = 'none';
      if (form) form.style.display = 'block';
      
      // Enfocar el título del formulario
      const formTitle = document.getElementById('form-title');
      if (formTitle) {
        formTitle.setAttribute('tabindex', '-1');
        formTitle.focus({ preventScroll: true });
        formTitle.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
