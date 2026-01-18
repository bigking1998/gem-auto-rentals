/**
 * Export utilities for CSV and PDF generation
 */

// CSV Export
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) return;

  // Get headers from the first item if not provided
  const csvHeaders = headers || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
  }));

  // Create header row
  const headerRow = csvHeaders.map((h) => `"${h.label}"`).join(',');

  // Create data rows
  const dataRows = data.map((item) =>
    csvHeaders.map((h) => {
      const value = item[h.key];
      // Handle different types
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  // Combine and download
  const csv = [headerRow, ...dataRows].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// PDF Export (simple HTML to PDF via print)
export function exportToPDF(
  title: string,
  sections: {
    title: string;
    type: 'table' | 'stats' | 'text';
    data: Record<string, unknown>[] | { label: string; value: string | number }[];
    headers?: { key: string; label: string }[];
  }[]
): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to export PDF');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build HTML content
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1f2937;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #6366f1;
        }
        .header h1 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .header .subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        .header .date {
          color: #9ca3af;
          font-size: 12px;
          margin-top: 4px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .stat-card {
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
          .header { margin-bottom: 30px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">Gem Auto Rentals - Analytics Report</div>
        <div class="date">Generated on ${currentDate}</div>
      </div>
  `;

  sections.forEach((section) => {
    htmlContent += `<div class="section">`;
    htmlContent += `<h2 class="section-title">${section.title}</h2>`;

    if (section.type === 'table' && section.headers) {
      htmlContent += '<table>';
      htmlContent += '<thead><tr>';
      section.headers.forEach((h) => {
        htmlContent += `<th>${h.label}</th>`;
      });
      htmlContent += '</tr></thead>';
      htmlContent += '<tbody>';
      (section.data as Record<string, unknown>[]).forEach((row) => {
        htmlContent += '<tr>';
        section.headers!.forEach((h) => {
          const value = row[h.key];
          htmlContent += `<td>${value ?? '-'}</td>`;
        });
        htmlContent += '</tr>';
      });
      htmlContent += '</tbody></table>';
    } else if (section.type === 'stats') {
      htmlContent += '<div class="stats-grid">';
      (section.data as { label: string; value: string | number }[]).forEach((stat) => {
        htmlContent += `
          <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
          </div>
        `;
      });
      htmlContent += '</div>';
    } else if (section.type === 'text') {
      (section.data as { label: string; value: string | number }[]).forEach((item) => {
        htmlContent += `<p><strong>${item.label}:</strong> ${item.value}</p>`;
      });
    }

    htmlContent += '</div>';
  });

  htmlContent += `
      <div class="footer">
        <p>This report was automatically generated by Gem Auto Rentals CRM</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

// Helper function to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format currency for export
export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Booking Contract interface
interface BookingContractData {
  bookingId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    licenseNumber?: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
    category?: string;
    vin?: string;
  };
  rental: {
    startDate: Date;
    endDate: Date;
    pickupLocation: string;
    dropoffLocation: string;
    dailyRate: number;
    totalAmount: number;
    deposit?: number;
  };
  extras?: {
    insurance?: boolean;
    gps?: boolean;
    childSeat?: boolean;
    additionalDriver?: boolean;
  };
}

// Generate Rental Contract PDF
export function generateRentalContract(booking: BookingContractData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate contract');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startDate = new Date(booking.rental.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDate = new Date(booking.rental.endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rentalDays = Math.ceil(
    (new Date(booking.rental.endDate).getTime() - new Date(booking.rental.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rental Contract - ${booking.bookingId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Times New Roman', Times, serif;
          padding: 40px 60px;
          color: #1f2937;
          line-height: 1.6;
          font-size: 14px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px double #1f2937;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #4f46e5;
          margin-bottom: 5px;
        }
        .header h1 {
          font-size: 22px;
          color: #1f2937;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .contract-number {
          font-size: 12px;
          color: #6b7280;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          margin-bottom: 12px;
          padding-bottom: 5px;
          border-bottom: 1px solid #d1d5db;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-box {
          background-color: #f9fafb;
          padding: 15px;
          border: 1px solid #e5e7eb;
        }
        .info-box h4 {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .info-box p {
          margin-bottom: 4px;
        }
        .info-box .value {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          border: 1px solid #d1d5db;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }
        .total-row {
          font-weight: bold;
          background-color: #f3f4f6;
        }
        .terms {
          font-size: 11px;
          color: #4b5563;
          margin-top: 20px;
        }
        .terms h4 {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .terms ol {
          padding-left: 20px;
        }
        .terms li {
          margin-bottom: 6px;
        }
        .signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #1f2937;
          margin-top: 60px;
          padding-top: 10px;
        }
        .signature-label {
          font-size: 12px;
          color: #6b7280;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px 40px; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">GEM AUTO RENTALS</div>
        <p style="font-size: 12px; color: #6b7280;">Premium Car Rental Services</p>
        <h1>Vehicle Rental Agreement</h1>
        <div class="contract-number">
          Contract #: ${booking.bookingId}<br>
          Date: ${currentDate}
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Parties to this Agreement</h3>
        <div class="info-grid">
          <div class="info-box">
            <h4>Lessor (Rental Company)</h4>
            <p class="value">Gem Auto Rentals</p>
            <p>123 Main Street, Suite 100</p>
            <p>Los Angeles, CA 90001</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: rentals@gemautorentals.com</p>
          </div>
          <div class="info-box">
            <h4>Lessee (Renter)</h4>
            <p class="value">${booking.customer.name}</p>
            ${booking.customer.address ? `<p>${booking.customer.address}</p>` : ''}
            ${booking.customer.phone ? `<p>Phone: ${booking.customer.phone}</p>` : ''}
            <p>Email: ${booking.customer.email}</p>
            ${booking.customer.licenseNumber ? `<p>Driver's License: ${booking.customer.licenseNumber}</p>` : ''}
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Vehicle Information</h3>
        <div class="info-box">
          <p><strong>Vehicle:</strong> ${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}</p>
          ${booking.vehicle.licensePlate ? `<p><strong>License Plate:</strong> ${booking.vehicle.licensePlate}</p>` : ''}
          ${booking.vehicle.vin ? `<p><strong>VIN:</strong> ${booking.vehicle.vin}</p>` : ''}
          ${booking.vehicle.category ? `<p><strong>Category:</strong> ${booking.vehicle.category}</p>` : ''}
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Rental Period & Locations</h3>
        <div class="info-grid">
          <div class="info-box">
            <h4>Pick-up</h4>
            <p class="value">${startDate}</p>
            <p>${booking.rental.pickupLocation}</p>
          </div>
          <div class="info-box">
            <h4>Return</h4>
            <p class="value">${endDate}</p>
            <p>${booking.rental.dropoffLocation}</p>
          </div>
        </div>
        <p style="margin-top: 10px;"><strong>Total Rental Duration:</strong> ${rentalDays} day${rentalDays > 1 ? 's' : ''}</p>
      </div>

      <div class="section">
        <h3 class="section-title">Rental Charges</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Daily Rental Rate</td>
              <td>${rentalDays} day${rentalDays > 1 ? 's' : ''}</td>
              <td>${formatCurrencyForExport(booking.rental.dailyRate)}/day</td>
              <td>${formatCurrencyForExport(booking.rental.dailyRate * rentalDays)}</td>
            </tr>
            ${booking.extras?.insurance ? `
            <tr>
              <td>Full Insurance Coverage</td>
              <td>${rentalDays} day${rentalDays > 1 ? 's' : ''}</td>
              <td>$15/day</td>
              <td>${formatCurrencyForExport(15 * rentalDays)}</td>
            </tr>
            ` : ''}
            ${booking.extras?.gps ? `
            <tr>
              <td>GPS Navigation</td>
              <td>${rentalDays} day${rentalDays > 1 ? 's' : ''}</td>
              <td>$10/day</td>
              <td>${formatCurrencyForExport(10 * rentalDays)}</td>
            </tr>
            ` : ''}
            ${booking.extras?.childSeat ? `
            <tr>
              <td>Child Seat</td>
              <td>${rentalDays} day${rentalDays > 1 ? 's' : ''}</td>
              <td>$8/day</td>
              <td>${formatCurrencyForExport(8 * rentalDays)}</td>
            </tr>
            ` : ''}
            ${booking.extras?.additionalDriver ? `
            <tr>
              <td>Additional Driver</td>
              <td>1</td>
              <td>$25</td>
              <td>$25</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3">Total Amount</td>
              <td>${formatCurrencyForExport(booking.rental.totalAmount)}</td>
            </tr>
            ${booking.rental.deposit ? `
            <tr>
              <td colspan="3">Security Deposit (Refundable)</td>
              <td>${formatCurrencyForExport(booking.rental.deposit)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <div class="section terms">
        <h4>TERMS AND CONDITIONS</h4>
        <ol>
          <li><strong>Age Requirement:</strong> The Lessee must be at least 21 years of age and hold a valid driver's license.</li>
          <li><strong>Insurance:</strong> The vehicle is covered by basic liability insurance. Additional coverage options are available.</li>
          <li><strong>Fuel Policy:</strong> The vehicle must be returned with the same fuel level as at pick-up. A refueling fee will apply otherwise.</li>
          <li><strong>Mileage:</strong> Unlimited mileage is included unless otherwise specified in this agreement.</li>
          <li><strong>Prohibited Use:</strong> The vehicle shall not be used for racing, towing, off-road driving, or any illegal purpose.</li>
          <li><strong>Damage Responsibility:</strong> The Lessee is responsible for any damage to the vehicle during the rental period.</li>
          <li><strong>Late Return:</strong> Late returns will incur additional daily charges at the standard rate.</li>
          <li><strong>Cancellation:</strong> Cancellations must be made at least 24 hours before the scheduled pick-up time for a full refund.</li>
          <li><strong>Traffic Violations:</strong> The Lessee is responsible for all traffic violations and fines incurred during the rental period.</li>
          <li><strong>Emergency:</strong> In case of accident or breakdown, contact Gem Auto Rentals immediately at (555) 123-4567.</li>
        </ol>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            <p class="signature-label">Lessor Signature</p>
            <p style="font-size: 11px; margin-top: 5px;">Gem Auto Rentals Representative</p>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <p class="signature-label">Lessee Signature</p>
            <p style="font-size: 11px; margin-top: 5px;">${booking.customer.name}</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This agreement constitutes the entire understanding between the parties.</p>
        <p>Gem Auto Rentals | 123 Main Street, Los Angeles, CA 90001 | (555) 123-4567</p>
        <p style="margin-top: 10px;">Document generated on ${currentDate}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.print();
  };
}
