import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.6' }}>
            <Link href="/" style={{ color: '#3B82F6', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>&larr; Torna alla Home</Link>
            
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Informativa sulla Privacy - PlayTCG.Online</h1>
            <p><em>Ultimo aggiornamento: 23 Marzo 2026</em></p>

            <h3>1. Introduzione e Impegno alla Conformità</h3>
            <p>
                PlayTCG.Online ("noi", "ci" o "nostro") pone la protezione dei dati al centro della propria tecnologia. La presente Informativa descrive come gestiamo i dati sulla piattaforma di gioco PlayTCG.Online.
                Dichiariamo esplicitamente che i nostri servizi sono progettati per essere pienamente conformi alle seguenti normative dell'Unione Europea: GDPR (Regolamento UE 2016/679) e Digital Services Act (DSA - Regolamento UE 2022/2065).
            </p>

            <h3>2. Titolare del Trattamento</h3>
            <p>
                Il titolare del trattamento è:<br/>
                <strong>[NOME TITOLARE provvisorio]</strong><br/>
                Email: [INSERIRE EMAIL]<br/>
            </p>

            <h3>3. Architettura "Privacy-by-Design": Modalità di Accesso</h3>
            <p>
                Offriamo diverse modalità di accesso su PlayTCG.Online:
                <ul>
                    <li style={{marginBottom: '5px'}}><strong>Accesso come Ospite:</strong> Non viene richiesto alcun dato associato ad un profilo persistente. I dati della sessione sono temporanei.</li>
                    <li><strong>Accesso Registrato:</strong> L'utente si registra per conservare avatar e preferenze, fornendo i dati strettamente necessari all'autenticazione tramite Supabase.</li>
                </ul>
            </p>

            <h3>4. Dati di Gioco e Finalità del Trattamento</h3>
            <p>Registriamo dati esclusivamente per finalità funzionali al servizio di gioco (Art. 6 GDPR, esecuzione di un contratto):
                <ul>
                    <li style={{marginBottom: '5px'}}>Impostazioni del profilo: Avatar, Nickname scelti dall'utente.</li>
                    <li>Svolgimento partita: Azioni di gioco e inviti in lobby.</li>
                </ul>
            </p>

            <h3>5. Diritti dell'Utente e Diritto all'Oblio</h3>
            <p>
                In conformità agli Artt. 15-22 del GDPR, l'utente può esercitare i propri diritti di accesso ed eliminazione account (diritto all'oblio) contattandoci direttamente all'indirizzo email indicato sopra.
            </p>
        </div>
    );
}
