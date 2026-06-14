/**
 * Enhanced Salary and Wage Extraction Service
 * Retrieves accurate salary/wage information from job postings
 * Supports extraction from structured fields AND job descriptions
 */

export interface SalaryInfo {
  min: number;
  max: number;
  currency: string;
  salaryType: 'annual' | 'monthly' | 'hourly' | 'unknown';
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'structured' | 'description' | 'ai';
}

/**
 * Main extraction function - tries all sources
 */
export function extractSalaryInfo(jobData: any): SalaryInfo | null {
  try {
    // 1. Try structured fields first (highest confidence)
    const structuredResult = extractFromStructuredFields(jobData);
    if (structuredResult) return structuredResult;

    // 2. Try extracting from description
    const descriptionResult = extractFromDescription(jobData.description);
    if (descriptionResult) return descriptionResult;

    return null;
  } catch (error) {
    console.error('Error extracting salary:', error);
    return null;
  }
}

/**
 * Extract from structured salary fields
 */
function extractFromStructuredFields(jobData: any): SalaryInfo | null {
  const salaryField = jobData.salary || 
                     jobData.salary_range || 
                     jobData.compensation ||
                     jobData.pay ||
                     jobData.wages;

  if (!salaryField) return null;

  const salaryText = String(salaryField).trim();
  if (!salaryText) return null;

  const currencyInfo = extractCurrency(salaryText);
  const salaryType = determineSalaryType(salaryText);
  const { min, max } = extractSalaryRange(salaryText);

  if (min === null || max === null) return null;

  return {
    min,
    max,
    currency: currencyInfo.symbol,
    salaryType,
    rawText: salaryText,
    confidence: 'high',
    source: 'structured',
  };
}

/**
 * Extract salary information from job description text
 */
export function extractFromDescription(description: string): SalaryInfo | null {
  if (!description || typeof description !== 'string') return null;

  const text = description;
  const lowerText = text.toLowerCase();

  // Skip if description is too short (likely not a real job posting)
  if (text.length < 50) return null;

  // Try different extraction patterns in order of reliability
  const strategies = [
    () => extractRangePattern(text),
    () => extractHourlyPattern(text),
    () => extractMonthlyPattern(text),
    () => extractSingleValueWithPlus(text),
    () => extractSalaryKeywordPattern(text),
    () => extractLooseNumberPattern(text),
  ];

  for (const strategy of strategies) {
    const result = strategy();
    if (result) return result;
  }

  return null;
}

/**
 * Extract range pattern: $50k - $80k, $50,000 - $100,000, etc.
 */
function extractRangePattern(text: string): SalaryInfo | null {
  const patterns = [
    // $50k - $80k or $50K-$80K
    /[\$€£¥₹₽₩]?\s*([\d,]+(?:\.\d+)?)\s*[kK]\s*[-–to]+\s*[\$€£¥₹₽₩]?\s*([\d,]+(?:\.\d+)?)\s*[kK]/i,
    // $50,000 - $100,000
    /[\$€£¥₹₽₩]\s*([\d,]+)\s*[-–to]+\s*[\$€£¥₹₽₩]\s*([\d,]+)/i,
    // 50k - 80k (without currency symbol)
    /\b([\d,]+)\s*[kK]\s*[-–to]+\s*([\d,]+)\s*[kK]\b/i,
    // 50,000 to 100,000
    /\b([\d,]+)\s*[-–to]+\s*([\d,]+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let min = parseNumber(match[1]);
      let max = parseNumber(match[2]);

      // Check if k suffix is present
      const hasK = /[kK]/.test(match[0]);
      if (hasK) {
        min *= 1000;
        max *= 1000;
      }

      // Validate range
      if (isValidSalaryRange(min, max)) {
        const currency = extractCurrency(match[0]);
        const salaryType = determineSalaryType(text);

        return {
          min,
          max,
          currency: currency.symbol,
          salaryType,
          rawText: match[0],
          confidence: 'high',
          source: 'description',
        };
      }
    }
  }

  return null;
}

/**
 * Extract hourly rate: $25/hr, $30/hour, $25 per hour
 */
