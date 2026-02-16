import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import axios from "axios";

// Iyzico API credentials
const IYZICO_API_KEY = functions.config().iyzico?.api_key || "kgvpLKB9EUfzNV64Y40a2wV0JijXbSEK";
const IYZICO_SECRET_KEY = functions.config().iyzico?.secret_key || "Qb1HcmeZEnSjIygCtVASbpUpiMrXrIPb";
const IYZICO_BASE_URL = functions.config().iyzico?.base_url || "https://sandbox-api.iyzipay.com";

// Iyzico PKI string oluştur (resmi format)
function toPkiString(obj: any): string {
  let result = "[";
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      result += `${key}=[`;
      for (let j = 0; j < value.length; j++) {
        if (typeof value[j] === "object") {
          result += toPkiString(value[j]);
        } else {
          result += String(value[j]);
        }
        if (j < value.length - 1) result += ", ";
      }
      result += "]";
    } else if (typeof value === "object") {
      result += `${key}=${toPkiString(value)}`;
    } else {
      result += `${key}=${value}`;
    }
    if (i < keys.length - 1) result += ",";
  }
  result += "]";
  return result;
}

// Iyzico v1 auth header (SHA-1)
function iyzicoHeaders(requestBody: any): Record<string, string> {
  const pkiString = toPkiString(requestBody);
  const randomHeaderValue = Date.now().toString() + Math.random().toString(36).substring(2, 7);
  const shaSum = crypto.createHash("sha1");
  shaSum.update(IYZICO_API_KEY + randomHeaderValue + IYZICO_SECRET_KEY + pkiString, "utf8");
  const hashValue = shaSum.digest("base64");

  return {
    "Content-Type": "application/json",
    "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashValue}`,
    "x-iyzi-rnd": randomHeaderValue,
    "x-iyzi-client-version": "iyzipay-node-2.0.56",
  };
}

// Checkout Form Başlat
export const iyzicoCheckoutInitialize = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Giriş yapmanız gerekiyor.");
  }

  const {
    productId,
    productName,
    productCategory,
    price,
    buyerName,
    buyerSurname,
    buyerEmail,
    buyerPhone,
    callbackUrl,
  } = data;

  const uid = context.auth.uid;
  const conversationId = `${uid}-${Date.now()}`;
  const basketId = `B-${Date.now()}`;

  const requestBody: any = {
    locale: "tr",
    conversationId,
    price: parseFloat(price).toFixed(2),
    paidPrice: parseFloat(price).toFixed(2),
    currency: "TRY",
    basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: callbackUrl || "https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc",
    enabledInstallments: [1],
    buyer: {
      id: uid,
      name: buyerName || "Kullanıcı",
      surname: buyerSurname || "TeknoKapsül",
      gsmNumber: buyerPhone || "+905000000000",
      email: buyerEmail,
      identityNumber: "11111111111",
      registrationAddress: "İstanbul, Türkiye",
      ip: "85.34.78.112",
      city: "Istanbul",
      country: "Turkey",
    },
    shippingAddress: {
      contactName: `${buyerName || "Kullanıcı"} ${buyerSurname || "TeknoKapsül"}`,
      city: "Istanbul",
      country: "Turkey",
      address: "İstanbul, Türkiye",
    },
    billingAddress: {
      contactName: `${buyerName || "Kullanıcı"} ${buyerSurname || "TeknoKapsül"}`,
      city: "Istanbul",
      country: "Turkey",
      address: "İstanbul, Türkiye",
    },
    basketItems: [
      {
        id: productId,
        name: productName,
        category1: productCategory || "Dijital Ürün",
        itemType: "VIRTUAL",
        price: parseFloat(price).toFixed(2),
      },
    ],
  };

  try {
    const headers = iyzicoHeaders(requestBody);
    const response = await axios.post(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
      requestBody,
      { headers }
    );

    if (response.data.status === "success") {
      // Token'ı Firestore'a kaydet (doğrulama için)
      await admin.firestore().collection("iyzico_payments").doc(conversationId).set({
        uid,
        productId,
        productName,
        price: parseFloat(price),
        token: response.data.token,
        status: "initialized",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        status: "success",
        token: response.data.token,
        checkoutFormContent: response.data.checkoutFormContent,
        paymentPageUrl: response.data.paymentPageUrl,
        conversationId,
      };
    } else {
      console.error("Iyzico error:", response.data);
      throw new functions.https.HttpsError(
        "internal",
        response.data.errorMessage || "Ödeme başlatılamadı."
      );
    }
  } catch (error: any) {
    console.error("Iyzico checkout init error:", error.response?.data || error.message);
    throw new functions.https.HttpsError(
      "internal",
      error.response?.data?.errorMessage || "Ödeme başlatılırken bir hata oluştu."
    );
  }
});

// Ödeme Sonucu Doğrula
export const iyzicoCheckoutVerify = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Giriş yapmanız gerekiyor.");
  }

  const { token } = data;
  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "Token gerekli.");
  }

  const requestBody: any = {
    locale: "tr",
    conversationId: `verify-${Date.now()}`,
    token,
  };

  try {
    const headers = iyzicoHeaders(requestBody);
    const response = await axios.post(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      requestBody,
      { headers }
    );

    const paymentStatus = response.data.paymentStatus;
    const isSuccess = response.data.status === "success" && paymentStatus === "SUCCESS";

    // Firestore'daki kaydı güncelle
    const paymentsSnap = await admin.firestore()
      .collection("iyzico_payments")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (!paymentsSnap.empty) {
      const paymentDoc = paymentsSnap.docs[0];
      await paymentDoc.ref.update({
        status: isSuccess ? "completed" : "failed",
        paymentId: response.data.paymentId || null,
        paymentStatus,
        iyzicoResponse: JSON.stringify(response.data),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      status: isSuccess ? "success" : "failure",
      paymentId: response.data.paymentId,
      paymentStatus,
      errorMessage: response.data.errorMessage,
    };
  } catch (error: any) {
    console.error("Iyzico verify error:", error.response?.data || error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Ödeme doğrulanırken bir hata oluştu."
    );
  }
});

// Callback endpoint (Iyzico'nun POST ile çağıracağı)
export const iyzicoCallback = functions.https.onRequest(async (req, res) => {
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
    // Token ile ödeme durumunu sorgula
    const requestBody: any = {
      locale: "tr",
      conversationId: `callback-${Date.now()}`,
      token,
    };

    const headers = iyzicoHeaders(requestBody);
    const response = await axios.post(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      requestBody,
      { headers }
    );

    const isSuccess = response.data.status === "success" && response.data.paymentStatus === "SUCCESS";

    // Firestore güncelle
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
        paymentId: response.data.paymentId || null,
        paymentStatus: response.data.paymentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Başarılı ödeme ise dijital sipariş oluştur
      if (isSuccess && paymentData.uid && paymentData.productId) {
        await admin.firestore().collection("teknokapsul").doc(paymentData.uid)
          .collection("digitalOrders").add({
            productId: paymentData.productId,
            productName: paymentData.productName,
            price: paymentData.price,
            status: "completed",
            paymentId: response.data.paymentId,
            paymentMethod: "iyzico",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    }

    // Kullanıcıyı sonuç sayfasına yönlendir
    const redirectUrl = isSuccess
      ? `https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=success&token=${token}`
      : `https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=fail&token=${token}`;

    res.redirect(303, redirectUrl);
  } catch (error) {
    console.error("Iyzico callback error:", error);
    res.redirect(303, "https://app.teknokapsul.info/dijital-kodlar/odeme-sonuc?status=error");
  }
});
