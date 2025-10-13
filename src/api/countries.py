"""
Countries and Regions Data for TasteBook Backend
Based on ISO 3166-1 Alpha-2 country codes and UN regional classifications
This serves as the single source of truth for country data in the Flask backend.
"""

REGIONS = {
    'north_america': {
        'name': "North America",
        'countries': [
            {'code': "AG", 'name': "Antigua and Barbuda"},
            {'code': "BS", 'name': "Bahamas"},
            {'code': "BB", 'name': "Barbados"},
            {'code': "BZ", 'name': "Belize"},
            {'code': "CA", 'name': "Canada"},
            {'code': "CR", 'name': "Costa Rica"},
            {'code': "CU", 'name': "Cuba"},
            {'code': "DM", 'name': "Dominica"},
            {'code': "DO", 'name': "Dominican Republic"},
            {'code': "SV", 'name': "El Salvador"},
            {'code': "GD", 'name': "Grenada"},
            {'code': "GT", 'name': "Guatemala"},
            {'code': "HT", 'name': "Haiti"},
            {'code': "HN", 'name': "Honduras"},
            {'code': "JM", 'name': "Jamaica"},
            {'code': "MX", 'name': "Mexico"},
            {'code': "NI", 'name': "Nicaragua"},
            {'code': "PA", 'name': "Panama"},
            {'code': "KN", 'name': "Saint Kitts and Nevis"},
            {'code': "LC", 'name': "Saint Lucia"},
            {'code': "VC", 'name': "Saint Vincent and the Grenadines"},
            {'code': "TT", 'name': "Trinidad and Tobago"},
            {'code': "US", 'name': "United States"}
        ]
    },
    'south_america': {
        'name': "South America",
        'countries': [
            {'code': "AR", 'name': "Argentina"},
            {'code': "BO", 'name': "Bolivia"},
            {'code': "BR", 'name': "Brazil"},
            {'code': "CL", 'name': "Chile"},
            {'code': "CO", 'name': "Colombia"},
            {'code': "EC", 'name': "Ecuador"},
            {'code': "GY", 'name': "Guyana"},
            {'code': "PY", 'name': "Paraguay"},
            {'code': "PE", 'name': "Peru"},
            {'code': "SR", 'name': "Suriname"},
            {'code': "UY", 'name': "Uruguay"},
            {'code': "VE", 'name': "Venezuela"}
        ]
    },
    'europe': {
        'name': "Europe",
        'countries': [
            {'code': "AL", 'name': "Albania"},
            {'code': "AD", 'name': "Andorra"},
            {'code': "AT", 'name': "Austria"},
            {'code': "BY", 'name': "Belarus"},
            {'code': "BE", 'name': "Belgium"},
            {'code': "BA", 'name': "Bosnia and Herzegovina"},
            {'code': "BG", 'name': "Bulgaria"},
            {'code': "HR", 'name': "Croatia"},
            {'code': "CY", 'name': "Cyprus"},
            {'code': "CZ", 'name': "Czech Republic"},
            {'code': "DK", 'name': "Denmark"},
            {'code': "EE", 'name': "Estonia"},
            {'code': "FI", 'name': "Finland"},
            {'code': "FR", 'name': "France"},
            {'code': "DE", 'name': "Germany"},
            {'code': "GR", 'name': "Greece"},
            {'code': "HU", 'name': "Hungary"},
            {'code': "IS", 'name': "Iceland"},
            {'code': "IE", 'name': "Ireland"},
            {'code': "IT", 'name': "Italy"},
            {'code': "LV", 'name': "Latvia"},
            {'code': "LI", 'name': "Liechtenstein"},
            {'code': "LT", 'name': "Lithuania"},
            {'code': "LU", 'name': "Luxembourg"},
            {'code': "MT", 'name': "Malta"},
            {'code': "MD", 'name': "Moldova"},
            {'code': "MC", 'name': "Monaco"},
            {'code': "ME", 'name': "Montenegro"},
            {'code': "NL", 'name': "Netherlands"},
            {'code': "MK", 'name': "North Macedonia"},
            {'code': "NO", 'name': "Norway"},
            {'code': "PL", 'name': "Poland"},
            {'code': "PT", 'name': "Portugal"},
            {'code': "RO", 'name': "Romania"},
            {'code': "RU", 'name': "Russia"},
            {'code': "SM", 'name': "San Marino"},
            {'code': "RS", 'name': "Serbia"},
            {'code': "SK", 'name': "Slovakia"},
            {'code': "SI", 'name': "Slovenia"},
            {'code': "ES", 'name': "Spain"},
            {'code': "SE", 'name': "Sweden"},
            {'code': "CH", 'name': "Switzerland"},
            {'code': "UA", 'name': "Ukraine"},
            {'code': "GB", 'name': "United Kingdom"},
            {'code': "VA", 'name': "Vatican City"}
        ]
    },
    'asia': {
        'name': "Asia",
        'countries': [
            {'code': "AF", 'name': "Afghanistan"},
            {'code': "AM", 'name': "Armenia"},
            {'code': "AZ", 'name': "Azerbaijan"},
            {'code': "BH", 'name': "Bahrain"},
            {'code': "BD", 'name': "Bangladesh"},
            {'code': "BT", 'name': "Bhutan"},
            {'code': "BN", 'name': "Brunei"},
            {'code': "KH", 'name': "Cambodia"},
            {'code': "CN", 'name': "China"},
            {'code': "GE", 'name': "Georgia"},
            {'code': "IN", 'name': "India"},
            {'code': "ID", 'name': "Indonesia"},
            {'code': "IR", 'name': "Iran"},
            {'code': "IQ", 'name': "Iraq"},
            {'code': "IL", 'name': "Israel"},
            {'code': "JP", 'name': "Japan"},
            {'code': "JO", 'name': "Jordan"},
            {'code': "KZ", 'name': "Kazakhstan"},
            {'code': "KW", 'name': "Kuwait"},
            {'code': "KG", 'name': "Kyrgyzstan"},
            {'code': "LA", 'name': "Laos"},
            {'code': "LB", 'name': "Lebanon"},
            {'code': "MY", 'name': "Malaysia"},
            {'code': "MV", 'name': "Maldives"},
            {'code': "MN", 'name': "Mongolia"},
            {'code': "MM", 'name': "Myanmar"},
            {'code': "NP", 'name': "Nepal"},
            {'code': "KP", 'name': "North Korea"},
            {'code': "OM", 'name': "Oman"},
            {'code': "PK", 'name': "Pakistan"},
            {'code': "PS", 'name': "Palestine"},
            {'code': "PH", 'name': "Philippines"},
            {'code': "QA", 'name': "Qatar"},
            {'code': "SA", 'name': "Saudi Arabia"},
            {'code': "SG", 'name': "Singapore"},
            {'code': "KR", 'name': "South Korea"},
            {'code': "LK", 'name': "Sri Lanka"},
            {'code': "SY", 'name': "Syria"},
            {'code': "TW", 'name': "Taiwan"},
            {'code': "TJ", 'name': "Tajikistan"},
            {'code': "TH", 'name': "Thailand"},
            {'code': "TL", 'name': "Timor-Leste"},
            {'code': "TR", 'name': "Turkey"},
            {'code': "TM", 'name': "Turkmenistan"},
            {'code': "AE", 'name': "United Arab Emirates"},
            {'code': "UZ", 'name': "Uzbekistan"},
            {'code': "VN", 'name': "Vietnam"},
            {'code': "YE", 'name': "Yemen"}
        ]
    },
    'africa': {
        'name': "Africa",
        'countries': [
            {'code': "DZ", 'name': "Algeria"},
            {'code': "AO", 'name': "Angola"},
            {'code': "BJ", 'name': "Benin"},
            {'code': "BW", 'name': "Botswana"},
            {'code': "BF", 'name': "Burkina Faso"},
            {'code': "BI", 'name': "Burundi"},
            {'code': "CV", 'name': "Cape Verde"},
            {'code': "CM", 'name': "Cameroon"},
            {'code': "CF", 'name': "Central African Republic"},
            {'code': "TD", 'name': "Chad"},
            {'code': "KM", 'name': "Comoros"},
            {'code': "CG", 'name': "Congo"},
            {'code': "CD", 'name': "Democratic Republic of the Congo"},
            {'code': "DJ", 'name': "Djibouti"},
            {'code': "EG", 'name': "Egypt"},
            {'code': "GQ", 'name': "Equatorial Guinea"},
            {'code': "ER", 'name': "Eritrea"},
            {'code': "SZ", 'name': "Eswatini"},
            {'code': "ET", 'name': "Ethiopia"},
            {'code': "GA", 'name': "Gabon"},
            {'code': "GM", 'name': "Gambia"},
            {'code': "GH", 'name': "Ghana"},
            {'code': "GN", 'name': "Guinea"},
            {'code': "GW", 'name': "Guinea-Bissau"},
            {'code': "CI", 'name': "Ivory Coast"},
            {'code': "KE", 'name': "Kenya"},
            {'code': "LS", 'name': "Lesotho"},
            {'code': "LR", 'name': "Liberia"},
            {'code': "LY", 'name': "Libya"},
            {'code': "MG", 'name': "Madagascar"},
            {'code': "MW", 'name': "Malawi"},
            {'code': "ML", 'name': "Mali"},
            {'code': "MR", 'name': "Mauritania"},
            {'code': "MU", 'name': "Mauritius"},
            {'code': "MA", 'name': "Morocco"},
            {'code': "MZ", 'name': "Mozambique"},
            {'code': "NA", 'name': "Namibia"},
            {'code': "NE", 'name': "Niger"},
            {'code': "NG", 'name': "Nigeria"},
            {'code': "RW", 'name': "Rwanda"},
            {'code': "ST", 'name': "São Tomé and Príncipe"},
            {'code': "SN", 'name': "Senegal"},
            {'code': "SC", 'name': "Seychelles"},
            {'code': "SL", 'name': "Sierra Leone"},
            {'code': "SO", 'name': "Somalia"},
            {'code': "ZA", 'name': "South Africa"},
            {'code': "SS", 'name': "South Sudan"},
            {'code': "SD", 'name': "Sudan"},
            {'code': "TZ", 'name': "Tanzania"},
            {'code': "TG", 'name': "Togo"},
            {'code': "TN", 'name': "Tunisia"},
            {'code': "UG", 'name': "Uganda"},
            {'code': "ZM", 'name': "Zambia"},
            {'code': "ZW", 'name': "Zimbabwe"}
        ]
    },
    'oceania': {
        'name': "Oceania",
        'countries': [
            {'code': "AU", 'name': "Australia"},
            {'code': "FJ", 'name': "Fiji"},
            {'code': "KI", 'name': "Kiribati"},
            {'code': "MH", 'name': "Marshall Islands"},
            {'code': "FM", 'name': "Micronesia"},
            {'code': "NR", 'name': "Nauru"},
            {'code': "NZ", 'name': "New Zealand"},
            {'code': "PW", 'name': "Palau"},
            {'code': "PG", 'name': "Papua New Guinea"},
            {'code': "WS", 'name': "Samoa"},
            {'code': "SB", 'name': "Solomon Islands"},
            {'code': "TO", 'name': "Tonga"},
            {'code': "TV", 'name': "Tuvalu"},
            {'code': "VU", 'name': "Vanuatu"}
        ]
    }
}

