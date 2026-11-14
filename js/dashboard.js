import { auth, db } from './auth.js';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const signoutBtn = document.getElementById('signout-btn');
const categoryList = document.getElementById('category-list');
const currentCategoryTitle = document.getElementById('current-category-title');
const mediaGrid = document.getElementById('media-grid');

// Add Category Modal Elements
const categoryModal = document.getElementById('add-category-modal');
const openModalBtn = document.getElementById('open-category-modal-btn');
const closeModalBtn = document.getElementById('close-category-modal-btn');
const cancelModalBtn = document.getElementById('cancel-category-btn');
const categoryForm = document.getElementById('add-category-form');
const categoryInput = document.getElementById('category-name-input');

// Edit Category Modal Elements
const editCategoryBtn = document.getElementById('edit-category-btn');
const editCategoryModal = document.getElementById('edit-category-modal');
const editCategoryForm = document.getElementById('edit-category-form');
const editCategoryInput = document.getElementById('edit-category-input');
const cancelEditCategoryBtn = document.getElementById('cancel-edit-category-btn');

// Add Item Modal Elements
const itemModal = document.getElementById('item-modal');
const itemModalTitle = document.getElementById('item-modal-title');
const itemForm = document.getElementById('item-form');
const editItemIdInput = document.getElementById('edit-item-id');
const itemImageInput = document.getElementById('item-image-input');
const itemNameInput = document.getElementById('item-name-input');
const itemStatusSelect = document.getElementById('item-status-select');
const itemDescInput = document.getElementById('item-desc-input');
const cancelItemBtn = document.getElementById('cancel-item-btn');

// State Variables
let currentUser = null;
let currentActiveCategory = null;

// ==========================================
// 1. AUTH STATE & SIGN OUT
// ==========================================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await loadCategories();
  } else {
    window.location.href = 'index.html';
  }
});

signoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Failed to sign out.");
  }
});

// ==========================================
// 2. CATEGORY MODAL TOGGLES
// ==========================================
openModalBtn.addEventListener('click', () => {
  categoryModal.style.display = 'flex';
});

const closeModal = () => {
  categoryModal.style.display = 'none';
  categoryForm.reset();
};

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// ==========================================
// 3. CREATE CATEGORY IN FIRESTORE
// ==========================================
categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = categoryInput.value.trim();
  if (!name || !currentUser) return;

  try {
    const categoriesRef = collection(db, `users/${currentUser.uid}/categories`);
    const docRef = await addDoc(categoriesRef, {
      name: name,
      createdAt: serverTimestamp()
    });

    closeModal();
    currentActiveCategory = docRef.id; // Automatically select the newly created category
    await loadCategories();
  } catch (error) {
    console.error("Error creating category:", error);
    alert("Could not create category.");
  }
});

// ==========================================
// 4. FETCH & RENDER CATEGORIES
// ==========================================
async function loadCategories() {
  if (!currentUser) return;

  try {
    const categoriesRef = collection(db, `users/${currentUser.uid}/categories`);
    const snapshot = await getDocs(categoriesRef);

    let categories = [];
    snapshot.forEach((docSnap) => {
      categories.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    categories.sort((a, b) => a.name.localeCompare(b.name));

    if (categories.length === 0) {
      currentActiveCategory = null;
      currentCategoryTitle.textContent = "No Categories Yet";
      
      // FIX: Explicitly clear the sidebar list so old tabs disappear!
      if (categoryList) {
        categoryList.innerHTML = '';
      }

      if (mediaGrid) {
        mediaGrid.innerHTML = `
          <p style="color: #9ca3af; text-align: center; grid-column: 1 / -1; padding: 40px;">
            No categories found. Create a category to start adding items!
          </p>`;
      }
      return;
    }

    // Default to the first category if none is active
    if (!currentActiveCategory || !categories.some(c => c.id === currentActiveCategory)) {
      currentActiveCategory = categories[0].id;
    }

    const activeCatObj = categories.find(c => c.id === currentActiveCategory);
    if (activeCatObj) {
      currentCategoryTitle.textContent = activeCatObj.name;
    }

    let html = '';
    categories.forEach((cat) => {
      const isActive = currentActiveCategory === cat.id;

      html += `
        <li>
          <button class="category-btn ${isActive ? 'active' : ''}" data-id="${cat.id}" style="width: 100%; text-align: left; padding: 10px; background: ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}; color: ${isActive ? '#fff' : '#9ca3af'}; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 6px;">
            ${escapeHTML(cat.name)}
          </button>
        </li>
      `;
    });

    categoryList.innerHTML = html;
    attachCategoryClickEvents();

    // Load items for the currently active category
    await loadCategoryItems(currentActiveCategory);

  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

// ==========================================
// 5. SIDEBAR CATEGORY CLICK SWITCHING
// ==========================================
function attachCategoryClickEvents() {
  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      currentActiveCategory = btn.getAttribute('data-id');
      currentCategoryTitle.textContent = btn.textContent.trim();
      
      // Toggle the active class across buttons
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      closeMobileSidebar(); // Auto-close drawer on mobile after selecting a category
      await loadCategoryItems(currentActiveCategory);
    });
  });
}

