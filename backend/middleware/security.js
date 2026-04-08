// Security headers that Helmet might not cover entirely or need specific rules
export const securityHeaders = (req, res, next) => {
  // Prevent browsers from guessing the MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filtering in browser
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy (Basic API configuration)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; sandbox"
  );
  
  // Strict Transport Security (HSTS)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  next();
};
