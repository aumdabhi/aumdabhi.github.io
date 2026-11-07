(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const themeButtons = [...document.querySelectorAll('[data-theme-value]')];
  const setTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem('aum-theme-v2', theme);
    themeButtons.forEach((input) => {
      input.checked = input.dataset.themeValue === theme;
    });
  };
  setTheme(localStorage.getItem('aum-theme-v2') || 'light');
  themeButtons.forEach((input) => input.addEventListener('change', () => setTheme(input.dataset.themeValue)));

  const header = document.querySelector('.site-header');
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  const scrollMeter = document.getElementById('scroll-meter-bar');
  const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
  const syncScrollMeter = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.min(1, window.scrollY / available) : 0;
    scrollMeter.style.transform = `scaleX(${progress})`;
  };
  syncScrollMeter();
  window.addEventListener('scroll', syncScrollMeter, { passive: true });
  window.addEventListener('resize', syncScrollMeter);

  if ('IntersectionObserver' in window) {
    const railObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => {
        const active = link.dataset.sectionLink === visible.target.id;
        link.toggleAttribute('aria-current', active);
      });
    }, { rootMargin: '-28% 0px -55% 0px', threshold: [0, .15, .35, .65] });
    sectionLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.sectionLink);
      if (section) railObserver.observe(section);
    });
  }

  const menu = document.getElementById('mobile-menu');
  const menuTrigger = document.getElementById('menu-trigger');
  const menuClose = document.getElementById('menu-close');
  let menuReturnFocus = null;

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.toggleAttribute('inert', !open);
    menuTrigger.setAttribute('aria-expanded', String(open));
    menuTrigger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    body.classList.toggle('menu-open', open);
    if (open) {
      menuReturnFocus = document.activeElement;
      menu.querySelector('a').focus();
    } else if (menuReturnFocus) {
      menuReturnFocus.focus();
    }
  };

  menuTrigger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menuClose.addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.querySelectorAll('.nav-group > button').forEach((button) => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
    });
    button.parentElement.addEventListener('mouseleave', () => button.setAttribute('aria-expanded', 'false'));
  });

  const hero = document.querySelector('.hero');
  if (!reduceMotion) {
    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
      hero.style.setProperty('--hero-x', x.toFixed(3));
      hero.style.setProperty('--hero-y', y.toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0');
      hero.style.setProperty('--hero-y', '0');
    });
  }

  const revealItems = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const projectPanels = [...document.querySelectorAll('[data-project-panel]')];
  const projectTabs = [...document.querySelectorAll('[data-project-tab]')];
  const projectCount = document.getElementById('project-count');
  const projectStage = document.querySelector('.project-stage');
  let activeProject = 0;

  const showProject = (next, focusTab = false) => {
    activeProject = (next + projectPanels.length) % projectPanels.length;
    projectPanels.forEach((panel, index) => { panel.hidden = index !== activeProject; });
    projectTabs.forEach((tab, index) => {
      const selected = index === activeProject;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });
    projectCount.textContent = `${String(activeProject + 1).padStart(2, '0')} / ${String(projectPanels.length).padStart(2, '0')}`;
  };

  projectTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showProject(index));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showProject(index + 1, true); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showProject(index - 1, true); }
      if (event.key === 'Home') { event.preventDefault(); showProject(0, true); }
      if (event.key === 'End') { event.preventDefault(); showProject(projectPanels.length - 1, true); }
    });
  });
  document.getElementById('project-prev').addEventListener('click', () => showProject(activeProject - 1));
  document.getElementById('project-next').addEventListener('click', () => showProject(activeProject + 1));
  projectStage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') showProject(activeProject + 1);
    if (event.key === 'ArrowLeft') showProject(activeProject - 1);
  });

  let pointerStart = null;
  projectStage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    pointerStart = event.clientX;
  });
  projectStage.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) < 45) return;
    showProject(activeProject + (delta < 0 ? 1 : -1));
  });

  document.querySelectorAll('.role-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const current = trigger.closest('.role-item');
      const wasOpen = current.classList.contains('is-open');
      document.querySelectorAll('.role-item').forEach((item) => {
        item.classList.remove('is-open');
        const button = item.querySelector('.role-trigger');
        const detail = item.querySelector('.role-detail');
        button.setAttribute('aria-expanded', 'false');
        button.querySelector('.role-icon').textContent = '+';
        detail.hidden = true;
      });
      if (!wasOpen) {
        current.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.querySelector('.role-icon').textContent = '−';
        current.querySelector('.role-detail').hidden = false;
      }
    });
  });

  const searchDialog = document.getElementById('search-dialog');
  const searchTrigger = document.getElementById('search-trigger');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchEmpty = document.getElementById('search-empty');
  let searchReturnFocus = null;

  const searchIndex = [
    { number: '07', title: 'About Aum', detail: 'Background, working approach, education, and construction focus', target: '#about', terms: 'about profile background approach civil engineer construction management phoenix arktent education' },
    { number: '02', title: 'Highway Drainage Project', detail: 'Hydrology, hydraulics, cost estimating, and sequencing', target: '#projects', project: 0, terms: 'highway drainage storm sewer hydrology hydraulics academic' },
    { number: '02', title: 'RFI & Submittal Dashboard', detail: '120+ records, SLA analysis, and Power BI escalation alerts', target: '#projects', project: 1, terms: 'rfi submittal power bi analytics dashboard kpi document control 120 sla' },
    { number: '02', title: 'Trenchless Pipeline Project', detail: 'HDD, microtunneling, geotechnical analysis, and risk', target: '#projects', project: 2, terms: 'pipeline subsea hdd microtunneling geotechnical trenchless reef' },
    { number: '02', title: 'Desert Meadows Preschool IEQ', detail: 'LEED thermal comfort strategy, smart controls, and natural ventilation', target: '#projects', project: 3, terms: 'desert meadows preschool indoor environmental quality ieq thermal comfort smart thermostat blinds operable windows leed' },
    { number: '03', title: 'Arktent Pre-Construction', detail: 'Commercial permitting, APS coordination, and active bids', target: '#experience', terms: 'arktent pre-construction coordinator phoenix permit permitting aps bidnet bids revit autocad' },
    { number: '03', title: 'Project Engineer Experience', detail: '209 km water-supply program and QA/QC leadership', target: '#experience', terms: 'experience project engineer vinod patel pipeline subcontractor cost water supply 209' },
    { number: '03', title: 'Site Engineer Experience', detail: '$38M highway bridge field coordination', target: '#experience', terms: 'site engineer bridge highway equipment procurement internship' },
    { number: '03', title: 'AI in Construction Research', detail: 'AI agents for codes, specifications, and permit criteria', target: '#experience', terms: 'graduate researcher asu ai construction llm agent codes specifications permits' },
    { number: '04', title: 'Capabilities & Tools', detail: 'AutoCAD, Revit, BidNet, P6, Procore, Bluebeam, Power BI, and Excel', target: '#capabilities', terms: 'skills capabilities tools autocad revit bidnet primavera p6 procore bluebeam power bi excel ineight project 365' },
    { number: '05', title: 'Education & Journey', detail: 'Civil engineering and construction management', target: '#journey', terms: 'journey education ganpat asu masters civil construction management' },
    { number: '06', title: 'Credentials', detail: 'OSHA 30, LEED GA, Bluebeam, CMIT, Procore, and P6', target: '#credentials', terms: 'credentials certification osha leed bluebeam cmit procore primavera' },
    { number: '07', title: 'Contact Aum', detail: 'Email, phone, and LinkedIn', target: '#contact', terms: 'contact aumdabhi22 gmail phone 602 linkedin opportunity relocate opt' }
  ];

  const renderSearch = (query = '') => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? searchIndex.filter((item) => `${item.title} ${item.detail} ${item.terms}`.toLowerCase().includes(normalized))
      : searchIndex;
    searchResults.replaceChildren(...matches.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result';
      button.innerHTML = `<span>${item.number}</span><span><strong>${item.title}</strong><small>${item.detail}</small></span><span aria-hidden="true">↗</span>`;
      button.addEventListener('click', () => {
        closeSearch();
        if (Number.isInteger(item.project)) showProject(item.project);
        requestAnimationFrame(() => document.querySelector(item.target).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
      });
      return button;
    }));
    searchEmpty.hidden = matches.length !== 0;
  };

  const openSearch = () => {
    if (searchDialog.open) return;
    searchReturnFocus = document.activeElement;
    renderSearch();
    searchDialog.showModal();
    body.classList.add('dialog-open');
    requestAnimationFrame(() => searchInput.focus());
  };
  function closeSearch() {
    if (!searchDialog.open) return;
    searchDialog.close();
    body.classList.remove('dialog-open');
    searchInput.value = '';
    if (searchReturnFocus) searchReturnFocus.focus();
  }

  searchTrigger.addEventListener('click', openSearch);
  searchClose.addEventListener('click', closeSearch);
  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  searchDialog.addEventListener('click', (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSearch();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchDialog.open ? closeSearch() : openSearch();
    }
    if (event.key === '/' && !searchDialog.open && document.activeElement.tagName !== 'INPUT') {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });

  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
