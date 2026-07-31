import "dotenv/config";
import { ObjectId } from "mongodb";
import { client } from "./lib/mongodb.js";
import { collections } from "./lib/db.js";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const makeSku = (sport: string, title: string, index: number) => {
  const prefix = sport.slice(0, 3).toUpperCase();
  const words = title.split(/[\s-]+/).slice(0, 2);
  const short = words
    .map((w) => w.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase())
    .join("");
  return `${prefix}-${short || "GEN"}-${String(index + 1).padStart(3, "0")}`;
};

interface SeedProduct {
  title: string;
  sport: "football" | "cricket" | "accessories";
  gender: "men" | "women" | "kids" | "unisex";
  category: string; // kit type / accessory type (drives the sidebar "type" group)
  team: string;
  brand?: string;
  season?: string;
  sku?: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sizes?: string[] | null;
  colors: string[];
  imageUrl: string;
  tags: string[];
  featured: boolean;
  newArrival?: boolean;
  onSale: boolean;
  status?: "active" | "draft" | "archived";
}

const JERSEY_IMG =
  "https://i.ibb.co.com/DPVbrGYR/br.webp";
const CRICKET_IMG =
  "https://i.ibb.co.com/k4RZfhC8/cricket.webp";
const CAP_IMG =
  "https://i.ibb.co.com/z2rT7wT/cap.webp";
const SCARF_IMG =
  "https://i.ibb.co.com/s5yZ4f6/scarf.webp";
const SOCKS_IMG =
  "https://i.ibb.co.com/jM0RGL7/socks.webp";
const BOTTLE_IMG =
  "https://i.ibb.co.com/Pm9L3sc/bottle.webp";
const BAG_IMG =
  "https://i.ibb.co.com/f2Vb3Qy/bag.webp";
const WRISTBAND_IMG =
  "https://i.ibb.co.com/R4JhYpF/wristband.webp";
const KEYCHAIN_IMG =
  "https://i.ibb.co.com/bPv1L8Z/keychain.webp";
const STICKER_IMG =
  "https://i.ibb.co.com/1N5G0BQ/sticker.webp";

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];
const FOOTBALL_SIZES = ["S", "M", "L", "XL"];