# Create a flat array of all countries for dropdowns and lookups
COUNTRIES = [country for region in REGIONS.values() for country in region['countries']]

# Create a lookup dictionary for quick country access by code
COUNTRIES_BY_CODE = {country['code']: country for country in COUNTRIES}

# Helper function to get region by country code
def get_region_by_country_code(country_code):
    """Get the region key for a given country code."""
    if not country_code:
        return None

    for region_key, region_data in REGIONS.items():
        if any(country['code'] == country_code for country in region_data['countries']):
            return region_key
    return None

# Helper function to get country name by code
def get_country_name_by_code(country_code):
    """Get the country name for a given country code."""
    if not country_code:
        return None

    country = COUNTRIES_BY_CODE.get(country_code.upper())
    return country['name'] if country else None

# Helper function to get countries by region
def get_countries_by_region(region_key):
    """Get all countries for a given region."""
    return REGIONS.get(region_key, {}).get('countries', [])

# Helper function to get a random country
def get_random_country():
    """Get a random country object {code, name}."""
    import random
    return random.choice(COUNTRIES)

# Helper function to get a random country from a specific region
def get_random_country_from_region(region_key):
    """Get a random country from a specific region."""
    import random
    countries = get_countries_by_region(region_key)
    return random.choice(countries) if countries else None