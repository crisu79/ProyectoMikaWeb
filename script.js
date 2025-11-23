// =================================================================
//  1. FUNCIÓN DE UTILIDAD: THROTTLE
// =================================================================

/**
 * Limita la frecuencia de ejecución de una función.
 * @param {Function} func La función a estrangular.
 * @param {number} limit El tiempo mínimo en milisegundos entre ejecuciones (ej: 100ms).
 * @returns {Function} La función estrangulada.
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            // Después del límite de tiempo, permite la siguiente ejecución
            setTimeout(() => inThrottle = false, limit);
        }
    }
}


// =================================================================
//  2. INICIO DEL SCRIPT PRINCIPAL
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    const IS_DEBUGGING = false; 
    
    function logDebug(message) {
        if (IS_DEBUGGING) {
            console.log(`[MIKA DEBUG]: ${message}`);
        }
    }

    logDebug('--- Script iniciado. Modulos cargados: Throttle, Carousel, Nav.');

    // =================================================================
    //  3. LÓGICA DE NAVEGACIÓN MÓVIL
    // =================================================================
    const navToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    // Función para alternar el menú móvil
    function toggleMobileMenu() {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
        
        navToggle.setAttribute('aria-expanded', !isExpanded);
        mainNav.classList.toggle('active');
        navToggle.classList.toggle('active');
        
        logDebug(`Menú móvil ${!isExpanded ? 'abierto' : 'cerrado'}`);
    }

    navToggle.addEventListener('click', toggleMobileMenu);

    // Cerrar menú al hacer clic en un enlace (solo en móvil)
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Se usa matchMedia para saber si estamos en un tamaño móvil (menos de 576px, ver CSS)
            if (window.matchMedia('(max-width: 57.6rem)').matches) {
                // Si el menú está abierto, lo cerramos
                if (mainNav.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });


    // =================================================================
    //  4. LÓGICA DEL CARRUSEL (RequestAnimationFrame)
    // =================================================================
    
    const carouselContainer = document.querySelector('.carousel-container');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    
    if (carouselContainer) {
        
        let animationFrameId = null;
        let isPaused = false;
        let lastTimestamp = 0;
        // La velocidad de desplazamiento en píxeles por segundo (px/ms) 
        // 0.05px por milisegundo = 50px por segundo.
        const SCROLL_SPEED = 0.05; 
        // Tiempo de pausa manual tras interacción (en ms)
        const PAUSE_DURATION = 3000; 
        let resumeTimeoutId = null;


        /**
         * Detiene la animación de requestAnimationFrame.
         */
        function stopAutoScroll() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                logDebug('Auto-scroll detenido.');
            }
            isPaused = true;
            // Limpiar el temporizador de reanudación si existe
            if (resumeTimeoutId) {
                clearTimeout(resumeTimeoutId);
                resumeTimeoutId = null;
            }
        }
        
        /**
         * Reinicia la animación de requestAnimationFrame.
         */
        function startAutoScroll() {
            if (!animationFrameId) {
                isPaused = false;
                animationFrameId = requestAnimationFrame(animateScroll);
                logDebug('Auto-scroll iniciado.');
            }
        }

        /**
         * Función principal de animación, llamada por requestAnimationFrame.
         * @param {number} timestamp - Tiempo transcurrido desde el inicio de la carga de la página.
         */
        function animateScroll(timestamp) {
            // Si está en pausa o fuera de vista, no hacer nada más que intentar en el siguiente frame
            if (isPaused) {
                return;
            }
            
            if (!lastTimestamp) {
                lastTimestamp = timestamp;
            }

            // Calcular la diferencia de tiempo para un movimiento consistente
            const deltaTime = timestamp - lastTimestamp;
            
            // Calcular cuánto desplazar en base al tiempo transcurrido
            const scrollAmount = SCROLL_SPEED * deltaTime;
            
            // Mover el carrusel
            carouselContainer.scrollLeft += scrollAmount;

            // Lógica de bucle: si llegamos al final, volvemos al inicio.
            if (carouselContainer.scrollLeft >= (carouselContainer.scrollWidth - carouselContainer.clientWidth)) {
                // Al llegar al final, esperamos un momento antes de volver
                stopAutoScroll();
                setTimeout(() => {
                    // Volver al inicio instantáneamente (sin scroll suave)
                    carouselContainer.scrollLeft = 0; 
                    logDebug('Carrusel reiniciado.');
                    // Reanudar el scroll
                    startAutoScroll();
                }, 1500); // 1.5 segundos de pausa al final del bucle
                
            } else {
                lastTimestamp = timestamp;
                // Si no hemos llegado al final, solicitamos el siguiente frame
                animationFrameId = requestAnimationFrame(animateScroll);
            }
        }
        
        /**
         * Lógica para reanudar la animación automáticamente después de una pausa manual.
         */
        function scheduleResume() {
            stopAutoScroll(); // Aseguramos que se detiene inmediatamente
            
            // Programamos la reanudación
            resumeTimeoutId = setTimeout(() => {
                startAutoScroll();
                logDebug('Auto-scroll reanudado tras interacción.');
            }, PAUSE_DURATION); 
        }
        
        // Manejar la pausa al hacer hover o focus en el contenedor
        carouselWrapper.addEventListener('mouseenter', stopAutoScroll);
        carouselWrapper.addEventListener('mouseleave', () => {
            // Reanudar solo si no hay un elemento enfocado dentro del contenedor
            if (!carouselWrapper.matches(':focus-within')) {
                startAutoScroll();
            }
        });
        
        // Manejar la pausa al enfocar (teclado/accesibilidad) y reanudar al desenfocar
        carouselWrapper.addEventListener('focusin', stopAutoScroll);
        carouselWrapper.addEventListener('focusout', () => {
            // Reanudar solo si no hay hover y ningún elemento está enfocado dentro
            if (!carouselWrapper.matches(':hover') && !carouselWrapper.matches(':focus-within')) {
                startAutoScroll();
            }
        });

        // Detener animación cuando el usuario scroll manualmente y programar la reanudación
        // Usamos throttle para evitar que se ejecute excesivamente al hacer scroll
        const throttledManualScroll = throttle(scheduleResume, 100); 

        carouselContainer.addEventListener('scroll', () => {
            // Solo llamar a la función si la animación estaba activa y no fue pausada por hover/focus
            if (animationFrameId !== null || resumeTimeoutId !== null) {
                throttledManualScroll();
            }
        });
        
        // --- Lógica de navegación manual (Flechas) ---
        
        /**
         * Desplaza el carrusel a la siguiente posición o vuelve al inicio/final.
         * @param {number} direction - 1 para siguiente, -1 para anterior.
         */
        function navigateCarousel(direction) {
            // Detener la animación y programar su reanudación
            scheduleResume(); 
            
            // Usamos el tamaño del primer elemento como referencia
            const item = carouselContainer.querySelector('.carousel-item');
            const itemWidth = item.offsetWidth + parseFloat(getComputedStyle(item).marginRight);

            let targetScroll = carouselContainer.scrollLeft + (direction * itemWidth);

            if (direction === 1) {
                // Next: si el objetivo está cerca del final, ir al inicio
                if (targetScroll >= (carouselContainer.scrollWidth - carouselContainer.clientWidth - 1)) {
                    targetScroll = 0;
                }
            } else if (direction === -1) {
                // Prev: si el objetivo está antes del inicio, ir al final
                if (targetScroll < 0) {
                    targetScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
                }
            }

            carouselContainer.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }

        // Event listeners para las flechas
        prevArrow.addEventListener('click', () => navigateCarousel(-1));
        nextArrow.addEventListener('click', () => navigateCarousel(1));

        // Iniciar el auto-scroll al cargar
        startAutoScroll();
        
    } else {
        logDebug('Contenedor del carrusel no encontrado. Saltando la lógica de carrusel.');
    }

});
