import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

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
console.log("Initializing Firebase for payment records...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized successfully");

// DOM elements
const backButton = document.getElementById('backButton') || console.error("Back button not found");
const logoutButton = document.getElementById('logoutButton') || console.error("Logout button not found");
const paymentRecordsTable = document.querySelector("#paymentRecordsTable") || console.error("Payment records table not found");
const downloadCsvButton = document.getElementById('downloadCsvButton') || console.error("Download CSV button not found");

// Fetch payment records
async function fetchPaymentRecords() {
  console.log("Fetching payment records (all orders)");
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const records = [];
    console.log("Query returned", querySnapshot.size, "orders");
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Processing order:", doc.id, data);
      let orderDate;
      if (data.orderDate && typeof data.orderDate.toDate === 'function') {
        console.log("orderDate is a Timestamp for order:", doc.id);
        orderDate = data.orderDate.toDate();
      } else if (data.orderDate && typeof data.orderDate === 'string') {
        console.log("orderDate is a string for order:", doc.id, data.orderDate);
        orderDate = new Date(data.orderDate);
      } else {
        console.log("orderDate is invalid or missing for order:", doc.id);
        orderDate = new Date();
      }
      const formattedDate = isNaN(orderDate) ? "Invalid Date" : orderDate.toLocaleString();
      records.push({
        id: doc.id,
        userId: data.userId,
        totalPrice: data.totalPrice,
        bankDetails: data.bankDetails,
        orderDate: formattedDate
      });
    });
    console.log("Total payment records fetched:", records.length);
    return records;
  } catch (error) {
    console.error("Error fetching payment records:", error);
    return [];
  }
}

// Render payment records in table
function renderPaymentRecords(records) {
  console.log("Rendering payment records in table");
  if (!paymentRecordsTable) {
    console.error("Table element missing, cannot render records");
    return;
  }
  paymentRecordsTable.innerHTML = "";
  if (records.length === 0) {
    console.log("No payment records to display");
    paymentRecordsTable.innerHTML = `<tr><td colspan="5">No payment records found.</td></tr>`;
  } else {
    records.forEach(record => {
      console.log("Rendering payment record:", record.id);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="order-id" data-id="${record.id}">${record.id.slice(0, 4)}...</td>
        <td>${record.userId || "N/A"}</td>
        <td>₦${record.totalPrice || "0.00"}</td>
        <td>${record.bankDetails || "N/A"}</td>
        <td>${record.orderDate}</td>
      `;
      paymentRecordsTable.appendChild(row);
    });
    console.log("Payment records rendered successfully");
  }
}

// Generate CSV for Download
const generateCSV = (records) => {
  console.log("Generating CSV for payment records");
  const csvContent = [
    "OrderID,UserID,TotalPrice,BankDetails,OrderDate",
    ...records.map((row) =>
      `"${row.id}","${row.userId || 'N/A'}","${row.totalPrice || '0.00'}","${row.bankDetails || 'N/A'}","${row.orderDate}"`
    )
  ].join("\n");

  try {
    // Try data URI for WebView compatibility
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "payment_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("CSV download initiated via data URI");
  } catch (error) {
    console.error("Error generating CSV via data URI:", error);
    try {
      // Fallback to Blob API for browsers
      console.log("Falling back to Blob API for CSV download");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = "payment_records.csv";
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      console.log("CSV download initiated via Blob API");
    } catch (blobError) {
      console.error("Error generating CSV via Blob API:", blobError);
      alert("Failed to download CSV: " + blobError.message);
    }
  }
};

// Authenticate user
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
  if (user) {
    console.log("User authenticated, fetching payment records");
    fetchPaymentRecords().then((records) => {
      renderPaymentRecords(records);
      if (downloadCsvButton) {
        downloadCsvButton.addEventListener('click', () => {
          console.log("Download CSV button clicked");
          generateCSV(records);
        });
      }
    });
  } else {
    console.log("No user logged in, redirecting to index.html");
    alert("Unauthorized access!");
    window.location.href = "index.html";
  }
});

// Event listeners
if (backButton) {
  backButton.addEventListener('click', () => {
    console.log("Back button clicked, redirecting to admin.html");
    window.location.href = "admin.html";
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    console.log("Logout button clicked");
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      alert("Logged out successfully!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out: " + error.message);
    }
  });
}