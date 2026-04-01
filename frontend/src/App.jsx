import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastQuery, setLastQuery] = useState('');

  const BACKEND_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/products`);
      const data = await response.json();
      setProducts(data);
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsInitialLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (value.trim().length > 2) {
      setIsSearching(true);
      try {
        const response = await fetch(`${BACKEND_URL}/recommend?query=${encodeURIComponent(value)}`);
        const data = await response.json();
        setProducts(data);
        setLastQuery(value);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsSearching(false);
      }
    } else if (value.trim() === '') {
      fetchProducts();
      setLastQuery('');
    }
  };

  const getRecommendationsFor = async (id) => {
      setIsSearching(true);
      try {
          const response = await fetch(`${BACKEND_URL}/related/${id}`);
          const data = await response.json();
          setProducts(data);
          setLastQuery('Related Products');
      } catch (error) {
          console.error('Error fetching related products:', error);
      } finally {
          setIsSearching(false);
      }
  }

  return (
    <div className="container">
      <header className="fade-in">
        <h1>AI Product Recommender</h1>
        <p className="subtitle">Powered by all-MiniLM-L6-v2 Deep Learning Model</p>
      </header>

      <div className="search-container fade-in" style={{ animationDelay: '0.2s' }}>
        <input
          type="text"
          className="search-input"
          placeholder="What are you looking for today? (e.g. 'music', 'gaming', 'office')"
          value={search}
          onChange={handleSearch}
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
          </div>
        )}
      </div>

      <div className="fade-in" style={{ animationDelay: '0.4s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {lastQuery ? `Recommendations for "${lastQuery}"` : 'Our Collection'}
          </h2>
          {lastQuery && (
              <button 
                onClick={() => { setSearch(''); fetchProducts(); setLastQuery(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Clear Results
              </button>
          )}
        </div>

        {isInitialLoading ? (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        ) : (
            <div className="product-grid">
              {products.map((product, index) => (
                <div 
                    className="card fade-in" 
                    key={product.id} 
                    style={{ animationDelay: `${0.1 * index + 0.5}s` }}
                    onClick={() => getRecommendationsFor(product.id)}
                >
                  {product.similarity_score && (
                    <div className="recommend-badge">
                      {(product.similarity_score * 100).toFixed(0)}% MATCH
                    </div>
                  )}
                  <div className="card-image-container">
                    <img src={product.image} alt={product.name} className="card-image" />
                  </div>
                  <div className="card-content">
                    <span className="card-category">{product.category}</span>
                    <h3 className="card-title">{product.name}</h3>
                    <p className="card-desc">{product.description}</p>
                    <div className="card-footer">
                      <span className="card-price">${product.price.toFixed(2)}</span>
                      <button className="similarity-text" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 700 }}>
                         FIND SIMILAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
