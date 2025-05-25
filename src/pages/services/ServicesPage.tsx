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
    // Service groups data as provided...
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