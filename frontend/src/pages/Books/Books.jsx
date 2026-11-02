import React, { useState, useEffect } from 'react';
import { getBooks } from '../../services/api';
import './Books.css';

export default function Books() {
  const [level]   = useState(parseInt(localStorage.getItem('userLevel') || '1'));
  const [books, setBooks] = useState([]);

  useEffect(() => {
    getBooks(level).then((r) => setBooks(r.data.books)).catch(() => {});
  }, [level]);

  return (
    <div className="books-page">
      <div className="page-header">
        <h1>📖 Books to Read</h1>
        <p>Curated reading list for Level {level}</p>
      </div>

      <div className="books-grid">
        {books.map((book, i) => (
          <div key={i} className="book-card card">
            <div className="book-cover">📚</div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <div className="book-author">by {book.author}</div>
              <div className="book-badge">{book.level}</div>
              <p>{book.description}</p>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="empty-state card">
          <div style={{ fontSize: 48 }}>📚</div>
          <p>Loading books for your level...</p>
        </div>
      )}
    </div>
  );
}