function extractHourlyPattern(text: string): SalaryInfo | null {
  const patterns = [
    /[\$€£¥₹₽₩]?\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per|an?)\s*(?:hr|hour|hrs|hours)\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*(?:\/|per|an?)\s*(?:hr|hour|hrs|hours)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const hourlyRate = parseNumber(match[1]);
      
      if (hourlyRate > 0 && hourlyRate < 1000) { // Reasonable hourly rate
        const annualMin = hourlyRate * 40 * 52;
        const annualMax = annualMin; // Exact match
        
        const currency = extractCurrency(match[0]);
        
        return {
          min: annualMin,
          max: annualMax,
          currency: currency.symbol,
          salaryType: 'hourly',
          rawText: match[0],
          confidence: 'high',
          source: 'description',
        };
      }
    }
  }

  return null;
}

/**
 * Extract monthly salary: $5000/month, $5000 per month
 */
function extractMonthlyPattern(text: string): SalaryInfo | null {
  const patterns = [
    /[\$€£¥₹₽₩]?\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per|an?)\s*(?:mo|month|months)\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*(?:\/|per|an?)\s*(?:mo|month|months)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const monthlyRate = parseNumber(match[1]);
      
      if (monthlyRate > 0 && monthlyRate < 100000) {
        const annualMin = monthlyRate * 12;
        const annualMax = annualMin;
        
        const currency = extractCurrency(match[0]);
        
        return {
          min: annualMin,
          max: annualMax,
          currency: currency.symbol,
          salaryType: 'monthly',
          rawText: match[0],
          confidence: 'high',
          source: 'description',
        };
      }
    }
  }

  return null;
}

/**
 * Extract single value with plus: $100k+, $50,000+
 */
function extractSingleValueWithPlus(text: string): SalaryInfo | null {
  const patterns = [
    /[\$€£¥₹₽₩]?\s*([\d,]+(?:\.\d+)?)\s*[kK]\s*\+/i,
    /[\$€£¥₹₽₩]\s*([\d,]+)\s*\+/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseNumber(match[1]);
      
      // Check if k suffix
      if (/[kK]/.test(match[0])) {
        value *= 1000;
      }

      if (value > 0 && value < 1000000) {
        const currency = extractCurrency(match[0]);
        const salaryType = determineSalaryType(text);
        
        return {
          min: value,
          max: Math.round(value * 1.5), // Estimate 50% higher
          currency: currency.symbol,
          salaryType,
          rawText: match[0],
          confidence: 'medium',
          source: 'description',
        };
      }
    }
  }

  return null;
}

/**
 * Extract salary mentioned after keywords like "salary:", "pay:", etc.
 */
function extractSalaryKeywordPattern(text: string): SalaryInfo | null {
  const patterns = [
    /(?:salary|pay|compensation|wage|rate)[:\s]+([^\n.,]{5,50})/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const salaryText = match[1];
      const { min, max } = extractSalaryRange(salaryText);
      
      if (min !== null && max !== null && isValidSalaryRange(min, max)) {
        const currency = extractCurrency(salaryText);
        const salaryType = determineSalaryType(salaryText);
        
        return {
          min,
          max,
          currency: currency.symbol,
          salaryType,
          rawText: match[0],
          confidence: 'medium',
          source: 'description',
        };
      }
    }
  }

  return null;
}

/**
 * Last resort: find loose numbers that look like salaries
 */
function extractLooseNumberPattern(text: string): SalaryInfo | null {
  // Look for numbers in reasonable salary ranges
  const numberPattern = /\b(\d{2,3}),?(\d{3})\b/g;
  const numbers: number[] = [];
  let match;
  
  while ((match = numberPattern.exec(text)) !== null) {
    const value = parseInt(match[1] + match[2]);
    if (value >= 30000 && value <= 500000) {
      numbers.push(value);
    }
  }
  
  if (numbers.length >= 2) {
    numbers.sort((a, b) => a - b);
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    
    if (isValidSalaryRange(min, max)) {
      const currency = extractCurrency(text);
      const salaryType = determineSalaryType(text);
      
      return {
        min,
        max,
        currency: currency.symbol,
        salaryType,
        rawText: `${min.toLocaleString()} - ${max.toLocaleString()}`,
        confidence: 'low',
        source: 'description',
      };
    }
  }

  return null;
}

