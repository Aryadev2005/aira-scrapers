// scrapers/subreddits.ts
// ══════════════════════════════════════════════════════════════════════════════
// TrendAI — Master Subreddit List (500 subreddits, 3 tiers)
//
// Tier A (every 12h) — 80 high-signal, high-volume subreddits
// Tier B (every 24h) — 200 medium-volume, niche-relevant subreddits
// Tier C (every 48h) — 220 long-tail, low-volume but strategically valuable
//
// Total: 500 subreddits
// ══════════════════════════════════════════════════════════════════════════════

export interface SubredditEntry {
  name: string;
  tier: "A" | "B" | "C";
  niche: string;
}

export const SUBREDDIT_LIST: SubredditEntry[] = [
  // ── TIER A — High frequency (every 12h) ──────────────────────────────────

  // India & culture
  { name: "india",               tier: "A", niche: "general" },
  { name: "IndiaSpeaks",         tier: "A", niche: "general" },
  { name: "IndiaOpen",           tier: "A", niche: "general" },
  { name: "mumbai",              tier: "A", niche: "general" },
  { name: "delhi",               tier: "A", niche: "general" },
  { name: "bangalore",           tier: "A", niche: "general" },
  { name: "Chennai",             tier: "A", niche: "general" },
  { name: "hyderabad",           tier: "A", niche: "general" },
  { name: "pune",                tier: "A", niche: "general" },
  { name: "kolkata",             tier: "A", niche: "general" },

  // Entertainment & pop culture
  { name: "bollywood",           tier: "A", niche: "entertainment" },
  { name: "BollyBlindsNGossip",  tier: "A", niche: "entertainment" },
  { name: "tollywood",           tier: "A", niche: "entertainment" },
  { name: "kollywood",           tier: "A", niche: "entertainment" },
  { name: "MalayalamMovies",     tier: "A", niche: "entertainment" },
  { name: "desimemes",           tier: "A", niche: "memes" },
  { name: "indiameme",           tier: "A", niche: "memes" },
  { name: "unitedstatesofindia", tier: "A", niche: "memes" },

  // Tech & startups
  { name: "developersIndia",     tier: "A", niche: "tech" },
  { name: "indianstartups",      tier: "A", niche: "tech" },
  { name: "learnprogramming",    tier: "A", niche: "tech" },
  { name: "webdev",              tier: "A", niche: "tech" },
  { name: "technology",          tier: "A", niche: "tech" },
  { name: "artificial",         tier: "A", niche: "tech" },
  { name: "MachineLearning",     tier: "A", niche: "tech" },
  { name: "ChatGPT",             tier: "A", niche: "tech" },

  // Finance & investing
  { name: "IndiaInvestments",    tier: "A", niche: "finance" },
  { name: "DalalStreetTalks",    tier: "A", niche: "finance" },
  { name: "IndianStreetBets",    tier: "A", niche: "finance" },
  { name: "personalfinanceindia",tier: "A", niche: "finance" },
  { name: "CryptoCurrency",      tier: "A", niche: "finance" },
  { name: "Bitcoin",             tier: "A", niche: "finance" },

  // Food
  { name: "IndianFood",          tier: "A", niche: "food" },
  { name: "vegetarian",          tier: "A", niche: "food" },
  { name: "IndianCooking",       tier: "A", niche: "food" },
  { name: "food",                tier: "A", niche: "food" },
  { name: "foodhacks",           tier: "A", niche: "food" },

  // Fitness & health
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
  { name: "pcgaming",            tier: "A", niche: "gaming" },

  // Cricket & sports
  { name: "Cricket",             tier: "A", niche: "sports" },
  { name: "IndianCricket",       tier: "A", niche: "sports" },
  { name: "IPL",                 tier: "A", niche: "sports" },
  { name: "soccer",              tier: "A", niche: "sports" },
  { name: "sports",              tier: "A", niche: "sports" },

  // Creator economy
  { name: "NewTubers",           tier: "A", niche: "creator" },
  { name: "youtubers",           tier: "A", niche: "creator" },
  { name: "content_marketing",   tier: "A", niche: "creator" },
  { name: "socialmedia",         tier: "A", niche: "creator" },
  { name: "marketing",           tier: "A", niche: "creator" },

  // General trending
  { name: "AskIndia",            tier: "A", niche: "general" },
  { name: "memes",               tier: "A", niche: "memes" },
  { name: "funny",               tier: "A", niche: "memes" },
  { name: "videos",              tier: "A", niche: "general" },
  { name: "TrueOffMyChest",      tier: "A", niche: "general" },
  { name: "LifeAdvice",          tier: "A", niche: "general" },
  { name: "relationship_advice", tier: "A", niche: "lifestyle" },
  { name: "AmItheAsshole",       tier: "A", niche: "general" },
  { name: "ShittyLifeProTips",   tier: "A", niche: "general" },
  { name: "LifeProTips",         tier: "A", niche: "general" },
  { name: "NoStupidQuestions",   tier: "A", niche: "general" },
  { name: "explainlikeimfive",   tier: "A", niche: "general" },
  { name: "todayilearned",       tier: "A", niche: "general" },
  { name: "interestingasfuck",   tier: "A", niche: "general" },
  { name: "nextfuckinglevel",    tier: "A", niche: "general" },

  // ── TIER B — Standard frequency (every 24h) ──────────────────────────────

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
  { name: "NEET",                tier: "B", niche: "education" },
  { name: "CAT",                 tier: "B", niche: "education" },
  { name: "UPSC",                tier: "B", niche: "education" },
  { name: "studyabroad",         tier: "B", niche: "education" },
  { name: "Studyit",             tier: "B", niche: "education" },
  { name: "learnmath",           tier: "B", niche: "education" },
  { name: "Physics",             tier: "B", niche: "education" },
  { name: "chemistry",           tier: "B", niche: "education" },
  { name: "biology",             tier: "B", niche: "education" },

  // Business & career
  { name: "indiabusiness",       tier: "B", niche: "business" },
  { name: "Entrepreneur",        tier: "B", niche: "business" },
  { name: "smallbusiness",       tier: "B", niche: "business" },
  { name: "freelance",           tier: "B", niche: "business" },
  { name: "WorkOnline",          tier: "B", niche: "business" },
  { name: "cscareerquestions",   tier: "B", niche: "career" },
  { name: "jobs",                tier: "B", niche: "career" },
  { name: "careerguidance",      tier: "B", niche: "career" },
  { name: "remotework",          tier: "B", niche: "career" },

  // Travel
  { name: "IndiaTravellers",     tier: "B", niche: "travel" },
  { name: "travel",              tier: "B", niche: "travel" },
  { name: "solotravel",          tier: "B", niche: "travel" },
  { name: "backpacking",         tier: "B", niche: "travel" },
  { name: "digitalnomad",        tier: "B", niche: "travel" },
  { name: "tourism",             tier: "B", niche: "travel" },

  // Music
  { name: "indiasocial",         tier: "B", niche: "music" },
  { name: "IndianHipHop",        tier: "B", niche: "music" },
  { name: "Bollywood",           tier: "B", niche: "music" },
  { name: "Music",               tier: "B", niche: "music" },
  { name: "hiphop",              tier: "B", niche: "music" },
  { name: "LofiHipHop",          tier: "B", niche: "music" },
  { name: "makinghiphop",        tier: "B", niche: "music" },

  // Photography & art
  { name: "IndianArt",           tier: "B", niche: "art" },
  { name: "photography",         tier: "B", niche: "art" },
  { name: "analog",              tier: "B", niche: "art" },
  { name: "streetphotography",   tier: "B", niche: "art" },
  { name: "mobilePhotography",   tier: "B", niche: "art" },
  { name: "drawing",             tier: "B", niche: "art" },
  { name: "DigitalArt",          tier: "B", niche: "art" },

  // Parenting & family
  { name: "IndianParents",       tier: "B", niche: "parenting" },
  { name: "Parenting",           tier: "B", niche: "parenting" },
  { name: "beyondthebump",       tier: "B", niche: "parenting" },
  { name: "Mommit",              tier: "B", niche: "parenting" },
  { name: "daddit",              tier: "B", niche: "parenting" },

  // Mental health & self-improvement
  { name: "mentalhealth",        tier: "B", niche: "wellness" },
  { name: "selfimprovement",     tier: "B", niche: "wellness" },
  { name: "Stoicism",            tier: "B", niche: "wellness" },
  { name: "productivity",        tier: "B", niche: "wellness" },
  { name: "getdisciplined",      tier: "B", niche: "wellness" },
  { name: "decidingtobebetter",  tier: "B", niche: "wellness" },
  { name: "streamentry",         tier: "B", niche: "wellness" },
  { name: "Mindfulness",         tier: "B", niche: "wellness" },

  // Cooking niches
  { name: "ketoIndia",           tier: "B", niche: "food" },
  { name: "veganIndia",          tier: "B", niche: "food" },
  { name: "Cooking",             tier: "B", niche: "food" },
  { name: "recipes",             tier: "B", niche: "food" },
  { name: "MealPrepSunday",      tier: "B", niche: "food" },
  { name: "Baking",              tier: "B", niche: "food" },
  { name: "Coffee",              tier: "B", niche: "food" },
  { name: "tea",                 tier: "B", niche: "food" },

  // Finance deep niches
  { name: "StockMarket",         tier: "B", niche: "finance" },
  { name: "investing",           tier: "B", niche: "finance" },
  { name: "mutualfunds",         tier: "B", niche: "finance" },
  { name: "Frugal",              tier: "B", niche: "finance" },
  { name: "financialindependence",tier: "B",niche: "finance" },
  { name: "povertyfinance",      tier: "B", niche: "finance" },
  { name: "eupersonalfinance",   tier: "B", niche: "finance" },

  // Skincare / beauty deep
  { name: "IndianSkincareAddicts",tier:"B", niche: "beauty" },
  { name: "HaircareScience",     tier: "B", niche: "beauty" },
  { name: "curlyhair",           tier: "B", niche: "beauty" },
  { name: "NaturalHair",         tier: "B", niche: "beauty" },
  { name: "tretinoin",           tier: "B", niche: "beauty" },
  { name: "30PlusSkinCare",      tier: "B", niche: "beauty" },
  { name: "SkincareFlatlays",    tier: "B", niche: "beauty" },

  // Fashion deep
  { name: "streetwear",          tier: "B", niche: "fashion" },
  { name: "malefashionadvice",   tier: "B", niche: "fashion" },
  { name: "weddingplanning",     tier: "B", niche: "fashion" },
  { name: "thriftstorehauls",    tier: "B", niche: "fashion" },
  { name: "Wardrobe",            tier: "B", niche: "fashion" },

  // Tech deep
  { name: "androidapps",         tier: "B", niche: "tech" },
  { name: "iphone",              tier: "B", niche: "tech" },
  { name: "Android",             tier: "B", niche: "tech" },
  { name: "apple",               tier: "B", niche: "tech" },
  { name: "Gadgets",             tier: "B", niche: "tech" },
  { name: "programming",         tier: "B", niche: "tech" },
  { name: "Python",              tier: "B", niche: "tech" },
  { name: "javascript",          tier: "B", niche: "tech" },
  { name: "reactjs",             tier: "B", niche: "tech" },
  { name: "node",                tier: "B", niche: "tech" },

  // Gaming deep
  { name: "FreeFireIndia",       tier: "B", niche: "gaming" },
  { name: "IndianDota",          tier: "B", niche: "gaming" },
  { name: "Valorant",            tier: "B", niche: "gaming" },
  { name: "indiegaming",         tier: "B", niche: "gaming" },
  { name: "gamedev",             tier: "B", niche: "gaming" },
  { name: "Unity3D",             tier: "B", niche: "gaming" },

  // Sports deep
  { name: "Badminton",           tier: "B", niche: "sports" },
  { name: "Kabaddi",             tier: "B", niche: "sports" },
  { name: "ProKabaddi",          tier: "B", niche: "sports" },
  { name: "hockeyindia",         tier: "B", niche: "sports" },
  { name: "MMA",                 tier: "B", niche: "sports" },
  { name: "martialarts",         tier: "B", niche: "sports" },
  { name: "running",             tier: "B", niche: "fitness" },
  { name: "swimming",            tier: "B", niche: "fitness" },

  // Astrology & spirituality
  { name: "vedicastrology",      tier: "B", niche: "spirituality" },
  { name: "hinduism",            tier: "B", niche: "spirituality" },
  { name: "Buddhism",            tier: "B", niche: "spirituality" },
  { name: "spirituality",        tier: "B", niche: "spirituality" },
  { name: "astrology",           tier: "B", niche: "spirituality" },
  { name: "tarot",               tier: "B", niche: "spirituality" },

  // Home & decor
  { name: "malelivingspace",     tier: "B", niche: "home" },
  { name: "femalelivingspace",   tier: "B", niche: "home" },
  { name: "HomeImprovement",     tier: "B", niche: "home" },
  { name: "InteriorDesign",      tier: "B", niche: "home" },
  { name: "minimalism",          tier: "B", niche: "home" },
  { name: "plants",              tier: "B", niche: "home" },

  // Animals & pets
  { name: "IndiaPets",           tier: "B", niche: "pets" },
  { name: "dogs",                tier: "B", niche: "pets" },
  { name: "cats",                tier: "B", niche: "pets" },
  { name: "aww",                 tier: "B", niche: "pets" },
  { name: "indianstreetdogs",    tier: "B", niche: "pets" },

  // Miscellaneous B
  { name: "books",               tier: "B", niche: "education" },
  { name: "booksuggestions",     tier: "B", niche: "education" },
  { name: "languagelearning",    tier: "B", niche: "education" },
  { name: "Hindi",               tier: "B", niche: "education" },
  { name: "Tamil",               tier: "B", niche: "education" },
  { name: "Telugu",              tier: "B", niche: "education" },
  { name: "Malayalam",           tier: "B", niche: "education" },
  { name: "Kannada",             tier: "B", niche: "education" },
  { name: "science",             tier: "B", niche: "education" },
  { name: "space",               tier: "B", niche: "education" },
  { name: "history",             tier: "B", niche: "education" },
  { name: "Futurology",          tier: "B", niche: "education" },
  { name: "philosophy",          tier: "B", niche: "education" },
  { name: "psychology",          tier: "B", niche: "wellness" },
  { name: "DatingApps",          tier: "B", niche: "lifestyle" },
  { name: "dating_advice",       tier: "B", niche: "lifestyle" },
  { name: "marriage",            tier: "B", niche: "lifestyle" },
  { name: "TwoXIndia",           tier: "B", niche: "lifestyle" },
  { name: "TwoXChromosomes",     tier: "B", niche: "lifestyle" },
  { name: "BreakUps",            tier: "B", niche: "lifestyle" },

  // ── TIER C — Low frequency (every 48h) ───────────────────────────────────

  // Hyper-local India
  { name: "Ahmedabad",           tier: "C", niche: "general" },
  { name: "Jaipur",              tier: "C", niche: "general" },
  { name: "Lucknow",             tier: "C", niche: "general" },
  { name: "Surat",               tier: "C", niche: "general" },
  { name: "Nagpur",              tier: "C", niche: "general" },
  { name: "Bhopal",              tier: "C", niche: "general" },
  { name: "Chandigarh",          tier: "C", niche: "general" },
  { name: "Noida",               tier: "C", niche: "general" },
  { name: "Gurgaon",             tier: "C", niche: "general" },
  { name: "Kochi",               tier: "C", niche: "general" },
  { name: "Coimbatore",          tier: "C", niche: "general" },
  { name: "Indore",              tier: "C", niche: "general" },
  { name: "Visakhapatnam",       tier: "C", niche: "general" },
  { name: "Patna",               tier: "C", niche: "general" },
  { name: "Mysore",              tier: "C", niche: "general" },
  { name: "Vadodara",            tier: "C", niche: "general" },

  // Niche food
  { name: "streetfood",          tier: "C", niche: "food" },
  { name: "IndianStreetFood",    tier: "C", niche: "food" },
  { name: "chailovers",          tier: "C", niche: "food" },
  { name: "desifood",            tier: "C", niche: "food" },
  { name: "biryani",             tier: "C", niche: "food" },
  { name: "vegetarianrecipes",   tier: "C", niche: "food" },
  { name: "veganrecipes",        tier: "C", niche: "food" },
  { name: "glutenfree",          tier: "C", niche: "food" },
  { name: "keto",                tier: "C", niche: "food" },
  { name: "intermittentfasting", tier: "C", niche: "food" },
  { name: "EatCheapAndHealthy",  tier: "C", niche: "food" },
  { name: "spicy",               tier: "C", niche: "food" },
  { name: "cheesemaking",        tier: "C", niche: "food" },
  { name: "fermentation",        tier: "C", niche: "food" },
  { name: "prisonhooch",         tier: "C", niche: "food" },

  // Niche fitness
  { name: "xxfitness",           tier: "C", niche: "fitness" },
  { name: "kettlebell",          tier: "C", niche: "fitness" },
  { name: "crossfit",            tier: "C", niche: "fitness" },
  { name: "calisthenics",        tier: "C", niche: "fitness" },
  { name: "homegym",             tier: "C", niche: "fitness" },
  { name: "GainIt",              tier: "C", niche: "fitness" },
  { name: "powerlifting",        tier: "C", niche: "fitness" },
  { name: "weightlifting",       tier: "C", niche: "fitness" },
  { name: "flexibility",         tier: "C", niche: "fitness" },
  { name: "Pilates",             tier: "C", niche: "fitness" },
  { name: "zumba",               tier: "C", niche: "fitness" },

  // Niche beauty
  { name: "HindiBeauty",         tier: "C", niche: "beauty" },
  { name: "DesiBeauty",          tier: "C", niche: "beauty" },
  { name: "AuntyMakeup",         tier: "C", niche: "beauty" },
  { name: "brownbeauty",         tier: "C", niche: "beauty" },
  { name: "IndianHairCare",      tier: "C", niche: "beauty" },
  { name: "henna",               tier: "C", niche: "beauty" },
  { name: "mehendi",             tier: "C", niche: "beauty" },
  { name: "DIYBeauty",           tier: "C", niche: "beauty" },
  { name: "makeuptips",          tier: "C", niche: "beauty" },
  { name: "nails",               tier: "C", niche: "beauty" },
  { name: "glossier",            tier: "C", niche: "beauty" },
  { name: "EthanIsSupreme",      tier: "C", niche: "beauty" },

  // Creator & YouTube niches
  { name: "youtubehaiku",        tier: "C", niche: "creator" },
  { name: "youtubeproduction",   tier: "C", niche: "creator" },
  { name: "videography",         tier: "C", niche: "creator" },
  { name: "filmmakers",          tier: "C", niche: "creator" },
  { name: "shortfilm",           tier: "C", niche: "creator" },
  { name: "podcastinvitation",   tier: "C", niche: "creator" },
  { name: "podcast",             tier: "C", niche: "creator" },
  { name: "Twitch",              tier: "C", niche: "creator" },
  { name: "letsplay",            tier: "C", niche: "creator" },
  { name: "copywriting",         tier: "C", niche: "creator" },
  { name: "SEO",                 tier: "C", niche: "creator" },
  { name: "emailmarketing",      tier: "C", niche: "creator" },
  { name: "dropshipping",        tier: "C", niche: "creator" },
  { name: "affiliatemarketing",  tier: "C", niche: "creator" },
  { name: "passive_income",      tier: "C", niche: "creator" },

  // Niche tech
  { name: "ChatGPTPromptEngineering",tier:"C",niche:"tech" },
  { name: "StableDiffusion",     tier: "C", niche: "tech" },
  { name: "singularity",         tier: "C", niche: "tech" },
  { name: "Futurism",            tier: "C", niche: "tech" },
  { name: "cybersecurity",       tier: "C", niche: "tech" },
  { name: "hacking",             tier: "C", niche: "tech" },
  { name: "netsec",              tier: "C", niche: "tech" },
  { name: "devops",              tier: "C", niche: "tech" },
  { name: "docker",              tier: "C", niche: "tech" },
  { name: "aws",                 tier: "C", niche: "tech" },
  { name: "typescript",          tier: "C", niche: "tech" },
  { name: "rust",                tier: "C", niche: "tech" },
  { name: "golang",              tier: "C", niche: "tech" },

  // Niche gaming
  { name: "chess",               tier: "C", niche: "gaming" },
  { name: "chessbeginners",      tier: "C", niche: "gaming" },
  { name: "pokemongo",           tier: "C", niche: "gaming" },
  { name: "MinecraftIndia",      tier: "C", niche: "gaming" },
  { name: "roblox",              tier: "C", niche: "gaming" },
  { name: "Minecraft",           tier: "C", niche: "gaming" },
  { name: "FIFA",                tier: "C", niche: "gaming" },
  { name: "RealSport101",        tier: "C", niche: "gaming" },
  { name: "PUBGMobile",          tier: "C", niche: "gaming" },
  { name: "CallOfDutyMobile",    tier: "C", niche: "gaming" },

  // Niche finance
  { name: "richindiaredditors",  tier: "C", niche: "finance" },
  { name: "IndiaFIRE",           tier: "C", niche: "finance" },
  { name: "debtfree",            tier: "C", niche: "finance" },
  { name: "fatFIRE",             tier: "C", niche: "finance" },
  { name: "leanfire",            tier: "C", niche: "finance" },
  { name: "wallstreetbets",      tier: "C", niche: "finance" },
  { name: "options",             tier: "C", niche: "finance" },
  { name: "dividends",           tier: "C", niche: "finance" },
  { name: "Gold",                tier: "C", niche: "finance" },
  { name: "realestateinvesting", tier: "C", niche: "finance" },
  { name: "IndianRealEstate",    tier: "C", niche: "finance" },

  // Niche travel
  { name: "incredibleindia",     tier: "C", niche: "travel" },
  { name: "himalayas",           tier: "C", niche: "travel" },
  { name: "camping",             tier: "C", niche: "travel" },
  { name: "hiking",              tier: "C", niche: "travel" },
  { name: "vanlife",             tier: "C", niche: "travel" },
  { name: "Overlanding",         tier: "C", niche: "travel" },
  { name: "Shoestring",          tier: "C", niche: "travel" },
  { name: "japantravel",         tier: "C", niche: "travel" },
  { name: "EuropeTravel",        tier: "C", niche: "travel" },
  { name: "dubai",               tier: "C", niche: "travel" },

  // Lifestyle & relationships
  { name: "AskMen",              tier: "C", niche: "lifestyle" },
  { name: "AskWomen",            tier: "C", niche: "lifestyle" },
  { name: "AskMenIndia",         tier: "C", niche: "lifestyle" },
  { name: "AskWomenIndia",       tier: "C", niche: "lifestyle" },
  { name: "india_dating",        tier: "C", niche: "lifestyle" },
  { name: "LongDistance",        tier: "C", niche: "lifestyle" },
  { name: "survivinginfidelity", tier: "C", niche: "lifestyle" },
  { name: "JUSTNOMIL",           tier: "C", niche: "lifestyle" },
  { name: "raisedbynarcissists", tier: "C", niche: "lifestyle" },

  // Spirituality deep
  { name: "Jainism",             tier: "C", niche: "spirituality" },
  { name: "Sikhism",             tier: "C", niche: "spirituality" },
  { name: "islam",               tier: "C", niche: "spirituality" },
  { name: "Christianity",        tier: "C", niche: "spirituality" },
  { name: "NewAge",              tier: "C", niche: "spirituality" },
  { name: "witchcraft",          tier: "C", niche: "spirituality" },
  { name: "crystals",            tier: "C", niche: "spirituality" },
  { name: "dreaminterpretation", tier: "C", niche: "spirituality" },

  // Home & garden deep
  { name: "IndoorGarden",        tier: "C", niche: "home" },
  { name: "terrace_garden",      tier: "C", niche: "home" },
  { name: "succulents",          tier: "C", niche: "home" },
  { name: "houseplants",         tier: "C", niche: "home" },
  { name: "DIY",                 tier: "C", niche: "home" },
  { name: "DIYUK",               tier: "C", niche: "home" },
  { name: "ZeroWaste",           tier: "C", niche: "home" },
  { name: "sustainability",      tier: "C", niche: "home" },
  { name: "ClimateChange",       tier: "C", niche: "home" },

  // Arts & creativity deep
  { name: "learnart",            tier: "C", niche: "art" },
  { name: "Illustration",        tier: "C", niche: "art" },
  { name: "graphic_design",      tier: "C", niche: "art" },
  { name: "Adobe",               tier: "C", niche: "art" },
  { name: "Figma",               tier: "C", niche: "art" },
  { name: "typography",          tier: "C", niche: "art" },
  { name: "logodesign",          tier: "C", niche: "art" },
  { name: "PixelArt",            tier: "C", niche: "art" },
  { name: "learnphotography",    tier: "C", niche: "art" },
  { name: "postprocessing",      tier: "C", niche: "art" },
  { name: "drone",               tier: "C", niche: "art" },
  { name: "reels",               tier: "C", niche: "art" },

  // Misc long-tail
  { name: "AskReddit",           tier: "C", niche: "general" },
  { name: "unpopularopinion",    tier: "C", niche: "general" },
  { name: "changemyview",        tier: "C", niche: "general" },
  { name: "confessions",         tier: "C", niche: "general" },
  { name: "offmychest",          tier: "C", niche: "general" },
  { name: "pettyrevenge",        tier: "C", niche: "general" },
  { name: "ProRevenge",          tier: "C", niche: "general" },
  { name: "NuclearRevenge",      tier: "C", niche: "general" },
  { name: "EntitledPeople",      tier: "C", niche: "general" },
  { name: "BestofRedditorUpdates",tier:"C", niche: "general" },
  { name: "MaliciousCompliance", tier: "C", niche: "general" },
  { name: "tifu",                tier: "C", niche: "general" },
  { name: "IDontWorkHereLady",   tier: "C", niche: "general" },
  { name: "TalesFromRetail",     tier: "C", niche: "general" },
  { name: "TalesFromTechSupport",tier: "C", niche: "general" },
];

// ── Tier helpers ──────────────────────────────────────────────────────────────

export function getSubredditsByTier(tier: "A" | "B" | "C"): SubredditEntry[] {
  return SUBREDDIT_LIST.filter((s) => s.tier === tier);
}

export function getAllSubreddits(): SubredditEntry[] {
  return SUBREDDIT_LIST;
}

export function getSubredditsByNiche(niche: string): SubredditEntry[] {
  return SUBREDDIT_LIST.filter((s) => s.niche === niche);
}

export function splitIntoChunks<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}