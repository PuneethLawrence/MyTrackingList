// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// --- Firestore imports for unique username registry ---
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJyjIdarOUvL9eE3JmQwge5_X_Oi2dw5k",
  authDomain: "mytrackinglist-912c0.firebaseapp.com",
  projectId: "mytrackinglist-912c0",
  storageBucket: "mytrackinglist-912c0.firebasestorage.app",
  messagingSenderId: "585648827816",
  appId: "1:585648827816:web:3b0c0d08b8f9b7e796019d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- Add export here!



// Helper function to display errors in your error banner
function showSignupError(message) {
  const errorBanner = document.getElementById('signup-error-msg');
  if (errorBanner) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
  } else {
    alert(message);
  }
}

// --- 1. AUTH STATE OBSERVER & PAGE PROTECTION ---
onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname;
  const navAuthContainer = document.getElementById('nav-auth-container');

  if (user && user.emailVerified) {
    // If they are on the landing page, automatically redirect to dashboard
    if (currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
      window.location.href = 'dashboard.html';
      return;
    }

    // Otherwise, handle navbar UI if the element exists on this page
    const userName = user.displayName || user.email.split('@')[0];
    if (navAuthContainer) {
      navAuthContainer.innerHTML = `
        <span style="color: #fff; margin-right: 15px; font-size: 0.95rem;">Hi, <strong>${userName}</strong></span>
        <button id="signout-btn" class="btn btn-secondary" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444;">Sign Out</button>
      `;
    }
  } else {
    // If user is NOT logged in, but trying to view the dashboard, send them back home
    if (currentPage.endsWith('dashboard.html')) {
      window.location.href = 'index.html';
      return;
    }

    // Restore original Sign In / Create Account buttons on public pages
    if (navAuthContainer) {
      navAuthContainer.innerHTML = `
        <button id="open-signin-btn" class="btn btn-secondary">Sign In</button>
        <button id="open-signup-btn" class="btn btn-primary">Create Account</button>
      `;
    }
  }
});

// --- 2. SIGN UP LOGIC (With Unique Username Enforcement) ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // Normalize to lowercase for case-insensitive uniqueness check
    const lowerUsername = usernameInput.toLowerCase();
    
    const errorBanner = document.getElementById('signup-error-msg');
    if (errorBanner) errorBanner.classList.add('hidden');

    try {
      // 1. Check if username already exists in Firestore
      const usernameRef = doc(db, "usernames", lowerUsername);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        showSignupError("This username is already taken. Please choose another one.");
        return;
      }

      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 3. Update display name in Auth profile
      await updateProfile(user, {
        displayName: usernameInput
      });

      // 4. Save username lock in Firestore & create user document
      await setDoc(usernameRef, { 
        uid: user.uid, 
        originalName: usernameInput 
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: usernameInput,
        email: email,
        createdAt: new Date().toISOString()
      });

      // 5. Send verification email
      await sendEmailVerification(user);
      
      alert(`Account created successfully! We've sent a verification link to ${email}. Please verify before signing in.`);
      
      await auth.signOut();
      
      document.getElementById('signup-modal').classList.add('hidden');
      signupForm.reset();
      
    } catch (error) {
      console.error("Signup error:", error.message);
      let readableError = error.message;
      if (error.code === 'auth/email-already-in-use') {
        readableError = "This email is already registered. Try signing in instead.";
      }
      showSignupError(readableError);
    }
  });
}

// --- 3. SIGN IN LOGIC ---
const signinForm = document.getElementById('signin-form');
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        alert("Please verify your email address before logging in. Check your inbox for the verification link!");
        await auth.signOut();
        return;
      }
      
      document.getElementById('signin-modal').classList.add('hidden');
      signinForm.reset();
      
      window.location.href = 'dashboard.html';
      
    } catch (error) {
      console.error("Sign-in error:", error.message);
      alert("Invalid email or password. Please try again.");
    }
  });
}

// --- 4. GLOBAL EVENT DELEGATION (Handles Modals & Sign Out reliably) ---
document.addEventListener('click', async (e) => {
  // Open Sign In Modal
  if (e.target && (e.target.id === 'open-signin-btn' || e.target.closest('#open-signin-btn'))) {
    const modal = document.getElementById('signin-modal');
    if (modal) modal.classList.remove('hidden');
  }

  // Open Sign Up Modal
  if (e.target && (e.target.id === 'open-signup-btn' || e.target.closest('#open-signup-btn'))) {
    const modal = document.getElementById('signup-modal');
    if (modal) modal.classList.remove('hidden');
  }

  // Close Sign In Modal
  if (e.target && (e.target.id === 'close-signin-btn' || e.target.closest('#close-signin-btn'))) {
    const modal = document.getElementById('signin-modal');
    if (modal) modal.classList.add('hidden');
  }

  // Close Sign Up Modal
  if (e.target && (e.target.id === 'close-signup-btn' || e.target.closest('#close-signup-btn'))) {
    const modal = document.getElementById('signup-modal');
    if (modal) modal.classList.add('hidden');
  }

  // Close modal when clicking outside on dark overlay
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }

  // Sign Out Button Click
  if (e.target && e.target.id === 'signout-btn') {
    try {
      await signOut(auth);
      alert("Signed out successfully.");
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Error signing out.");
    }
  }
});


//Forgot Password 
const forgotPasswordLink = document.getElementById('forgot-password-link');

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Prompt the user for their account email
    const email = prompt("Enter your account email address to reset your password:");
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert("Password reset email sent! Check your inbox for instructions.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      // Handle common Firebase errors gracefully
      if (error.code === 'auth/user-not-found') {
        alert("No account found with this email address.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Please enter a valid email address.");
      } else {
        alert("Failed to send reset email. Please try again.");
      }
    }
  });
}