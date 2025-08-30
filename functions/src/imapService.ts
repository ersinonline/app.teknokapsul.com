import * as functions from 'firebase-functions';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

interface GmailConfig {
  email: string;
  appPassword: string;
}

interface EmailMessage {
  id: string;
  from: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  textBody?: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments?: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
}



class ImapEmailService {
  private createImapConnection(config: GmailConfig): Imap {
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

  async fetchEmailsFromFolder(config: GmailConfig, folderName: string, limit: number = 20): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      const imap = this.createImapConnection(config);
      const emails: EmailMessage[] = [];

      imap.once('ready', () => {
        imap.openBox(folderName, true, (err: any, box: any) => {
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

          fetch.on('message', (msg: any, seqno: any) => {
            msg.on('body', (stream: any, info: any) => {
              simpleParser(stream, (err: any, mail: any) => {
                if (err) {
                  console.error('Email parse hatası:', err);
                  return;
                }

                const email: EmailMessage = {
                  id: `${folderName}_${seqno}`,
                  from: mail.from?.text || 'Bilinmeyen',
                  to: mail.to?.text || '',
                  cc: mail.cc?.text || '',
                  bcc: mail.bcc?.text || '',
                  subject: mail.subject || 'Konu yok',
                  body: mail.html || mail.text || 'İçerik yok',
                  htmlBody: mail.html || '',
                  textBody: mail.text || '',
                  date: mail.date || new Date(),
                  isRead: false,
                  isStarred: false,
                  hasAttachments: mail.attachments && mail.attachments.length > 0,
                  attachments: mail.attachments ? mail.attachments.map((att: any) => ({
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

          fetch.once('error', (err: any) => {
            console.error(`${folderName} fetch hatası: ${err.message}`);
            resolve([]);
          });

          fetch.once('end', () => {
            resolve(emails);
            imap.end();
          });
        });
      });

      imap.once('error', (err: any) => {
        console.error(`IMAP bağlantı hatası: ${err.message}`);
        resolve([]);
      });

      imap.connect();
    });
  }

  async fetchEmails(config: GmailConfig, limit: number = 20): Promise<EmailMessage[]> {
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
    } catch (error) {
      console.error('Email fetch hatası:', error);
      throw error;
    }
  }

  // Eski fetchEmails fonksiyonu için backward compatibility
  async fetchEmailsOld(config: GmailConfig, limit: number = 20): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      const imap = this.createImapConnection(config);
      const emails: EmailMessage[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err: any, box: any) => {
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

          fetch.on('message', (msg: any, seqno: any) => {
            msg.on('body', (stream: any, info: any) => {
              simpleParser(stream, (err: any, mail: any) => {
                if (err) {
                  console.error('Email parse hatası:', err);
                  return;
                }

                const email: EmailMessage = {
                  id: seqno.toString(),
                  from: mail.from?.text || 'Bilinmeyen',
                  to: mail.to?.text || '',
                  cc: mail.cc?.text || '',
                  bcc: mail.bcc?.text || '',
                  subject: mail.subject || 'Konu yok',
                  body: mail.html || mail.text || 'İçerik yok',
                  htmlBody: mail.html || '',
                  textBody: mail.text || '',
                  date: mail.date || new Date(),
                  isRead: false,
                  isStarred: false,
                  hasAttachments: mail.attachments && mail.attachments.length > 0,
                  attachments: mail.attachments ? mail.attachments.map((att: any) => ({
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

          fetch.once('error', (err: any) => {
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

      imap.once('error', (err: any) => {
        reject(new Error(`IMAP bağlantı hatası: ${err.message}`));
      });

      imap.connect();
    });
  }
}

const imapService = new ImapEmailService();

// Firebase Cloud Function with CORS support
export const fetchGmailEmails = functions.https.onRequest(async (req, res) => {
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
    const config: GmailConfig = { email, appPassword };
    const emails = await imapService.fetchEmails(config, limit);
    
    console.log(`IMAP başarılı: ${emails.length} email getirildi`);
    res.status(200).json({
      success: true,
      emails: emails,
      message: `${emails.length} email başarıyla getirildi`
    });
  } catch (error) {
    console.error('IMAP email fetch hatası:', error);
    res.status(500).json({
      success: false,
      emails: [],
      message: error instanceof Error ? error.message : 'Email getirme işlemi başarısız'
    });
  }
});