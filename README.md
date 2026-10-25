# Tea Account Price Details

A React application for tea shop and stall owners to manage daily tea sales, customer accounts, received amounts, and outstanding balance dues.

## Features

- **Daily Summary Dashboard**: Real-time summary cards calculating Total Sales (₹), Total Received (₹), Balance Due (₹), and Total Cups Sold.
- **Entry Management**:
  - Add tea orders with Date, Customer / Account name, Tea type, Quantity, Unit price, Received amount, and optional Notes.
  - Interactive validation and instant balance calculation.
  - Clear / reset form with today's date preserved.
- **Account History & Real-Time Filtering**:
  - Searchable transaction ledger by customer name.
  - Auto-sorted chronologically by date descending.
  - Status pills identifying fully paid vs balance due orders.
  - Single-click row deletion with confirmation.
- **Export & Print**:
  - One-click CSV export with UTF-8 BOM encoding (`tea-account-price-details.csv`).
  - Print-friendly layout (`window.print()`) with print-optimized styles.
- **Theme Support**:
  - Light mode and Dark mode toggles with persistent local storage.
  - High-contrast accessible color tokens.
- **Local Persistence**:
  - Entries and theme preferences are automatically saved in browser `localStorage`.

## Tech Stack

- React 19
- TypeScript
- Vite
