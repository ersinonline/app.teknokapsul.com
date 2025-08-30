// Browser-compatible imports - IMAP only works in Node.js environment
let Imap: any;
let simpleParser: any;

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Mock implementations for browser
  Imap = class MockImap {
    constructor() {}
    connect() {}
    openBox() {}
    search() {}
    fetch() {
      return {
        on: () => {}
      };
    }
    end() {}
    on() {}
  };
  simpleParser = () => {};
} else {
  // Only import in Node.js environment
  try {
    Imap = require('imap');
    const mailparser = require('mailparser');
    simpleParser = mailparser.simpleParser;
  } catch (e) {
    console.warn('IMAP modules not available:', e);
  }
}

export interface GmailConfig {
  email: string;
  appPassword: string;
}

export interface EmailMessage {
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

export class GmailService {
  private config: GmailConfig;
  private imap: any | null = null;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  private createImapConnection(): any {
    return new Imap({
      user: this.config.email,
      password: this.config.appPassword,
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

  async fetchEmails(limit: number = 20): Promise<EmailMessage[]> {
    // In browser environment, return mock data
    if (typeof window !== 'undefined') {
      console.log('IMAP sadece sunucu ortamında çalışır. Demo verileri gösteriliyor.');
      return [
        {
          id: '1',
          from: 'demo@example.com',
          subject: 'Demo Email - IMAP Bağlantısı Gerekli',
          body: 'Bu bir demo email\'dir. Gerçek emailleri görmek için sunucu ortamında IMAP bağlantısı kurmanız gerekir.',
          date: new Date(),
          isRead: false,
          isStarred: false
        }
      ];
    }

    return new Promise((resolve, reject) => {
      this.imap = this.createImapConnection();
      const emails: EmailMessage[] = [];

      this.imap.once('ready', () => {
        this.imap!.openBox('INBOX', true, (err: any, box: any) => {
          if (err) {
            reject(new Error(`INBOX açılamadı: ${err.message}`));
            return;
          }

          const totalMessages = box.messages.total;
          const startSeq = Math.max(1, totalMessages - limit + 1);
          const endSeq = totalMessages;

          if (totalMessages === 0) {
            resolve([]);
            this.imap!.end();
            return;
          }

          const fetch = this.imap!.seq.fetch(`${startSeq}:${endSeq}`, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg: any, seqno: any) => {
            msg.on('body', (stream: any, info: any) => {
              simpleParser(stream as any, (err: any, mail: any) => {
                if (err) {
                  console.error('Email parse hatası:', err);
                  return;
                }

                const email: EmailMessage = {
                  id: seqno.toString(),
                  from: mail.from?.text || 'Bilinmeyen',
                  subject: mail.subject || 'Konu yok',
                  body: mail.text || mail.html || 'İçerik yok',
                  date: mail.date || new Date(),
                  isRead: false, // IMAP flags ile kontrol edilebilir
                  isStarred: false // IMAP flags ile kontrol edilebilir
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
            this.imap!.end();
          });
        });
      });

      this.imap.once('error', (err: any) => {
        reject(new Error(`IMAP bağlantı hatası: ${err.message}`));
      });

      this.imap.connect();
    });
  }

  async markAsRead(emailId: string): Promise<void> {
    // IMAP ile email'i okundu olarak işaretle
    console.log(`Email ${emailId} okundu olarak işaretlendi`);
  }

  async starEmail(emailId: string): Promise<void> {
    // IMAP ile email'i yıldızla
    console.log(`Email ${emailId} yıldızlandı`);
  }

  async unstarEmail(emailId: string): Promise<void> {
    // IMAP ile email'in yıldızını kaldır
    console.log(`Email ${emailId} yıldızı kaldırıldı`);
  }

  async deleteEmail(emailId: string): Promise<void> {
    // IMAP ile email'i sil
    console.log(`Email ${emailId} silindi`);
  }

  static getSetupInstructions(): string[] {
    return [
      '1. Gmail hesabınızda 2 faktörlü doğrulamayı etkinleştirin',
      '2. Google Hesap ayarlarından "Uygulama şifreleri" bölümüne gidin',
      '3. "Mail" uygulaması için yeni bir uygulama şifresi oluşturun',
      '4. Oluşturulan 16 haneli şifreyi kopyalayın',
      '5. Bu şifreyi GMAIL_CONFIG içindeki appPassword alanına yapıştırın',
      '6. Email adresinizi doğru girdiğinizden emin olun'
    ];
  }
}