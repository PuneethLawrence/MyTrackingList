document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. AUTOMATIC CROSS-FADE HERO SHOWCASE (WATCH & PLAY)
  // ==========================================
  const showcaseData = [
    {
      title: "Elden Ring",
      type: "Game",
      image: "img/elden.jpg"
    },
    {
      title: "Crimson Desert",
      type: "Game",
      image: "img/crimson.jpg"
    },
    {
      title: "The Blood of the Dawn Walker",
      type: "Game",
      image: "img/dawn.jpg"
    },
      {
      title: "Spider-Man:  Brand New Day",
      type: "Movie",
      image: "img/spiderman.jpg"
    },
      {
      title: "Dungeon & Dragons",
      type: "Movie",
      image: "img/dragons.jpeg"
    },
      {
      title: "Puss in Boots: The Last Wish ",
      type: "Movie",
      image: "img/puss.jpg"
    }
  ];

  const showcaseContainer = document.getElementById('crossfade-showcase');
  let currentIndex = 0;

  function updateShowcase() {
    if (!showcaseContainer) return;
    const currentItem = showcaseData[currentIndex];
    
    const slide = document.createElement('div');
    slide.className = 'showcase-slide';
    slide.style.opacity = '0';
    slide.style.transition = 'opacity 0.8s ease-in-out';
    slide.style.position = 'absolute';
    slide.style.top = '0';
    slide.style.left = '0';
    slide.style.width = '100%';
    slide.style.height = '100%';

    slide.innerHTML = `
      <img src="${currentItem.image}" alt="${currentItem.title}" class="slide-img" style="width:100%; height:100%; object-fit:cover;">
      <div class="showcase-overlay">
        <h3>${currentItem.title}</h3>
        <span class="badge">${currentItem.type}</span>
      </div>
    `;

    showcaseContainer.appendChild(slide);

    setTimeout(() => {
      slide.style.opacity = '1';
    }, 50);

    if (showcaseContainer.children.length > 1) {
      const oldSlide = showcaseContainer.children[0];
      setTimeout(() => {
        oldSlide.remove();
      }, 800);
    }

    currentIndex = (currentIndex + 1) % showcaseData.length;
  }

  if (showcaseContainer) {
    showcaseContainer.style.position = 'relative';
    showcaseContainer.style.overflow = 'hidden';
    updateShowcase();
    setInterval(updateShowcase, 4000);
  }


  // ==========================================
  // 2. WATCH & PLAY COMBINED VAULT & FILTERING
  // ==========================================
  const watchPlayGrid = document.getElementById('watch-play-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');

  const watchPlayData = [
    { title: "Elden Ring", type: "Game", img: "/img/elden.jpg" },
    { title: "Cyberpunk 2077: Phantom Liberty", type: "Game", img: "/img/crimson.jpg" },
    { title: "Spider-Man: Brand New Day", type: "Movie", img: "/img/spiderman.jpg" },
    { title: "The Dark Knight", type: "Movie", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80" },
    { title: "God of War Ragnarök", type: "Game", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80" },
    { title: "Interstellar", type: "Movie", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80" }
  ];

  function renderWatchPlayCards(filter = 'all') {
    if (!watchPlayGrid) return;

    const filteredData = filter === 'all' 
      ? watchPlayData 
      : watchPlayData.filter(item => item.type === filter);

    watchPlayGrid.innerHTML = filteredData.map(item => `
      <div class="media-card landscape-card">
        <div class="card-image-wrapper">
          <img src="${item.img}" alt="${item.title}">
        </div>
        <div class="card-info">
          <h3>${item.title}</h3>
          <span class="badge">${item.type}</span>
        </div>
      </div>
    `).join('');
  }

  // Initial render for Watch & Play
  renderWatchPlayCards('all');

  // Filter Button Event Listeners
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const filterValue = button.getAttribute('data-filter');
      renderWatchPlayCards(filterValue);
    });
  });


  /// ==========================================
  // 3. INFINITE LOOPING MARQUEE FOR READS
  // ==========================================
  const readsGrid = document.getElementById('reads-grid');
  const dummyReads = [
    { title: "Barbarian's Adventure in a Fantasy World", type: "Manhwa", img: "img/barbarian.jpg" },
    { title: "What a Bountiful Harvest, Demon Lord! ", type: "Manhwa", img: "img/bountiful.jpg" },
    { title: "The Regressed Mercenary's Machinations", type: "Manhwa", img: "img/machinations.jpg" },
    { title: "The Wandering Knight’s Survival Manual", type: "Manhwa", img: "img/wandering.jpg" },
    { title: "Hell Mode", type: "Manga", img: "img/hellmode.jpg"},
    { title: "Hori-san to Miyamura-kun", type: "Manga", img: "img/horimiya.jpg" },
    { title: "I'm a Demon Lord. I Got Remarried to the Mother of a Hero, So She Became My Step-Daughter", type: "Manga", img: "img/demonlord.jpg" },
    { title: "The Ice Princess Wants to Be Melted by a Small Patch of Sunlight", type: "Manga", img: "img/ice.jpg" }
  ];

  if (readsGrid) {
    readsGrid.innerHTML = ""; // Clear any static elements

    // Duplicate the array once so the marquee loops seamlessly (-50% translation trick)
    const marqueeItems = [...dummyReads, ...dummyReads];

    marqueeItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'media-card portrait-card reads-card';

      card.innerHTML = `
        <div class="card-image-wrapper" style="position: relative;">
          <img src="${item.img}" alt="${item.title}">
          <span class="card-badge">${item.type}</span>
        </div>
        <div class="card-info">
          <h3>${item.title}</h3>
        </div>
      `;
      readsGrid.appendChild(card);
    });
  }


  // ==========================================
  // 4. AUTH MODAL & TOOLTIP HANDLERS
  // ==========================================
  const signupModal = document.getElementById('signup-modal');
  const signinModal = document.getElementById('signin-modal');
  const openSignupBtn = document.getElementById('open-signup-btn');
  const openSigninBtn = document.getElementById('open-signin-btn');
  const closeSignupBtn = document.getElementById('close-signup-btn');
  const closeSigninBtn = document.getElementById('close-signin-btn');

  if (openSignupBtn) openSignupBtn.addEventListener('click', () => signupModal.classList.remove('hidden'));
  if (openSigninBtn) openSigninBtn.addEventListener('click', () => signinModal.classList.remove('hidden'));
  if (closeSignupBtn) closeSignupBtn.addEventListener('click', () => signupModal.classList.add('hidden'));
  if (closeSigninBtn) closeSigninBtn.addEventListener('click', () => signinModal.classList.add('hidden'));

  window.addEventListener('click', (e) => {
    if (e.target === signupModal) signupModal.classList.add('hidden');
    if (e.target === signinModal) signinModal.classList.add('hidden');
  });

  const usernameInput = document.getElementById('signup-username');
  const usernameTooltip = document.getElementById('username-tooltip');
  const passwordInput = document.getElementById('signup-password');
  const passwordTooltip = document.getElementById('password-tooltip');

  if (usernameInput && usernameTooltip) {
    usernameInput.addEventListener('input', () => {
      if (usernameInput.value.length > 0 && usernameInput.value.length < 4) {
        usernameTooltip.classList.remove('hidden');
      } else {
        usernameTooltip.classList.add('hidden');
      }
    });
    usernameInput.addEventListener('blur', () => usernameTooltip.classList.add('hidden'));
  }

if (passwordInput && passwordTooltip) {
    // Strict password regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strictPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      // Show tooltip if the user typed something but it fails the strict pattern
      if (val.length > 0 && !strictPasswordRegex.test(val)) {
        passwordTooltip.classList.remove('hidden');
      } else {
        passwordTooltip.classList.add('hidden');
      }
    });

    passwordInput.addEventListener('blur', () => passwordTooltip.classList.add('hidden'));

    // Block form submission if the password is weak
    const signupForm = signupModal.querySelector('form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        if (!strictPasswordRegex.test(passwordInput.value)) {
          e.preventDefault();
          alert("Please make sure your password meets all requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character) before signing up.");
          passwordInput.focus();
        }
      });
    }
  }
});
