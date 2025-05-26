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
    // Hizmet grupları burada...
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
            scrollMarginTop: '80px', // Sayfa ortasından başlama için offset
            id: group.title.toLowerCase().replace(/\s+/g, '-')
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
              <Grid item xs={12} sm={6} md={4} lg={3} key={serviceIndex}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleServiceClick(service.url)}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '100%'
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
                  </CardActionArea>
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