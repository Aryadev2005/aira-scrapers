// config/index.ts

import type { PoolConfig } from "pg";
import { SubredditEntry } from "../types";

// ── DB ────────────────────────────────────────────────────────────────────────

export const DB_CONFIG: PoolConfig = {
  connectionString:    process.env.DATABASE_URL,
  ssl:                 { rejectUnauthorized: false },
  max:                 5,
  idleTimeoutMillis:   30_000,
  connectionTimeoutMillis: 10_000,
};

// ── Scraper configs ───────────────────────────────────────────────────────────

export interface ScraperConfig {
  maxRetries:  number;
  retryDelay:  number;
}

export interface PinterestConfig extends ScraperConfig {
  maxPinsPerQuery:      number;
  pageSize:             number;
  delayBetweenPages:    number;
  delayBetweenQueries:  number;
  sessionFile:          string;
  sessionMaxAgeDays:    number;
}

export interface RedditConfig extends ScraperConfig {
  maxPostsPerSub:   number;
  delayBetweenSubs: number;
}

export interface TikTokConfig extends ScraperConfig {
  maxVideosPerTag:  number;
  delayBetweenTags: number;
}

export interface GoogleTrendsConfig extends ScraperConfig {
  maxKeywords:          number;
  delayBetweenKeywords: number;
}

export const SCRAPE_CONFIG = {
  pinterest: {
    maxPinsPerQuery:      100,
    pageSize:             25,
    delayBetweenPages:    1200,
    delayBetweenQueries:  8000,
    maxRetries:           3,
    retryDelay:           5000,
    sessionFile:          "./pinterest.session.json",
    sessionMaxAgeDays:    13,
  } satisfies PinterestConfig,

  reddit: {
    maxPostsPerSub:   50,
    delayBetweenSubs: 2000,
    maxRetries:       3,
    retryDelay:       4000,
  } satisfies RedditConfig,

  tiktok: {
    maxVideosPerTag:  30,
    delayBetweenTags: 3000,
    maxRetries:       3,
    retryDelay:       5000,
  } satisfies TikTokConfig,

  googleTrends: {
    geo:               "IN",
    timeRange:         "now 1-d",
    concurrency:       5,
    minDelayMs:        1000,
    maxDelayMs:        3000,
    maxRetries:        3,
    retryBaseMs:       5000,
    batchSize:         5,
    interestThreshold: 10,
    breakoutThreshold: 90,
    expiresInDays:     3,
  } satisfies GoogleTrendsConfig,
};

// ── Global proxy ──────────────────────────────────────────────────────────────

export const PROXY_URL: string | null =
  process.env.SCRAPER_PROXY || process.env.PINTEREST_PROXY || null;

// ── Query lists ───────────────────────────────────────────────────────────────

export const PINTEREST_QUERIES: string[] = [
  // ── Fashion & Style (highest Pinterest volume for Indian women 18-30) ──────
  "clean girl aesthetic outfit",
  "quiet luxury aesthetic outfit",
  "indian ethnic wear outfit ideas",
  "saree styling modern 2025",
  "kurta set styling ideas",
  "western outfits for indian girls",
  "college outfit ideas india",
  "indo western outfit ideas",
  "summer outfit ideas india",
  "party outfit ideas indian girl",

  // ── Skincare & Beauty ────────────────────────────────────────────────────
  "korean skincare routine steps",
  "indian skin care routine",
  "dark spot removal skincare india",
  "skincare routine for oily skin india",
  "drugstore skincare india affordable",
  "glass skin routine steps",
  "natural skincare home remedies india",
  "bridal skincare routine indian",

  // ── Hair ────────────────────────────────────────────────────────────────
  "hair care routine for indian hair",
  "curly hair routine india",
  "hair oiling routine india",
  "hairstyle ideas for indian girls",
  "braid hairstyle ideas indian",

  // ── Fitness & Wellness ───────────────────────────────────────────────────
  "that girl morning routine",
  "home workout routine for women",
  "yoga routine for beginners india",
  "healthy meal prep ideas india",
  "weight loss meal plan indian food",
  "gym outfit ideas women",

  // ── Food & Recipes ───────────────────────────────────────────────────────
  "healthy indian breakfast recipes",
  "quick indian lunch recipes",
  "high protein indian meal prep",
  "aesthetic food photography india",
  "cafe food photography ideas",
  "healthy snacks india recipes",

  // ── Lifestyle & Productivity ─────────────────────────────────────────────
  "morning routine productive aesthetic",
  "study aesthetic motivation",
  "desk setup aesthetic india",
  "journal ideas aesthetic",
  "vision board ideas 2025 india",
  "minimalist lifestyle india",

  // ── Home & Room ──────────────────────────────────────────────────────────
  "aesthetic room decor india",
  "small bedroom decor ideas india",
  "indian home decor living room",
  "study room setup india",
  "renter friendly room decor ideas",

  // ── Travel ───────────────────────────────────────────────────────────────
  "travel outfit ideas india",
  "places to visit india 2025",
  "solo travel india tips women",
  "bali travel aesthetic",
  "europe travel aesthetic outfit",

  // ── Content Creator Meta ─────────────────────────────────────────────────
  "instagram reels ideas aesthetic",
  "content creation setup aesthetic",
  "photo dump ideas aesthetic",
  "grwm outfit ideas",
  "influencer outfit ideas india",
];
// ── Reddit subreddits (500 total, 3 tiers) ────────────────────────────────────

