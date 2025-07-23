import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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
console.log("Initializing Firebase for admin dashboard...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized successfully");

// DOM Elements
const pendingOrdersTable = document.getElementById("pendingOrdersTable") || console.error("Pending orders table not found");
const completedOrdersTable = document.getElementById("completedOrdersTable") || console.error("Completed orders table not found");
const generateUserReportForm = document.getElementById("generateUserReportForm") || console.error("Generate report form not found");
const userIdInput = document.getElementById("userIdInput") || console.error("User ID input not found");
const orderStatusSelect = document.getElementById("orderStatusSelect") || console.error("Order status select not found");
const reportContainer = document.getElementById("reportContainer") || console.error("Report container not found");
const logoutButton = document.getElementById("logoutButton") || console.error("Logout button not found");

// Fetch Orders
const fetchOrders = async () => {
  console.log("Fetching orders for admin dashboard");
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef);
    const querySnapshot = await getDocs(q);
    console.log("Query returned", querySnapshot.size, "orders");

    pendingOrdersTable.innerHTML = "";
    completedOrdersTable.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      console.log("Processing order:", doc.id, order);
      let orderDate;
      if (order.orderDate && typeof order.orderDate.toDate === 'function') {
        console.log("orderDate is a Timestamp for order:", doc.id);
        orderDate = order.orderDate.toDate();
      } else if (order.orderDate && typeof order.orderDate === 'string') {
        console.log("orderDate is a string for order:", doc.id, order.orderDate);
        orderDate = new Date(order.orderDate);
      } else {
        console.log("orderDate is invalid or missing for order:", doc.id);
        orderDate = new Date();
      }
      const formattedDate = isNaN(orderDate) ? "Invalid Date" : orderDate.toLocaleString();
      const row = `
        <tr>
          <td class="order-id" data-id="${doc.id}">${doc.id.slice(0, 4)}...</td>
          <td>${order.gasType || "N/A"}</td>
          <td>${order.quantity || "N/A"}</td>
          <td>${order.deliveryAddress || "N/A"}</td>
          <td>${order.status || "N/A"}</td>
          <td>${formattedDate}</td>
          ${order.status === "Pending" ? `<td><button class="process-order" data-id="${doc.id}">Accept</button></td>` : ""}
        </tr>
      `;

      if (order.status === "Pending") {
        pendingOrdersTable.innerHTML += row;
      } else if (order.status === "Completed") {
        completedOrdersTable.innerHTML += row;
      }
    });

    // Add event listeners to "Accept" buttons
    document.querySelectorAll(".process-order").forEach(button => {
      button.addEventListener("click", async () => {
        const orderId = button.getAttribute("data-id");
        console.log("Accepting order:", orderId);
        await window.acceptOrder(orderId);
      });
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    pendingOrdersTable.innerHTML = `<tr><td colspan="7">Error loading orders: ${error.message}</td></tr>`;
  }
};

// Accept Order
window.acceptOrder = async (orderId) => {
  console.log("Updating order status to Completed for order:", orderId);
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "Completed" });
    console.log("Order accepted successfully:", orderId);
    alert("Order accepted successfully!");
    fetchOrders();
  } catch (error) {
    console.error("Error accepting order:", error);
    alert("Failed to accept order: " + error.message);
  }
};

// Generate User Report
const generateUserReport = async (userId, status) => {
  console.log("Generating report for user:", userId, "with status:", status);
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userId", "==", userId), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    console.log("Report query returned", querySnapshot.size, "orders");

    const reportData = [];
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      let orderDate;
      if (order.orderDate && typeof order.orderDate.toDate === 'function') {
        orderDate = order.orderDate.toDate();
      } else if (order.orderDate && typeof order.orderDate === 'string') {
        orderDate = new Date(order.orderDate);
      } else {
        orderDate = new Date();
      }
      const formattedDate = isNaN(orderDate) ? "Invalid Date" : orderDate.toLocaleString();
      reportData.push({
        OrderID: doc.id,
        GasType: order.gasType,
        Quantity: order.quantity,
        DeliveryAddress: order.deliveryAddress,
        Status: order.status,
        OrderDate: formattedDate,
      });
    });

    if (reportData.length > 0) {
      const reportHtml = `
        <h3>Report for ${userId} (${status} Orders)</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Order ID</th>
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
                <td>${row.OrderID.slice(0, 4)}...</td>
                <td>${row.GasType || "N/A"}</td>
                <td>${row.Quantity || "N/A"}</td>
                <td>${row.DeliveryAddress || "N/A"}</td>
                <td>${row.Status || "N/A"}</td>
                <td>${row.OrderDate}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <button id="downloadReportButton">Download Report</button>
        <button id="printReportButton">Print Report</button>
      `;
      reportContainer.innerHTML = reportHtml;

      document.getElementById("downloadReportButton").addEventListener("click", () => {
        console.log("Downloading report as CSV");
        generateCSV(reportData);
      });

      document.getElementById("printReportButton").addEventListener("click", () => {
        console.log("Printing report");
        printReport(reportHtml);
      });
    } else {
      console.log("No orders found for report");
      reportContainer.innerHTML = `<p>No orders found for this user with the selected status.</p>`;
    }
  } catch (error) {
    console.error("Error generating report:", error);
    reportContainer.innerHTML = `<p>Error generating report: ${error.message}</p>`;
  }
};

// Generate CSV for Download
const generateCSV = (reportData) => {
  console.log("Generating CSV for report");
  const csvContent = [
    "OrderID,GasType,Quantity,DeliveryAddress,Status,OrderDate",
    ...reportData.map((row) =>
      `"${row.OrderID}","${row.GasType || 'N/A'}","${row.Quantity || 'N/A'}","${row.DeliveryAddress || 'N/A'}","${row.Status || 'N/A'}","${row.OrderDate}"`
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = "user_order_report.csv";

  if (navigator.msSaveBlob) { // For APK compatibility (e.g., older browsers or WebView)
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  console.log("CSV downloaded");
};

// Print Report
const printReport = (reportHtml) => {
  console.log("Opening print window for report");
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
if (generateUserReportForm) {
  generateUserReportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const userId = userIdInput.value;
    const status = orderStatusSelect.value;
    console.log("Form submitted for user:", userId, "status:", status);
    generateUserReport(userId, status);
  });
}

// Logout
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    console.log("Logout button clicked");
    try {
      await signOut(auth);
      console.log("Admin signed out successfully");
      alert("Logged out successfully!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out: " + error.message);
    }
  });
}

// Navigate to Users Page
if (document.getElementById("userPageButton")) {
  document.getElementById("userPageButton").addEventListener("click", () => {
    console.log("Navigating to users.html");
    window.location.href = "users.html";
  });
}

// Authenticate Admin
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
  if (user) {
    console.log("User authenticated, fetching orders");
    fetchOrders();
  } else {
    console.log("No user logged in, redirecting to index.html");
    alert("Unauthorized access!");
    window.location.href = "index.html";
  }
});