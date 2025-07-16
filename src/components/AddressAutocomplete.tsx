import React, { useRef, useEffect, useState } from 'react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    fullAddress: string;
    city: string;
    district: string;
    postalCode?: string;
  }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Adres ara...",
  value = "",
  onChange,
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (!inputRef.current) return;

    // Google Places API'nin yüklenip yüklenmediğini kontrol et
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.warn('Google Places API yüklenmemiş');
      return;
    }

    // Autocomplete instance oluştur
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'TR' }, // Sadece Türkiye
      fields: ['address_components', 'formatted_address', 'geometry']
    });

    // Place seçildiğinde çalışacak listener
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.address_components) return;

      let city = '';
      let district = '';
      let postalCode = '';
      let route = '';
      let streetNumber = '';

      // Adres bileşenlerini parse et
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('administrative_area_level_1')) {
          city = component.long_name; // İl
        } else if (types.includes('administrative_area_level_2')) {
          district = component.long_name; // İlçe
        } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          // Eğer ilçe bulunamadıysa, mahalle/semt bilgisini ilçe olarak kullan
          if (!district) {
            district = component.long_name;
          }
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
      });

      // Tam adresi oluştur
      let fullAddress = place.formatted_address || '';
      
      // Eğer sokak numarası ve sokak adı varsa, bunları birleştir
      if (streetNumber && route) {
        fullAddress = `${route} No: ${streetNumber}`;
      } else if (route) {
        fullAddress = route;
      }

      // İlçe bilgisi yoksa, şehir bilgisini ilçe olarak kullan (Google API bazen karıştırıyor)
      if (!district && city) {
        // Türkiye'deki büyük şehirler için merkez ilçe isimleri
        const centerDistricts: { [key: string]: string } = {
          'İstanbul': 'Fatih',
          'Ankara': 'Çankaya',
          'İzmir': 'Konak',
          'Bursa': 'Osmangazi',
          'Antalya': 'Muratpaşa',
          'Adana': 'Seyhan',
          'Konya': 'Selçuklu',
          'Gaziantep': 'Şahinbey',
          'Kayseri': 'Melikgazi'
        };
        
        district = centerDistricts[city] || city;
      }

      setInputValue(fullAddress);
      
      onAddressSelect({
        fullAddress,
        city,
        district,
        postalCode
      });
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onAddressSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
};

export default AddressAutocomplete;