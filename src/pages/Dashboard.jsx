import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DatePicker from "react-datepicker";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isAfter, isBefore } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [totalServices, setTotalServices] = useState(0);
  const [availableServices, setAvailableServices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState('monthly'); // daily, weekly, monthly, custom
  const [filteredIncome, setFilteredIncome] = useState(0);
  const [startDate, setStartDate] = useState(startOfDay(subDays(new Date(), 30)));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  const servicesCollection = collection(db, "services");
  const transactionsCollection = collection(db, "transactions");
  const expensesCollection = collection(db, "expenses");

  useEffect(() => {
    // Services listener
    const unsubscribeServices = onSnapshot(servicesCollection, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => doc.data());
      setTotalServices(servicesList.length);
      setAvailableServices(servicesList.filter(s => s.available).length);
    });

    // Transactions listener with date range
    let txQuery = query(
      transactionsCollection,
      where('finishedAt', '>=', startDate),
      where('finishedAt', '<=', endDate)
    );

    const unsubscribeTransactions = onSnapshot(txQuery, (snapshot) => {
      const txList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTransactions(txList);
      
      const revenue = txList.reduce(
        (sum, tx) => sum + Number(tx.price || 0),
        0
      );
      setTotalRevenue(revenue);
      
    });

    // Expenses listener with date range
    let expensesQuery = query(
      expensesCollection,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const expensesTotal = expensesList.reduce(
        (sum, exp) => sum + Number(exp.amount || 0),
        0
      );

      setTotalExpenses(expensesTotal);
      
    });

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeServices();
      unsubscribeTransactions();
      unsubscribeExpenses();
    };
  }, [startDate, endDate]); // Re-run effect when dates change

  // -----------------------------------------
  // FILTERING FUNCTIONS (Daily / Weekly / Monthly)
  // -----------------------------------------
  const parseFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return null;
    return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  };

  const groupByDay = useCallback((txList) => {
    const map = new Map();
    
    txList.forEach(tx => {
      const date = parseFirestoreTimestamp(tx.finishedAt);
      if (!date) return;
      
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      map.set(dateKey, (map.get(dateKey) || 0) + (Number(tx.price) || 0));
    });

    // Sort by date
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([label, revenue]) => ({ label, revenue }));
  }, []);

  const groupByWeek = useCallback((txList) => {
    const map = new Map();
    
    txList.forEach(tx => {
      const date = parseFirestoreTimestamp(tx.finishedAt);
      if (!date) return;
      
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekKey = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      map.set(weekKey, (map.get(weekKey) || 0) + (Number(tx.price) || 0));
    });

    // Sort by week start date
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a.split(' - ')[0]) - new Date(b.split(' - ')[0]))
      .map(([label, revenue]) => ({ label, revenue }));
  }, []);

  const groupByMonth = useCallback((txList) => {
    const map = new Map();
    
    txList.forEach(tx => {
      const date = parseFirestoreTimestamp(tx.finishedAt);
      if (!date) return;
      
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      map.set(monthKey, (map.get(monthKey) || 0) + (Number(tx.price) || 0));
    });

    // Sort by month
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([label, revenue]) => ({ label, revenue }));
  }, []);

  // -----------------------------------------
  // Format individual transactions for the chart
  const formatTransactionData = useCallback((txList) => {
    return txList
      .map(tx => {
        const date = parseFirestoreTimestamp(tx.finishedAt);
        if (!date) return null;
        
        return {
          date,
          label: format(date, 'MMM d, yyyy HH:mm'),
          revenue: Number(tx.price) || 0,
          service: tx.serviceName || 'Service',
          customer: tx.customerName || 'Customer'
        };
      })
      .filter(Boolean) // Remove any null entries
      .sort((a, b) => a.date - b.date); // Sort by date
  }, []);

  // Update chart when date range or transactions change
  useEffect(() => {
    if (transactions.length === 0) {
      setChartData([]);
      setFilteredIncome(0);
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedData = formatTransactionData(transactions);
      const total = formattedData.reduce((sum, d) => sum + (d.revenue || 0), 0);
      
      setChartData(formattedData);
      setFilteredIncome(total);
    } catch (error) {
      console.error('Error processing chart data:', error);
      setChartData([]);
      setFilteredIncome(0);
    } finally {
      setIsLoading(false);
    }
  }, [transactions, formatTransactionData]);

  // Handle date range preset selection
  const handleRangeChange = (range) => {
    const today = new Date();
    let newStartDate = startDate;
    let newEndDate = endDate;
    
    switch (range) {
      case 'daily':
        newStartDate = startOfDay(today);
        newEndDate = endOfDay(today);
        break;
      case 'weekly':
        newStartDate = startOfWeek(today, { weekStartsOn: 1 });
        newEndDate = endOfDay(today);
        break;
      case 'monthly':
        newStartDate = startOfMonth(today);
        newEndDate = endOfDay(today);
        break;
      default:
        return; // Keep existing dates for 'custom' range
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setDateRange(range);
  };

  // Handle start date change
  const handleStartDateChange = (date) => {
    if (!date) return;
    const newStart = startOfDay(new Date(date));
    setStartDate(newStart);
    
    // If end date is before new start date, update end date to be the same as start date
    if (isBefore(endDate, newStart)) {
      setEndDate(endOfDay(newStart));
    }
    
    setDateRange('custom');
  };

  // Handle end date change
  const handleEndDateChange = (date) => {
    if (!date) return;
    const newEnd = endOfDay(new Date(date));
    setEndDate(newEnd);
    
    // If start date is after new end date, update start date to be the same as end date
    if (isAfter(startDate, newEnd)) {
      setStartDate(startOfDay(newEnd));
    }
    
    setDateRange('custom');
  };
  
  // Format date for display in the date picker inputs
  const formatDateForInput = (date) => {
    return date ? format(date, 'MMM d, yyyy') : '';
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h2>Total Services</h2>
          <p className="stat-number">{totalServices}</p>
        </div>

        <div className="stat-card available">
          <h2>Available Services</h2>
          <p className="stat-number">{availableServices}</p>
        </div>

        <div className="stat-card revenue">
          <h2>Total Revenue</h2>
          <p className="stat-number">₱{totalRevenue.toLocaleString()}</p>
        </div>

        <div className="stat-card expenses">
          <h2>Total Expenses</h2>
          <p className="stat-number">₱{totalExpenses.toLocaleString()}</p>
        </div>

      </div>

      {/* ------------------------------ */}
      {/*   Income Summary with Date Range Picker */}
      {/* ------------------------------ */}
      <div className="income-filter">
        <div className="date-range-picker-container">
          <h2>Income Summary</h2>
          <div className="date-range-selector">
            <div className="date-range-buttons">
              <button 
                type="button" 
                className={`date-range-btn ${dateRange === 'daily' ? 'active' : ''}`}
                onClick={() => handleRangeChange('daily')}
              >
                Today
              </button>
              <button 
                type="button" 
                className={`date-range-btn ${dateRange === 'weekly' ? 'active' : ''}`}
                onClick={() => handleRangeChange('weekly')}
              >
                This Week
              </button>
              <button 
                type="button" 
                className={`date-range-btn ${dateRange === 'monthly' ? 'active' : ''}`}
                onClick={() => handleRangeChange('monthly')}
              >
                Last 30 Days
              </button>
            </div>
            <div className="date-range-pickers">
              <div className="date-picker-group">
                <label>From:</label>
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  className="date-picker-input"
                  dateFormat="MMM d, yyyy"
                  maxDate={endDate || new Date()}
                  placeholderText="Start date"
                  value={formatDateForInput(startDate)}
                />
              </div>
              <div className="date-picker-separator">to</div>
              <div className="date-picker-group">
                <label>To:</label>
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  className="date-picker-input"
                  dateFormat="MMM d, yyyy"
                  minDate={startDate}
                  maxDate={new Date()}
                  placeholderText="End date"
                  value={formatDateForInput(endDate)}
                />
              </div>
            </div>
          </div>
          <p className="filtered-income-value">
            {startDate && endDate ? (
              <span>
                Income from <strong>{format(startDate, 'MMM d, yyyy')}</strong> to{' '}
                <strong>{format(endDate, 'MMM d, yyyy')}</strong>:
              </span>
            ) : (
              <span>Select a date range to view income</span>
            )}
            <strong> ₱{filteredIncome.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      {/* ------------------------------ */}
      {/* Revenue Chart */}
      {/* ------------------------------ */}
      <div className="revenue-chart-container">
        <h2>Transaction History</h2>
        <p className="chart-subtitle">
          Showing all transactions from {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
        </p>

        {isLoading ? (
          <div className="chart-loading">Loading transactions...</div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 10 }}
                interval={0} // Show all labels
                tickFormatter={(value, index) => {
                  // Show time for better readability when there are many points
                  if (chartData.length > 10) {
                    return format(new Date(chartData[index]?.date || new Date()), 'HH:mm');
                  }
                  return value;
                }}
              />
              <YAxis 
                tickFormatter={(value) => `₱${value.toLocaleString()}`}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={(value) => [`₱${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label, payload) => {
                  if (!payload || !payload[0]) return label;
                  return [
                    `Date: ${label}`,
                    `Service: ${payload[0].payload.service}`,
                    `Customer: ${payload[0].payload.customer}`,
                    `Amount: ₱${payload[0].payload.revenue.toLocaleString()}`
                  ].join('<br/>');
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Amount"
                stroke="#003d7a"
                strokeWidth={2}
                dot={{ r: 4, fill: '#003d7a' }}
                activeDot={{ r: 6, fill: '#ff6b6b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-transactions">No transactions found in the selected date range.</div>
        )}
      </div>
    </div>
  );
}
