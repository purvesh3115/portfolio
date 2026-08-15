/* ==========================================================================
   PORTFOLIO INTERACTION ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initFormHandling();
    initScrollAnimations();
    initSmoothScroll();
    initNavHighlighting();
});

/* --- Mobile Navigation --- */
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links') || document.querySelector('.nav-links');
    
    if (!navToggle) return;
    
    // Toggle the Tailwind `hidden` class for mobile
    navToggle.addEventListener('click', () => {
        if (window.innerWidth < 768 && navLinks) {
            navLinks.classList.toggle('hidden');
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!expanded));
        }
    });

    // Close mobile menu when a link is clicked
    if (navLinks) {
        navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    navLinks.classList.add('hidden');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
}

/* --- Nav Highlighting (updates active link on scroll & click) --- */
function initNavHighlighting() {
    const links = Array.from(document.querySelectorAll('#nav-links a[href^="#"], header nav a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('section[id]'));

    if (!links.length || !sections.length) return;

    const setActive = (id) => {
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
                link.classList.add('text-primary','font-bold','border-b-2','border-primary','pb-1');
                link.classList.remove('text-on-surface-variant');
            } else {
                link.classList.remove('text-primary','font-bold','border-b-2','border-primary','pb-1');
                link.classList.add('text-on-surface-variant');
            }
        });
    };

    // compute header offset and apply CSS variable for scroll-margin
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 64;
    document.documentElement.style.setProperty('--header-offset', `${headerHeight + 8}px`);
    // apply scroll-padding to body so anchor jumps avoid being hidden
    document.documentElement.style.scrollPaddingTop = `${headerHeight + 8}px`;
    sections.forEach(s => s.style.scrollMarginTop = `var(--header-offset)`);

    // IntersectionObserver to detect visible section
    const observerOptions = {
        root: null,
        rootMargin: `-${Math.round(headerHeight + 8)}px 0px -40% 0px`,
        threshold: [0.15, 0.35, 0.5, 0.75]
    };

    let activeId = null;
    const io = new IntersectionObserver((entries) => {
        // pick the entry with largest intersectionRatio that isIntersecting
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) {
            visible.sort((a,b) => b.intersectionRatio - a.intersectionRatio);
            const topEntry = visible[0];
            const id = topEntry.target.getAttribute('id');
            if (id && id !== activeId) {
                activeId = id;
                setActive(id);
            }
        }
    }, observerOptions);

    sections.forEach(section => io.observe(section));

    // on click: immediately set active and close mobile nav if open
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const id = href.slice(1);
                setActive(id);
                // close mobile menu if present
                const navLinks = document.getElementById('nav-links');
                const navToggle = document.getElementById('nav-toggle');
                if (navLinks && window.innerWidth < 768) {
                    navLinks.classList.add('hidden');
                    if (navToggle) navToggle.setAttribute('aria-expanded','false');
                }
            }
        });
    });
}

/* --- Form Handling --- */
const API_BASE_URL = 'http://localhost:5000/api';

function initFormHandling() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            // Support multiple possible input id/name conventions used across versions
            const getField = (selectors) => {
                for (const sel of selectors) {
                    const el = form.querySelector(sel);
                    if (el) return el.value;
                }
                return '';
            };

            const formData = {
                name: getField(['#name', '#cf-name', '[name="from_name"]', '[name="name"]']),
                email: getField(['#email', '#cf-email', '[name="reply_to"]', '[name="email"]']),
                subject: getField(['#subject', '[name="subject"]']) || 'Portfolio Inquiry',
                message: getField(['#message', '#cf-message', '[name="message"]'])
            };
            
            // Send to backend
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Success! Your message has been sent.', 'success');
                form.reset();
            } else {
                const errorMsg = result.errors 
                    ? result.errors.map(err => err.msg).join(', ')
                    : result.message;
                showNotification(`Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to send message. Please check if backend is running.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/* --- Notification System --- */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/* --- Scroll Animations --- */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease-out';
        observer.observe(section);
    });
}

/* --- Smooth Scroll --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            // Close mobile nav first if open (allow other handlers to run)
            const navLinks = document.getElementById('nav-links');
            const navToggle = document.getElementById('nav-toggle');
            if (navLinks && window.innerWidth < 768) {
                navLinks.classList.add('hidden');
                if (navToggle) navToggle.setAttribute('aria-expanded','false');
            }

            // Defer measurement to next frame to allow layout updates (menu close)
            requestAnimationFrame(() => {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 64;
                const targetTop = window.pageYOffset + target.getBoundingClientRect().top - (headerHeight + 8);
                window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            });
        });
    });
}

/* --- Add Animation Keyframes --- */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

/* --- Backend Health Check --- */
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend server is running');
        }
    } catch (error) {
        console.warn('⚠️ Backend server is not running. Contact form will not work.');
        console.warn('   Run: npm install && npm run dev');
    }
}

// Check backend on page load
window.addEventListener('load', checkBackendHealth);
