import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingHistoryPage.css';

const BookingHistoryPage = () => {
  const [bookingHistory, setBookingHistory] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'successful', 'failed'

  const userId = localStorage.getItem('userId');

  const refreshBookingHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/routes/booking-history/${userId}`);
      if (response.data && response.data.length > 0) {
        const sortedBookings = response.data.sort(
          (a, b) => new Date(b.reservation_time) - new Date(a.reservation_time)
        );
        setBookingHistory(sortedBookings);
        setFilteredBookings(sortedBookings);
      } else {
        setError('No bookings found for this user.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      refreshBookingHistory();
    } else {
      setError('User not logged in');
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let filtered = bookingHistory;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.id.toString().includes(searchTerm) ||
          booking.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.slot_id.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus === 'successful') {
      filtered = filtered.filter((booking) => booking.status !== 0);
    } else if (filterStatus === 'failed') {
      filtered = filtered.filter((booking) => booking.status === 0);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, bookingHistory, filterStatus]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  if (loading) {
    return (
      <div className="booking-history-page">
        <h2>Your Booking History</h2>
        <div className="loading-container">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="booking-card-skeleton">
              <div className="skeleton-line" style={{ width: '30%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
              <div className="skeleton-line" style={{ width: '50%' }}></div>
              <div className="skeleton-line" style={{ width: '40%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button className="refresh-button" onClick={refreshBookingHistory}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="booking-history-page">
      <h2>Your Booking History</h2>
      <div className="search-filter-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        
        {/* Dropdown for filtering */}
        <select className="filter-dropdown" value={filterStatus} onChange={handleFilterChange}>
          <option value="all">Filter Bookings</option>
          <option value="all">All</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="history-list">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, index) => {
            const bookingIdStyle = booking.status === 0 ? { color: 'red' } : { color: 'green' };

            return (
              <div key={index} className="booking-card">
                <h3 style={bookingIdStyle}>
                  Booking ID: {booking.id}
                </h3>
                <p><strong>Location:</strong> {booking.location}</p>
                <p><strong>Slot:</strong> {booking.slot_id}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={booking.status === 0 ? 'status-failed' : 'status-success'}>
                    {booking.status === 0 ? 'Failed' : 'Successful'}
                  </span>
                </p>
                <p><strong>Reservation Time:</strong> {new Date(booking.reservation_time).toLocaleString()}</p>
              </div>
            );
          })
        ) : (
          <div className="no-bookings">
            <p>No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;
