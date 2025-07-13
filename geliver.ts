import axios from 'axios';

const GELIVER_API_URL = 'https://api.geliver.io/api/v1';
const API_KEY = '861b4a6b-a0e3-40f2-9c3d-dc2387814c22';
const ORG_ID = 'f309a7e1-2c91-43fe-b5a5-da2f65d4f020';

const geliverApi = axios.create({
  baseURL: GELIVER_API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'X-Organization-ID': ORG_ID
  }
});

// Şehir kodları
const cityCodeMap: { [key: string]: string } = {
  'Adana': '01', 'Adıyaman': '02', 'Afyonkarahisar': '03', 'Ağrı': '04', 'Amasya': '05',
  'Ankara': '06', 'Antalya': '07', 'Artvin': '08', 'Aydın': '09', 'Balıkesir': '10',
  'Bilecik': '11', 'Bingöl': '12', 'Bitlis': '13', 'Bolu': '14', 'Burdur': '15',
  'Bursa': '16', 'Çanakkale': '17', 'Çankırı': '18', 'Çorum': '19', 'Denizli': '20',
  'Diyarbakır': '21', 'Edirne': '22', 'Elazığ': '23', 'Erzincan': '24', 'Erzurum': '25',
  'Eskişehir': '26', 'Gaziantep': '27', 'Giresun': '28', 'Gümüşhane': '29', 'Hakkari': '30',
  'Hatay': '31', 'Isparta': '32', 'Mersin': '33', 'İstanbul': '34', 'İzmir': '35',
  'Kars': '36', 'Kastamonu': '37', 'Kayseri': '38', 'Kırklareli': '39', 'Kırşehir': '40',
  'Kocaeli': '41', 'Konya': '42', 'Kütahya': '43', 'Malatya': '44', 'Manisa': '45',
  'Kahramanmaraş': '46', 'Mardin': '47', 'Muğla': '48', 'Muş': '49', 'Nevşehir': '50',
  'Niğde': '51', 'Ordu': '52', 'Rize': '53', 'Sakarya': '54', 'Samsun': '55',
  'Siirt': '56', 'Sinop': '57', 'Sivas': '58', 'Tekirdağ': '59', 'Tokat': '60',
  'Trabzon': '61', 'Tunceli': '62', 'Şanlıurfa': '63', 'Uşak': '64', 'Van': '65',
  'Yozgat': '66', 'Zonguldak': '67', 'Aksaray': '68', 'Bayburt': '69', 'Karaman': '70',
  'Kırıkkale': '71', 'Batman': '72', 'Şırnak': '73', 'Bartın': '74', 'Ardahan': '75',
  'Iğdır': '76', 'Yalova': '77', 'Karabük': '78', 'Kilis': '79', 'Osmaniye': '80',
  'Düzce': '81'
};

const SENDER_ADDRESS_ID = '97085457-feb5-4616-b04c-5ef7f9e360e4';
const RETURN_ADDRESS_ID = '97085457-feb5-4616-b04c-5ef7f9e360e4';

export const syncOrder = async (order: any) => {
  try {
    const cityCode = cityCodeMap[order.shippingAddress?.city] || '34'; // Default to Istanbul if city not found

    const payload = {
      test: false,
      senderAddressID: SENDER_ADDRESS_ID,
      returnAddressID: RETURN_ADDRESS_ID,
      length: "10",
      height: "10",
      width: "10",
      distanceUnit: "cm",
      weight: "1",
      massUnit: "kg",
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        title: item.name,
        quantity: item.quantity
      })) : [],
      recipientAddress: {
        name: order.shippingAddress?.fullName,
        email: order.shippingAddress?.email,
        phone: order.shippingAddress?.phone,
        address1: order.shippingAddress?.address,
        countryCode: "TR",
        cityCode: cityCode,
        districtName: order.shippingAddress?.district,
        zip: order.shippingAddress?.postalCode
      },
      productPaymentOnDelivery: false,
      order: {
        sourceCode: "API",
        sourceIdentifier: "https://magazaadresiniz.com",
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        totalAmountCurrency: "TL"
      }
    };

    const response = await geliverApi.post('/shipments', payload);
    return response.data;
  } catch (error) {
    let msg = '';
    if (axios.isAxiosError(error)) {
      msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    } else if (error instanceof Error) {
      msg = error.message;
    } else {
      msg = String(error);
    }
    console.error('Geliver.io API error:', msg);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await geliverApi.patch(`/orders/${orderId}`, {
      status
    });
    return response.data;
  } catch (error) {
    console.error('Geliver.io API error:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (orderId: string, isPaid: boolean) => {
  try {
    const response = await geliverApi.patch(`/orders/${orderId}`, {
      isPaid
    });
    return response.data;
  } catch (error) {
    console.error('Geliver.io API error:', error);
    throw error;
  }
};

export const createShipment = async (order: any) => {
  try {
    const cityCode = cityCodeMap[order.customerInfo?.city] || '34'; // Default to Istanbul if city not found

    const payload = {
      test: false,
      senderAddressID: SENDER_ADDRESS_ID,
      returnAddressID: RETURN_ADDRESS_ID,
      recipientAddress: {
        name: order.customerInfo?.fullName,
        email: order.customerInfo?.email,
        phone: order.customerInfo?.phone,
        address1: order.customerInfo?.address,
        countryCode: "TR",
        cityCode: cityCode,
        districtName: order.customerInfo?.district,
        zip: order.customerInfo?.postalCode
      },
      length: "10",
      height: "10",
      width: "10",
      distanceUnit: "cm",
      weight: "1",
      massUnit: "kg",
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        title: item.name,
        quantity: item.quantity
      })) : [],
      productPaymentOnDelivery: false,
      order: {
        sourceCode: "API",
        sourceIdentifier: "https://magazaadresiniz.com",
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        totalAmountCurrency: "TL"
      }
    };

    const response = await geliverApi.post('/shipments', payload);
    return response.data;
  } catch (error) {
    let msg = '';
    if (axios.isAxiosError(error)) {
      msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    } else if (error instanceof Error) {
      msg = error.message;
    } else {
      msg = String(error);
    }
    console.error('Geliver.io API error:', msg);
    throw error;
  }
};

