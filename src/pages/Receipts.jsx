import { useEffect, useState } from "react";
import "../styles/receipts.css";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, query } from "firebase/firestore";
import jsPDF from "jspdf";

export default function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");

  // Load role from localStorage (fix: use "userRole")
  useEffect(() => {
    const role = localStorage.getItem("userRole"); // <-- correct key
    console.log("Loaded role:", role); // Debug
    if (role) setCurrentUserRole(role);
  }, []);

  const transactionsCollection = collection(db, "transactions");

  const fetchTransactions = async () => {
    const q = query(transactionsCollection);
    const data = await getDocs(q);

    setTransactions(
      data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ----------------------
  // Generate PDF
  // ----------------------
  const generatePDF = (tx) => {
    const doc = new jsPDF();

    const dateObj = tx.finishedAt ? tx.finishedAt.toDate() : new Date();
    const formattedDate = dateObj.toLocaleDateString();
    const formattedTime = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const img = new Image();
    img.src = "/images/logo.jpg";
    img.onload = () => {
      const logoWidth = 40;
      const logoHeight = (img.height / img.width) * logoWidth;

      doc.addImage(img, "JPEG", 10, 2, logoWidth, logoHeight);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Toledo Doctors & Diagnostic Center", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Official Receipt", 105, 28, { align: "center" });

      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

      doc.setFontSize(12);
      doc.text(`Customer Name: ${tx.customerName}`, 10, 45);
      doc.text(`Service Name: ${tx.serviceName}`, 10, 55);

      const formattedPrice = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(tx.price);

      const cleanPrice = formattedPrice.replace("₱", "P");
      doc.text(`Total Price: ${cleanPrice}`, 10, 65);

      doc.text(`Date: ${formattedDate}`, 10, 75);
      doc.text(`Time: ${formattedTime}`, 10, 85);

      doc.line(10, 95, 200, 95);
      doc.text("Thank you for trusting our services!", 105, 105, { align: "center" });

      doc.save(`receipt-${tx.customerName}-${tx.id}.pdf`);
    };
  };

  // ----------------------
  // Delete Transaction (Admin Only)
  // ----------------------
  const deleteTransaction = async (id) => {
    if (currentUserRole !== "admin") {
      alert("Only admin can delete receipts.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this receipt?")) {
      await deleteDoc(doc(db, "transactions", id));
      fetchTransactions();
    }
  };

  return (
    <div className="receipts-container">
      <h1 className="page-title">Receipts</h1>

      <div className="receipts-table">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Service Name</th>
              <th>Price</th>
              <th>Date & Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const dateObj = tx.finishedAt ? tx.finishedAt.toDate() : new Date();
              const formattedDate = dateObj.toLocaleDateString();
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <tr key={tx.id}>
                  <td>{tx.customerName}</td>
                  <td>{tx.serviceName}</td>
                  <td>
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(tx.price)}
                  </td>
                  <td>{formattedDate} {formattedTime}</td>
                  <td>
                    <button className="receipt-btn" onClick={() => generatePDF(tx)}>
                      Generate PDF
                    </button>

                    {currentUserRole === "admin" && (
                      <>
                        <div className="spacer"></div>
                        <br />
                        <button
                          className="receipt-btn delete"
                          onClick={() => deleteTransaction(tx.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