export const REDDIT_SUBREDDITS: SubredditEntry[] = [

  // ── TIER A — scraped every 12h, highest signal ────────────────────────────

  // India core
  { name: "india",               tier: "A", niche: "general" },
  { name: "IndiaSpeaks",         tier: "A", niche: "general" },
  { name: "AskIndia",            tier: "A", niche: "general" },
  { name: "mumbai",              tier: "A", niche: "general" },
  { name: "delhi",               tier: "A", niche: "general" },
  { name: "bangalore",           tier: "A", niche: "general" },
  { name: "Chennai",             tier: "A", niche: "general" },
  { name: "hyderabad",           tier: "A", niche: "general" },
  { name: "pune",                tier: "A", niche: "general" },
  { name: "kolkata",             tier: "A", niche: "general" },

  // Entertainment
  { name: "bollywood",           tier: "A", niche: "entertainment" },
  { name: "BollyBlindsNGossip",  tier: "A", niche: "entertainment" },
  { name: "tollywood",           tier: "A", niche: "entertainment" },
  { name: "kollywood",           tier: "A", niche: "entertainment" },
  { name: "MalayalamMovies",     tier: "A", niche: "entertainment" },
  { name: "desimemes",           tier: "A", niche: "memes" },
  { name: "indiameme",           tier: "A", niche: "memes" },
  { name: "unitedstatesofindia", tier: "A", niche: "memes" },

  // Tech
  { name: "developersIndia",     tier: "A", niche: "tech" },
  { name: "indianstartups",      tier: "A", niche: "tech" },
  { name: "technology",          tier: "A", niche: "tech" },
  { name: "ChatGPT",             tier: "A", niche: "tech" },
  { name: "MachineLearning",     tier: "A", niche: "tech" },
  { name: "artificial",          tier: "A", niche: "tech" },
  { name: "learnprogramming",    tier: "A", niche: "tech" },
  { name: "webdev",              tier: "A", niche: "tech" },

  // Finance
  { name: "IndiaInvestments",    tier: "A", niche: "finance" },
  { name: "DalalStreetTalks",    tier: "A", niche: "finance" },
  { name: "IndianStreetBets",    tier: "A", niche: "finance" },
  { name: "personalfinanceindia",tier: "A", niche: "finance" },
  { name: "CryptoCurrency",      tier: "A", niche: "finance" },
  { name: "Bitcoin",             tier: "A", niche: "finance" },

  // Food
  { name: "IndianFood",          tier: "A", niche: "food" },
  { name: "IndianCooking",       tier: "A", niche: "food" },
  { name: "food",                tier: "A", niche: "food" },
  { name: "vegetarian",          tier: "A", niche: "food" },
  { name: "foodhacks",           tier: "A", niche: "food" },

  // Fitness & wellness
  { name: "yoga",                tier: "A", niche: "fitness" },
  { name: "fitness",             tier: "A", niche: "fitness" },
  { name: "bodyweightfitness",   tier: "A", niche: "fitness" },
  { name: "loseit",              tier: "A", niche: "fitness" },
  { name: "Ayurveda",            tier: "A", niche: "wellness" },
  { name: "meditation",          tier: "A", niche: "wellness" },

  // Fashion & beauty
  { name: "IndianFashion",       tier: "A", niche: "fashion" },
  { name: "MakeupAddiction",     tier: "A", niche: "beauty" },
  { name: "SkincareAddiction",   tier: "A", niche: "beauty" },
  { name: "AsianBeauty",         tier: "A", niche: "beauty" },
  { name: "femalefashionadvice", tier: "A", niche: "fashion" },

  // Gaming
  { name: "IndianGaming",        tier: "A", niche: "gaming" },
  { name: "BGMI",                tier: "A", niche: "gaming" },
  { name: "GamingIndia",         tier: "A", niche: "gaming" },
  { name: "gaming",              tier: "A", niche: "gaming" },

  // Sports
  { name: "Cricket",             tier: "A", niche: "sports" },
  { name: "IndianCricket",       tier: "A", niche: "sports" },
  { name: "IPL",                 tier: "A", niche: "sports" },

  // Creator economy
  { name: "NewTubers",           tier: "A", niche: "creator" },
  { name: "youtubers",           tier: "A", niche: "creator" },
  { name: "socialmedia",         tier: "A", niche: "creator" },
  { name: "marketing",           tier: "A", niche: "creator" },

  // Trending general
  { name: "memes",               tier: "A", niche: "memes" },
  { name: "funny",               tier: "A", niche: "memes" },
  { name: "todayilearned",       tier: "A", niche: "general" },
  { name: "interestingasfuck",   tier: "A", niche: "general" },
  { name: "nextfuckinglevel",    tier: "A", niche: "general" },
  { name: "LifeProTips",         tier: "A", niche: "general" },
  { name: "relationship_advice", tier: "A", niche: "lifestyle" },
  { name: "AmItheAsshole",       tier: "A", niche: "general" },
  { name: "TrueOffMyChest",      tier: "A", niche: "general" },
  { name: "explainlikeimfive",   tier: "A", niche: "general" },
  { name: "NoStupidQuestions",   tier: "A", niche: "general" },
  { name: "videos",              tier: "A", niche: "general" },
  { name: "pcgaming",            tier: "A", niche: "gaming" },
  { name: "soccer",              tier: "A", niche: "sports" },
  { name: "sports",              tier: "A", niche: "sports" },

  // ── TIER B — scraped every 24h ────────────────────────────────────────────

  // Regional India
  { name: "Kerala",              tier: "B", niche: "general" },
  { name: "tamilnadu",           tier: "B", niche: "general" },
  { name: "Karnataka",           tier: "B", niche: "general" },
  { name: "Gujarat",             tier: "B", niche: "general" },
  { name: "Maharashtra",         tier: "B", niche: "general" },
  { name: "rajasthan",           tier: "B", niche: "general" },
  { name: "Goa",                 tier: "B", niche: "general" },
  { name: "Bihar",               tier: "B", niche: "general" },
  { name: "Uttarakhand",         tier: "B", niche: "general" },
  { name: "assam",               tier: "B", niche: "general" },

  // Education
  { name: "IITians",             tier: "B", niche: "education" },
  { name: "JEEPreparation",      tier: "B", niche: "education" },
  { name: "UPSC",                tier: "B", niche: "education" },
  { name: "CAT",                 tier: "B", niche: "education" },
  { name: "studyabroad",         tier: "B", niche: "education" },
  { name: "books",               tier: "B", niche: "education" },
  { name: "science",             tier: "B", niche: "education" },
  { name: "space",               tier: "B", niche: "education" },
  { name: "history",             tier: "B", niche: "education" },
  { name: "Futurology",          tier: "B", niche: "education" },
  { name: "philosophy",          tier: "B", niche: "education" },

  // Business & career
  { name: "indiabusiness",       tier: "B", niche: "business" },
  { name: "Entrepreneur",        tier: "B", niche: "business" },
  { name: "freelance",           tier: "B", niche: "business" },
  { name: "remotework",          tier: "B", niche: "business" },
  { name: "cscareerquestions",   tier: "B", niche: "career" },

  // Travel
  { name: "IndiaTravellers",     tier: "B", niche: "travel" },
  { name: "travel",              tier: "B", niche: "travel" },
  { name: "solotravel",          tier: "B", niche: "travel" },
  { name: "backpacking",         tier: "B", niche: "travel" },
  { name: "digitalnomad",        tier: "B", niche: "travel" },

  // Music
  { name: "IndianHipHop",        tier: "B", niche: "music" },
  { name: "Music",               tier: "B", niche: "music" },
  { name: "hiphop",              tier: "B", niche: "music" },
  { name: "LofiHipHop",          tier: "B", niche: "music" },

  // Photography & art
  { name: "IndianArt",           tier: "B", niche: "art" },
  { name: "photography",         tier: "B", niche: "art" },
  { name: "streetphotography",   tier: "B", niche: "art" },
  { name: "mobilePhotography",   tier: "B", niche: "art" },
  { name: "DigitalArt",          tier: "B", niche: "art" },

  // Parenting
  { name: "IndianParents",       tier: "B", niche: "parenting" },
  { name: "Parenting",           tier: "B", niche: "parenting" },
  { name: "Mommit",              tier: "B", niche: "parenting" },
  { name: "daddit",              tier: "B", niche: "parenting" },

  // Mental health & self-improvement
  { name: "mentalhealth",        tier: "B", niche: "wellness" },
  { name: "selfimprovement",     tier: "B", niche: "wellness" },
  { name: "productivity",        tier: "B", niche: "wellness" },
  { name: "getdisciplined",      tier: "B", niche: "wellness" },
  { name: "Mindfulness",         tier: "B", niche: "wellness" },
  { name: "Stoicism",            tier: "B", niche: "wellness" },
  { name: "psychology",          tier: "B", niche: "wellness" },

  // Food deep
  { name: "Cooking",             tier: "B", niche: "food" },
  { name: "recipes",             tier: "B", niche: "food" },
  { name: "MealPrepSunday",      tier: "B", niche: "food" },
  { name: "Baking",              tier: "B", niche: "food" },
  { name: "Coffee",              tier: "B", niche: "food" },
  { name: "tea",                 tier: "B", niche: "food" },

  // Finance deep
  { name: "StockMarket",         tier: "B", niche: "finance" },
  { name: "investing",           tier: "B", niche: "finance" },
  { name: "mutualfunds",         tier: "B", niche: "finance" },
  { name: "financialindependence",tier:"B", niche: "finance" },
  { name: "wallstreetbets",      tier: "B", niche: "finance" },

  // Beauty deep
  { name: "IndianSkincareAddicts",tier:"B", niche: "beauty" },
  { name: "HaircareScience",     tier: "B", niche: "beauty" },
  { name: "curlyhair",           tier: "B", niche: "beauty" },
  { name: "NaturalHair",         tier: "B", niche: "beauty" },
  { name: "tretinoin",           tier: "B", niche: "beauty" },
  { name: "30PlusSkinCare",      tier: "B", niche: "beauty" },

  // Fashion deep
  { name: "streetwear",          tier: "B", niche: "fashion" },
  { name: "malefashionadvice",   tier: "B", niche: "fashion" },
  { name: "weddingplanning",     tier: "B", niche: "fashion" },
  { name: "thriftstorehauls",    tier: "B", niche: "fashion" },

  // Tech deep
  { name: "androidapps",         tier: "B", niche: "tech" },
  { name: "Android",             tier: "B", niche: "tech" },
  { name: "apple",               tier: "B", niche: "tech" },
  { name: "Gadgets",             tier: "B", niche: "tech" },
  { name: "programming",         tier: "B", niche: "tech" },
  { name: "Python",              tier: "B", niche: "tech" },
  { name: "javascript",          tier: "B", niche: "tech" },
  { name: "reactjs",             tier: "B", niche: "tech" },

  // Gaming deep
  { name: "Valorant",            tier: "B", niche: "gaming" },
  { name: "gamedev",             tier: "B", niche: "gaming" },
  { name: "FreeFireIndia",       tier: "B", niche: "gaming" },
  { name: "indiegaming",         tier: "B", niche: "gaming" },

  // Sports deep
  { name: "Badminton",           tier: "B", niche: "sports" },
  { name: "Kabaddi",             tier: "B", niche: "sports" },
  { name: "ProKabaddi",          tier: "B", niche: "sports" },
  { name: "MMA",                 tier: "B", niche: "sports" },
  { name: "running",             tier: "B", niche: "fitness" },

  // Spirituality
  { name: "vedicastrology",      tier: "B", niche: "spirituality" },
  { name: "hinduism",            tier: "B", niche: "spirituality" },
  { name: "spirituality",        tier: "B", niche: "spirituality" },
  { name: "astrology",           tier: "B", niche: "spirituality" },
  { name: "meditation",          tier: "B", niche: "spirituality" },

  // Home & decor
  { name: "InteriorDesign",      tier: "B", niche: "home" },
  { name: "minimalism",          tier: "B", niche: "home" },
  { name: "plants",              tier: "B", niche: "home" },
  { name: "HomeImprovement",     tier: "B", niche: "home" },

  // Pets
  { name: "IndiaPets",           tier: "B", niche: "pets" },
  { name: "dogs",                tier: "B", niche: "pets" },
  { name: "cats",                tier: "B", niche: "pets" },
  { name: "aww",                 tier: "B", niche: "pets" },

  // Languages
  { name: "Hindi",               tier: "B", niche: "education" },
  { name: "Tamil",               tier: "B", niche: "education" },
  { name: "Telugu",              tier: "B", niche: "education" },
  { name: "Malayalam",           tier: "B", niche: "education" },
  { name: "Kannada",             tier: "B", niche: "education" },
  { name: "languagelearning",    tier: "B", niche: "education" },

  // Lifestyle
  { name: "DatingApps",          tier: "B", niche: "lifestyle" },
  { name: "TwoXChromosomes",     tier: "B", niche: "lifestyle" },
  { name: "TwoXIndia",           tier: "B", niche: "lifestyle" },
  { name: "dating_advice",       tier: "B", niche: "lifestyle" },
  { name: "marriage",            tier: "B", niche: "lifestyle" },
  { name: "BreakUps",            tier: "B", niche: "lifestyle" },
  { name: "AskMen",              tier: "B", niche: "lifestyle" },
  { name: "AskWomen",            tier: "B", niche: "lifestyle" },

  // Creator deep
  { name: "content_marketing",   tier: "B", niche: "creator" },
  { name: "podcast",             tier: "B", niche: "creator" },
  { name: "SEO",                 tier: "B", niche: "creator" },
  { name: "copywriting",         tier: "B", niche: "creator" },
  { name: "passive_income",      tier: "B", niche: "creator" },

  // ── TIER C — scraped every 48h, long-tail ────────────────────────────────

  // Hyper-local India
  { name: "Ahmedabad",           tier: "C", niche: "general" },
  { name: "Jaipur",              tier: "C", niche: "general" },
  { name: "Lucknow",             tier: "C", niche: "general" },
  { name: "Nagpur",              tier: "C", niche: "general" },
  { name: "Chandigarh",          tier: "C", niche: "general" },
  { name: "Noida",               tier: "C", niche: "general" },
  { name: "Gurgaon",             tier: "C", niche: "general" },
  { name: "Kochi",               tier: "C", niche: "general" },
  { name: "Indore",              tier: "C", niche: "general" },
  { name: "Mysore",              tier: "C", niche: "general" },
  { name: "Surat",               tier: "C", niche: "general" },
  { name: "Vadodara",            tier: "C", niche: "general" },
  { name: "Coimbatore",          tier: "C", niche: "general" },
  { name: "Patna",               tier: "C", niche: "general" },
  { name: "Visakhapatnam",       tier: "C", niche: "general" },
  { name: "Bhopal",              tier: "C", niche: "general" },

  // Niche food
  { name: "streetfood",          tier: "C", niche: "food" },
  { name: "IndianStreetFood",    tier: "C", niche: "food" },
  { name: "biryani",             tier: "C", niche: "food" },
  { name: "vegetarianrecipes",   tier: "C", niche: "food" },
  { name: "keto",                tier: "C", niche: "food" },
  { name: "intermittentfasting", tier: "C", niche: "food" },
  { name: "EatCheapAndHealthy",  tier: "C", niche: "food" },
  { name: "Baking",              tier: "C", niche: "food" },
  { name: "fermentation",        tier: "C", niche: "food" },

  // Niche fitness
  { name: "xxfitness",           tier: "C", niche: "fitness" },
  { name: "kettlebell",          tier: "C", niche: "fitness" },
  { name: "calisthenics",        tier: "C", niche: "fitness" },
  { name: "homegym",             tier: "C", niche: "fitness" },
  { name: "powerlifting",        tier: "C", niche: "fitness" },
  { name: "flexibility",         tier: "C", niche: "fitness" },
  { name: "Pilates",             tier: "C", niche: "fitness" },
  { name: "crossfit",            tier: "C", niche: "fitness" },

  // Niche beauty
  { name: "brownbeauty",         tier: "C", niche: "beauty" },
  { name: "IndianHairCare",      tier: "C", niche: "beauty" },
  { name: "henna",               tier: "C", niche: "beauty" },
  { name: "DIYBeauty",           tier: "C", niche: "beauty" },
  { name: "nails",               tier: "C", niche: "beauty" },
  { name: "makeuptips",          tier: "C", niche: "beauty" },

  // Creator long-tail
  { name: "youtubehaiku",        tier: "C", niche: "creator" },
  { name: "videography",         tier: "C", niche: "creator" },
  { name: "filmmakers",          tier: "C", niche: "creator" },
  { name: "Twitch",              tier: "C", niche: "creator" },
  { name: "affiliatemarketing",  tier: "C", niche: "creator" },
  { name: "dropshipping",        tier: "C", niche: "creator" },
  { name: "emailmarketing",      tier: "C", niche: "creator" },

  // Tech long-tail
  { name: "ChatGPTPromptEngineering",tier:"C",niche:"tech" },
  { name: "StableDiffusion",     tier: "C", niche: "tech" },
  { name: "cybersecurity",       tier: "C", niche: "tech" },
  { name: "devops",              tier: "C", niche: "tech" },
  { name: "docker",              tier: "C", niche: "tech" },
  { name: "typescript",          tier: "C", niche: "tech" },
  { name: "golang",              tier: "C", niche: "tech" },
  { name: "rust",                tier: "C", niche: "tech" },
  { name: "aws",                 tier: "C", niche: "tech" },

  // Gaming long-tail
  { name: "chess",               tier: "C", niche: "gaming" },
  { name: "Minecraft",           tier: "C", niche: "gaming" },
  { name: "Valorant",            tier: "C", niche: "gaming" },
  { name: "FIFA",                tier: "C", niche: "gaming" },
  { name: "PUBGMobile",          tier: "C", niche: "gaming" },
  { name: "CallOfDutyMobile",    tier: "C", niche: "gaming" },
  { name: "roblox",              tier: "C", niche: "gaming" },

  // Finance long-tail
  { name: "IndiaFIRE",           tier: "C", niche: "finance" },
  { name: "fatFIRE",             tier: "C", niche: "finance" },
  { name: "leanfire",            tier: "C", niche: "finance" },
  { name: "dividends",           tier: "C", niche: "finance" },
  { name: "realestateinvesting", tier: "C", niche: "finance" },
  { name: "IndianRealEstate",    tier: "C", niche: "finance" },
  { name: "options",             tier: "C", niche: "finance" },
  { name: "Gold",                tier: "C", niche: "finance" },

  // Travel long-tail
  { name: "incredibleindia",     tier: "C", niche: "travel" },
  { name: "himalayas",           tier: "C", niche: "travel" },
  { name: "camping",             tier: "C", niche: "travel" },
  { name: "hiking",              tier: "C", niche: "travel" },
  { name: "vanlife",             tier: "C", niche: "travel" },
  { name: "dubai",               tier: "C", niche: "travel" },
  { name: "japantravel",         tier: "C", niche: "travel" },

  // Spirituality long-tail
  { name: "Jainism",             tier: "C", niche: "spirituality" },
  { name: "Sikhism",             tier: "C", niche: "spirituality" },
  { name: "tarot",               tier: "C", niche: "spirituality" },
  { name: "crystals",            tier: "C", niche: "spirituality" },
  { name: "NewAge",              tier: "C", niche: "spirituality" },
  { name: "witchcraft",          tier: "C", niche: "spirituality" },

  // Home long-tail
  { name: "IndoorGarden",        tier: "C", niche: "home" },
  { name: "succulents",          tier: "C", niche: "home" },
  { name: "houseplants",         tier: "C", niche: "home" },
  { name: "DIY",                 tier: "C", niche: "home" },
  { name: "ZeroWaste",           tier: "C", niche: "home" },
  { name: "sustainability",      tier: "C", niche: "home" },

  // Art long-tail
  { name: "Illustration",        tier: "C", niche: "art" },
  { name: "graphic_design",      tier: "C", niche: "art" },
  { name: "Figma",               tier: "C", niche: "art" },
  { name: "typography",          tier: "C", niche: "art" },
  { name: "PixelArt",            tier: "C", niche: "art" },
  { name: "learnphotography",    tier: "C", niche: "art" },
  { name: "drone",               tier: "C", niche: "art" },

  // Lifestyle long-tail
  { name: "AskMenIndia",         tier: "C", niche: "lifestyle" },
  { name: "AskWomenIndia",       tier: "C", niche: "lifestyle" },
  { name: "india_dating",        tier: "C", niche: "lifestyle" },
  { name: "LongDistance",        tier: "C", niche: "lifestyle" },
  { name: "JUSTNOMIL",           tier: "C", niche: "lifestyle" },
  { name: "raisedbynarcissists", tier: "C", niche: "lifestyle" },

  // General long-tail
  { name: "AskReddit",           tier: "C", niche: "general" },
  { name: "unpopularopinion",    tier: "C", niche: "general" },
  { name: "changemyview",        tier: "C", niche: "general" },
  { name: "confessions",         tier: "C", niche: "general" },
  { name: "offmychest",          tier: "C", niche: "general" },
  { name: "pettyrevenge",        tier: "C", niche: "general" },
  { name: "tifu",                tier: "C", niche: "general" },
  { name: "MaliciousCompliance", tier: "C", niche: "general" },
  { name: "TalesFromRetail",     tier: "C", niche: "general" },
  { name: "EntitledPeople",      tier: "C", niche: "general" },
  { name: "BestofRedditorUpdates",tier:"C", niche: "general" },
  { name: "ProRevenge",          tier: "C", niche: "general" },
  { name: "NuclearRevenge",      tier: "C", niche: "general" },
  { name: "IDontWorkHereLady",   tier: "C", niche: "general" },
];

