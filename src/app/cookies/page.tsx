import React from 'react';
import Link from 'next/link';

export default function CookiePolicy() {
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.6' }}>
            <Link href="/" style={{ color: '#3B82F6', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>&larr; Torna alla Home</Link>
            
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Cookie Policy - PlayTCG.Online</h1>
            <p><em>Ultimo aggiornamento: 23 Marzo 2026</em></p>

            <h3>Cosa sono i cookie?</h3>
            <p>I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell'utente, dove vengono memorizzati, per poi essere ritrasmessi agli stessi siti alla visita successiva.</p>

            <h3>Quali cookie utilizziamo?</h3>
            <p>PlayTCG.Online utilizza esclusivamente <strong>cookie tecnici e strettamente necessari</strong> al funzionamento della piattaforma. Non utilizziamo cookie di profilazione o tracciamento pubblicitario di terze parti.</p>

            <ul>
                <li style={{marginBottom: '5px'}}><strong>Autenticazione:</strong> Utilizzati per mantenere la sessione utente attiva e sicura tra le pagine.</li>
                <li><strong>Preferenze:</strong> Per memorizzare le impostazioni visive o di gioco salvate localmente sul dispositivo dell'utente.</li>
            </ul>

            <h3>Gestione dei cookie</h3>
            <p>Puoi impostare il tuo browser per rifiutare tutti i cookie o per indicare quando un cookie viene inviato. Tuttavia, alcune funzionalità del nostro servizio (come il login) potrebbero non funzionare correttamente senza i cookie tecnici abilitati.</p>
        </div>
    );
}
