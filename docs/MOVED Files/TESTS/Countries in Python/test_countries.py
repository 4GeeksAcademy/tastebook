#!/usr/bin/env python3

# RUN INSTRUCTIONS:
# /workspaces/tastebook && python test_countries.py

"""
Test script to verify that the countries module and test user creation work correctly.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from api.countries import get_random_country, COUNTRIES, REGIONS, get_region_by_country_code

def test_countries_module():
    """Test the countries module functionality."""
    print("Testing countries module...")

    # Test total countries
    print(f"Total countries: {len(COUNTRIES)}")

    # Test random country
    random_country = get_random_country()
    print(f"Random country: {random_country}")

    # Test region lookup
    region = get_region_by_country_code(random_country['code'])
    print(f"Region for {random_country['code']}: {region}")

    # Test region countries
    region_countries = REGIONS[region]['countries']
    print(f"Countries in {region}: {len(region_countries)}")

    # Test that random country is in its region
    assert random_country in region_countries, "Random country should be in its region"
    print("✓ Random country is correctly assigned to its region")

    # Test all countries have required fields
    for country in COUNTRIES:
        assert 'code' in country, f"Country missing code: {country}"
        assert 'name' in country, f"Country missing name: {country}"
        assert len(country['code']) == 2, f"Country code should be 2 characters: {country}"
    print("✓ All countries have required fields")

    print("All tests passed!")

if __name__ == '__main__':
    test_countries_module()