  import { useEffect, useState } from "react";
  import "../styles/transactions.css";
  import { db } from "../firebase";
  import { collection, getDocs, addDoc } from "firebase/firestore";
  import { jsPDF } from 'jspdf';
  import 'jspdf-autotable';
  import { useNavigate } from 'react-router-dom';
  import logo from "../images/logo.jpg";

  export default function POS() {
    const [services, setServices] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [discountPercent, setDiscountPercent] = useState(0);

    const servicesCollection = collection(db, "services");
    const transactionsCollection = collection(db, "transactions");

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

    const filteredServices = services.filter((service) =>
      service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.details?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addServiceToCart = (service) => {
      setSelectedServices([
        ...selectedServices,
        {
          id: service.id,
          title: service.title,
          details: service.details || service.detail || "",
          price: service.price,
          timestamp: new Date().getTime(),
        },
      ]);
    };

    const removeServiceFromCart = (timestamp) => {
      setSelectedServices(
        selectedServices.filter((service) => service.timestamp !== timestamp)
      );
    };

    const calculateTotal = () => {
      return selectedServices.reduce(
        (total, service) => total + service.price,
        0
      );
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const imageToDataUrl = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg'), width: img.width, height: img.height });
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    };

    const generateReceiptPDF = async (transactionData) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // add logo if available
      try {
        const imgObj = await imageToDataUrl(logo);
        const desiredWidth = 40; // mm
        const desiredHeight = (imgObj.height / imgObj.width) * desiredWidth;
        // center horizontally: (210 - desiredWidth) / 2 = 85 when desiredWidth=40
        doc.addImage(imgObj.dataUrl, 'JPEG', 85, 10, desiredWidth, desiredHeight);
      } catch (err) {
        console.error('Failed to load logo for PDF:', err);
      }

      // Add header text
      doc.setFontSize(22);
      doc.text('Toledo Doctors', 105, 35, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('123 Medical Center Drive', 105, 28, { align: 'center' });
      doc.text('Toledo, City', 105, 34, { align: 'center' });
      doc.text('Contact: (123) 456-7890', 105, 40, { align: 'center' });
      
      // Add receipt title
      doc.setFontSize(18);
      doc.text('INVOICE', 105, 60, { align: 'center' });
      
      // Add receipt details
      doc.setFontSize(10);
      doc.text(`Receipt #: ${transactionData.id}`, 20, 75);
      doc.text(`Date: ${formatDate(transactionData.finishedAt)}`, 20, 80);
      doc.text(`Customer: ${transactionData.customerName}`, 20, 85);
      
      // Prepare table data
      const headers = [['Service', 'Price (P)']];
      const data = transactionData.services.map(service => [
        service.serviceName + (service.details ? ` — ${service.details}` : ''),
        `P${Math.round(parseFloat(service.price) || 0)}`
      ]);

      // Calculate totals
      const subtotal = transactionData.services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
      const discount = parseFloat(transactionData.discountPercent || 0);
      const discountAmount = Math.round((subtotal * (discount / 100)) * 100) / 100;
      const finalTotal = Math.round((subtotal - discountAmount) * 100) / 100;

      // Add subtotal, discount and total rows
      data.push([
        { content: 'SUBTOTAL', styles: { fontStyle: 'bold' }},
        { content: `P${Math.round(subtotal)}`, styles: { fontStyle: 'bold' }}
      ]);

      if (discount > 0) {
        data.push([
          { content: `DISCOUNT (${discount}% )`, styles: { fontStyle: 'bold' }},
          { content: `-P${discountAmount}`, styles: { fontStyle: 'bold' }}
        ]);
      }

      data.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold' }},
        { content: `P${finalTotal}`, styles: { fontStyle: 'bold' }}
      ]);
      
      // Generate table
      doc.autoTable({
        startY: 95,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 'auto', halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak',
          lineWidth: 0.1
        },
        didDrawPage: function (data) {
          // Footer
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
          doc.text('For any inquiries, please contact our office.', 105, pageHeight - 15, { align: 'center' });
        }
      });
      
      // Save the PDF with a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      doc.save(`invoice-${transactionData.id}-${timestamp}.pdf`);
    };

    const finishServices = async () => {
      if (!customerName.trim()) {
        alert("Please enter customer name");
        return;
      }

      if (selectedServices.length === 0) {
        alert("Please add at least one service");
        return;
      }

      try {
        // Create the transaction
        const subtotal = calculateTotal();
        const discountNum = Math.max(0, Math.min(100, Number(discountPercent) || 0));
        const discountAmount = Math.round((subtotal * (discountNum / 100)) * 100) / 100;
        const discountedTotal = Math.round((subtotal - discountAmount) * 100) / 100;

        const docRef = await addDoc(transactionsCollection, {
          customerName,
          services: selectedServices.map((service) => ({
            serviceId: service.id,
            serviceName: service.title,
            details: service.details || service.detail || "",
            price: service.price,
          })),
          subtotal,
          discountPercent: discountNum,
          discountAmount,
          total: discountedTotal,
          finishedAt: new Date(),
        });

        // Show a success message when the invoice is saved
        alert('Invoice created successfully!');

        // Attempt to generate and download the PDF; failures here should not affect the success message
        try {
          generateReceiptPDF({
            id: docRef.id,
            customerName,
            services: selectedServices.map((service) => ({
              serviceName: service.title,
              details: service.details || service.detail || "",
              price: service.price,
            })),
            finishedAt: new Date(),
            subtotal,
            discountPercent: discountNum,
            discountAmount,
            total: discountedTotal,
          });
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
        }

        // Reset form
        setCustomerName("");
        setSelectedServices([]);
        setSelectedServiceId(null);
      } catch (error) {
        console.error('Error creating invoice:', error);
        alert('Failed to create invoice. Please try again.');
      }
    };

    return (
      <div className="pos-container">
        <h1 className="page-title">Point of Sale</h1>

        <div className="customer-section">
          <div className="customer-input">
            <input
              type="text"
              placeholder="Enter Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {selectedServices.length > 0 && (
            <div className="cart-section">
              <h3>Selected Services</h3>
              <div className="cart-items">
                {selectedServices.map((service) => (
                  <div key={service.timestamp} className="cart-item">
                    <span>
                      {service.title} - ₱{service.price}
                    </span>
                    <button
                      onClick={() => removeServiceFromCart(service.timestamp)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="discount-row">
                <label>Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="discount-input"
                />
              </div>

              <div className="cart-total">
                <div>
                  <div>Subtotal: ₱{calculateTotal().toFixed(2)}</div>
                  <div>Discount: {Math.max(0, Math.min(100, Number(discountPercent) || 0))}%</div>
                  <strong>
                    Total: ₱{
                      (Math.round((calculateTotal() - (calculateTotal() * (Math.max(0, Math.min(100, Number(discountPercent) || 0)) / 100))) * 100) / 100).toFixed(2)
                    }
                  </strong>
                </div>
              </div>

              <button className="checkout-btn" onClick={finishServices}>
                Create Invoice
              </button>
            </div>
          )}
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search services..."
            className="service-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="services-grid">
          {filteredServices.length === 0 && (
            <p className="no-results">No services found.</p>
          )}

          {filteredServices.map((service) => (
            <div
              className={`service-card ${
                service.available ? "available" : "not-available"
              }`}
              key={service.id}
            >
              <h2>{service.title}</h2>
              <p>{service.details}</p>
              <p><strong>Price:</strong> ₱{service.price}</p>

              <p className="status">
                Status:
                <span className={service.available ? "green" : "red"}>
                  {service.available ? "Available" : "Not Available"}
                </span>
              </p>

              {service.available && (
                <button
                  className="finish-btn"
                  onClick={() => addServiceToCart(service)}
                >
                  Add to Invoice
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
