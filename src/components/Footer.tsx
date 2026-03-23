import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '20px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#888',
            width: '100%',
        }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
                <Link href="/privacy" style={{ color: '#888', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/cookies" style={{ color: '#888', textDecoration: 'none' }}>Cookie Policy</Link>
            </div>
            <div>
                © {new Date().getFullYear()} PlayTCG.Online. Tutti i diritti riservati.
            </div>
        </footer>
    );
};

export default Footer;