/**
 * Validate if numbers form a reasonable salary range
 */
function isValidSalaryRange(min: number, max: number): boolean {
  return (
    min > 0 &&
    max > 0 &&
    max >= min &&
    min >= 10000 &&      // Minimum reasonable salary
    max <= 2000000 &&    // Maximum reasonable salary
    (max / min) <= 10    // Max shouldn't be more than 10x min
  );
}

/**
 * Parse number from string (handles commas, decimals)
 */
function parseNumber(str: string): number {
  return parseFloat(str.replace(/,/g, '')) || 0;
}

/**
 * Extract currency symbol and code from salary text
 */
function extractCurrency(salaryText: string): { symbol: string; code: string } {
  const currencyMap: Record<string, { symbol: string; code: string }> = {
    '$': { symbol: '$', code: 'USD' },
    '€': { symbol: '€', code: 'EUR' },
    '£': { symbol: '£', code: 'GBP' },
    '¥': { symbol: '¥', code: 'JPY' },
    '₹': { symbol: '₹', code: 'INR' },
    '₽': { symbol: '₽', code: 'RUB' },
    '₩': { symbol: '₩', code: 'KRW' },
    '₦': { symbol: '₦', code: 'NGN' },
    'R': { symbol: 'R', code: 'ZAR' },
    'USD': { symbol: '$', code: 'USD' },
    'EUR': { symbol: '€', code: 'EUR' },
    'GBP': { symbol: '£', code: 'GBP' },
    'JPY': { symbol: '¥', code: 'JPY' },
    'INR': { symbol: '₹', code: 'INR' },
    'RUB': { symbol: '₽', code: 'RUB' },
    'KRW': { symbol: '₩', code: 'KRW' },
    'NGN': { symbol: '₦', code: 'NGN' },
    'ZAR': { symbol: 'R', code: 'ZAR' },
  };

  for (const [key, value] of Object.entries(currencyMap)) {
    if (salaryText.includes(key)) {
      return value;
    }
  }

  return { symbol: '$', code: 'USD' };
}

/**
 * Determine if salary is annual, monthly, or hourly
 */
function determineSalaryType(salaryText: string): 'annual' | 'monthly' | 'hourly' | 'unknown' {
  const lowerText = salaryText.toLowerCase();

  if (lowerText.includes('/year') || lowerText.includes('yearly') || 
      lowerText.includes('per year') || lowerText.includes('p.a.') ||
      lowerText.includes('annum') || lowerText.includes('annually')) {
    return 'annual';
  }
  if (lowerText.includes('/month') || lowerText.includes('monthly') || 
      lowerText.includes('per month') || lowerText.includes('per mth')) {
    return 'monthly';
  }
  if (lowerText.includes('/hour') || lowerText.includes('hourly') || 
      lowerText.includes('per hour') || lowerText.includes('/hr') ||
      lowerText.includes('per hr')) {
    return 'hourly';
  }

  // Default based on salary amount
  const numbers = salaryText.match(/[\d,]+(?:\.\d+)?/g);
  if (numbers && numbers.length > 0) {
    const firstNum = parseInt(numbers[0].replace(/,/g, ''), 10);
    if (firstNum > 1000) {
      return 'annual';
    }
    if (firstNum < 200) {
      return 'hourly';
    }
  }

  return 'unknown';
}

/**
 * Extract minimum and maximum salary from text
 */
function extractSalaryRange(salaryText: string): { min: number | null; max: number | null } {
  try {
    const patterns = [
      /[\$€£¥₹₽₩₦R]?\s*([\d,]+(?:\.\d+)?)\s*(?:k|K)?\s*[-–to]+\s*[\$€£¥₹₽₩₦R]?\s*([\d,]+(?:\.\d+)?)\s*(?:k|K)?/,
      /([\d,]+(?:\.\d+)?)\s*[-–to]+\s*([\d,]+(?:\.\d+)?)/,
    ];

    for (const pattern of patterns) {
      const match = salaryText.match(pattern);
      if (match) {
        let min = parseNumber(match[1]);
        let max = parseNumber(match[2]);

        // Handle thousands (k suffix)
        if (/[kK]/.test(match[0])) {
          min = min * 1000;
          max = max * 1000;
        }

        // Validate and swap if needed
        if (min > 0 && max > 0) {
          if (min > max) {
            [min, max] = [max, min];
          }
          return { min, max };
        }
      }
    }

    // Try to extract single value
    const singleMatch = salaryText.match(/([\d,]+(?:\.\d+)?)\s*(?:k|K)?/);
    if (singleMatch) {
      let value = parseNumber(singleMatch[1]);
      if (/[kK]/.test(singleMatch[0])) {
        value = value * 1000;
      }
      if (value > 0) {
        return { min: value, max: Math.round(value * 1.2) };
      }
    }

    return { min: null, max: null };
  } catch (error) {
    console.error('Error extracting salary range:', error);
    return { min: null, max: null };
  }
}

