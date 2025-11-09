import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { DayEntry, WeeklySummary, MonthlySummary } from '@/types/work';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB');
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

const pdfStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px;
      background: #f8f9fa;
      color: #1a1a1a;
    }
    .header {
      background: #007AFF;
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .summary-card-label {
      font-size: 13px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .summary-card-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .summary-card-unit {
      font-size: 14px;
      color: #666;
    }
    .expense-card {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
    .expense-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .expense-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 16px;
    }
    .expense-amount {
      font-size: 48px;
      font-weight: 700;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    .day-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .day-date {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .day-stats {
      font-size: 14px;
      color: #007AFF;
      font-weight: 600;
    }
    .rebooking-badge {
      display: inline-block;
      background: #ff9800;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .schools-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .school-tag {
      background: #f0f0f0;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      color: #1a1a1a;
    }
    .holiday-card {
      background: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .holiday-title {
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 24px;
      color: #1a1a1a;
    }
    .holiday-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
    }
    .holiday-stat {
      text-align: center;
      flex: 1;
    }
    .holiday-stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #007AFF;
      margin-bottom: 4px;
    }
    .holiday-stat-value.remaining {
      color: #4caf50;
    }
    .holiday-stat-label {
      font-size: 13px;
      color: #666;
    }
    .holiday-note {
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      margin-top: 30px;
      border-top: 2px solid #e0e0e0;
      color: #999;
      font-size: 12px;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    th {
      background: #f8f9fa;
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:last-child td {
      border-bottom: none;
    }
  </style>
`;

export async function exportDailyEntry(entry: DayEntry, contractedHoursPerDay: number): Promise<void> {
  const date = formatDate(entry.date);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        ${pdfStyles}
      </head>
      <body>
        <div class="header">
          <h1>Daily Work Entry</h1>
          <p>${date}</p>
        </div>

        ${entry.isDayOff ? `
          <div class="summary-card">
            <div class="summary-card-label">Status</div>
            <div class="summary-card-value">Day Off</div>
            <div class="summary-card-unit">Holiday - ${contractedHoursPerDay} hours used</div>
          </div>
        ` : `
          <div class="section">
            <div class="section-title">Schools Visited</div>
            <div class="schools-list">
              ${entry.schools.map(school => `
                <div class="school-tag">${school.name}</div>
              `).join('')}
            </div>
          </div>

          ${entry.isRebooking ? '<div class="rebooking-badge">Rebooking</div><br/><br/>' : ''}

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-card-label">Start Time</div>
              <div class="summary-card-value">${formatTime(entry.startTime)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">End Time</div>
              <div class="summary-card-value">${formatTime(entry.endTime)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">Total Hours</div>
              <div class="summary-card-value">${entry.hoursWorked.toFixed(2)}</div>
              <div class="summary-card-unit">hours</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">Miles Driven</div>
              <div class="summary-card-value">${(entry.endMileage - entry.startMileage).toFixed(1)}</div>
              <div class="summary-card-unit">miles</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-card-label">Start Location</div>
              <div style="font-size: 18px; font-weight: 600; margin-top: 8px;">${entry.startLocation}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">End Location</div>
              <div style="font-size: 18px; font-weight: 600; margin-top: 8px;">${entry.endLocation}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-card-label">Start Mileage</div>
              <div class="summary-card-value">${entry.startMileage}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">End Mileage</div>
              <div class="summary-card-value">${entry.endMileage}</div>
            </div>
          </div>
        `}

        <div class="footer">
          Generated on ${new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </body>
    </html>
  `;
  
  await printOrSharePDF(html, `daily-entry-${entry.date}.pdf`);
}

export async function exportWeeklySummary(summary: WeeklySummary, mileageRate: number): Promise<void> {
  const weekStart = formatDate(summary.weekStart);
  const weekEnd = formatDate(summary.weekEnd);
  const rebookings = summary.dailyBreakdown.filter(d => d.isRebooking).length;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        ${pdfStyles}
      </head>
      <body>
        <div class="header">
          <h1>Weekly Summary</h1>
          <p>${weekStart} - ${weekEnd}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">Total Hours</div>
            <div class="summary-card-value">${summary.totalHours.toFixed(1)}</div>
            <div class="summary-card-unit">hours</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Total Miles</div>
            <div class="summary-card-value">${summary.totalMiles.toFixed(1)}</div>
            <div class="summary-card-unit">miles</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Rebookings</div>
            <div class="summary-card-value">${rebookings}</div>
            <div class="summary-card-unit">this week</div>
          </div>
        </div>

        <div class="expense-card">
          <div class="expense-title">Mileage Expenses</div>
          <div class="expense-subtitle">Based on selected expenses: ${mileageRate}p/mile</div>
          <div class="expense-amount">£${summary.mileageExpense.toFixed(2)}</div>
        </div>

        <div class="section">
          <div class="section-title">Daily Breakdown</div>
          ${summary.dailyBreakdown.map(day => `
            <div class="day-card">
              <div class="day-header">
                <div class="day-date">
                  ${formatDate(day.date)}
                  ${day.isRebooking ? '<span class="rebooking-badge">Rebooking</span>' : ''}
                </div>
                <div class="day-stats">${day.hours.toFixed(1)}h • ${day.miles.toFixed(1)}mi</div>
              </div>
              ${day.schools.length > 0 ? `
                <div class="schools-list">
                  ${day.schools.map(school => `
                    <div class="school-tag">${school}</div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </body>
    </html>
  `;
  
  await printOrSharePDF(html, `weekly-summary-${summary.weekStart}.pdf`);
}

export async function exportMonthlySummary(summary: MonthlySummary, mileageRate: number, contractedHours: number, contractedHoursPerDay: number): Promise<void> {
  const monthDate = new Date(summary.monthStart);
  const monthName = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        ${pdfStyles}
      </head>
      <body>
        <div class="header">
          <h1>Monthly Summary</h1>
          <p>${monthName}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">Total Hours</div>
            <div class="summary-card-value">${summary.totalHours.toFixed(1)}</div>
            <div class="summary-card-unit">hours</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Total Miles</div>
            <div class="summary-card-value">${summary.totalMiles.toFixed(1)}</div>
            <div class="summary-card-unit">miles</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Rebookings</div>
            <div class="summary-card-value">${summary.rebookingsCount}</div>
            <div class="summary-card-unit">this month</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Overtime</div>
            <div class="summary-card-value">${summary.overtimeHours.toFixed(1)}</div>
            <div class="summary-card-unit">hours</div>
          </div>
        </div>

        <div class="holiday-card">
          <div class="holiday-title">Holiday Entitlement</div>
          <div class="holiday-stats">
            <div class="holiday-stat">
              <div class="holiday-stat-value">${summary.totalHolidayEntitlement.toFixed(1)}</div>
              <div class="holiday-stat-label">Total Days</div>
            </div>
            <div class="holiday-stat">
              <div class="holiday-stat-value">${summary.holidaysUsed.toFixed(1)}</div>
              <div class="holiday-stat-label">Used</div>
            </div>
            <div class="holiday-stat">
              <div class="holiday-stat-value remaining">${summary.holidaysRemaining.toFixed(1)}</div>
              <div class="holiday-stat-label">Remaining</div>
            </div>
          </div>
          <div class="holiday-note">
            1 day = ${contractedHoursPerDay} hours • Contracted hours: ${contractedHours}h/week
          </div>
        </div>

        <div class="expense-card">
          <div class="expense-title">Mileage Expenses</div>
          <div class="expense-subtitle">Based on selected expenses: ${mileageRate}p/mile</div>
          <div class="expense-amount">£${summary.mileageExpense.toFixed(2)}</div>
        </div>

        <div class="section">
          <div class="section-title">Weekly Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Hours</th>
                <th>Miles</th>
                <th>Rebookings</th>
              </tr>
            </thead>
            <tbody>
              ${summary.weeklyBreakdown.map((week, i) => {
                const weekStart = formatDate(week.weekStart);
                const weekEnd = formatDate(week.weekEnd);
                return `
                  <tr>
                    <td><strong>${weekStart} - ${weekEnd}</strong></td>
                    <td>${week.hours.toFixed(1)} hours</td>
                    <td>${week.miles.toFixed(1)} miles</td>
                    <td>${week.rebookings}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </body>
    </html>
  `;
  
  await printOrSharePDF(html, `monthly-summary-${summary.monthStart}.pdf`);
}

async function printOrSharePDF(html: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const blob = await fetch(uri).then(res => res.blob());
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF on web:', error);
      throw error;
    }
  } else {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}