export const getShippingQuote = async ({
  fullName,
  email,
  phone,
  address,
  city,
  district,
  postalCode,
  items = [],
  length = 10,
  width = 10,
  height = 10,
  distanceUnit = 'cm',
  massUnit = 'kg',
}: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  items?: any[];
  length?: number;
  width?: number;
  height?: number;
  distanceUnit?: string;
  massUnit?: string;
}) => {
  try {
    // Get city code from map
    const cityCode = cityCodeMap[city] || '34'; // Default to Istanbul if city not found

    // Telefon numarasını uluslararası formata çevir
    let formattedPhone = phone?.trim() || '';
    if (!formattedPhone.startsWith('+')) {
      // Eğer numara 0 ile başlıyorsa, 0'ı kaldır
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      // Türkiye için +90 ekle
      formattedPhone = '+90' + formattedPhone;
    }

    // Her kitap için ağırlık 0.5 kg olacak şekilde toplam ağırlığı hesapla
    const safeItems = Array.isArray(items) ? items : [];
    const totalBookCount = safeItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalWeight = (totalBookCount * 0.5).toString(); // kg cinsinden

    const payload = {
      test: false,
      senderAddressID: SENDER_ADDRESS_ID,
      returnAddressID: RETURN_ADDRESS_ID,
      length: String(length),
      height: String(height),
      width: String(width),
      distanceUnit,
      weight: totalWeight,
      massUnit,
      items: safeItems.map(item => ({
        title: item.name,
        quantity: item.quantity
      })),
      recipientAddress: {
        name: fullName,
        email: email,
        phone: formattedPhone,
        address1: address,
        countryCode: "TR",
        cityCode: cityCode,
        districtName: district,
        zip: postalCode
      },
      productPaymentOnDelivery: false,
    };

    console.log('Geliver API Request Payload:', JSON.stringify(payload, null, 2));
    
    const response = await geliverApi.post('/shipments', payload);
    
    console.log('Geliver API Response:', JSON.stringify(response.data, null, 2));

    const offersList = response.data?.data?.offers?.list;
    const offersArr = response.data?.data?.offers?.offers;
    const cheapest = response.data?.data?.offers?.cheapest;

    if (Array.isArray(offersList) && offersList.length > 0) {
      return offersList.map((offer: any) => ({
        price: parseFloat(offer.totalAmount) || 0,
        company: offer.providerCode || 'Bilinmeyen Kargo',
        service: offer.providerServiceCode || 'Standart Teslimat',
        deliveryTime: offer.averageEstimatedTimeHumanReadible || offer.estimatedDeliveryTime || '2-3 iş günü'
      }));
    } else if (Array.isArray(offersArr) && offersArr.length > 0) {
      return offersArr.map((offer: any) => ({
        price: parseFloat(offer.totalAmount) || 0,
        company: offer.providerCode || 'Bilinmeyen Kargo',
        service: offer.providerServiceCode || 'Standart Teslimat',
        deliveryTime: offer.estimatedDeliveryTime || '2-3 iş günü'
      }));
    } else if (cheapest) {
      return [{
        price: parseFloat(cheapest.totalAmount) || 0,
        company: cheapest.providerCode || 'Bilinmeyen Kargo',
        service: cheapest.providerServiceCode || 'Standart Teslimat',
        deliveryTime: cheapest.averageEstimatedTimeHumanReadible || cheapest.estimatedDeliveryTime || '2-3 iş günü'
      }];
    } else {
      console.error('Geliver API yanıtında kargo teklifleri bulunamadı:', response.data);
      throw new Error('Kargo fiyatı alınamadı: API yanıtı geçersiz');
    }
  } catch (error) {
    let msg = '';
    if (axios.isAxiosError(error)) {
      msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error('Geliver API Error Response:', error.response?.data);
    } else if (error instanceof Error) {
      msg = error.message;
    } else {
      msg = String(error);
    }
    console.error('Geliver.io Quote API error:', msg);
    throw error;
  }
};