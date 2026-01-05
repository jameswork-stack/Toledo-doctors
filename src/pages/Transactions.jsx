import { useEffect, useState } from "react";
import "../styles/transactions.css";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function POS() {
  const [services, setServices] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const servicesCollection = collection(db, "services");
  const transactionsCollection = collection(db, "transactions");

  // Fetch all services
  const fetchServices = async () => {
    const data = await getDocs(servicesCollection);
    setServices(
      data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Finish service
  const finishService = async (service) => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    await addDoc(transactionsCollection, {
      serviceId: service.id,
      serviceName: service.title,
      price: service.price,
      customerName,
      finishedAt: new Date(),
    });

    // Optional: mark service as unavailable
    // const serviceDoc = doc(db, "services", service.id);
    // await updateDoc(serviceDoc, { available: false });

    alert(`Service "${service.title}" finished for ${customerName}`);

    setCustomerName("");
    setSelectedServiceId(null);
    fetchServices();
  };

  return (
    <div className="pos-container">
      <h1 className="page-title">Point of Sale</h1>

        <div className="customer-input">
          <input
            type="text"
            placeholder="Enter Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div
              className={`service-card ${
                service.available ? "available" : "not-available"
              }`}
              key={service.id}
            >
              <h2>{service.title}</h2>
              <p>{service.details}</p>
              <p>
                <strong>Price:</strong> ₱{service.price}
              </p>
              <p className="status">
                Status:{" "}
                <span className={service.available ? "green" : "red"}>
                  {service.available ? "Available" : "Not Available"}
                </span>
              </p>

              {service.available && (
                <button
                  className="finish-btn"
                  onClick={() => finishService(service)}
                >
                  Invoice
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
