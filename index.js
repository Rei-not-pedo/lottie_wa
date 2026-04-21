// Import Module
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
const { resolve } = require("path")
const { version } = require("os")

// Metode Pairing
// True = Pairing Code || False = Scan QR
const usePairingCode = true

// prompt Input Terminal
async function question(promt) {
    process.stdout.write(promt)
    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise((resolve) => r1.question("", (ans) => {
        r1.close()
        resolve(ans)
    }))
}

// Koneksi WhatsApp
async function connectToWhatsApp() {
    console.log(chalk.blue("🎁 Memulai Koneksi Ke WhatsApp"))

    // Menyimpan Sesi Login
    // LenwySesi Menjadi Penyimpanan Sesi Login
    const { state, saveCreds } = await useMultiFileAuthState("./LenwySesi")

    // Membuat Koneksi WhatsApp
    const lenwy = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !usePairingCode,
        auth: state, // Pakai Sesi Yang Ada
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Simulasi Browser
        version: [2, 3000, 1015901307] // Versi WhatsApp
    })

    // Metode Pairing Code
    if (usePairingCode && !lenwy.authState.creds.registered) {
        console.log(chalk.green("☘ Masukkan Nomor Dengan Awal 62"))
        const phoneNumber = await question("> ")
        const code = await lenwy.requestPairingCode(phoneNumber.trim())
        console.log(chalk.cyan(`🎁 Pairing Code : ${code}`))
    }

    // Menyimpan Sesi Login
    lenwy.ev.on("creds.update", saveCreds)

    // Informasi Koneksi
    lenwy.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            console.log(chalk.red("❌ Koneksi Terputus, Mencoba Menyambung Ulang"))
            connectToWhatsApp()
        } else if (connection === "open") {
            console.log(chalk.green("✓ Bot Berhasil Terhubung Ke WhatsApp"))
        }
    })
}

// Jalankan Koneksi WhatsApp
connectToWhatsApp()
