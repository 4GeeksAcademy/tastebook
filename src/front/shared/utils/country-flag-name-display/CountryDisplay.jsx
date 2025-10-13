

// THIS REUSABLE COMPONENT IS NOT BEING CURRENTLY USED

// There a Rect component in CountryDisplay.jsx that is being used instead
// with "import ReactCountryFlag from 'react-country-flag';" and "<ReactCountryFlag />""

// This is a use example:
//      {/* Example usage of CountryDisplay component */}
//      <div className="mb-4 text-center">
//          <CountryDisplay countryCode="US" flagSize={32} className="mx-2" showName={true} flagFirst={true} />
//          {/* This will display the US flag and the country name "United States" */}
//      </div>

import React from 'react';
import { CountryFlag, getCountryNameByCode } from './countriesData.jsx';


/**
 * Reusable component to display country name with flag
 * @param {string}  countryCode - ISO country code (e.g., 'US', 'CA', 'MX')
 * @param {number}  flagSize    - Size of the flag icon in pixels (default: 16)
 * @param {string}  className   - Additional CSS classes
 * @param {boolean} showName    - Whether to show the country name (default: true)
 * @param {boolean} flagFirst   - Whether to show flag before name (default: false)
 */
const CountryDisplay = ({ 
  countryCode, 
  flagSize  = 16, 
  className = "", 
  showName  = true, 
  flagFirst = false 
}) => {

  if (!countryCode) return null;

  const countryName = getCountryNameByCode(countryCode);
  const flag = <CountryFlag countryCode={countryCode} size={flagSize} className="flex-shrink-0" />;
  
  return (
    <span className={`d-flex align-items-center ${className}`}>
      {flagFirst && flag}
      {showName && (
        <span className={flagFirst ? "ms-2" : "me-2"}>
          {countryName || countryCode}
        </span>
      )}
      {!flagFirst && flag}
    </span>
  );
};

export default CountryDisplay;