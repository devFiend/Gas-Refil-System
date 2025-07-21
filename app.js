// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCX0vxlyd0hXXDur4v3SpAnNuRwrm4Fyyc",
  authDomain: "gas-refill-app.firebaseapp.com",
  projectId: "gas-refill-app",
  storageBucket: "gas-refill-app.firebasestorage.app",
  messagingSenderId: "369760533545",
  appId: "1:369760533545:web:5bc99b940b30154fe3b038",
  measurementId: "G-8GV51M539Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const updateProfileForm = document.getElementById("updateProfileForm");
const orderForm = document.getElementById("orderForm");
const orderHistoryTable = document.getElementById("orderHistoryTable");

// Handle Registration
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create Firestore user profile
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: user.email === adminEmail ? "admin" : "user",
        createdAt: new Date().toISOString()
      });

      alert("User registered successfully!");
      window.location.href = "index.html"; // Redirect to login
    } catch (error) {
      console.error("Error:", error.message);
      alert(error.message);
    }
  });
}

// Handle Login with Admin Check
const adminEmail = "admin@example.com";  // Predefined admin email

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
  
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
  
          // Check if the user is admin by comparing email
          if (user.email === adminEmail) {
            // Redirect to admin panel if admin
            window.location.href = "admin.html";
          } else {
            // Redirect to user profile if not admin
            window.location.href = "profile.html";
          }
        })
        .catch((error) => {
          console.error("Error:", error.message);
          alert(error.message);
        });
    });
  }
  

// Handle Logout
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        alert("Logged out successfully!");
        window.location.href = "index.html"; // Redirect to login
      })
      .catch((error) => {
        console.error("Error:", error.message);
        alert(error.message);
      });
  });
}

// Handle Profile Updates
if (updateProfileForm) {
  updateProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const displayName = document.getElementById("displayName").value;
    const newPassword = document.getElementById("updatePassword").value;

    if (user) {
      // Update Display Name
      if (displayName) {
        updateProfile(user, { displayName })
          .then(() => {
            alert("Display name updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating display name:", error.message);
            alert(error.message);
          });
      }

      // Update Password
      if (newPassword) {
        updatePassword(user, newPassword)
          .then(() => {
            alert("Password updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating password:", error.message);
            alert(error.message);
          });
      }
    } else {
      alert("No user is signed in!");
    }
  });
}

// Fetch and Display Order History (Conditional Display for Profile and Admin Panel)
const fetchOrderHistory = async (userId) => {
    orderHistoryTable.innerHTML = ""; // Clear previous data
  
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        const isAdminPage = window.location.pathname === "/admin.html"; // Check if on admin page
        let row;
  
        if (isAdminPage) {
          // Full order details for Admin Panel
          row = `
            <tr>
              <td>${doc.id}</td>
              <td>${order.gasType}</td>
              <td>${order.quantity}</td>
              <td>${order.deliveryAddress}</td>
              <td>${order.status}</td>
              <td>${new Date(order.orderDate).toLocaleString()}</td>
            </tr>
          `;
        } else {
          // Simplified order details for Profile Page
          row = `
            <tr>
              <td>${order.gasType}</td>
              <td>${new Date(order.orderDate).toLocaleString()}</td>
              <td>${order.quantity}</td>
              <td>${order.deliveryAddress}</td>
            </tr>
          `;
        }
  
        orderHistoryTable.innerHTML += row;
      });
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      alert("Failed to load order history.");
    }
  };
  
// Place Order
if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gasType = document.getElementById("gasType").value;
    const quantity = document.getElementById("quantity").value;
    const deliveryAddress = document.getElementById("deliveryAddress").value;

    const user = auth.currentUser;

    if (user) {
      try {
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          gasType,
          quantity: parseInt(quantity),
          deliveryAddress,
          orderDate: new Date().toISOString(),
          status: "Pending",
        });
        alert("Order placed successfully!");
        orderForm.reset();
        fetchOrderHistory(user.uid); // Refresh order history
      } catch (error) {
        console.error("Error placing order:", error.message);
        alert("Failed to place order. Please try again.");
      }
    } else {
      alert("You must be logged in to place an order.");
    }
  });
}

// Handle User Authentication and Fetch Orders
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if the user is on the login page, and redirect if necessary
    if (window.location.pathname === "/index.html") {
      window.location.href = "profile.html"; // Redirect to profile
    }
    fetchOrderHistory(user.uid); // Fetch order history if user is logged in
  } else {
    // If no user is signed in, check if we're on the profile page and redirect to login
    if (window.location.pathname === "/profile.html") {
      alert("No user is signed in!");
      window.location.href = "index.html"; // Redirect to login
    }
  }
});

