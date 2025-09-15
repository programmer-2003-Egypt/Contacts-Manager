// 📁 Realtime Contact Frontend (React with Update & Delete logic)

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

const queryClient = new QueryClient();
const GlobalStyle = createGlobalStyle`
  /* CSS Reset & Box Model */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Smooth Font Rendering */
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: 'Segoe UI', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    background: linear-gradient(145deg, #0f2027, #203a43, #2c5364);
    color: #f5f5f5;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 3rem;
    overflow-x: hidden;
    background-attachment: fixed;
    background-size: 400% 400%;
    animation: gradientShift 20s ease infinite;
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(129, 1, 1, 0.2);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  /* Selection Style */
  ::selection {
    background: #00c6ff;
    color: #fff;
  }

`;

const theme = {
  colors: {
    primary: '#00c6ff',
    gradient: 'linear-gradient(to right, #00c6ff, #0072ff)',
    cardBg: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255,255,255,0.15)'
  }
};

const Container = styled.div`
 display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
gap: 2rem;
width: 100%;
max-width: 800px;
margin: 0 auto;
`;
const Card = styled(motion.div)`
  background: ${({ theme }) => theme.colors.cardBg};
  backdrop-filter: blur(16px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin-bottom: 1.2rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.colors.gradient};
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25), inset 0 -2px 0 rgba(255,255,255,0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 12px 24px rgba(0,0,0,0.3);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: rgba(255,255,255,0.2);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 14px 18px;
  margin: 0 auto 1.5rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: #fff;
  display: block;
  transition: 0.3s ease;
  backdrop-filter: blur(12px);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(0, 198, 255, 0.3);
    background: rgba(255,255,255,0.09);
  }
`;


const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContactItem = styled(motion.li)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 1.8rem;
  margin-bottom: 1.8rem;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;


  button {
    background: ${({ theme }) => theme.colors.gradient};
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
  }

  button:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
`;
const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap; /* Optional: wrap buttons on small screens */
  margin-top: 1rem;
`;

function App() {
  const [form, setForm] = useState({ name: '', email: '', message: '', pin: false });
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);


  const fetchContacts = async () => {
    const res = await axios.get('http://localhost:8000/contact');
    setContacts(res.data);
  };

  useEffect(() => {
    setLoading(true);
    fetchContacts()
      .catch(() => {
        Swal.fire('❌ Error', 'Failed to load contacts', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = uuidv4(); // generate unique ID to match backend route
  
    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
  
      // If you're handling a file input later:
      // formData.append('file', selectedFile); // optional
  
      const res = await axios.post(`http://localhost:8000/contact/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      Swal.fire('✅ Success', res.data.message, 'success');
      setForm({ name: '', email: '', message: '', pin: false });
      fetchContacts();
    } catch (err) {
      Swal.fire('❌ Error', 'Could not send contact', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/contact/${id}`);
      Swal.fire('🗑️ Deleted!', 'Contact removed.', 'success');
      fetchContacts();
    } catch (err) {
      Swal.fire('❌ Error', 'Delete failed', 'error');
    }
  };

  const handleUpdate = async (contact) => {
    const { value: name } = await Swal.fire({
      title: 'Update Name',
      input: 'text',
      inputValue: contact.name
    });
    if (!name) return;

    const updated = { ...contact, name };
    try {
      const res = await axios.put(`http://localhost:8000/contact/${contact.id}`, updated);
      Swal.fire('✏️ Updated!', res.data.message, 'success');
      fetchContacts();
    } catch (err) {
      Swal.fire('❌ Error', 'Update failed', 'error');
    }
  };

  const filteredContacts = contacts.filter(c =>
    (c?.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (c?.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    (c?.message || '').toLowerCase().includes(filters.message.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <GlobalStyle />
        <Container>
          {/* 📬 Contact Form */}
          <Card>
            <h2>📨 Contact Form</h2>
            <form onSubmit={handleSubmit}>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Name" required autoComplete="off" />
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" required autoComplete="off" />
              <TextArea name="message" value={form.message} onChange={handleChange} placeholder="Message" required />
             
  
              <Button
                type="submit"
                disabled={!form.name || !form.email || !form.message}
              >
                Send
              </Button>
            </form>
          </Card>
  
          {/* 📋 Contact List */}
          <Card>
            <h2>📬 Contacts</h2>
  
            {/* 🔍 Search Fields */}
            <SearchInput
              placeholder="Search name..."
              value={filters.name}
              onChange={e => setFilters(p => ({ ...p, name: e.target.value }))}
            />
            <SearchInput
              placeholder="Search email..."
              value={filters.email}
              onChange={e => setFilters(p => ({ ...p, email: e.target.value }))}
            />
            <SearchInput
              placeholder="Search message..."
              value={filters.message}
              onChange={e => setFilters(p => ({ ...p, message: e.target.value }))}
            />
  
            {/* 📊 Total Count */}
            <div style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              margin: '1rem 0',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.05)',
              padding: '0.8rem',
              borderRadius: '10px'
            }}>
              📊 Total Contacts: {filteredContacts.length}
            </div>
  
            {/* ⏳ Loading Spinner OR Contact List */}
            {loading ? (
              <div style={{
                margin: '2rem auto',
                border: '5px dashed rgba(255,255,255,0.4)',
                borderTop: '5px dashed #00c6ff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <List>
                {filteredContacts.map((c, i) => (
                  <ContactItem key={c.id || i}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      opacity: 0.7
                    }}>
                      #{i + 1}
                    </div>
  
                    <div><strong>👤 {c.name}</strong></div>
                    <div>✉️ {c.email}</div>
                    <div>💬 {c.message}</div>
  
                    <div style={{
                      marginTop: '0.8rem',
                      display: 'flex',
                      gap: '1rem',
                      justifyContent: 'center'
                    }}>
                      <Button onClick={() => handleUpdate(c)}>✏️ Update</Button>
                      <Button onClick={() => handleDelete(c.id)}>🗑️ Delete</Button>
                    </div>
                  </ContactItem>
                ))}
              </List>
            )}
          </Card>
        </Container>
  
        {/* ⛓️ Inline Spinner Animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </QueryClientProvider>
    </ThemeProvider>
  );
}  
export default App;