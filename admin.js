// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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
const pendingOrdersTable = document.getElementById("pendingOrdersTable");
const completedOrdersTable = document.getElementById("completedOrdersTable");
const generateUserReportForm = document.getElementById("generateUserReportForm");
const userIdInput = document.getElementById("userIdInput");
const orderStatusSelect = document.getElementById("orderStatusSelect");
const reportContainer = document.getElementById("reportContainer");
const logoutButton = document.getElementById("logoutButton");

// Fetch Orders
const fetchOrders = async () => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef);
  const querySnapshot = await getDocs(q);

  pendingOrdersTable.innerHTML = "";
  completedOrdersTable.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const order = doc.data();
    const orderDate = new Date(order.orderDate).toLocaleString();
    const row = `
      <tr>
        <td>${doc.id}</td>
        <td>${order.gasType}</td>
        <td>${order.quantity}</td>
        <td>${order.deliveryAddress}</td>
        <td>${order.status}</td>
        <td>${orderDate}</td>
        ${order.status === "Pending" ? `<td><button onclick="acceptOrder('${doc.id}')">Accept</button></td>` : ""}
      </tr>
    `;

    if (order.status === "Pending") {
      pendingOrdersTable.innerHTML += row;
    } else if (order.status === "Completed") {
      completedOrdersTable.innerHTML += row;
    }
  });
};

// Accept Order
window.acceptOrder = async (orderId) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status: "Completed" });
  alert("Order accepted successfully!");
  fetchOrders();
};

// Generate User Report
const generateUserReport = async (userId, status) => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("userId", "==", userId), where("status", "==", status));
  const querySnapshot = await getDocs(q);

  const reportData = [];
  querySnapshot.forEach((doc) => {
    const order = doc.data();
    reportData.push({
      OrderID: doc.id,
      GasType: order.gasType,
      Quantity: order.quantity,
      DeliveryAddress: order.deliveryAddress,
      Status: order.status,
      OrderDate: new Date(order.orderDate).toLocaleString(),
    });
  });

  if (reportData.length > 0) {
    const reportHtml = `
      <h3>Report for ${userId} (${status} Orders)</h3>
      <table border="1">
        <thead>
          <tr>
            <th>OrderID</th>
            <th>Gas Type</th>
            <th>Quantity</th>
            <th>Delivery Address</th>
            <th>Status</th>
            <th>Order Date</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.map(row => `
            <tr>
              <td>${row.OrderID}</td>
              <td>${row.GasType}</td>
              <td>${row.Quantity}</td>
              <td>${row.DeliveryAddress}</td>
              <td>${row.Status}</td>
              <td>${row.OrderDate}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <button id="downloadReportButton">Download Report</button>
      <button id="printReportButton">Print Report</button>
    `;
    
    reportContainer.innerHTML = reportHtml;

    // Add download functionality
    document.getElementById("downloadReportButton").addEventListener("click", () => {
      generateCSV(reportData);
    });

    // Add print functionality
    document.getElementById("printReportButton").addEventListener("click", () => {
      printReport(reportHtml);
    });
  } else {
    reportContainer.innerHTML = `<p>No orders found for this user with the selected status.</p>`;
  }
};

// Generate CSV for Download
const generateCSV = (reportData) => {
  const csvContent = "data:text/csv;charset=utf-8," + 
    ["OrderID,GasType,Quantity,DeliveryAddress,Status,OrderDate"].concat(
      reportData.map((row) => 
        `${row.OrderID},${row.GasType},${row.Quantity},${row.DeliveryAddress},${row.Status},${row.OrderDate}`
      )
    ).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "user_order_report.csv");
  document.body.appendChild(link); 
  link.click();
  document.body.removeChild(link);
};

// Print Report
const printReport = (reportHtml) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
      <head><title>Print Report</title></head>
      <body>
        ${reportHtml}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
};

// Handle Form Submission
generateUserReportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const userId = userIdInput.value;
  const status = orderStatusSelect.value;
  generateUserReport(userId, status);
});

// Logout
logoutButton.addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
});

// Add event listener to navigate to user page
    document.getElementById("userPageButton").addEventListener("click", () => {
      window.location.href = "users.html"; // Redirect to user.html
    });

// Authenticate Admin
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchOrders();
  } else {
    // alert("Unauthorized access!");
    window.location.href = "index.html";
  }
});
