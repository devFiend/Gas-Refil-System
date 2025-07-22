import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, updateProfile, updatePassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, getDoc, doc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase configuration
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
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized successfully");

// DOM elements with null checks
const profileNameElement = document.getElementById('profileName') || logMissingElement('profileName');
const logoutButton = document.getElementById('logoutButton') || logMissingElement('logoutButton');
const editProfileButton = document.getElementById('editProfileButton') || logMissingElement('editProfileButton');
const profileModal = document.getElementById('profileModal') || logMissingElement('profileModal');
const closeModalButton = document.getElementById('closeModalButton') || logMissingElement('closeModalButton');
const profileForm = document.getElementById('profileForm') || logMissingElement('profileForm');
const placeOrderButton = document.getElementById('placeOrderButton') || logMissingElement('placeOrderButton');
const orderModal = document.getElementById('orderModal') || logMissingElement('orderModal');
const closeOrderModalButton = document.getElementById('closeOrderModalButton') || logMissingElement('closeOrderModalButton');
const bankModal = document.getElementById('bankModal') || logMissingElement('bankModal');
const closeBankModalButton = document.getElementById('closeBankModalButton') || logMissingElement('closeBankModalButton');
const showBankDetailsButton = document.getElementById('showBankDetailsButton') || logMissingElement('showBankDetailsButton');
const proceedPaymentButton = document.getElementById('proceedPaymentButton') || logMissingElement('proceedPaymentButton');
const cancelPaymentButton = document.getElementById('cancelPaymentButton') || logMissingElement('cancelPaymentButton');
const gasTypeSelect = document.getElementById('gasType') || logMissingElement('gasType');
const quantityInput = document.getElementById('quantity') || logMissingElement('quantity');
const priceTag = document.getElementById('priceTag') || logMissingElement('priceTag');
const deliveryAddressInput = document.getElementById('deliveryAddress') || logMissingElement('deliveryAddress');
const viewOrderHistoryButton = document.getElementById('viewOrderHistoryButton') || logMissingElement('viewOrderHistoryButton');
const orderHistoryModal = document.getElementById('orderHistoryModal') || logMissingElement('orderHistoryModal');
const closeOrderHistoryModalButton = document.getElementById('closeOrderHistoryModalButton') || logMissingElement('closeOrderHistoryModalButton');
const stars = document.querySelectorAll('.star') || logMissingElement('star');
const submitRatingButton = document.getElementById('submitRatingButton') || logMissingElement('submitRatingButton');

// Helper function to log missing DOM elements
function logMissingElement(id) {
  console.error(`Error: DOM element with ID '${id}' not found`);
  return null;
}

// Rating state
let selectedRating = 0;

// Bank list for payment (demo purposes)
const banks = [
  "Access Bank", "First Bank", "Guaranty Trust Bank", "Zenith Bank",
  "United Bank for Africa", "Stanbic IBTC", "Ecobank", "Fidelity Bank",
  "Union Bank", "Wema Bank"
];

// Load user profile
async function loadUserProfile(user) {
  console.log("Loading profile for user:", user.uid);
  if (!profileNameElement) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const displayName = userDoc.exists() ? userDoc.data().displayName || user.displayName || "Profile" : user.displayName || "Profile";
    profileNameElement.textContent = displayName;
    console.log("Profile loaded successfully:", displayName);
  } catch (error) {
    console.error("Error loading user profile:", error);
    profileNameElement.textContent = "Profile";
    alert("Failed to load profile: " + error.message);
  }
}

// Update profile and password
async function updateProfileAndPassword(user, newDisplayName, newPassword) {
  console.log("Updating profile for user:", user.uid, "with displayName:", newDisplayName);
  if (!profileNameElement) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log("Creating new user document");
      await setDoc(userRef, { displayName: newDisplayName, email: user.email });
    } else {
      console.log("Updating existing user document");
      await updateDoc(userRef, { displayName: newDisplayName });
    }

    console.log("Updating Firebase Auth profile");
    await updateProfile(user, { displayName: newDisplayName });

    if (newPassword) {
      console.log("Updating password");
      await updatePassword(user, newPassword);
    }

    profileNameElement.textContent = newDisplayName;
    console.log("Profile updated successfully");
    alert("Profile updated successfully.");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert(`Failed to update profile: ${error.message}`);
  }
}

