import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Container, Box,
  CardMedia, Button, CardActionArea, CardActions, Chip, Avatar
} from '@mui/material';
import { 
  DirectionsCar, Home, LocalHospital, Pets, 
  Security, FlightTakeoff, AccountBalance, Receipt,
  LocalFireDepartment, AccountBalanceWallet,
  SportsEsports, Tv, VideogameAsset, Shop, PhoneAndroid, Apple,
  Games, MovieFilter, Phone, ElectricBolt, LocalGasStation, WaterDrop,
  Payments, Wifi, Router, LiveTv, Speed, Cable,
  CleaningServices, Business, Construction,
  AlarmOn, Apps, LocalShipping
} from '@mui/icons-material';

const Services = () => {
  const RESELLER_ID = "123456";
  const REFID = "54108";
  const BAYI_ID = "54108";
  
  const serviceGroups = [
    // 1. Sigortalar (En önemli finansal hizmetler)
    {
      title: 'Sigortalar',
      icon: <Security fontSize="large" />,
      color: '#4CAF50',
      services: [
        { name: 'Trafik Sigortası', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Kasko', tag: 'Popüler', url: `https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'DASK', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Konut Sigortası', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Eşyam Güvende', tag: 'Yeni', url: `https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', url: `https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Yabancı Sağlık', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/yabanci-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Ferdi Kaza', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/ferdi-kaza-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Güvenli Cüzdan', tag: 'Yeni', url: `https://gelsinteklif.sigortayeri.com/guvenli-cuzdan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Fatura Koruma', tag: 'Avantajlı', url: `https://gelsinteklif.sigortayeri.com/fatura-koruma-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Evcil Hayvan', tag: 'Popüler', url: `https://gelsinteklif.sigortayeri.com/evcil-hayvan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'İlk Ateş', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/teklif-al/ilk-ates-sigortasi?reseller=${RESELLER_ID}` },
        { name: 'Seyahat Sağlık', tag: 'Gerekli', url: `https://gelsinteklif.sigortayeri.com/seyahat-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'IMM Sigortası', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/imm-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
      ]
    },

    // 2. Fatura Ödemeleri (Temel ödemeler)
    {
      title: 'Fatura Ödemeleri',
      icon: <Receipt fontSize="large" />,
      color: '#1976D2',
      services: [
        { name: 'EnerjiSA', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'CK Enerji', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İGDAŞ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'BAŞKENTGAZ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İSKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'ASKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Elektrik', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Doğalgaz', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Su', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` }
      ]
    },

    // 3. İnternet & TV (Abonelik hizmetleri bir arada)
    {
      title: 'İnternet & TV',
      icon: <Router fontSize="large" />,
      color: '#3F51B5',
      services: [
        { name: 'KabloTV + İnternet', tag: 'Combo', url: 'https://www.tumhizmetler.com/turksat-internet-kampanyalari.html' },
        { name: 'D-Smart + İnternet', tag: 'Combo', url: 'https://www.smartabonelik.com.tr/d_smart_kampanyalari.html' },
        { name: 'Digiturk + İnternet', tag: 'Combo', url: 'https://www.digiturkburada.com.tr/digiturk_kampanyalari.html' }
      ]
    },

    // 4. TV & İnternet Başvuru (Abonelik başvuruları bir arada)
    {
      title: 'İnternet Başvuru',
      icon: <Router fontSize="large" />,
      color: '#3F51B5',
      services: [
        { name: 'Superonline', tag: 'Fiber', url: 'https://www.superonlineinternet.com/superonline_kampanyalari.html' },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: 'http://www.onlineabonelik.com/millenicom-kampanyalari.html' },
        { name: 'KabloNET', tag: 'Avantajlı', url: 'https://www.tumhizmetler.com/turksat-internet-kampanyalari.html' },
        { name: 'Extranet', tag: 'Ekonomik', url: 'https://www.tumhizmetler.com/extranet-internet-kampanyalari.html' },
        { name: 'Şoknet', tag: 'Taahhütsüz', url: 'https://www.tumhizmetler.com/soknet-kampanyalari.html' },
        { name: 'D-Smart', tag: 'İnternet', url: `https://www.smartabonelik.com.tr/bayi_online_basvuru.asp?urun=Dsmart&bayiid=${BAYI_ID}` },
        { name: 'Digitürk', tag: 'İnternet', url: `https://www.digiturkburada.com.tr/basvuru?refid=${REFID}` },
        { name: 'Superonline', tag: 'Fiber', url: `https://www.superonlineinternet.com/bayi_online_basvuru.asp?urun=Superonline&bayiid=${BAYI_ID}` },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Doping&bayiid=${BAYI_ID}` },
        { name: 'Göknet', tag: 'Ekonomik', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Goknet&bayiid=${BAYI_ID}` }
      ]
    },

    // 5. GSM Operatörleri (Telefon hizmetleri)
    {
      title: 'GSM Operatörleri',
      icon: <PhoneAndroid fontSize="large" />,
      color: '#F44336',
      services: [
        { name: 'Numara Taşıma', tag: 'Vodafone', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Yeni Hat', tag: 'Vodafone', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Numara Taşıma', tag: 'Turkcell', url: 'https://basvuru.teknokapsul.com/apply/turkcell' },
        { name: 'Yeni Hat', tag: 'Turkcell', url: 'https://basvuru.teknokapsul.com/apply/turkcell' },
        { name: 'Numara Taşıma', tag: 'Türk Telekom', url: 'https://basvuru.teknokapsul.com/apply/turktelekom' },
        { name: 'Yeni Hat', tag: 'Türk Telekom', url: 'https://basvuru.teknokapsul.com/apply/turktelekom' },
      ]
    },

    // 6. Dijital Hizmetler (Tüm dijital içerikler bir arada)
    {
      title: 'Dijital Hizmetler',
      icon: <Tv fontSize="large" />,
      color: '#2196F3',
      services: [
        { name: 'TOD TV', tag: 'Popüler', url: `https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}` },
        { name: 'D-Smart GO', tag: 'Yeni', url: `https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
        { name: 'GAIN', tag: 'Trend', url: `https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
        { name: 'S Sport Plus', tag: 'Spor', url: `https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` },
        { name: 'Valorant', tag: 'En Çok Satan', url: `https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}` },
        { name: 'League of Legends', tag: 'Popüler', url: `https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}` },
        { name: 'PUBG Mobile', tag: 'Trend', url: `https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}` },
        { name: 'Point Blank', tag: 'FPS', url: `https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
        { name: 'Zula', tag: 'Yerli', url: `https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` },
        { name: 'Wolfteam', tag: 'MMO', url: `https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` },
        { name: 'Google Play', tag: 'Android', url: `https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
        { name: 'App Store', tag: 'iOS', url: `https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` },
        { name: 'Razer Gold', tag: 'Oyun', url: `https://www.kodmarketim.com/razer-paketleri-mid-18?refid=${REFID}` },
        { name: 'Gameforge', tag: 'MMO', url: `https://www.kodmarketim.com/gameforge-paketleri-mid-30?refid=${REFID}` },
        { name: 'Garena', tag: 'Çevrimiçi', url: `https://www.kodmarketim.com/garena-paketleri-mid-26?refid=${REFID}` },
        { name: 'Roblox', tag: 'Sandbox', url: `https://www.kodmarketim.com/roblox-paketleri-mid-24?refid=${REFID}` },
        { name: 'BomBom', tag: 'Casual', url: `https://www.kodmarketim.com/bombom-paketleri-mid-35?refid=${REFID}` }
      ]
    },

    // 7. Dijital Oyunlar (Oyun hizmetleri)
    {
      title: 'Dijital Oyunlar',
      icon: <SportsEsports fontSize="large" />,
      color: '#7B1FA2',
      services: [
        { name: 'Valorant', tag: 'En Çok Satan', url: `https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}` },
        { name: 'League of Legends', tag: 'Popüler', url: `https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}` },
        { name: 'PUBG Mobile', tag: 'Trend', url: `https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}` },
        { name: 'Point Blank', tag: 'FPS', url: `https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
        { name: 'Zula', tag: 'Yerli', url: `https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` },
        { name: 'Wolfteam', tag: 'MMO', url: `https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` }
      ]
    },

    // 8. Dijital Marketler (Dijital mağazalar)
    {
      title: 'Dijital Marketler',
      icon: <Shop fontSize="large" />,
      color: '#00796B',
      services: [
        { name: 'Google Play', tag: 'Android', url: `https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
        { name: 'App Store', tag: 'iOS', url: `https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` },
        { name: 'Razer Gold', tag: 'Oyun', url: `https://www.kodmarketim.com/razer-paketleri-mid-18?refid=${REFID}` }
      ]
    },

    // 9. Teknik Servis (Cihaz tamir hizmetleri)
    {
      title: 'Teknik Servis',
      icon: <PhoneAndroid fontSize="large" />,
      color: '#1E88E5',
      services: [
        { name: 'iPhone Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'iPad Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'Apple Watch Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'AirPods Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'Samsung Tamiri', tag: 'Samsung', url: 'https://basvuru.teknokapsul.com/apply/samsung_repair' },
        { name: 'Xiaomi Tamiri', tag: 'Xiaomi', url: 'https://basvuru.teknokapsul.com/apply/xiaomi_repair' },
        { name: 'Huawei Tamiri', tag: 'Huawei', url: 'https://basvuru.teknokapsul.com/apply/huawei_repair' },
        { name: 'OPPO Tamiri', tag: 'OPPO', url: 'https://basvuru.teknokapsul.com/apply/oppo_repair' }
      ]
    },

    // 10. Temizlik & Bakım (Ev/ofis hizmetleri)
    {
      title: 'Temizlik & Bakım',
      icon: <CleaningServices fontSize="large" />,
      color: '#00BCD4',
      services: [
        { name: 'Ev Temizliği', tag: 'Standart', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` },
        { name: 'Ofis Temizliği', tag: 'Kurumsal', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` },
        { name: 'İnşaat Sonrası Temizlik', tag: 'Özel', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` },
        { name: 'Böcek İlaçlama', tag: 'İlaçlama', url: 'https://basvuru.teknokapsul.com/apply/pest_control' }
      ]
    },

    // 11. Nakliyat Hizmetleri (Taşıma hizmetleri)
    {
      title: 'Nakliyat Hizmetleri',
      icon: <LocalShipping fontSize="large" />,
      color: '#009688',
      services: [
        { name: 'Şehirler Arası Nakliyat', tag: 'Ev Taşıma', url: 'https://basvuru.teknokapsul.com/apply/moving' },
        { name: 'Parça Eşya Taşıma', tag: 'Parça Eşya', url: 'https://basvuru.teknokapsul.com/apply/moving' }
      ]
    },

    // 12. E-Hizmetler (Kurumsal dijital hizmetler)
    {
      title: 'E-Hizmetler',
      icon: <Business fontSize="large" />,
      color: '#673AB7',
      services: [
        { name: 'E-İmza Başvurusu', tag: 'Kurumsal', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'KEP Adresi', tag: 'Resmi', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'E-Fatura', tag: 'Ticari', url: 'https://basvuru.teknokapsul.com/apply/e_services' }
      ]
    }
  ];

  const handleServiceClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        mt: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Tüm Hizmetler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tüm hizmetlere tek yerden ulaşın
        </Typography>
      </Box>

      {serviceGroups.map((group, groupIndex) => (
        <Box key={groupIndex} sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3 
          }}>
            <Avatar 
              sx={{ 
                bgcolor: `${group.color}15`,
                width: 56,
                height: 56,
                p: 1
              }}
            >
              {React.cloneElement(group.icon, { sx: { color: group.color } })}
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              {group.title}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {group.services && group.services.map((service, serviceIndex) => (
              <Grid item xs={12} md={6} lg={4} key={serviceIndex}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    onClick={() => handleServiceClick(service.url)}
                    sx={{ 
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Typography variant="subtitle1">
                      {service.name}
                    </Typography>
                    {service.tag && (
                      <Chip 
                        label={service.tag}
                        size="small"
                        sx={{
                          bgcolor: `${group.color}15`,
                          color: group.color,
                          fontWeight: 500
                        }}
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Container>
  );
};

export default Services; 