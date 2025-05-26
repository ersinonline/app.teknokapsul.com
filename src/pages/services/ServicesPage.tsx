import React from 'react';
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
import { Grid, Card, Typography, Container, Box, Avatar, Chip } from '@mui/material';

const Services = () => {
  const RESELLER_ID = "123456";
  const REFID = "54108";
  const BAYI_ID = "54108";
  
  const serviceGroups = [
    // 1. Sigortalar
    {
      title: 'Sigortalar',
      icon: <Security />,
      color: '#4CAF50',
      services: [
        { name: 'Trafik Sigortası', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Kasko', tag: 'Popüler', url: `https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'DASK', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Konut Sigortası', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Eşyam Güvende', tag: 'Yeni', url: `https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', url: `https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Yabancı Sağlık', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/yabanci-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Ferdi Kaza', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/ferdi-kaza-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
      ]
    },

    // 2. Fatura Ödemeleri
    {
      title: 'Fatura Ödemeleri',
      icon: <Receipt />,
      color: '#1976D2',
      services: [
        { name: 'EnerjiSA', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'CK Enerji', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İGDAŞ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'BAŞKENTGAZ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İSKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'ASKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` }
      ]
    },

    // 3. İnternet & TV
    {
      title: 'İnternet & TV',
      icon: <Router />,
      color: '#3F51B5',
      services: [
        { name: 'Superonline', tag: 'Fiber', url: 'https://www.superonlineinternet.com/superonline_kampanyalari.html' },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: 'http://www.onlineabonelik.com/millenicom-kampanyalari.html' },
        { name: 'KabloNET', tag: 'Avantajlı', url: 'https://www.tumhizmetler.com/turksat-internet-kampanyalari.html' },
        { name: 'D-Smart', tag: 'İnternet', url: `https://www.smartabonelik.com.tr/bayi_online_basvuru.asp?urun=Dsmart&bayiid=${BAYI_ID}` },
        { name: 'Digitürk', tag: 'İnternet', url: `https://www.digiturkburada.com.tr/basvuru?refid=${REFID}` }
      ]
    },

    // 4. GSM Operatörleri
    {
      title: 'GSM Operatörleri',
      icon: <PhoneAndroid />,
      color: '#F44336',
      services: [
        { name: 'Numara Taşıma', tag: 'Vodafone', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Yeni Hat', tag: 'Vodafone', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Numara Taşıma', tag: 'Turkcell', url: 'https://basvuru.teknokapsul.com/apply/turkcell' },
        { name: 'Yeni Hat', tag: 'Turkcell', url: 'https://basvuru.teknokapsul.com/apply/turkcell' }
      ]
    },

    // 5. Dijital Hizmetler
    {
      title: 'Dijital Hizmetler',
      icon: <Tv />,
      color: '#2196F3',
      services: [
        { name: 'TOD TV', tag: 'Popüler', url: `https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}` },
        { name: 'D-Smart GO', tag: 'Yeni', url: `https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
        { name: 'GAIN', tag: 'Trend', url: `https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
        { name: 'S Sport Plus', tag: 'Spor', url: `https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` }
      ]
    }
  ];

  const handleServiceClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Tüm Hizmetler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          İhtiyacınız olan tüm hizmetlere tek yerden ulaşın
        </Typography>
      </Box>

      {serviceGroups.map((group, groupIndex) => (
        <Box key={groupIndex} sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3,
            scrollMarginTop: '80px'
          }}>
            <Avatar 
              sx={{ 
                bgcolor: `${group.color}15`,
                width: 56,
                height: 56,
                p: 1
              }}
            >
              {group.icon}
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              {group.title}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {group.services && group.services.map((service, serviceIndex) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={serviceIndex}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleServiceClick(service.url)}
                >
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {service.name}
                      </Typography>
                      {service.tag && (
                        <Chip 
                          label={service.tag}
                          size="small"
                          sx={{
                            bgcolor: `${group.color}15`,
                            color: group.color,
                            fontWeight: 500,
                            ml: 1
                          }}
                        />
                      )}
                    </Box>
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