"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.iyzicoCallback = exports.iyzicoCheckoutVerify = exports.iyzicoCheckoutInitialize = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require("iyzipay");
// Iyzico API credentials
const iyzipay = new Iyzipay({
    apiKey: ((_a = functions.config().iyzico) === null || _a === void 0 ? void 0 : _a.api_key) || "kgvpLKB9EUfzNV64Y40a2wV0JijXbSEK",
    secretKey: ((_b = functions.config().iyzico) === null || _b === void 0 ? void 0 : _b.secret_key) || "Qb1HcmeZEnSjIygCtVASbpUpiMrXrIPb",
    uri: ((_c = functions.config().iyzico) === null || _c === void 0 ? void 0 : _c.base_url) || "https://sandbox-api.iyzipay.com",
});
// Promise wrapper for iyzipay SDK callbacks
function initializeCheckoutForm(request) {
    return new Promise((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(request, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}
function retrieveCheckoutForm(request) {
    return new Promise((resolve, reject) => {
        iyzipay.checkoutForm.retrieve(request, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}
// Checkout Form Başlat
exports.iyzicoCheckoutInitialize = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Giriş yapmanız gerekiyor.");
    }
    const { productId, productName, productCategory, price, buyerName, buyerSurname, buyerEmail, buyerPhone, callbackUrl, } = data;
    const uid = context.auth.uid;
    const conversationId = `${uid}-${Date.now()}`;
    const basketId = `B-${Date.now()}`;
    const priceStr = parseFloat(price).toFixed(1);
    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        price: priceStr,
        paidPrice: priceStr,
        currency: Iyzipay.CURRENCY.TRY,
        basketId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: callbackUrl || "https://us-central1-superapp-37db4.cloudfunctions.net/iyzicoCallback",
        enabledInstallments: [1],
        buyer: {
            id: uid,
            name: buyerName || "Kullanici",
            surname: buyerSurname || "TeknoKapsul",
            gsmNumber: buyerPhone || "+905000000000",
            email: buyerEmail || "test@test.com",
            identityNumber: "11111111111",
            registrationAddress: "Istanbul, Turkiye",
            ip: "85.34.78.112",
            city: "Istanbul",
            country: "Turkey",
        },
        shippingAddress: {
            contactName: `${buyerName || "Kullanici"} ${buyerSurname || "TeknoKapsul"}`,
            city: "Istanbul",
            country: "Turkey",
            address: "Istanbul, Turkiye",
        },
        billingAddress: {
            contactName: `${buyerName || "Kullanici"} ${buyerSurname || "TeknoKapsul"}`,
            city: "Istanbul",
            country: "Turkey",
            address: "Istanbul, Turkiye",
        },
        basketItems: [
            {
                id: productId || "PROD1",
                name: productName || "Dijital Urun",
                category1: productCategory || "Dijital",
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: priceStr,
            },
        ],
    };
    try {
        console.log("Iyzico request:", JSON.stringify(request));
        const result = await initializeCheckoutForm(request);
        console.log("Iyzico response status:", result.status);
        if (result.status === "success") {
            await admin.firestore().collection("iyzico_payments").doc(conversationId).set({
                uid,
                productId,
                productName,
                price: parseFloat(price),
                token: result.token,
                status: "initialized",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                status: "success",
                token: result.token,
                checkoutFormContent: result.checkoutFormContent,
                paymentPageUrl: result.paymentPageUrl,
                conversationId,
            };
        }
        else {
            console.error("Iyzico error:", result);
            throw new functions.https.HttpsError("internal", result.errorMessage || "Odeme baslatilamadi.");
        }
    }
    catch (error) {
        console.error("Iyzico checkout init error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Odeme baslatilirken bir hata olustu.");
    }
});
// Ödeme Sonucu Doğrula
exports.iyzicoCheckoutVerify = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Giris yapmaniz gerekiyor.");
    }
    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError("invalid-argument", "Token gerekli.");
    }
    try {
        const result = await retrieveCheckoutForm({ locale: Iyzipay.LOCALE.TR, token });
        const paymentStatus = result.paymentStatus;
        const isSuccess = result.status === "success" && paymentStatus === "SUCCESS";
        const paymentsSnap = await admin.firestore()
            .collection("iyzico_payments")
            .where("token", "==", token)
            .limit(1)
            .get();
        if (!paymentsSnap.empty) {
            const paymentDoc = paymentsSnap.docs[0];
            await paymentDoc.ref.update({
                status: isSuccess ? "completed" : "failed",
                paymentId: result.paymentId || null,
                paymentStatus,
                iyzicoResponse: JSON.stringify(result),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return {
            status: isSuccess ? "success" : "failure",
            paymentId: result.paymentId,
            paymentStatus,
            errorMessage: result.errorMessage,
        };
    }
    catch (error) {
        console.error("Iyzico verify error:", error);
        throw new functions.https.HttpsError("internal", "Odeme dogrulanirken bir hata olustu.");
    }
});
// Callback endpoint (Iyzico'nun POST ile çağıracağı)
exports.iyzicoCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    const { token } = req.body;
    if (!token) {
        res.status(400).send("Token gerekli");
        return;
    }
    try {
        const result = await retrieveCheckoutForm({ locale: Iyzipay.LOCALE.TR, token });
        const isSuccess = result.status === "success" && result.paymentStatus === "SUCCESS";
        const paymentsSnap = await admin.firestore()
            .collection("iyzico_payments")
            .where("token", "==", token)
            .limit(1)
            .get();
        if (!paymentsSnap.empty) {
            const paymentDoc = paymentsSnap.docs[0];
            const paymentData = paymentDoc.data();
            await paymentDoc.ref.update({
                status: isSuccess ? "completed" : "failed",
                paymentId: result.paymentId || null,
                paymentStatus: result.paymentStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            if (isSuccess && paymentData.uid && paymentData.productId) {
                await admin.firestore().collection("teknokapsul").doc(paymentData.uid)
                    .collection("digitalOrders").add({
                    productId: paymentData.productId,
                    productName: paymentData.productName,
                    price: paymentData.price,
                    status: "completed",
                    paymentId: result.paymentId,
                    paymentMethod: "iyzico",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
        const redirectUrl = isSuccess
            ? `https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=success&token=${token}`
            : `https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=fail&token=${token}`;
        res.redirect(303, redirectUrl);
    }
    catch (error) {
        console.error("Iyzico callback error:", error);
        res.redirect(303, "https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=error");
    }
});
//# sourceMappingURL=iyzico.js.map