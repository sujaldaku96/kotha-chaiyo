import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import PaymentDetails from './PaymentDetails';

const AdminPayments = ({ payments, onViewPaymentDetails, selectedPayment }) => {
  // Filter out payments with missing required data
  const validPayments = payments.filter(payment => 
    payment?.paymentDetails && 
    payment?.property && 
    payment?.user &&
    payment.status === 'paid'
  );

  console.log('All payments:', payments);
  console.log('Valid payments:', validPayments);

  return (
    <div className="admin-payments">
      <h2>Payment Transactions ({validPayments.length})</h2>
      
      {validPayments.length === 0 ? (
        <div className="no-payments">No payment transactions found</div>
      ) : (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {validPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.paymentDetails.transactionId || 'N/A'}</td>
                  <td>{payment.property.title}</td>
                  <td>{`${payment.user.firstName} ${payment.user.lastName}`}</td>
                  <td>Rs {payment.amount.toLocaleString()}</td>
                  <td>
                    {new Date(payment.paymentDetails.paymentTimestamp).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status ${payment.paymentDetails.paymentStatus}`}>
                      {payment.paymentDetails.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-details-btn"
                      onClick={() => onViewPaymentDetails(payment)}
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetails 
          booking={selectedPayment} 
          onClose={() => onViewPaymentDetails(null)} 
        />
      )}
    </div>
  );
};

export default AdminPayments; 