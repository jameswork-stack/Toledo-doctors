import { useState, useEffect } from "react";
import "../styles/reports.css";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export default function Reports() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const expensesCollection = collection(db, "expenses");

  // Load all expenses
  const loadExpenses = async () => {
    const snapshot = await getDocs(expensesCollection);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setExpenses(data);

    // Compute total
    const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
    setTotalExpenses(total);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!amount) {
      alert("Amount is required");
      return;
    }

    await addDoc(expensesCollection, {
      amount: Number(amount),
      note: note || "No details",
      date: Timestamp.now(),
    });

    setAmount("");
    setNote("");
    loadExpenses();
  };

  // Delete Expense
  const deleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteDoc(doc(db, "expenses", id));
      loadExpenses();
    }
  };

  // Format date
  const formatDate = (ts) => {
    const d = ts.toDate();
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  return (
    <div className="reports-container">
      <h1 className="page-title">Expense History</h1>

      {/* Add Expense */}
      <form className="expense-form" onSubmit={handleAddExpense}>
        <input
          type="number"
          placeholder="Expense Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <textarea
          placeholder="Expense Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        ></textarea>

        <button className="button-primary" type="submit">
          Add Expense
        </button>
      </form>

      {/* Total Expenses */}
      <div className="total-expenses-box" style={{ display: "none"}}>
        <h2>Total Expenses</h2>
        <p className="total-amount">₱{totalExpenses.toLocaleString()}</p>
      </div>

      {/* Expense List */}
      <div className="expenses-list">
        <h2>Expense History</h2>

        <table>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Note</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>₱{e.amount.toLocaleString()}</td>
                <td>{e.note}</td>
                <td>{formatDate(e.date)}</td>
                <td>
                  <button
                    className="button-delete"
                    onClick={() => deleteExpense(e.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
