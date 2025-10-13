/**
 * Countries and Regions Data
 * Based on ISO 3166-1 Alpha-2 country codes and UN regional classifications
 * Includes flag icon support using react-country-flag package
 */

import React from 'react';
import ReactCountryFlag from 'react-country-flag';

export const REGIONS = {
  north_america: {
    name: "North America",
    countries: [
      { code: "AG", name: "Antigua and Barbuda" },
      { code: "BS", name: "Bahamas" },
      { code: "BB", name: "Barbados" },
      { code: "BZ", name: "Belize" },
      { code: "CA", name: "Canada" },
      { code: "CR", name: "Costa Rica" },
      { code: "CU", name: "Cuba" },
      { code: "DM", name: "Dominica" },
      { code: "DO", name: "Dominican Republic" },
      { code: "SV", name: "El Salvador" },
      { code: "GD", name: "Grenada" },
      { code: "GT", name: "Guatemala" },
      { code: "HT", name: "Haiti" },
      { code: "HN", name: "Honduras" },
      { code: "JM", name: "Jamaica" },
      { code: "MX", name: "Mexico" },
      { code: "NI", name: "Nicaragua" },
      { code: "PA", name: "Panama" },
      { code: "KN", name: "Saint Kitts and Nevis" },
      { code: "LC", name: "Saint Lucia" },
      { code: "VC", name: "Saint Vincent and the Grenadines" },
      { code: "TT", name: "Trinidad and Tobago" },
      { code: "US", name: "United States" }
    ]
  },
  south_america: {
    name: "South America",
    countries: [
      { code: "AR", name: "Argentina" },
      { code: "BO", name: "Bolivia" },
      { code: "BR", name: "Brazil" },
      { code: "CL", name: "Chile" },
      { code: "CO", name: "Colombia" },
      { code: "EC", name: "Ecuador" },
      { code: "GY", name: "Guyana" },
      { code: "PY", name: "Paraguay" },
      { code: "PE", name: "Peru" },
      { code: "SR", name: "Suriname" },
      { code: "UY", name: "Uruguay" },
      { code: "VE", name: "Venezuela" }
    ]
  },
  europe: {
    name: "Europe",
    countries: [
      { code: "AL", name: "Albania" },
      { code: "AD", name: "Andorra" },
      { code: "AT", name: "Austria" },
      { code: "BY", name: "Belarus" },
      { code: "BE", name: "Belgium" },
      { code: "BA", name: "Bosnia and Herzegovina" },
      { code: "BG", name: "Bulgaria" },
      { code: "HR", name: "Croatia" },
      { code: "CY", name: "Cyprus" },
      { code: "CZ", name: "Czech Republic" },
      { code: "DK", name: "Denmark" },
      { code: "EE", name: "Estonia" },
      { code: "FI", name: "Finland" },
      { code: "FR", name: "France" },
      { code: "DE", name: "Germany" },
      { code: "GR", name: "Greece" },
      { code: "HU", name: "Hungary" },
      { code: "IS", name: "Iceland" },
      { code: "IE", name: "Ireland" },
      { code: "IT", name: "Italy" },
      { code: "LV", name: "Latvia" },
      { code: "LI", name: "Liechtenstein" },
      { code: "LT", name: "Lithuania" },
      { code: "LU", name: "Luxembourg" },
      { code: "MT", name: "Malta" },
      { code: "MD", name: "Moldova" },
      { code: "MC", name: "Monaco" },
      { code: "ME", name: "Montenegro" },
      { code: "NL", name: "Netherlands" },
      { code: "MK", name: "North Macedonia" },
      { code: "NO", name: "Norway" },
      { code: "PL", name: "Poland" },
      { code: "PT", name: "Portugal" },
      { code: "RO", name: "Romania" },
      { code: "RU", name: "Russia" },
      { code: "SM", name: "San Marino" },
      { code: "RS", name: "Serbia" },
      { code: "SK", name: "Slovakia" },
      { code: "SI", name: "Slovenia" },
      { code: "ES", name: "Spain" },
      { code: "SE", name: "Sweden" },
      { code: "CH", name: "Switzerland" },
      { code: "UA", name: "Ukraine" },
      { code: "GB", name: "United Kingdom" },
      { code: "VA", name: "Vatican City" }
    ]
  },
  asia: {
    name: "Asia",
    countries: [
      { code: "AF", name: "Afghanistan" },
      { code: "AM", name: "Armenia" },
      { code: "AZ", name: "Azerbaijan" },
      { code: "BH", name: "Bahrain" },
      { code: "BD", name: "Bangladesh" },
      { code: "BT", name: "Bhutan" },
      { code: "BN", name: "Brunei" },
      { code: "KH", name: "Cambodia" },
      { code: "CN", name: "China" },
      { code: "GE", name: "Georgia" },
      { code: "IN", name: "India" },
      { code: "ID", name: "Indonesia" },
      { code: "IR", name: "Iran" },
      { code: "IQ", name: "Iraq" },
      { code: "IL", name: "Israel" },
      { code: "JP", name: "Japan" },
      { code: "JO", name: "Jordan" },
      { code: "KZ", name: "Kazakhstan" },
      { code: "KW", name: "Kuwait" },
      { code: "KG", name: "Kyrgyzstan" },
      { code: "LA", name: "Laos" },
      { code: "LB", name: "Lebanon" },
      { code: "MY", name: "Malaysia" },
      { code: "MV", name: "Maldives" },
      { code: "MN", name: "Mongolia" },
      { code: "MM", name: "Myanmar" },
      { code: "NP", name: "Nepal" },
      { code: "KP", name: "North Korea" },
      { code: "OM", name: "Oman" },
      { code: "PK", name: "Pakistan" },
      { code: "PS", name: "Palestine" },
      { code: "PH", name: "Philippines" },
      { code: "QA", name: "Qatar" },
      { code: "SA", name: "Saudi Arabia" },
      { code: "SG", name: "Singapore" },
      { code: "KR", name: "South Korea" },
      { code: "LK", name: "Sri Lanka" },
      { code: "SY", name: "Syria" },
      { code: "TW", name: "Taiwan" },
      { code: "TJ", name: "Tajikistan" },
      { code: "TH", name: "Thailand" },
      { code: "TL", name: "Timor-Leste" },
      { code: "TR", name: "Turkey" },
      { code: "TM", name: "Turkmenistan" },
      { code: "AE", name: "United Arab Emirates" },
      { code: "UZ", name: "Uzbekistan" },
      { code: "VN", name: "Vietnam" },
      { code: "YE", name: "Yemen" }
    ]
  },
  africa: {
    name: "Africa",
    countries: [
      { code: "DZ", name: "Algeria" },
      { code: "AO", name: "Angola" },
      { code: "BJ", name: "Benin" },
      { code: "BW", name: "Botswana" },
      { code: "BF", name: "Burkina Faso" },
      { code: "BI", name: "Burundi" },
      { code: "CV", name: "Cape Verde" },
      { code: "CM", name: "Cameroon" },
      { code: "CF", name: "Central African Republic" },
      { code: "TD", name: "Chad" },
      { code: "KM", name: "Comoros" },
      { code: "CG", name: "Congo" },
      { code: "CD", name: "Democratic Republic of the Congo" },
      { code: "DJ", name: "Djibouti" },
      { code: "EG", name: "Egypt" },
      { code: "GQ", name: "Equatorial Guinea" },
      { code: "ER", name: "Eritrea" },
      { code: "SZ", name: "Eswatini" },
      { code: "ET", name: "Ethiopia" },
      { code: "GA", name: "Gabon" },
      { code: "GM", name: "Gambia" },
      { code: "GH", name: "Ghana" },
      { code: "GN", name: "Guinea" },
      { code: "GW", name: "Guinea-Bissau" },
      { code: "CI", name: "Ivory Coast" },
      { code: "KE", name: "Kenya" },
      { code: "LS", name: "Lesotho" },
      { code: "LR", name: "Liberia" },
      { code: "LY", name: "Libya" },
      { code: "MG", name: "Madagascar" },
      { code: "MW", name: "Malawi" },
      { code: "ML", name: "Mali" },
      { code: "MR", name: "Mauritania" },
      { code: "MU", name: "Mauritius" },
      { code: "MA", name: "Morocco" },
      { code: "MZ", name: "Mozambique" },
      { code: "NA", name: "Namibia" },
      { code: "NE", name: "Niger" },
      { code: "NG", name: "Nigeria" },
      { code: "RW", name: "Rwanda" },
      { code: "ST", name: "São Tomé and Príncipe" },
      { code: "SN", name: "Senegal" },
      { code: "SC", name: "Seychelles" },
      { code: "SL", name: "Sierra Leone" },
      { code: "SO", name: "Somalia" },
      { code: "ZA", name: "South Africa" },
      { code: "SS", name: "South Sudan" },
      { code: "SD", name: "Sudan" },
      { code: "TZ", name: "Tanzania" },
      { code: "TG", name: "Togo" },
      { code: "TN", name: "Tunisia" },
      { code: "UG", name: "Uganda" },
      { code: "ZM", name: "Zambia" },
      { code: "ZW", name: "Zimbabwe" }
    ]
  },
  oceania: {
    name: "Oceania",
    countries: [
      { code: "AU", name: "Australia" },
      { code: "FJ", name: "Fiji" },
      { code: "KI", name: "Kiribati" },
      { code: "MH", name: "Marshall Islands" },
      { code: "FM", name: "Micronesia" },
      { code: "NR", name: "Nauru" },
      { code: "NZ", name: "New Zealand" },
      { code: "PW", name: "Palau" },
      { code: "PG", name: "Papua New Guinea" },
      { code: "WS", name: "Samoa" },
      { code: "SB", name: "Solomon Islands" },
      { code: "TO", name: "Tonga" },
      { code: "TV", name: "Tuvalu" },
      { code: "VU", name: "Vanuatu" }
    ]
  }
};