/**
 * Convert salary to annual equivalent for comparison
 */
export function convertToAnnualSalary(salary: SalaryInfo): { min: number; max: number } {
  let min = salary.min;
  let max = salary.max;

  switch (salary.salaryType) {
    case 'monthly':
      min = min * 12;
      max = max * 12;
      break;
    case 'hourly':
      min = min * 40 * 52;
      max = max * 40 * 52;
      break;
    case 'annual':
    case 'unknown':
    default:
      break;
  }

  return { min, max };
}

/**
 * Format salary for display
 */
export function formatSalaryDisplay(salary: SalaryInfo): string {
  const { min, max, currency, salaryType } = salary;
  
  let typeLabel = '';
  if (salaryType === 'hourly') {
    const hourlyMin = Math.round(min / (40 * 52));
    const hourlyMax = Math.round(max / (40 * 52));
    return `${currency}${hourlyMin} - ${currency}${hourlyMax}/hr`;
  } else if (salaryType === 'monthly') {
    const monthlyMin = Math.round(min / 12);
    const monthlyMax = Math.round(max / 12);
    return `${currency}${monthlyMin.toLocaleString()} - ${currency}${monthlyMax.toLocaleString()}/mo`;
  }

  if (min === max) {
    return `${currency}${min.toLocaleString()}`;
  }

  return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
}

/**
 * Extract comprehensive salary info from job object
 */
export function extractComprehensiveSalaryInfo(jobData: any): SalaryInfo | null {
  // Try structured fields first
  const structuredResult = extractSalaryInfo(jobData);
  if (structuredResult) return structuredResult;

  // Try description
  if (jobData.description) {
    return extractFromDescription(jobData.description);
  }

  return null;
}

/**
 * AI-powered salary extraction using Groq
 */
export async function extractSalaryWithAI(description: string): Promise<SalaryInfo | null> {
  try {
    const response = await fetch('/api/extract-salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.salary;
  } catch (error) {
    console.error('AI salary extraction failed:', error);
    return null;
  }
}

/**
 * Get hourly equivalent of annual salary
 */
export function getHourlyRate(annualSalary: number): number {
  return Math.round(annualSalary / (40 * 52));
}

/**
 * Get monthly equivalent of annual salary
 */
export function getMonthlyRate(annualSalary: number): number {
  return Math.round(annualSalary / 12);
}

/**
 * Get daily equivalent of annual salary
 */
export function getDailyRate(annualSalary: number): number {
  return Math.round(annualSalary / (5 * 52));
}

/**
 * Generate comprehensive salary breakdown
 */
export function generateSalaryBreakdown(salary: SalaryInfo): {
  annual: { min: number; max: number };
  monthly: { min: number; max: number };
  weekly: { min: number; max: number };
  daily: { min: number; max: number };
  hourly: { min: number; max: number };
  source: string;
  confidence: string;
} {
  const annual = convertToAnnualSalary(salary);

  return {
    annual,
    monthly: {
      min: Math.round(annual.min / 12),
      max: Math.round(annual.max / 12),
    },
    weekly: {
      min: Math.round(annual.min / 52),
      max: Math.round(annual.max / 52),
    },
    daily: {
      min: Math.round(annual.min / (5 * 52)),
      max: Math.round(annual.max / (5 * 52)),
    },
    hourly: {
      min: Math.round(annual.min / (40 * 52)),
      max: Math.round(annual.max / (40 * 52)),
    },
    source: salary.source,
    confidence: salary.confidence,
  };
}