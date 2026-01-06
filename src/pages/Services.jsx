import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCheck, 
  FiX, 
  FiDollarSign, 
  FiInfo,
  FiToggleLeft, 
  FiToggleRight 
} from 'react-icons/fi';
import "../styles/services.css";

export default function Services() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);

  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const servicesCollection = collection(db, "services");

  // Load user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole"); // must match Login.jsx
    setCurrentUserRole(role || "");
  }, []);

  // Fetch Services
  const fetchServices = async () => {
    const data = await getDocs(servicesCollection);
    setServices(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.title?.toLowerCase().includes(q) ||
      s.details?.toLowerCase().includes(q);

    if (availabilityFilter === "all") return matchesSearch;
    if (availabilityFilter === "available") return matchesSearch && s.available === true;
    return matchesSearch && s.available === false;
  });

  // Add or Update Service
  const saveService = async (e) => {
    e.preventDefault();

    if (!title || !details || !price) {
      alert("Please fill all required fields");
      return;
    }

    try {
      if (editingService) {
        const serviceDoc = doc(db, "services", editingService.id);
        await updateDoc(serviceDoc, {
          title: title.trim(),
          details: details.trim(),
          price: Number(price),
          available,
          updatedAt: new Date().toISOString(),
        });
        setEditingService(null);
      } else {
        await addDoc(servicesCollection, {
          title: title.trim(),
          details: details.trim(),
          price: Number(price),
          available,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Reset form
      setTitle("");
      setDetails("");
      setPrice("");
      setAvailable(true);
      
      // Refresh the services list
      await fetchServices();
    } catch (error) {
      console.error("Error saving service: ", error);
      alert("An error occurred while saving the service. Please try again.");
    }
  };

  // Toggle Availability
  const toggleAvailability = async (id, currentValue) => {
    try {
      const serviceDoc = doc(db, "services", id);
      await updateDoc(serviceDoc, { 
        available: !currentValue,
        updatedAt: new Date().toISOString()
      });
      fetchServices();
    } catch (error) {
      console.error("Error toggling service availability: ", error);
      alert("Failed to update service availability. Please try again.");
    }
  };

  // Delete service (Admin only)
  const deleteService = async (id) => {
    if (currentUserRole !== "admin") {
      alert("Only administrators can delete services.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this service? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        const serviceDoc = doc(db, "services", id);
        await deleteDoc(serviceDoc);
        fetchServices();
      } catch (error) {
        console.error("Error deleting service: ", error);
        alert("Failed to delete service. Please try again.");
      }
    }
  };

  // Edit service
  const editService = (service) => {
    setEditingService(service);
    setTitle(service.title);
    setDetails(service.details);
    setPrice(service.price);
    setAvailable(service.available);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setTitle("");
    setDetails("");
    setPrice("");
    setAvailable(true);
  };

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Service Management</h1>
        <p>Add, edit, or manage your services</p>
      </div>

      {/* Add/Edit Service Form */}
      <form className="service-form" onSubmit={saveService}>
        <div className="form-group">
          <label htmlFor="service-title">Service Title *</label>
          <input
            id="service-title"
            type="text"
            placeholder="e.g"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="service-details">Service Details *</label>
          <textarea
            id="service-details"
            placeholder="Describe the service in detail..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="form-control"
            rows="4"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="service-price">Price (₱) *</label>
          <div className="price-input">
            <FiDollarSign className="price-icon" />
            <input
              id="service-price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="form-control"
            />
          </div>
        </div>

        <div className="availability-toggle" style={{ display: "none"}}>
          <div className="toggle-wrapper">
            {available ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
            <input
              type="checkbox"
              id="service-available"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="sr-only"
            />
          </div>
          <label htmlFor="service-available">
            {available ? 'Service is currently available' : 'Service is currently unavailable'}
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingService ? (
              <>
                <FiEdit2 size={16} /> Update Service
              </>
            ) : (
              <>
                <FiPlus size={16} /> Add New Service
              </>
            )}
          </button>
          {editingService && (
            <button 
              type="button" 
              onClick={cancelEdit} 
              className="btn btn-outline"
            >
              <FiX size={16} /> Cancel
            </button>
          )}
        </div>
      </form>

      {/* Service List */}
      <div className="service-list-header">
        <div className="availability-filter">
          <button
            type="button"
            className={`filter-btn ${availabilityFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-btn ${availabilityFilter === 'available' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('available')}
          >
            Available
          </button>
          <button
            type="button"
            className={`filter-btn ${availabilityFilter === 'unavailable' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('unavailable')}
          >
            Unavailable
          </button>
        </div>

        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="service-search"
        />
      </div>

      <div className="service-list">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div
              className={`service-card ${service.available ? "available" : "not-available"}`}
              key={service.id}
            >
              <div className="service-content">
                <div className="service-header">
                  <h2>{service.title}</h2>
                  <span className={`service-status ${service.available ? 'status-available' : 'status-unavailable'}`}>
                    {service.available ? (
                      <><FiCheck size={14} /> Available</>
                    ) : (
                      <><FiX size={14} /> Unavailable</>
                    )}
                  </span>
                </div>
                
                <p className="service-description">{service.details}</p>
                
                <div className="service-price">
                  ₱{parseFloat(service.price).toFixed(2)}
                </div>

                <div className="service-actions">
                  <button 
                    onClick={() => toggleAvailability(service.id, service.available)}
                    className={`btn ${service.available ? 'btn-unavailable' : 'btn-available'}`}
                  >
                    {service.available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  
                  <button 
                    onClick={() => editService(service)}
                    className="btn btn-edit"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  
                  {currentUserRole === "admin" && (
                    <button
                      onClick={() => deleteService(service.id)}
                      className="btn btn-delete"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FiInfo size={48} className="empty-icon" />
            <h3>No Services Found</h3>
            <p>{services.length === 0 ? 'Add your first service to get started' : 'No services match your search'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
