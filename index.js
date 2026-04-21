const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function startBot() {
    // Folder 'session' untuk menyimpan login agar tidak scan QR terus
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Mematikan log sampah agar QR terlihat jelas
        browser: ["Ubuntu", "Chrome", "20.0.0"] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Tampilkan QR di log server jika bot belum login
        if (qr) {
            console.log("--- SCAN QR CODE DI BAWAH INI ---");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menyambung kembali...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('BOT BERHASIL TERHUBUNG!');
        }
    });

    // Handler pesan (opsional)
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        console.log('Ada pesan masuk dari:', msg.key.remoteJid);
    });
}

startBot();
