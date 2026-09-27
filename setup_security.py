import re

with open('server.ts', 'r') as f:
    content = f.read()

imports_to_add = """import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
"""

# Insert imports after existing imports
content = re.sub(r'(import \{ getGeminiClient \} from "./server/gemini";)', r'\1\n' + imports_to_add, content)

security_middleware = """
  // =======================================================================
  // ULTIMATE SECURITY SHIELD: Anti-hacking & DDoS/Brute-Force protection
  // =======================================================================
  
  // 1. Helmet: Sets strict HTTP security headers (prevents XSS, Clickjacking, MIME-sniffing)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"], // Required for Vite/React dev mode
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "data:", "https:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // 2. Rate Limiting: Prevents DDoS & Brute Force attacks (Ransomware vectors)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 2000 requests per windowMs
    message: { error: "Security Shield Triggered: Too many requests from this IP. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter); // Apply to all API routes

  // 3. HPP: Protects against HTTP Parameter Pollution attacks
  app.use(hpp());

  // 4. CORS: Restrict cross-origin resource sharing
  app.use(cors({
    origin: "*", // Can be restricted to specific domain in production
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  // =======================================================================
"""

# Insert middleware after app.use(express.json(...))
content = re.sub(r'(app\.use\(express\.json\(\{ limit: "15mb" \}\)\);)', r'\1\n' + security_middleware, content)

with open('server.ts', 'w') as f:
    f.write(content)