// ==========================================
// 6. DELETE CATEGORY MODAL & LOGIC
// ==========================================
const deleteModal = document.getElementById('delete-category-modal');
const openDeleteModalBtn = document.getElementById('delete-category-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

if (openDeleteModalBtn) {
  openDeleteModalBtn.addEventListener('click', () => {
    if (!currentActiveCategory) {
      alert("Please select a category to delete first.");
      return;
    }
    deleteModal.style.display = 'flex';
  });
}

const closeDeleteModal = () => {
  deleteModal.style.display = 'none';
};

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Stop any accidental form submission
    
    if (!currentUser || !currentActiveCategory) {
      alert("Error: No active user or category found.");
      return;
    }

    try {
      const categoryIdToDelete = currentActiveCategory;
      const categoryDocRef = doc(db, `users/${currentUser.uid}/categories`, categoryIdToDelete);
      
      await deleteDoc(categoryDocRef);
      console.log("Successfully deleted category:", categoryIdToDelete);

      closeDeleteModal();
      currentActiveCategory = null;
      
      // Reload categories list from Firestore
      await loadCategories();

      // If no categories are left, immediately wipe the media grid clean
      if (typeof categories !== 'undefined' && categories.length === 0) {
        const grid = document.getElementById('media-grid');
        if (grid) {
          grid.innerHTML = '<p style="text-align:center; color:#9ca3af; grid-column: span 2; padding: 40px;">No categories remaining. Create one to get started!</p>';
        }
        const categoryHeader = document.querySelector('main h2');
        if (categoryHeader) categoryHeader.textContent = 'No Categories';
      }

    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Check console for details.");
    }
  });
}

// ==========================================
// 7. EDIT CATEGORY LOGIC
// ==========================================
const closeEditCategoryModal = () => {
  editCategoryModal.style.display = 'none';
  editCategoryForm.reset();
};

if (editCategoryBtn) {
  editCategoryBtn.addEventListener('click', () => {
    if (!currentActiveCategory) return;
    const currentTitle = document.getElementById('current-category-title').textContent;
    editCategoryInput.value = currentTitle;
    editCategoryModal.style.display = 'flex';
  });
}

if (cancelEditCategoryBtn) {
  cancelEditCategoryBtn.addEventListener('click', closeEditCategoryModal);
}

if (editCategoryForm) {
  editCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = editCategoryInput.value.trim();
    if (!newName || !currentUser || !currentActiveCategory) return;

    try {
      const categoryRef = doc(db, `users/${currentUser.uid}/categories`, currentActiveCategory);
      await updateDoc(categoryRef, { name: newName });

      document.getElementById('current-category-title').textContent = newName;
      closeEditCategoryModal();
      await loadCategories(); 
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Could not update category name.");
    }
  });
}

// ==========================================
// 8. ITEMS: FETCH & RENDER GRID
// ==========================================
async function loadCategoryItems(categoryId) {
  if (!currentUser || !categoryId || !mediaGrid) return;

  try {
    const itemsRef = collection(db, `users/${currentUser.uid}/categories/${categoryId}/items`);
    const snapshot = await getDocs(itemsRef);

    let items = [];
    snapshot.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    // Always start the grid with the "+ Add Item" card tile
    let html = `
      <div onclick="openAddItemModal()" style="background: rgba(255,255,255,0.03); border: 2px dashed #334155; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; cursor: pointer; color: #9ca3af; font-weight: 500; transition: border-color 0.2s;">
        <span style="font-size: 2rem; margin-bottom: 4px;">+</span>
        <span>Add Item</span>
      </div>
    `;

    // Append all item cards next to it
    items.forEach(item => {
      html += createItemCardHTML(item);
    });

    mediaGrid.innerHTML = html;

  } catch (error) {
    console.error("Error loading items:", error);
    mediaGrid.innerHTML = `<p style="color: #ef4444; grid-column: 1 / -1; text-align: center;">Failed to load items.</p>`;
  }
}

