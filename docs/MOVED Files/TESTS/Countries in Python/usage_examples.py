from api.countries import get_random_country, get_region_by_country_code, COUNTRIES

# Get a random country for test users
country = get_random_country()  # {'code': 'US', 'name': 'United States'}

# Find which region a country belongs to
region = get_region_by_country_code('US')  # 'north_america'

# Get all countries
all_countries = COUNTRIES  # List of 196 country objects