const products: SeedProduct[] = [
  // ============================= FOOTBALL — MEN =============================
  {
    title: "Egypt Home Jersey 2026 - Salah Edition",
    sport: "football",
    gender: "men",
    category: "National Team Jerseys",
    team: "Egypt",
    brand: "Nike",
    shortDescription:
      "Player edition jersey featuring Salah's number 10 in Egypt's colors.",
    fullDescription:
      "Show your support with the Egypt Home Jersey 2026 Player Edition featuring Salah's No. 10. Breathable stretch fabric built for comfort and a true match-day fit.",
    price: 90,
    comparePrice: 110,
    stock: 26,
    sizes: FOOTBALL_SIZES,
    colors: ["Red", "White", "Black"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "egypt", "national", "salah", "player-edition"],
    featured: true,
    onSale: true,
  },
  {
    title: "Argentina Home Jersey 2026 - Messi Edition",
    sport: "football",
    gender: "men",
    category: "National Team Jerseys",
    team: "Argentina",
    brand: "Nike",
    shortDescription: "World champion Argentina jersey with Messi's No. 10.",
    fullDescription:
      "Celebrate the reigning champions with the Argentina Home Jersey 2026. Features Messi's iconic No. 10 and sky-blue stripes with moisture-wicking fabric.",
    price: 95,
    comparePrice: 115,
    stock: 34,
    sizes: FOOTBALL_SIZES,
    colors: ["Sky Blue", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "argentina", "national", "messi", "player-edition"],
    featured: true,
    onSale: true,
  },
  {
    title: "Brazil Home Jersey 2026",
    sport: "football",
    gender: "men",
    category: "National Team Jerseys",
    team: "Brazil",
    brand: "Nike",
    shortDescription: "Official home jersey in classic yellow and green.",
    fullDescription:
      "Celebrate the national team with the Brazil Home Jersey 2026. Made from lightweight, breathable fabric with moisture-wicking technology.",
    price: 84,
    stock: 42,
    sizes: FOOTBALL_SIZES,
    colors: ["Yellow", "Green"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "brazil", "national"],
    featured: true,
    onSale: false,
  },
  {
    title: "France Home Jersey 2026 - Mbappe Edition",
    sport: "football",
    gender: "men",
    category: "National Team Jerseys",
    team: "France",
    brand: "Nike",
    shortDescription: "Bleus home jersey with Mbappe's No. 10.",
    fullDescription:
      "Show your Bleus pride with the France Home Jersey 2026 featuring Mbappe's No. 10. Navy blue with gold details in a sharp match-day silhouette.",
    price: 92,
    comparePrice: 108,
    stock: 31,
    sizes: FOOTBALL_SIZES,
    colors: ["Navy", "White", "Gold"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "france", "national", "mbappe"],
    featured: true,
    onSale: true,
  },
  {
    title: "Barcelona Home Jersey 2026",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "Barcelona",
    brand: "Nike",
    shortDescription: "Blaugrana stripes in Barcelona's 2026 home kit.",
    fullDescription:
      "The Barcelona Home Jersey 2026 stays true to the club's famous blaugrana stripes. Lightweight AEROREADY fabric for every Culer.",
    price: 85,
    stock: 55,
    sizes: FOOTBALL_SIZES,
    colors: ["Blue", "Garnet"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "barcelona", "club"],
    featured: true,
    onSale: false,
  },
  {
    title: "Real Madrid Away Jersey 2026",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "Real Madrid",
    brand: "Nike",
    shortDescription: "Sleek away kit from the Royal club.",
    fullDescription:
      "The Real Madrid Away Jersey 2026 features a modern minimalist design, premium breathable fabric and the club crest front and center.",
    price: 85,
    stock: 48,
    sizes: FOOTBALL_SIZES,
    colors: ["White", "Gold"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "real-madrid", "club"],
    featured: false,
    onSale: false,
  },
  {
    title: "Liverpool Home Jersey 2026 - Salah Edition",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "Liverpool",
    brand: "Nike",
    shortDescription: "You'll Never Walk Alone — with Salah's No. 11.",
    fullDescription:
      "Support the Reds with the Liverpool Home Jersey 2026 featuring Salah's No. 11. Classic red with subtle detail, built for Anfield atmosphere.",
    price: 89,
    comparePrice: 105,
    stock: 37,
    sizes: FOOTBALL_SIZES,
    colors: ["Red", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "liverpool", "club", "salah"],
    featured: true,
    onSale: true,
  },
  {
    title: "Manchester United Third Jersey 2026",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "Manchester United",
    brand: "Nike",
    shortDescription: "The Red Devils' striking third kit.",
    fullDescription:
      "The Manchester United Third Jersey 2026 carries the spirit of Old Trafford. Bold design with moisture-managing fabric and the classic devil crest.",
    price: 87,
    stock: 40,
    sizes: FOOTBALL_SIZES,
    colors: ["Black", "Red"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "manchester-united", "club"],
    featured: false,
    onSale: false,
  },
  {
    title: "Bayern Munich Home Jersey 2026",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "Bayern Munich",
    brand: "Nike",
    shortDescription: "Mia San Mia — Bayern's 2026 home strip.",
    fullDescription:
      "The Bayern Munich Home Jersey 2026 features the club's red heritage with a sharp modern cut and breathable knit fabric.",
    price: 84,
    stock: 29,
    sizes: FOOTBALL_SIZES,
    colors: ["Red", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "bayern-munich", "club"],
    featured: false,
    onSale: false,
  },
  {
    title: "PSG Home Jersey 2026",
    sport: "football",
    gender: "men",
    category: "Club Jerseys",
    team: "PSG",
    brand: "Nike",
    shortDescription: "Parisian style in navy, red and white.",
    fullDescription:
      "The PSG Home Jersey 2026 blends Parisian elegance with performance. Navy base, red center stripe and the iconic Eiffel Tower crest.",
    price: 86,
    stock: 33,
    sizes: FOOTBALL_SIZES,
    colors: ["Navy", "Red", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "psg", "club"],
    featured: false,
    onSale: false,
  },
  {
    title: "Brazil Retro Jersey 1998",
    sport: "football",
    gender: "men",
    category: "Retro Jerseys",
    team: "Brazil",
    brand: "Nike",
    shortDescription: "Throwback 1998 Ronaldo-era Brazil shirt.",
    fullDescription:
      "Relive '98 with the Brazil Retro Jersey 1998. A faithful re-release of the classic yellow shirt worn by Ronaldo and co.",
    price: 78,
    stock: 15,
    sizes: FOOTBALL_SIZES,
    colors: ["Yellow", "Green", "Blue"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "brazil", "retro", "ronaldo"],
    featured: true,
    onSale: false,
  },
  {
    title: "Manchester United Retro Jersey 1999",
    sport: "football",
    gender: "men",
    category: "Retro Jerseys",
    team: "Manchester United",
    brand: "Nike",
    shortDescription: "Treble-winning 1999 United shirt.",
    fullDescription:
      "Own a piece of history with the Manchester United Retro Jersey 1999. The famous treble-winning kit, re-released with authentic details.",
    price: 79,
    comparePrice: 95,
    stock: 12,
    sizes: FOOTBALL_SIZES,
    colors: ["Red", "Black", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "manchester-united", "retro"],
    featured: true,
    onSale: true,
  },
  {
    title: "Barcelona Training Kit 2026",
    sport: "football",
    gender: "men",
    category: "Training Kits",
    team: "Barcelona",
    brand: "Nike",
    shortDescription: "Official training top and shorts set.",
    fullDescription:
      "Train like a professional with the Barcelona Training Kit 2026. Lightweight training top and shorts in club colors.",
    price: 70,
    stock: 28,
    sizes: FOOTBALL_SIZES,
    colors: ["Blue", "Garnet"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "barcelona", "training"],
    featured: false,
    onSale: false,
  },

  // ============================= FOOTBALL — WOMEN =============================
  {
    title: "England Women's Home Jersey 2026",
    sport: "football",
    gender: "women",
    category: "National Team Jerseys",
    team: "England",
    brand: "Nike",
    shortDescription: "Lionesses home jersey, tailored for women.",
    fullDescription:
      "Support the Lionesses with the England Women's Home Jersey 2026. Tailored female-specific fit with the iconic Three Lions crest.",
    price: 82,
    stock: 22,
    sizes: APPAREL_SIZES,
    colors: ["White", "Navy", "Red"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "england", "national", "women"],
    featured: true,
    onSale: false,
  },
  {
    title: "USA Women's Home Jersey 2026",
    sport: "football",
    gender: "women",
    category: "National Team Jerseys",
    team: "USA",
    brand: "Nike",
    shortDescription: "USWNT jersey with a female-specific fit.",
    fullDescription:
      "Rep the four-time champions with the USA Women's Home Jersey 2026. Lightweight, sweat-wicking fabric with the US Soccer crest.",
    price: 83,
    stock: 25,
    sizes: APPAREL_SIZES,
    colors: ["White", "Navy", "Red"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "usa", "national", "women"],
    featured: true,
    onSale: false,
  },
  {
    title: "Barcelona Women's Home Jersey 2026",
    sport: "football",
    gender: "women",
    category: "Club Jerseys",
    team: "Barcelona",
    brand: "Nike",
    shortDescription: "Blaugrana kit for the women's champions.",
    fullDescription:
      "Wear the colors of the reigning women's champions with a female-specific fit in the club's famous blaugrana stripes.",
    price: 80,
    comparePrice: 95,
    stock: 18,
    sizes: APPAREL_SIZES,
    colors: ["Blue", "Garnet"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "barcelona", "club", "women"],
    featured: true,
    onSale: true,
  },

  // ============================= FOOTBALL — KIDS =============================
  {
    title: "Argentina Kids Home Jersey 2026",
    sport: "football",
    gender: "kids",
    category: "National Team Jerseys",
    team: "Argentina",
    brand: "Nike",
    shortDescription: "Sky-blue stripes for the youngest fans.",
    fullDescription:
      "Get your young fan match-ready with the Argentina Kids Home Jersey 2026. Durable, breathable fabric in the famous sky-blue and white.",
    price: 55,
    stock: 40,
    sizes: ["XS", "S", "M"],
    colors: ["Sky Blue", "White"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "argentina", "national", "kids"],
    featured: true,
    onSale: false,
  },
  {
    title: "Barcelona Kids Home Jersey 2026",
    sport: "football",
    gender: "kids",
    category: "Club Jerseys",
    team: "Barcelona",
    brand: "Nike",
    shortDescription: "Blaugrana stripes for young Culers.",
    fullDescription:
      "The Barcelona Kids Home Jersey 2026 brings the Camp Nou magic to your young supporter. Lightweight, comfortable and true to club colors.",
    price: 52,
    stock: 45,
    sizes: ["XS", "S", "M"],
    colors: ["Blue", "Garnet"],
    imageUrl: JERSEY_IMG,
    tags: ["football", "barcelona", "club", "kids"],
    featured: false,
    onSale: false,
  },

  // ============================= CRICKET — MEN INTERNATIONAL =============================
  {
    title: "Bangladesh National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "Bangladesh",
    brand: "Spark",
    shortDescription: "Official Bangladesh cricket jersey for 2025.",
    fullDescription:
      "Support the Tigers with the Bangladesh National Cricket Jersey 2025. Lightweight, sweat-wicking fabric with the iconic red and green design.",
    price: 49,
    stock: 120,
    sizes: APPAREL_SIZES,
    colors: ["Red", "Green"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "bangladesh", "national"],
    featured: true,
    onSale: false,
  },
  {
    title: "India National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "India",
    brand: "Spark",
    shortDescription: "Men in Blue — India's 2025 jersey.",
    fullDescription:
      "Back the Men in Blue with the India National Cricket Jersey 2025. Navy blue with premium breathable fabric and the official team crest.",
    price: 52,
    comparePrice: 65,
    stock: 150,
    sizes: APPAREL_SIZES,
    colors: ["Navy", "Sky Blue", "Orange"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "india", "national"],
    featured: true,
    onSale: true,
  },
  {
    title: "Pakistan National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "Pakistan",
    brand: "Spark",
    shortDescription: "Emerald green Pakistan cricket jersey.",
    fullDescription:
      "Show your pride with the Pakistan National Cricket Jersey 2025. Emerald green with sharp design details and lightweight, quick-dry fabric.",
    price: 50,
    stock: 110,
    sizes: APPAREL_SIZES,
    colors: ["Green", "White"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "pakistan", "national"],
    featured: true,
    onSale: false,
  },
  {
    title: "Australia Away Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "Australia",
    brand: "Spark",
    shortDescription: "The Baggy Green brand, away edition.",
    fullDescription:
      "Cheer on the Aussies with the Australia Away Cricket Jersey 2025. Dark tones with premium athletic fabric built for the heat of the crease.",
    price: 53,
    stock: 95,
    sizes: APPAREL_SIZES,
    colors: ["Navy", "Gold"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "australia", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "England National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "England",
    brand: "Spark",
    shortDescription: "England's 2025 One-Day jersey.",
    fullDescription:
      "Support the Three Lions of cricket with the England National Cricket Jersey 2025. Blue tones with a modern print and comfortable stretch fit.",
    price: 51,
    stock: 88,
    sizes: APPAREL_SIZES,
    colors: ["Blue", "Red", "White"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "england", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "South Africa National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "South Africa",
    brand: "Spark",
    shortDescription: "Proteas green — 2025 edition.",
    fullDescription:
      "The South Africa National Cricket Jersey 2025 in Proteas green with breathable performance fabric and the official Proteas crest.",
    price: 49,
    stock: 76,
    sizes: APPAREL_SIZES,
    colors: ["Green", "Yellow"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "south-africa", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "New Zealand National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "New Zealand",
    brand: "Spark",
    shortDescription: "Black Caps' 2025 jersey.",
    fullDescription:
      "The New Zealand National Cricket Jersey 2025 in signature black. Clean, modern design with moisture-managing fabric.",
    price: 50,
    stock: 82,
    sizes: APPAREL_SIZES,
    colors: ["Black", "White"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "new-zealand", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "Sri Lanka National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "Sri Lanka",
    brand: "Spark",
    shortDescription: "Sri Lanka's blue 2025 jersey.",
    fullDescription:
      "Cheer on the Lions with the Sri Lanka National Cricket Jersey 2025. Blue with yellow trim and lightweight breathable fabric.",
    price: 48,
    stock: 70,
    sizes: APPAREL_SIZES,
    colors: ["Blue", "Yellow"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "sri-lanka", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "West Indies National Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "International Jerseys",
    team: "West Indies",
    brand: "Spark",
    shortDescription: "Maroon pride — West Indies 2025.",
    fullDescription:
      "The West Indies National Cricket Jersey 2025 in iconic maroon. Vibrant and breathable, made to celebrate the flair of Caribbean cricket.",
    price: 47,
    stock: 65,
    sizes: APPAREL_SIZES,
    colors: ["Maroon", "Yellow"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "west-indies", "national"],
    featured: false,
    onSale: false,
  },
  {
    title: "India Training Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "Training Jerseys",
    team: "India",
    brand: "Spark",
    shortDescription: "Official India practice jersey.",
    fullDescription:
      "Train with the same look as the pros with the India Training Cricket Jersey 2025. Lightweight, breathable, and made for hours of practice.",
    price: 38,
    stock: 90,
    sizes: APPAREL_SIZES,
    colors: ["Sky Blue", "Navy"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "india", "training"],
    featured: false,
    onSale: false,
  },

  // ============================= CRICKET — FRANCHISE =============================
  {
    title: "CSK Home Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "Franchise Jerseys",
    team: "CSK",
    brand: "Spark",
    shortDescription: "Yellow Army — Chennai Super Kings jersey.",
    fullDescription:
      "Join the Yellow Army with the CSK Home Cricket Jersey 2025. Bright yellow with the iconic lion crest, made from breathable performance fabric.",
    price: 45,
    stock: 130,
    sizes: APPAREL_SIZES,
    colors: ["Yellow", "Blue"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "csk", "franchise", "ipl"],
    featured: true,
    onSale: false,
  },
  {
    title: "MI Home Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "Franchise Jerseys",
    team: "MI",
    brand: "Spark",
    shortDescription: "Mumbai Indians' blue and gold jersey.",
    fullDescription:
      "Duniya Hila Denge — the MI Home Cricket Jersey 2025 in blue and gold. Lightweight fabric with the Mumbai Indians crest for every faithful fan.",
    price: 46,
    stock: 125,
    sizes: APPAREL_SIZES,
    colors: ["Blue", "Gold"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "mi", "franchise", "ipl"],
    featured: true,
    onSale: false,
  },
  {
    title: "RCB Home Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "Franchise Jerseys",
    team: "RCB",
    brand: "Spark",
    shortDescription: "Play Bold — Royal Challengers Bengaluru.",
    fullDescription:
      "Play bold with the RCB Home Cricket Jersey 2025. Red, black and gold in a striking design with the RCB crest and breathable fabric.",
    price: 47,
    comparePrice: 58,
    stock: 140,
    sizes: APPAREL_SIZES,
    colors: ["Red", "Black", "Gold"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "rcb", "franchise", "ipl"],
    featured: true,
    onSale: true,
  },
  {
    title: "KKR Home Cricket Jersey 2025",
    sport: "cricket",
    gender: "men",
    category: "Franchise Jerseys",
    team: "KKR",
    brand: "Spark",
    shortDescription: "Korbo, Lorbo, Jeetbo — KKR jersey.",
    fullDescription:
      "The KKR Home Cricket Jersey 2025 in purple and gold. Sleek design with the Knight Riders crest, made to keep you cool under pressure.",
    price: 45,
    stock: 118,
    sizes: APPAREL_SIZES,
    colors: ["Purple", "Gold"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "kkr", "franchise", "ipl"],
    featured: false,
    onSale: false,
  },

  // ============================= CRICKET — WOMEN =============================
  {
    title: "India Women's Cricket Jersey 2025",
    sport: "cricket",
    gender: "women",
    category: "International Jerseys",
    team: "India",
    brand: "Spark",
    shortDescription: "Women in Blue — India's 2025 jersey.",
    fullDescription:
      "Back the Women in Blue with the India Women's Cricket Jersey 2025. Female-specific fit with premium breathable fabric and the official crest.",
    price: 44,
    stock: 60,
    sizes: APPAREL_SIZES,
    colors: ["Navy", "Sky Blue"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "india", "national", "women"],
    featured: true,
    onSale: false,
  },
  {
    title: "Australia Women's Cricket Jersey 2025",
    sport: "cricket",
    gender: "women",
    category: "International Jerseys",
    team: "Australia",
    brand: "Spark",
    shortDescription: "Australia women's 2025 cricket jersey.",
    fullDescription:
      "Support the world champions with the Australia Women's Cricket Jersey 2025. Tailored fit in yellow and green with lightweight fabric.",
    price: 45,
    stock: 55,
    sizes: APPAREL_SIZES,
    colors: ["Yellow", "Green"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "australia", "national", "women"],
    featured: false,
    onSale: false,
  },

  // ============================= CRICKET — KIDS =============================
  {
    title: "Bangladesh Kids Cricket Jersey 2025",
    sport: "cricket",
    gender: "kids",
    category: "International Jerseys",
    team: "Bangladesh",
    brand: "Spark",
    shortDescription: "Tigers jersey for young cricket fans.",
    fullDescription:
      "Get your young fan cheering with the Bangladesh Kids Cricket Jersey 2025. Soft, breathable fabric in the Tigers' red and green.",
    price: 32,
    stock: 80,
    sizes: ["XS", "S", "M"],
    colors: ["Red", "Green"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "bangladesh", "national", "kids"],
    featured: true,
    onSale: false,
  },
  {
    title: "India Kids Cricket Jersey 2025",
    sport: "cricket",
    gender: "kids",
    category: "International Jerseys",
    team: "India",
    brand: "Spark",
    shortDescription: "Little fan? Get the Men in Blue kids kit.",
    fullDescription:
      "The India Kids Cricket Jersey 2025 brings the blue of Team India to your young supporter. Lightweight, comfortable and match-ready.",
    price: 33,
    comparePrice: 40,
    stock: 85,
    sizes: ["XS", "S", "M"],
    colors: ["Navy", "Sky Blue"],
    imageUrl: CRICKET_IMG,
    tags: ["cricket", "india", "national", "kids"],
    featured: false,
    onSale: true,
  },

  // ============================= ACCESSORIES =============================
  {
    title: "FanKit Team Cap",
    sport: "accessories",
    gender: "unisex",
    category: "Caps",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Classic adjustable cap with embroidered logo.",
    fullDescription:
      "Finish your match-day look with the FanKit Team Cap. Adjustable fit, breathable mesh, and an embroidered FanKit logo. One size fits most.",
    price: 18,
    comparePrice: 24,
    stock: 200,
    sizes: null,
    colors: ["Black", "Navy", "Red"],
    imageUrl: CAP_IMG,
    tags: ["accessories", "cap", "fan-kit"],
    featured: true,
    onSale: true,
  },
  {
    title: "Football Scarf - Classic Stripes",
    sport: "accessories",
    gender: "unisex",
    category: "Scarves",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Woven supporter scarf in team colors.",
    fullDescription:
      "Wrap yourself in club pride with the Classic Stripes Football Scarf. Soft woven cotton blend, made for terraces and cold match nights.",
    price: 15,
    stock: 180,
    sizes: null,
    colors: ["Red", "Blue", "Green"],
    imageUrl: SCARF_IMG,
    tags: ["accessories", "scarf", "fan-kit"],
    featured: true,
    onSale: false,
  },
  {
    title: "Athletic Football Socks (Pair)",
    sport: "accessories",
    gender: "unisex",
    category: "Socks",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Cushioned performance socks for match day.",
    fullDescription:
      "Step up your comfort with Athletic Football Socks. Cushioned heel and toe, moisture-wicking knit, and a snug arch support fit.",
    price: 12,
    stock: 300,
    sizes: ["S/M", "M/L", "L/XL"],
    colors: ["White", "Black"],
    imageUrl: SOCKS_IMG,
    tags: ["accessories", "socks", "fan-kit"],
    featured: false,
    onSale: false,
  },
  {
    title: "FanKit Water Bottle 750ml",
    sport: "accessories",
    gender: "unisex",
    category: "Water Bottles",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Leak-proof sports bottle with straw cap.",
    fullDescription:
      "Stay hydrated with the FanKit Water Bottle. BPA-free, leak-proof, and easy to carry with a flip-top straw. Holds 750ml.",
    price: 14,
    comparePrice: 18,
    stock: 260,
    sizes: null,
    colors: ["Red", "Blue", "Black"],
    imageUrl: BOTTLE_IMG,
    tags: ["accessories", "water-bottle", "fan-kit"],
    featured: false,
    onSale: true,
  },
  {
    title: "Team Gym Bag",
    sport: "accessories",
    gender: "unisex",
    category: "Gym Bags",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Spacious duffel with shoe compartment.",
    fullDescription:
      "Carry all your kit with the Team Gym Bag. Large main compartment, separate shoe pocket, and adjustable shoulder strap.",
    price: 35,
    stock: 90,
    sizes: null,
    colors: ["Black", "Navy"],
    imageUrl: BAG_IMG,
    tags: ["accessories", "gym-bag", "fan-kit"],
    featured: true,
    onSale: false,
  },
  {
    title: "Silicone Wristbands (Pack of 5)",
    sport: "accessories",
    gender: "unisex",
    category: "Wristbands",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Debossed silicone bands in team colors.",
    fullDescription:
      "Show your support in style with Silicone Wristbands. Pack of 5 debossed bands in team colors, printed with the FanKit logo.",
    price: 8,
    stock: 400,
    sizes: null,
    colors: ["Red", "Green", "Blue", "Yellow", "Black"],
    imageUrl: WRISTBAND_IMG,
    tags: ["accessories", "wristbands", "fan-kit"],
    featured: false,
    onSale: false,
  },
  {
    title: "FanKit Logo Keychain",
    sport: "accessories",
    gender: "unisex",
    category: "Keychains",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Metal keyring with logo tag.",
    fullDescription:
      "Carry FanKit with you everywhere. A durable metal keyring with an enamel logo tag and team color accents.",
    price: 5,
    stock: 500,
    sizes: null,
    colors: ["Red", "Blue"],
    imageUrl: KEYCHAIN_IMG,
    tags: ["accessories", "keychain", "fan-kit"],
    featured: false,
    onSale: false,
  },
  {
    title: "Team Sticker Pack",
    sport: "accessories",
    gender: "unisex",
    category: "Stickers",
    team: "FanKit",
    brand: "FanKit",
    shortDescription: "Set of 10 vinyl die-cut stickers.",
    fullDescription:
      "Deck out your laptop, bottle or car with the Team Sticker Pack. 10 weatherproof vinyl die-cut stickers with team crests and slogans.",
    price: 6,
    comparePrice: 9,
    stock: 600,
    sizes: null,
    colors: ["Multi"],
    imageUrl: STICKER_IMG,
    tags: ["accessories", "stickers", "fan-kit"],
    featured: false,
    onSale: true,
  },
];

async function run() {
  try {
    await client.connect();
    const col = collections.products();

    const { deletedCount } = await col.deleteMany({});
    console.log(`Cleared ${deletedCount} existing products.`);

    const docs = products.map((p, i) => ({
      _id: new ObjectId(),
      title: p.title,
      slug: slugify(p.title),
      sport: p.sport,
      gender: p.gender,
      category: p.category,
      team: p.team,
      brand: p.brand ?? "FanKit",
      season: p.season ?? (p.title.match(/20\d\d/)?.[0] ?? "2026"),
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      price: p.price,
      comparePrice: p.comparePrice ?? null,
      stock: p.stock,
      sku: p.sku ?? makeSku(p.sport, p.title, i),
      sizes: p.sizes ?? [],
      colors: p.colors,
      imageUrl: p.imageUrl,
      images: [p.imageUrl],
      tags: p.tags,
      featured: p.featured,
      newArrival: p.newArrival ?? (p.title.match(/20\d\d/)?.[0] ?? "2026") === "2026",
      onSale: p.onSale,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      status: p.status ?? "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await col.insertMany(docs);
    console.log(`Seeded ${result.insertedCount} products successfully.`);
    await client.close();
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

run();
