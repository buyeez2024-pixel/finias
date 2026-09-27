/**
 * Global Postal Code & Pincode Lookup Utility
 * Automatically resolves City, District/Province, State, and Country from Zipcode/Pincode.
 * Combines an extensive fast offline dataset with online fallback APIs.
 */

export interface PostalLookupResult {
  city: string;
  district: string;
  state: string;
  country: string;
  source?: 'local' | 'api';
}

const STATIC_POSTAL_DB: Record<string, PostalLookupResult> = {
  // United States Major ZIPs
  '10001': { city: 'New York', district: 'New York County', state: 'New York', country: 'United States', source: 'local' },
  '10002': { city: 'New York', district: 'New York County', state: 'New York', country: 'United States', source: 'local' },
  '90210': { city: 'Beverly Hills', district: 'Los Angeles County', state: 'California', country: 'United States', source: 'local' },
  '90001': { city: 'Los Angeles', district: 'Los Angeles County', state: 'California', country: 'United States', source: 'local' },
  '94101': { city: 'San Francisco', district: 'San Francisco County', state: 'California', country: 'United States', source: 'local' },
  '94102': { city: 'San Francisco', district: 'San Francisco County', state: 'California', country: 'United States', source: 'local' },
  '30301': { city: 'Atlanta', district: 'Fulton County', state: 'Georgia', country: 'United States', source: 'local' },
  '60601': { city: 'Chicago', district: 'Cook County', state: 'Illinois', country: 'United States', source: 'local' },
  '75201': { city: 'Dallas', district: 'Dallas County', state: 'Texas', country: 'United States', source: 'local' },
  '78701': { city: 'Austin', district: 'Travis County', state: 'Texas', country: 'United States', source: 'local' },
  '77001': { city: 'Houston', district: 'Harris County', state: 'Texas', country: 'United States', source: 'local' },
  '33101': { city: 'Miami', district: 'Miami-Dade County', state: 'Florida', country: 'United States', source: 'local' },
  '98101': { city: 'Seattle', district: 'King County', state: 'Washington', country: 'United States', source: 'local' },
  '02101': { city: 'Boston', district: 'Suffolk County', state: 'Massachusetts', country: 'United States', source: 'local' },
  '80201': { city: 'Denver', district: 'Denver County', state: 'Colorado', country: 'United States', source: 'local' },
  '97201': { city: 'Portland', district: 'Multnomah County', state: 'Oregon', country: 'United States', source: 'local' },
  '85001': { city: 'Phoenix', district: 'Maricopa County', state: 'Arizona', country: 'United States', source: 'local' },
  '89101': { city: 'Las Vegas', district: 'Clark County', state: 'Nevada', country: 'United States', source: 'local' },

  // India Major PINs
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', country: 'India', source: 'local' },
  '110002': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', country: 'India', source: 'local' },
  '110006': { city: 'Delhi', district: 'North Delhi', state: 'Delhi', country: 'India', source: 'local' },
  '400001': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', country: 'India', source: 'local' },
  '400050': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', country: 'India', source: 'local' },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', source: 'local' },
  '560001': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', country: 'India', source: 'local' },
  '560034': { city: 'Koramangala', district: 'Bangalore Urban', state: 'Karnataka', country: 'India', source: 'local' },
  '560038': { city: 'Indiranagar', district: 'Bangalore Urban', state: 'Karnataka', country: 'India', source: 'local' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India', source: 'local' },
  '500081': { city: 'Madhapur', district: 'Hyderabad', state: 'Telangana', country: 'India', source: 'local' },
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', source: 'local' },
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India', source: 'local' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', source: 'local' },
  '395001': { city: 'Surat', district: 'Surat', state: 'Gujarat', country: 'India', source: 'local' },
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', country: 'India', source: 'local' },
  '226001': { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', country: 'India', source: 'local' },
  '201301': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', country: 'India', source: 'local' },
  '122001': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', country: 'India', source: 'local' },
  '682001': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', country: 'India', source: 'local' },
  '452001': { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', country: 'India', source: 'local' },

  // United Kingdom
  'SW1A 1AA': { city: 'London', district: 'City of Westminster', state: 'England', country: 'United Kingdom', source: 'local' },
  'SW1A': { city: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', source: 'local' },
  'W1A': { city: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', source: 'local' },
  'EC1A': { city: 'London', district: 'City of London', state: 'England', country: 'United Kingdom', source: 'local' },
  'M1 1AE': { city: 'Manchester', district: 'Greater Manchester', state: 'England', country: 'United Kingdom', source: 'local' },
  'B1 1AA': { city: 'Birmingham', district: 'West Midlands', state: 'England', country: 'United Kingdom', source: 'local' },
  'EH1 1YZ': { city: 'Edinburgh', district: 'City of Edinburgh', state: 'Scotland', country: 'United Kingdom', source: 'local' },

  // Canada
  'M5V 2T6': { city: 'Toronto', district: 'Toronto Division', state: 'Ontario', country: 'Canada', source: 'local' },
  'M5V': { city: 'Toronto', district: 'Toronto Division', state: 'Ontario', country: 'Canada', source: 'local' },
  'V6B 1A1': { city: 'Vancouver', district: 'Metro Vancouver', state: 'British Columbia', country: 'Canada', source: 'local' },
  'V6B': { city: 'Vancouver', district: 'Metro Vancouver', state: 'British Columbia', country: 'Canada', source: 'local' },
  'H2Y 1C6': { city: 'Montreal', district: 'Montreal Region', state: 'Quebec', country: 'Canada', source: 'local' },

  // Australia
  '2000': { city: 'Sydney', district: 'Sydney Region', state: 'New South Wales', country: 'Australia', source: 'local' },
  '3000': { city: 'Melbourne', district: 'Melbourne Region', state: 'Victoria', country: 'Australia', source: 'local' },
  '4000': { city: 'Brisbane', district: 'Brisbane Region', state: 'Queensland', country: 'Australia', source: 'local' },
  '6000': { city: 'Perth', district: 'Perth Region', state: 'Western Australia', country: 'Australia', source: 'local' },

  // Germany
  '10115': { city: 'Berlin', district: 'Mitte', state: 'Berlin', country: 'Germany', source: 'local' },
  '80331': { city: 'Munich', district: 'Altstadt-Lehel', state: 'Bavaria', country: 'Germany', source: 'local' },
  '60311': { city: 'Frankfurt', district: 'Innenstadt', state: 'Hesse', country: 'Germany', source: 'local' },

  // France
  '75001': { city: 'Paris', district: '1er Arrondissement', state: 'Île-de-France', country: 'France', source: 'local' },
  '75008': { city: 'Paris', district: '8e Arrondissement', state: 'Île-de-France', country: 'France', source: 'local' },

  // Singapore
  '018956': { city: 'Singapore', district: 'Downtown Core', state: 'Central Region', country: 'Singapore', source: 'local' },
  '048581': { city: 'Singapore', district: 'Raffles Place', state: 'Central Region', country: 'Singapore', source: 'local' },

  // United Arab Emirates
  '00000': { city: 'Dubai', district: 'Downtown Dubai', state: 'Dubai', country: 'United Arab Emirates', source: 'local' },
};

/**
 * Perform asynchronous postal code / pincode lookup.
 */
export async function lookupPostalCode(
  rawCode: string,
  preferredCountry?: string
): Promise<PostalLookupResult | null> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code || code.length < 2) return null;

  const normalized = code.replace(/\s+/g, ' ');
  const compact = code.replace(/[^A-Z0-9]/g, '');

  // 1. Check static fast cache
  if (STATIC_POSTAL_DB[normalized]) {
    return STATIC_POSTAL_DB[normalized];
  }
  if (STATIC_POSTAL_DB[compact]) {
    return STATIC_POSTAL_DB[compact];
  }

  // Check prefix for UK / Canada 3-4 chars
  const prefix3 = compact.substring(0, 3);
  const prefix4 = compact.substring(0, 4);
  if (STATIC_POSTAL_DB[prefix3]) {
    return STATIC_POSTAL_DB[prefix3];
  }
  if (STATIC_POSTAL_DB[prefix4]) {
    return STATIC_POSTAL_DB[prefix4];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    // 2. Indian 6-digit PIN code
    if (/^\d{6}$/.test(compact)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${compact}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const po = data[0].PostOffice[0];
            const city = (po.Block && po.Block !== 'NA' ? po.Block : po.Name) || po.District || '';
            const district = po.District || city;
            const state = po.State || '';
            clearTimeout(timeoutId);
            return {
              city: city || 'City Area',
              district: district || city,
              state: state || 'State',
              country: 'India',
              source: 'api',
            };
          }
        }
      } catch (err) {
        // Ignore API timeout and continue
      }
    }

    // 3. US 5-digit ZIP code
    if (/^\d{5}$/.test(compact)) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${compact}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.places && data.places.length > 0) {
            const pl = data.places[0];
            const city = pl['place name'] || '';
            const district = pl['state'] ? `${pl['state']} County` : '';
            const state = pl['state abbreviation'] || pl['state'] || '';
            clearTimeout(timeoutId);
            return {
              city: city || 'City',
              district: district || city,
              state: state || 'State',
              country: 'United States',
              source: 'api',
            };
          }
        }
      } catch (err) {
        // Ignore API timeout
      }
    }

    // 4. Canada 3-letter forward sortation area (e.g. M5V)
    if (/^[A-Z]\d[A-Z]/.test(compact)) {
      try {
        const fsa = compact.substring(0, 3);
        const res = await fetch(`https://api.zippopotam.us/ca/${fsa}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.places && data.places.length > 0) {
            const pl = data.places[0];
            clearTimeout(timeoutId);
            return {
              city: pl['place name'] || '',
              district: pl['state'] || '',
              state: pl['state abbreviation'] || pl['state'] || '',
              country: 'Canada',
              source: 'api',
            };
          }
        }
      } catch (err) {}
    }

    // 5. Great Britain / UK
    if (preferredCountry === 'United Kingdom' || /^[A-Z]{1,2}\d/.test(compact)) {
      try {
        const outcode = compact.replace(/(\d[A-Z]{2})$/, '').trim();
        const res = await fetch(`https://api.zippopotam.us/gb/${outcode}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.places && data.places.length > 0) {
            const pl = data.places[0];
            clearTimeout(timeoutId);
            return {
              city: pl['place name'] || '',
              district: pl['state'] || '',
              state: pl['state abbreviation'] || pl['state'] || 'England',
              country: 'United Kingdom',
              source: 'api',
            };
          }
        }
      } catch (err) {}
    }

    // 6. Australia 4-digit postcodes
    if (/^\d{4}$/.test(compact) && preferredCountry === 'Australia') {
      try {
        const res = await fetch(`https://api.zippopotam.us/au/${compact}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.places && data.places.length > 0) {
            const pl = data.places[0];
            clearTimeout(timeoutId);
            return {
              city: pl['place name'] || '',
              district: pl['state'] || '',
              state: pl['state abbreviation'] || pl['state'] || '',
              country: 'Australia',
              source: 'api',
            };
          }
        }
      } catch (err) {}
    }
  } catch (e) {
    // Fail silently
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}
