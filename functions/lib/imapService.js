"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGmailEmails = void 0;
const functions = require("firebase-functions");
const Imap = require("imap");
const mailparser_1 = require("mailparser");
class ImapEmailService {
    createImapConnection(config) {
        return new Imap({
            user: config.email,
            password: config.appPassword,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            },
            connTimeout: 60000,
            authTimeout: 30000
        });
    }
    async fetchEmailsFromFolder(config, folderName, limit = 20) {
        return new Promise((resolve, reject) => {
            const imap = this.createImapConnection(config);
            const emails = [];
            imap.once('ready', () => {
                imap.openBox(folderName, true, (err, box) => {
                    if (err) {
                        console.log(`${folderName} klasörü açılamadı: ${err.message}`);
                        resolve([]);
                        return;
                    }
                    const totalMessages = box.messages.total;
                    const startSeq = Math.max(1, totalMessages - limit + 1);
                    const endSeq = totalMessages;
                    if (totalMessages === 0) {
                        resolve([]);
                        imap.end();
                        return;
                    }
                    const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
                        bodies: '',
                        struct: true
                    });
                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            (0, mailparser_1.simpleParser)(stream, (err, mail) => {
                                var _a, _b, _c, _d;
                                if (err) {
                                    console.error('Email parse hatası:', err);
                                    return;
                                }
                                const email = {
                                    id: `${folderName}_${seqno}`,
                                    from: ((_a = mail.from) === null || _a === void 0 ? void 0 : _a.text) || 'Bilinmeyen',
                                    to: ((_b = mail.to) === null || _b === void 0 ? void 0 : _b.text) || '',
                                    cc: ((_c = mail.cc) === null || _c === void 0 ? void 0 : _c.text) || '',
                                    bcc: ((_d = mail.bcc) === null || _d === void 0 ? void 0 : _d.text) || '',
                                    subject: mail.subject || 'Konu yok',
                                    body: mail.html || mail.text || 'İçerik yok',
                                    htmlBody: mail.html || '',
                                    textBody: mail.text || '',
                                    date: mail.date || new Date(),
                                    isRead: false,
                                    isStarred: false,
                                    hasAttachments: mail.attachments && mail.attachments.length > 0,
                                    attachments: mail.attachments ? mail.attachments.map((att) => ({
                                        filename: att.filename || 'unknown',
                                        contentType: att.contentType || 'application/octet-stream',
                                        size: att.size || 0
                                    })) : [],
                                    messageId: mail.messageId || '',
                                    inReplyTo: mail.inReplyTo || '',
                                    references: mail.references ? (Array.isArray(mail.references) ? mail.references.join(' ') : mail.references.toString()) : ''
                                };
                                emails.push(email);
                            });
                        });
                    });
                    fetch.once('error', (err) => {
                        console.error(`${folderName} fetch hatası: ${err.message}`);
                        resolve([]);
                    });
                    fetch.once('end', () => {
                        resolve(emails);
                        imap.end();
                    });
                });
            });
            imap.once('error', (err) => {
                console.error(`IMAP bağlantı hatası: ${err.message}`);
                resolve([]);
            });
            imap.connect();
        });
    }
    async fetchEmails(config, limit = 20) {
        try {
            // Hem INBOX hem de spam klasörünü kontrol et
            const [inboxEmails, spamEmails] = await Promise.all([
                this.fetchEmailsFromFolder(config, 'INBOX', Math.ceil(limit / 2)),
                this.fetchEmailsFromFolder(config, '[Gmail]/Spam', Math.ceil(limit / 2))
            ]);
            // Tüm e-postaları birleştir ve tarihe göre sırala
            const allEmails = [...inboxEmails, ...spamEmails];
            allEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
            // Limit kadar e-posta döndür
            return allEmails.slice(0, limit);
        }
        catch (error) {
            console.error('Email fetch hatası:', error);
            throw error;
        }
    }
    // Eski fetchEmails fonksiyonu için backward compatibility
    async fetchEmailsOld(config, limit = 20) {
        return new Promise((resolve, reject) => {
            const imap = this.createImapConnection(config);
            const emails = [];
            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        reject(new Error(`INBOX açılamadı: ${err.message}`));
                        return;
                    }
                    const totalMessages = box.messages.total;
                    const startSeq = Math.max(1, totalMessages - limit + 1);
                    const endSeq = totalMessages;
                    if (totalMessages === 0) {
                        resolve([]);
                        imap.end();
                        return;
                    }
                    const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
                        bodies: '',
                        struct: true
                    });
                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            (0, mailparser_1.simpleParser)(stream, (err, mail) => {
                                var _a, _b, _c, _d;
                                if (err) {
                                    console.error('Email parse hatası:', err);
                                    return;
                                }
                                const email = {
                                    id: seqno.toString(),
                                    from: ((_a = mail.from) === null || _a === void 0 ? void 0 : _a.text) || 'Bilinmeyen',
                                    to: ((_b = mail.to) === null || _b === void 0 ? void 0 : _b.text) || '',
                                    cc: ((_c = mail.cc) === null || _c === void 0 ? void 0 : _c.text) || '',
                                    bcc: ((_d = mail.bcc) === null || _d === void 0 ? void 0 : _d.text) || '',
                                    subject: mail.subject || 'Konu yok',
                                    body: mail.html || mail.text || 'İçerik yok',
                                    htmlBody: mail.html || '',
                                    textBody: mail.text || '',
                                    date: mail.date || new Date(),
                                    isRead: false,
                                    isStarred: false,
                                    hasAttachments: mail.attachments && mail.attachments.length > 0,
                                    attachments: mail.attachments ? mail.attachments.map((att) => ({
                                        filename: att.filename || 'unknown',
                                        contentType: att.contentType || 'application/octet-stream',
                                        size: att.size || 0
                                    })) : [],
                                    messageId: mail.messageId || '',
                                    inReplyTo: mail.inReplyTo || '',
                                    references: mail.references ? mail.references.join(' ') : ''
                                };
                                emails.push(email);
                            });
                        });
                    });
                    fetch.once('error', (err) => {
                        reject(new Error(`Email fetch hatası: ${err.message}`));
                    });
                    fetch.once('end', () => {
                        // Tarihe göre sırala (en yeni önce)
                        emails.sort((a, b) => b.date.getTime() - a.date.getTime());
                        resolve(emails);
                        imap.end();
                    });
                });
            });
            imap.once('error', (err) => {
                reject(new Error(`IMAP bağlantı hatası: ${err.message}`));
            });
            imap.connect();
        });
    }
}
const imapService = new ImapEmailService();
// Firebase Cloud Function with CORS support
exports.fetchGmailEmails = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { email, appPassword, limit = 20 } = req.body;
    if (!email || !appPassword) {
        res.status(400).json({
            success: false,
            error: 'Email adresi ve uygulama şifresi gerekli'
        });
        return;
    }
    try {
        console.log('IMAP bağlantısı başlatılıyor...', { email, limit });
        const config = { email, appPassword };
        const emails = await imapService.fetchEmails(config, limit);
        console.log(`IMAP başarılı: ${emails.length} email getirildi`);
        res.status(200).json({
            success: true,
            emails: emails,
            message: `${emails.length} email başarıyla getirildi`
        });
    }
    catch (error) {
        console.error('IMAP email fetch hatası:', error);
        res.status(500).json({
            success: false,
            emails: [],
            message: error instanceof Error ? error.message : 'Email getirme işlemi başarısız'
        });
    }
});
//# sourceMappingURL=imapService.js.map