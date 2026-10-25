import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TeaEntry } from './types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const getTodayDate = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
};

export default function App() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('teaAccountTheme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [entries, setEntries] = useState<TeaEntry[]>(() => {
    try {
      const raw = localStorage.getItem('teaAccountEntries');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Form states
  const [date, setDate] = useState<string>(getTodayDate);
  const [customer, setCustomer] = useState<string>('');
  const [item, setItem] = useState<string>('Tea');
  const [qty, setQty] = useState<number | string>(1);
  const [price, setPrice] = useState<number | string>(12);
  const [received, setReceived] = useState<number | string>(0);
  const [notes, setNotes] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const customerInputRef = useRef<HTMLInputElement>(null);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('teaAccountTheme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  // Persist entries to localStorage
  const updateEntries = (newEntries: TeaEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem('teaAccountEntries', JSON.stringify(newEntries));
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Calculations
  const totalSales = useMemo(
    () => entries.reduce((s, e) => s + (Number(e.qty) || 0) * (Number(e.price) || 0), 0),
    [entries]
  );
  const totalPaid = useMemo(
    () => entries.reduce((s, e) => s + (Number(e.received) || 0), 0),
    [entries]
  );
  const totalDue = useMemo(
    () =>
      entries.reduce(
        (s, e) =>
          s +
          Math.max(
            0,
            (Number(e.qty) || 0) * (Number(e.price) || 0) - (Number(e.received) || 0)
          ),
        0
      ),
    [entries]
  );
  const totalCups = useMemo(
    () => entries.reduce((s, e) => s + (Number(e.qty) || 0), 0),
    [entries]
  );

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .map((entry, index) => ({ ...entry, originalIndex: index }))
      .filter(entry => entry.customer.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = Number(qty);
    const parsedPrice = Number(price);
    const parsedReceived = Number(received);

    if (
      isNaN(parsedQty) ||
      isNaN(parsedPrice) ||
      isNaN(parsedReceived) ||
      parsedQty < 1 ||
      parsedPrice < 0 ||
      parsedReceived < 0
    ) {
      alert('Please enter valid amounts.');
      return;
    }

    const newEntry: TeaEntry = {
      date: date || getTodayDate(),
      customer: customer.trim(),
      item,
      qty: parsedQty,
      price: parsedPrice,
      received: parsedReceived,
      notes: notes.trim(),
    };

    updateEntries([...entries, newEntry]);

    setCustomer('');
    setQty(1);
    setReceived(0);
    setNotes('');
    customerInputRef.current?.focus();
  };

  const handleReset = () => {
    setDate(getTodayDate());
    setCustomer('');
    setItem('Tea');
    setQty(1);
    setPrice(12);
    setReceived(0);
    setNotes('');
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Delete this account entry?')) {
      const updated = entries.filter((_, i) => i !== index);
      updateEntries(updated);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const data = [
      [
        'Date',
        'Account',
        'Item',
        'Quantity (cups)',
        'Price per cup',
        'Total',
        'Received',
        'Balance',
        'Notes',
      ],
      ...entries.map(e => {
        const itemQty = Number(e.qty) || 0;
        const itemPrice = Number(e.price) || 0;
        const itemReceived = Number(e.received) || 0;
        const itemTotal = itemQty * itemPrice;
        const itemBalance = Math.max(0, itemTotal - itemReceived);

        return [
          e.date,
          e.customer,
          e.item,
          itemQty,
          itemPrice,
          itemTotal.toFixed(2),
          itemReceived.toFixed(2),
          itemBalance.toFixed(2),
          e.notes || '',
        ];
      }),
    ];

    const csv = data
      .map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tea-account-price-details.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header>
        <div className="wrap headerbar">
          <div className="brand">
            <div className="cup" aria-hidden="true">☕</div>
            <div>
              <h1>Tea Account Price Details</h1>
              <p>Tea sales • Daily account • Payment balance</p>
            </div>
          </div>
          <button
            className="theme-toggle"
            id="themeToggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
          >
            <span id="themeIcon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span id="themeLabel">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="stats">
          <div className="stat">
            <small>Total sales</small>
            <strong id="totalSales">{fmt(totalSales)}</strong>
          </div>
          <div className="stat">
            <small>Total received</small>
            <strong id="totalPaid">{fmt(totalPaid)}</strong>
          </div>
          <div className="stat">
            <small>Balance due</small>
            <strong id="totalDue">{fmt(totalDue)}</strong>
          </div>
          <div className="stat">
            <small>Total cups sold</small>
            <strong id="totalCups">{totalCups} cups</strong>
          </div>
        </section>

        <section className="panel">
          <h2>Add tea account entry</h2>
          <form id="entryForm" onSubmit={handleSubmit}>
            <div className="formgrid">
              <div>
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="customer">Customer / Account name</label>
                <input
                  ref={customerInputRef}
                  id="customer"
                  placeholder="e.g. Office account"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="item">Tea type</label>
                <select
                  id="item"
                  value={item}
                  onChange={e => setItem(e.target.value)}
                >
                  <option>Tea</option>
                  <option>Milk tea</option>
                  <option>Black tea</option>
                  <option>Ginger tea</option>
                  <option>Coffee</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="qty">Quantity (cups)</label>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  step="1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="price">Price per cup (₹)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="received">Amount received (₹)</label>
                <input
                  id="received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={received}
                  onChange={e => setReceived(e.target.value)}
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label htmlFor="notes">Notes (optional)</label>
                <input
                  id="notes"
                  placeholder="Extra details"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="actions">
              <button className="primary" type="submit">
                ＋ Add entry
              </button>
              <button
                className="secondary"
                type="reset"
                id="resetBtn"
                onClick={handleReset}
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Account history</h2>
          <div className="actions" style={{ marginTop: 0, marginBottom: '14px' }}>
            <input
              id="search"
              placeholder="Search account name…"
              aria-label="Search account name"
              style={{ maxWidth: '280px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className="secondary"
              id="exportBtn"
              type="button"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>
            <button
              className="secondary"
              id="printBtn"
              type="button"
              onClick={handlePrint}
            >
              Print account
            </button>
          </div>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Item</th>
                  <th>Qty (cups)</th>
                  <th>Total</th>
                  <th>Received</th>
                  <th>Balance</th>
                  <th className="delcol">Action</th>
                </tr>
              </thead>
              <tbody id="rows">
                {filteredEntries.map(entry => {
                  const amount = entry.qty * entry.price;
                  const balance = Math.max(0, amount - entry.received);
                  return (
                    <tr key={entry.originalIndex}>
                      <td>{entry.date}</td>
                      <td>
                        <strong>{entry.customer}</strong>
                        {entry.notes ? (
                          <>
                            <br />
                            <small>{entry.notes}</small>
                          </>
                        ) : null}
                      </td>
                      <td>{entry.item}</td>
                      <td>{entry.qty}</td>
                      <td className="money">{fmt(amount)}</td>
                      <td>{fmt(entry.received)}</td>
                      <td>
                        <span className={`pill ${balance === 0 ? 'paid' : 'due'}`}>
                          {fmt(balance)}
                        </span>
                      </td>
                      <td className="delcol">
                        <button
                          className="del"
                          type="button"
                          onClick={() => handleDelete(entry.originalIndex)}
                          aria-label={`Delete entry for ${entry.customer}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredEntries.length === 0 && (
            <div id="empty" className="empty">
              No entries yet. Add your first tea account above.
            </div>
          )}
        </section>

        <p className="foot">
          Tea Account Price Details · Sample cup price is ₹12. Change it to your
          shop’s price. Entries are saved in this browser on this device.
        </p>
      </main>
    </>
  );
}