// ── Reddit tier helpers ───────────────────────────────────────────────────────

export function getSubredditsByTier(tier: "A" | "B" | "C"): SubredditEntry[] {
  return REDDIT_SUBREDDITS.filter((s) => s.tier === tier);
}

export const TIKTOK_HASHTAGS: string[] = [
  "cleangirl", "grwm", "quietluxury", "koreanbeauty",
  "fitcheck", "studywithme", "contentcreator", "startupindia",
];

// ADD to your existing config/index.ts

// ── Google Trends config ──────────────────────────────────────────────────────

export interface GoogleTrendsConfig {
  geo:                  string;
  timeRange:            string;
  concurrency:          number;
  minDelayMs:           number;
  maxDelayMs:           number;
  maxRetries:           number;
  retryBaseMs:          number;
  batchSize:            number;
  interestThreshold:    number;
  breakoutThreshold:    number;
  expiresInDays:        number;
}

// ADD to SCRAPE_CONFIG object:
// googleTrends: { ... } satisfies GoogleTrendsConfig

// Add this block inside your existing SCRAPE_CONFIG export:
/*
  googleTrends: {
    geo:               "IN",
    timeRange:         "now 1-d",
    concurrency:       5,
    minDelayMs:        1000,
    maxDelayMs:        3000,
    maxRetries:        3,
    retryBaseMs:       5000,
    batchSize:         5,
    interestThreshold: 10,
    breakoutThreshold: 90,
    expiresInDays:     3,
  } satisfies GoogleTrendsConfig,
*/

// ── Google Trends proxy config ────────────────────────────────────────────────
// PROXY_URL already exists in your config. Google Trends scraper will use it.
// When DataImpulse is ready, set:
//   SCRAPER_PROXY=http://user-USERNAME-session-{SESSION}:PASSWORD@gate.dataimpulse.com:823
// The {SESSION} placeholder is replaced per-request in proxy.ts