// Create a flat array of all countries for dropdowns and lookups
export const COUNTRIES = Object.values(REGIONS).flatMap(region => region.countries)
  .sort((a, b) => a.name.localeCompare(b.name));

// Helper function to get region by country code
export const getRegionByCountryCode = (countryCode) => {
  if (!countryCode) return null;
  
  for (const [regionKey, regionData] of Object.entries(REGIONS)) {
    if (regionData.countries.some(country => country.code === countryCode)) {
      return regionKey;
    }
  }
  return null;
};

// Helper function to get country name by code
export const getCountryNameByCode = (countryCode) => {
  if (!countryCode) return null;
  
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.name : null;
};

// Helper function to get countries by region
export const getCountriesByRegion = (regionKey) => {
  return REGIONS[regionKey]?.countries || [];
};

// Helper function to create a flag component for a country code
export const CountryFlag = ({ countryCode, size = 16, className = "" }) => {
  if (!countryCode) return null;
  
  return React.createElement(ReactCountryFlag, {
    countryCode: countryCode,
    svg: true,
    style: {
      width: `${size}px`,
      height: `${size * 0.75}px`, // Maintain aspect ratio for flags
      borderRadius: '2px'
    },
    className: className,
    title: getCountryNameByCode(countryCode)
  });
};

// Helper function to get flag emoji for a country code (fallback option)
export const getCountryFlagEmoji = (countryCode) => {
  if (!countryCode) return '';
  
  // Convert country code to flag emoji using regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  
  return String.fromCodePoint(...codePoints);
};