// Render individual item card HTML
function createItemCardHTML(item) {
  return `
    <div class="item-card" data-id="${item.id}">
      
      <!-- Kebab 3-dot Menu Button -->
      <button class="kebab-btn" onclick="toggleKebabMenu(event, '${item.id}')" style="position: absolute; top: 12px; right: 12px; background: rgba(17,20,19,0.85); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; cursor: pointer; padding: 4px 10px; border-radius: 4px; z-index: 5;">⋮</button>
      
      <!-- Kebab Dropdown Menu -->
      <div id="kebab-menu-${item.id}" class="kebab-dropdown" style="display: none; position: absolute; top: 44px; right: 12px; background: #111413; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10;">
        <button onclick="openEditItemModal('${item.id}', '${encodeURIComponent(item.image || '')}', '${encodeURIComponent(item.name || '')}', '${item.status || 'Reading'}', '${encodeURIComponent(item.description || '')}')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; background: none; border: none; color: #10b981; cursor: pointer; font-size: 0.85rem;">Edit</button>
        <button onclick="deleteItem('${item.id}')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;">Delete</button>
      </div>

      <!-- Item Image Preview Banner with strict aspect ratio -->
      ${item.image ? `
        <div style="width: 100%; aspect-ratio: 2 / 3; background: #080a09; overflow: hidden; position: relative;">
          <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block;">
        </div>` : ''
      }

      <!-- Content Section -->
      <div style="padding: 16px; display: flex; flex-direction: column; flex-grow: 1; min-width: 0;">
        <h3 title="${escapeHTML(item.name)}" style="color: #fff; margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
          ${escapeHTML(item.name)}
        </h3>
        <p style="color: #9ca3af; font-size: 0.82rem; margin: 0 0 8px 0;">Status: <span style="color: #10b981; font-weight: 500;">${escapeHTML(item.status)}</span></p>
        ${item.description ? `<p class="card-description" style="color: #9ca3af; font-size: 0.8rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    </div>
  `;
}

// Toggle Kebab Menu Dropdown
window.toggleKebabMenu = (event, itemId) => {
  event.stopPropagation();
  document.querySelectorAll('.kebab-dropdown').forEach(el => el.style.display = 'none');
  const menu = document.getElementById(`kebab-menu-${itemId}`);
  if (menu) menu.style.display = 'block';
};

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.kebab-dropdown').forEach(el => el.style.display = 'none');
});

// Open Modal in Edit Mode
window.openEditItemModal = (id, encImg, encName, status, encDesc) => {
  editItemIdInput.value = id;
  itemImageInput.value = encImg ? decodeURIComponent(encImg) : "";
  itemNameInput.value = encName ? decodeURIComponent(encName) : "";
  itemStatusSelect.value = status;
  itemDescInput.value = encDesc ? decodeURIComponent(encDesc) : "";
  
  itemModalTitle.textContent = "Edit Item";
  itemModal.style.display = "flex";
};

// Open Modal in Add Mode
window.openAddItemModal = () => {
  if (!currentActiveCategory) {
    alert("Please select or create a category first!");
    return;
  }
  editItemIdInput.value = "";
  itemForm.reset();
  
  itemModalTitle.textContent = "Add Item";
  itemModal.style.display = "flex";
};

// Close Modal
const closeItemModal = () => {
  itemModal.style.display = "none";
  itemForm.reset();
  editItemIdInput.value = "";
};

if (cancelItemBtn) cancelItemBtn.addEventListener('click', closeItemModal);

// Handle Form Submission (Add & Edit)
if (itemForm) {
  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !currentActiveCategory) {
      alert("No active category selected.");
      return;
    }

    const itemId = editItemIdInput.value;
    const itemData = {
      image: itemImageInput.value.trim(),
      name: itemNameInput.value.trim(),
      status: itemStatusSelect.value,
      description: itemDescInput.value.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      if (itemId) {
        const itemRef = doc(db, `users/${currentUser.uid}/categories/${currentActiveCategory}/items`, itemId);
        await updateDoc(itemRef, itemData);
      } else {
        itemData.createdAt = serverTimestamp();
        const itemsColRef = collection(db, `users/${currentUser.uid}/categories/${currentActiveCategory}/items`);
        await addDoc(itemsColRef, itemData);
      }

      closeItemModal();
      await loadCategoryItems(currentActiveCategory);
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item.");
    }
  });
}

// Delete Item
window.deleteItem = async (itemId) => {
  if (!confirm("Are you sure you want to delete this item?")) return;
  if (!currentUser || !currentActiveCategory) return;

  try {
    const itemRef = doc(db, `users/${currentUser.uid}/categories/${currentActiveCategory}/items`, itemId);
    await deleteDoc(itemRef);
    await loadCategoryItems(currentActiveCategory);
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("Could not delete item.");
  }
};

// Utility to escape text safely
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}


// ==========================================
// MOBILE SIDEBAR HAMBURGER TOGGLE
// ==========================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarAside = document.querySelector('aside');

function closeMobileSidebar() {
  if (sidebarAside) sidebarAside.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

if (mobileMenuBtn && sidebarAside && sidebarOverlay) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebarAside.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
  });

  sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
      // Replace 'closeMobileSidebar' with whatever function name closes your sidebar, 
      // or directly target the class/element toggle if you handle it inline:
      if (typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
      } else {
        // Fallback: directly hide the sidebar if function isn't found
        const aside = document.querySelector('aside');
        if (aside) aside.classList.remove('open'); // Adjust based on how your CSS opens/closes it
      }
    });
  }
});
