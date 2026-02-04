"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpenseReminder = exports.sendPaymentPlanEmail = void 0;
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
// Gmail SMTP transporter oluştur
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: functions.config().gmail.user, // Gmail adresi
            pass: functions.config().gmail.password // Gmail app password
        }
    });
};
// Email gönderme fonksiyonu
exports.sendPaymentPlanEmail = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // Kullanıcı doğrulaması
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı doğrulaması gerekli');
    }
    const { to, planData } = data;
    if (!to || !planData) {
        throw new functions.https.HttpsError('invalid-argument', 'Email adresi ve plan verisi gerekli');
    }
    try {
        const transporter = createTransporter();
        // Email içeriği oluştur
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ffb700; text-align: center;">TeknoKapsül - Ödeme Planı</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px;">${planData.name}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Ev Fiyatı:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(planData.housePrice)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Toplam Peşinat:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(planData.totalDownPayment)}</td>
            </tr>
            ${planData.housingCredit ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Konut Kredisi:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(planData.housingCredit.amount)} (${planData.housingCredit.term} ay)</td>
            </tr>
            ` : ''}
            ${planData.personalCredits && planData.personalCredits.length > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>İhtiyaç Kredileri:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${planData.personalCredits.length} adet</td>
            </tr>
            ` : ''}
            <tr style="background-color: #ffb700; color: white;">
              <td style="padding: 12px 8px; font-weight: bold;"><strong>Aylık Toplam Ödeme:</strong></td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold;">${formatCurrency(planData.totalMonthlyPayment)}</td>
            </tr>
          </table>
          
          ${planData.additionalExpenses ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #333; margin-bottom: 10px;">Ek Masraflar:</h4>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 4px 0;">• Tapu Masrafı: ${formatCurrency((_b = (_a = planData.additionalExpenses.titleDeedFee) !== null && _a !== void 0 ? _a : planData.additionalExpenses.titleDeed) !== null && _b !== void 0 ? _b : 0)}</li>
              <li style="padding: 4px 0;">• Kredi Tahsis Ücreti: ${formatCurrency((_d = (_c = planData.additionalExpenses.loanAllocationFee) !== null && _c !== void 0 ? _c : planData.additionalExpenses.creditAllocation) !== null && _d !== void 0 ? _d : 0)}</li>
              <li style="padding: 4px 0;">• Ekspertiz Ücreti: ${formatCurrency((_f = (_e = planData.additionalExpenses.appraisalFee) !== null && _e !== void 0 ? _e : planData.additionalExpenses.appraisal) !== null && _f !== void 0 ? _f : 0)}</li>
              <li style="padding: 4px 0;">• İpotek Tesis Ücreti: ${formatCurrency((_h = (_g = planData.additionalExpenses.mortgageEstablishmentFee) !== null && _g !== void 0 ? _g : planData.additionalExpenses.mortgageEstablishment) !== null && _h !== void 0 ? _h : 0)}</li>
              <li style="padding: 4px 0;">• DASK Sigorta Primi: ${formatCurrency((_k = (_j = planData.additionalExpenses.daskInsurancePremium) !== null && _j !== void 0 ? _j : planData.additionalExpenses.daskInsurance) !== null && _k !== void 0 ? _k : 0)}/yıl</li>
              <li style="padding: 4px 0;">• Döner Sermaye Bedeli: ${formatCurrency((_l = planData.additionalExpenses.revolvingFundFee) !== null && _l !== void 0 ? _l : 0)}</li>
              ${Array.isArray(planData.additionalExpenses.customExpenses) ? planData.additionalExpenses.customExpenses.map((item) => {
            var _a;
            return `
                <li style="padding: 4px 0;">• ${item.description}: ${formatCurrency((_a = item.amount) !== null && _a !== void 0 ? _a : 0)}</li>
              `;
        }).join('') : ''}
            </ul>
            <p style="font-weight: bold; margin-top: 10px;">Toplam Ek Masraf: ${formatCurrency((_m = planData.additionalExpenses.total) !== null && _m !== void 0 ? _m : 0)}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">
          <p style="margin: 0; color: #666;">Plan Tarihi: ${new Date(planData.createdAt).toLocaleDateString('tr-TR')}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Bu plan TeknoKapsül uygulaması ile oluşturulmuştur.</p>
        </div>
      </div>
    `;
        // Email gönder
        const mailOptions = {
            from: functions.config().email.user,
            to: to,
            subject: `TeknoKapsül - Ödeme Planı: ${planData.name}`,
            html: emailContent
        };
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Email başarıyla gönderildi' };
    }
    catch (error) {
        console.error('Email gönderme hatası:', error);
        throw new functions.https.HttpsError('internal', 'Email gönderilirken hata oluştu');
    }
});
// Para formatı fonksiyonu
function formatCurrency(amount) {
    return amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' TL';
}
// Gider hatırlatma email gönderme fonksiyonu
const sendExpenseReminder = async (data) => {
    try {
        const transporter = createTransporter();
        // Email içeriği oluştur
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ffb700; text-align: center;">TeknoKapsül - Gider Hatırlatması</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Merhaba ${data.to_name},</h3>
          <p style="color: #666; line-height: 1.6;">
            <strong>${data.expense_title}</strong> adlı giderinizin ödeme tarihi yaklaşıyor.
          </p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffb700;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Gider Detayları:</h4>
            <p style="margin: 5px 0;"><strong>Gider Adı:</strong> ${data.expense_title}</p>
            <p style="margin: 5px 0;"><strong>Tutar:</strong> ${data.expense_amount}</p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> ${data.expense_category}</p>
            <p style="margin: 5px 0;"><strong>Ödeme Tarihi:</strong> ${data.expense_due_date}</p>
            <p style="margin: 5px 0; color: #e74c3c;"><strong>Kalan Süre:</strong> ${data.days_until_due} gün</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Lütfen ödeme tarihinizi kaçırmayın. TeknoKapsül uygulamasına giriş yaparak giderinizi ödendi olarak işaretleyebilirsiniz.
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              Bu hatırlatma TeknoKapsül uygulaması tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        </div>
      </div>
    `;
        // Email gönder
        const mailOptions = {
            from: functions.config().gmail.user,
            to: data.to_email,
            subject: `TeknoKapsül - Gider Hatırlatması: ${data.expense_title}`,
            html: emailContent
        };
        await transporter.sendMail(mailOptions);
        console.log(`Expense reminder sent successfully to ${data.to_email} for expense: ${data.expense_title}`);
    }
    catch (error) {
        console.error('Expense reminder email error:', error);
        throw error;
    }
};
exports.sendExpenseReminder = sendExpenseReminder;
//# sourceMappingURL=emailService.js.map