// Fetch and display orders
async function fetchOrderHistory(userId) {
  console.log("Fetching order history for user:", userId);
  const orderHistoryTableBody = document.querySelector("#orderHistoryTable tbody");
  if (!orderHistoryTableBody) {
    console.error("Order history table body not found");
    return;
  }
  orderHistoryTableBody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    console.log("Executing Firestore query for orders");
    const querySnapshot = await getDocs(q);
    orderHistoryTableBody.innerHTML = "";
    console.log("Query returned", querySnapshot.size, "orders");

    if (querySnapshot.empty) {
      console.log("No orders found for user");
      orderHistoryTableBody.innerHTML = `<tr><td colspan="7">No orders found.</td></tr>`;
    } else {
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        console.log("Processing order:", doc.id, order);
        let orderDate;
        if (order.orderDate && typeof order.orderDate.toDate === 'function') {
          console.log("orderDate is a Timestamp");
          orderDate = order.orderDate.toDate();
        } else if (order.orderDate && typeof order.orderDate === 'string') {
          console.log("orderDate is a string:", order.orderDate);
          orderDate = new Date(order.orderDate);
        } else {
          console.log("orderDate is invalid or missing, using current date");
          orderDate = new Date();
        }
        const formattedDate = isNaN(orderDate) ? "Invalid Date" : orderDate.toLocaleString();

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${order.gasType || "N/A"}</td>
          <td>${formattedDate}</td>
          <td>${order.quantity || "N/A"}</td>
          <td>₦${order.totalPrice || "0.00"}</td>
          <td>${order.deliveryAddress || "N/A"}</td>
          <td>${order.bankDetails || "N/A"}</td>
          <td>${order.status || "N/A"}</td>
        `;
        orderHistoryTableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error fetching order history:", error);
    orderHistoryTableBody.innerHTML = `<tr><td colspan="7">Failed to load order history: ${error.message}</td></tr>`;
  }
}

// Update price display
function updatePrice() {
  if (!gasTypeSelect || !quantityInput || !priceTag) return;
  console.log("Updating price display");
  const selectedGas = gasTypeSelect.options[gasTypeSelect.selectedIndex];
  const pricePerKg = parseFloat(selectedGas.getAttribute('data-price')) || 0;
  const quantity = parseInt(quantityInput.value) || 0;
  const totalPrice = (pricePerKg * quantity).toFixed(2);
  priceTag.textContent = `Total Price: ₦${totalPrice}`;
  console.log("Price updated:", totalPrice);
}

// Generate random account number (for demo purposes)
function generateAccountNumber() {
  const accountNumber = '0' + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
  console.log("Generated account number:", accountNumber);
  return accountNumber;
}

// Place order
async function placeOrder() {
  console.log("Starting placeOrder function");
  if (!gasTypeSelect || !quantityInput || !deliveryAddressInput || !priceTag) {
    console.error("Required form elements missing");
    alert("Form elements are missing. Please check the page structure.");
    return;
  }

  const gasType = gasTypeSelect.value;
  const quantity = parseInt(quantityInput.value);
  const deliveryAddress = deliveryAddressInput.value;
  const pricePerKg = parseFloat(gasTypeSelect.options[gasTypeSelect.selectedIndex].getAttribute('data-price')) || 0;
  const totalPrice = (pricePerKg * quantity).toFixed(2);
  const bankDetailsElement = document.getElementById('bankDetails');
  const bankDetails = bankDetailsElement ? bankDetailsElement.textContent : null;

  console.log("Order details:", { gasType, quantity, deliveryAddress, totalPrice, bankDetails });

  if (!gasType || quantity <= 0 || !deliveryAddress || !bankDetails) {
    console.log("Validation failed:", { gasType, quantity, deliveryAddress, bankDetails });
    alert("Please fill in all fields with valid values and proceed to payment.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    console.log("No authenticated user");
    alert("You must be logged in to place an order.");
    return;
  }

  try {
    console.log("Saving order to Firestore for user:", user.uid);
    const order = {
      userId: user.uid,
      userEmail: user.email,
      gasType,
      quantity,
      totalPrice: parseFloat(totalPrice),
      deliveryAddress,
      bankDetails,
      orderDate: Timestamp.now(),
      status: "Pending"
    };

    const orderRef = await addDoc(collection(db, "orders"), order);
    console.log("Order saved successfully, ID:", orderRef.id);
    alert("Your order has been placed. Thank you for your payment!");

    const queryParams = new URLSearchParams({
      orderId: orderRef.id,
      gasType: order.gasType,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      bankDetails: order.bankDetails,
      orderDate: new Date(order.orderDate.toDate()).toLocaleString(),
      status: order.status
    }).toString();

    console.log("Redirecting to receipt.html with params:", queryParams);
    window.location.href = `receipt.html?${queryParams}`;
    if (document.getElementById('orderForm')) document.getElementById('orderForm').reset();
    if (priceTag) priceTag.textContent = 'Total Price: ₦0';
    if (bankModal) bankModal.style.display = 'none';
    if (orderModal) orderModal.style.display = 'none';
  } catch (error) {
    console.error("Error placing order:", error);
    alert("Failed to place order: " + error.message);
  }
}

// Rating system
function updateRatingUI(rating) {
  console.log("Updating rating UI to:", rating);
  stars.forEach((star, i) => {
    star.classList.toggle('selected', i < rating);
  });
}

function highlightStars(rating) {
  console.log("Highlighting stars up to:", rating);
  stars.forEach((star, i) => {
    star.classList.toggle('hovered', i < rating);
  });
}

// Authentication state listener
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
  if (user) {
    await loadUserProfile(user);

    // Load saved rating
    try {
      console.log("Loading saved rating for user:", user.uid);
      const docRef = doc(db, "ratings", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        selectedRating = docSnap.data().rating;
        console.log("Saved rating loaded:", selectedRating);
        updateRatingUI(selectedRating);
        if (submitRatingButton) {
          submitRatingButton.disabled = true;
          submitRatingButton.textContent = "Rating Submitted";
        }
      } else {
        console.log("No saved rating found");
      }
    } catch (error) {
      console.error("Error loading saved rating:", error);
      alert("Failed to load rating: " + error.message);
    }
  } else {
    console.log("Redirecting to index.html due to no user");
    window.location.href = "index.html";
  }
});

// Event listeners
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    console.log("Logout button clicked");
    try {
      await auth.signOut();
      console.log("User signed out successfully");
      alert("You have been logged out.");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out: " + error.message);
    }
  });
}

if (editProfileButton) {
  editProfileButton.addEventListener('click', () => {
    console.log("Edit profile button clicked");
    if (profileModal) profileModal.style.display = 'block';
  });
}

if (closeModalButton) {
  closeModalButton.addEventListener('click', () => {
    console.log("Close profile modal button clicked");
    if (profileModal) profileModal.style.display = 'none';
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    console.log("Profile form submitted");
    e.preventDefault();
    const displayName = document.getElementById('displayName')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    console.log("Profile form data:", { displayName, newPassword, confirmPassword });

    if (!displayName) {
      console.log("Display name is missing");
      alert("Display name is required.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      console.log("Passwords do not match");
      alert("Passwords do not match.");
      return;
    }

    await updateProfileAndPassword(auth.currentUser, displayName, newPassword);
    if (profileModal) profileModal.style.display = 'none';
  });
}

if (placeOrderButton) {
  placeOrderButton.addEventListener('click', () => {
    console.log("Place order button clicked");
    if (orderModal) orderModal.style.display = 'block';
  });
}

if (closeOrderModalButton) {
  closeOrderModalButton.addEventListener('click', () => {
    console.log("Close order modal button clicked");
    if (orderModal) orderModal.style.display = 'none';
  });
}

if (closeBankModalButton) {
  closeBankModalButton.addEventListener('click', () => {
    console.log("Close bank modal button clicked");
    if (bankModal) bankModal.style.display = 'none';
  });
}

if (cancelPaymentButton) {
  cancelPaymentButton.addEventListener('click', () => {
    console.log("Cancel payment button clicked");
    if (bankModal) bankModal.style.display = 'none';
    if (orderModal) orderModal.style.display = 'block';
  });
}

if (showBankDetailsButton) {
  showBankDetailsButton.addEventListener('click', () => {
    console.log("Show bank details button clicked");
    const quantity = parseInt(quantityInput?.value) || 0;
    const deliveryAddress = deliveryAddressInput?.value;
    console.log("Bank details inputs:", { quantity, deliveryAddress });

    if (quantity <= 0 || !deliveryAddress) {
      console.log("Invalid quantity or delivery address");
      alert("Please enter a valid quantity and delivery address.");
      return;
    }

    const selectedGas = gasTypeSelect.options[gasTypeSelect.selectedIndex];
    const pricePerKg = parseFloat(selectedGas.getAttribute('data-price')) || 0;
    const totalPrice = (pricePerKg * quantity).toFixed(2);
    const randomBank = banks[Math.floor(Math.random() * banks.length)];
    const accountNumber = generateAccountNumber();

    const bankDetailsElement = document.getElementById('bankDetails');
    const orderPriceElement = document.getElementById('orderPrice');
    if (bankDetailsElement && orderPriceElement) {
      bankDetailsElement.textContent = `Bank: ${randomBank}\nAccount Number: ${accountNumber}`;
      orderPriceElement.textContent = `Total Price: ₦${totalPrice}`;
      console.log("Bank details displayed:", { bank: randomBank, accountNumber, totalPrice });
      alert("Please make payment before clicking Proceed.");
      if (bankModal) bankModal.style.display = 'block';
      if (orderModal) orderModal.style.display = 'none';
    } else {
      console.error("Bank details or order price element missing");
    }
  });
}

if (proceedPaymentButton) {
  proceedPaymentButton.addEventListener('click', () => {
    console.log("Proceed payment button clicked");
    placeOrder();
  });
}

if (gasTypeSelect) {
  gasTypeSelect.addEventListener('change', updatePrice);
}

if (quantityInput) {
  quantityInput.addEventListener('input', updatePrice);
}

if (viewOrderHistoryButton) {
  viewOrderHistoryButton.addEventListener('click', () => {
    console.log("View order history button clicked");
    if (auth.currentUser) {
      fetchOrderHistory(auth.currentUser.uid);
      if (orderHistoryModal) orderHistoryModal.style.display = 'block';
    } else {
      console.log("User not logged in for order history");
      alert("You need to be logged in to view your order history.");
    }
  });
}

if (closeOrderHistoryModalButton) {
  closeOrderHistoryModalButton.addEventListener('click', () => {
    console.log("Close order history modal button clicked");
    if (orderHistoryModal) orderHistoryModal.style.display = 'none';
  });
}

if (stars.length > 0) {
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      console.log("Star clicked, rating:", index + 1);
      selectedRating = index + 1;
      updateRatingUI(selectedRating);
    });

    star.addEventListener('mouseover', () => {
      console.log("Star mouseover, highlighting:", index + 1);
      highlightStars(index + 1);
    });

    star.addEventListener('mouseout', () => {
      console.log("Star mouseout, reverting to selected rating:", selectedRating);
      highlightStars(selectedRating);
    });
  });
}

if (submitRatingButton) {
  submitRatingButton.addEventListener('click', async () => {
    console.log("Submit rating button clicked, rating:", selectedRating);
    if (selectedRating === 0) {
      console.log("No rating selected");
      alert("Please select a rating before submitting.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in for rating");
      alert("You must be logged in to submit a rating.");
      return;
    }

    try {
      console.log("Submitting rating for user:", user.uid);
      await setDoc(doc(db, "ratings", user.uid), {
        rating: selectedRating,
        timestamp: Timestamp.now()
      });
      console.log("Rating submitted successfully");
      alert(`Thank you for rating us ${selectedRating} star${selectedRating > 1 ? 's' : ''}!`);
      submitRatingButton.disabled = true;
      submitRatingButton.textContent = "Rating Submitted";
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating: " + error.message);
    }
  });
}

if (window) {
  window.addEventListener('click', (event) => {
    console.log("Window clicked, checking modal targets");
    if (event.target === profileModal) {
      console.log("Closing profile modal via window click");
      profileModal.style.display = 'none';
    }
    if (event.target === orderModal) {
      console.log("Closing order modal via window click");
      orderModal.style.display = 'none';
    }
    if (event.target === bankModal) {
      console.log("Closing bank modal via window click");
      bankModal.style.display = 'none';
    }
    if (event.target === orderHistoryModal) {
      console.log("Closing order history modal via window click");
      orderHistoryModal.style.display = 'none';
    }
  });
}