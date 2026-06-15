export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverUrl: string;
  categories: string[];
  publishedDate: string;
  publisher: string;
  language: string;
  averageRating?: number;
  previewLink?: string;
}

// Client-side cache for prefetched books
const prefetchCache = new Map<string, Book>();

// Client-side caches for lists (persists during client-side navigation)
const categoryCache = new Map<string, Book[]>();
const trendingCache = new Map<number, Book[]>();
let bookOfTheDayCache: Book | null = null;

// Safe localStorage helper functions checking for SSR context
function getStoredItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error("Error reading localStorage key", key, e);
    return null;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error writing localStorage key", key, e);
  }
}

export function getCachedBook(id: string): Book | undefined {
  return prefetchCache.get(id);
}

export function cacheBook(book: Book) {
  prefetchCache.set(book.id, book);
}

// Rich mock database to use as a fallback if Google Books API is rate-limited (429) or offline
const MOCK_BOOKS: Book[] = [
  {
    id: "mock-1",
    title: "Dune",
    authors: ["Frank Herbert"],
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange, a drug capable of extending life and enhancing consciousness.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
    categories: ["Sci-Fi", "Classic"],
    publishedDate: "1965",
    publisher: "Chilton Books",
    language: "en",
    averageRating: 4.7,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-2",
    title: "The Great Gatsby",
    authors: ["F. Scott Fitzgerald"],
    description: "The Great Gatsby, F. Scott Fitzgerald's third book, stands as the supreme achievement of his career. This novel of the Jazz Age has been acclaimed by generations of readers.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    categories: ["Fiction", "Classic"],
    publishedDate: "1925",
    publisher: "Charles Scribner's Sons",
    language: "en",
    averageRating: 4.5,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-3",
    title: "1984",
    authors: ["George Orwell"],
    description: "Winston Smith reins in his rebellion against the Party in a totalitarian world where Big Brother is watching him. 1984 is George Orwell's chilling prophecy about the future.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    categories: ["Fiction", "Dystopian"],
    publishedDate: "1949",
    publisher: "Secker & Warburg",
    language: "en",
    averageRating: 4.6,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-4",
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    description: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
    categories: ["Fiction", "Fantasy"],
    publishedDate: "1937",
    publisher: "George Allen & Unwin",
    language: "en",
    averageRating: 4.8,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-5",
    title: "Project Hail Mary",
    authors: ["Andy Weir"],
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity and the earth. Except that right now, he doesn't know that. He can't even remember his own name, let alone the nature of his assignment or how to complete it.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    categories: ["Sci-Fi", "Thriller"],
    publishedDate: "2021",
    publisher: "Ballantine Books",
    language: "en",
    averageRating: 4.7,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-6",
    title: "Atomic Habits",
    authors: ["James Clear"],
    description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    categories: ["Psychology", "Self-Help"],
    publishedDate: "2018",
    publisher: "Avery",
    language: "en",
    averageRating: 4.8,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-7",
    title: "Designing Data-Intensive Applications",
    authors: ["Martin Kleppmann"],
    description: "Want to know how the best software engines are built? This book helps you navigate the diverse and fast-changing landscape of technologies for storing and processing data.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg",
    categories: ["Computers", "Technology"],
    publishedDate: "2017",
    publisher: "O'Reilly Media",
    language: "en",
    averageRating: 4.9,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-8",
    title: "Clean Code",
    authors: ["Robert C. Martin"],
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    categories: ["Computers", "Software Development"],
    publishedDate: "2008",
    publisher: "Prentice Hall",
    language: "en",
    averageRating: 4.4,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-9",
    title: "The Pragmatic Programmer",
    authors: ["David Thomas", "Andrew Hunt"],
    description: "The Pragmatic Programmer is one of those tech books that are read, re-read, and read again by coding teams. It covers topics ranging from personal responsibility and career development to architectural techniques.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
    categories: ["Computers", "Professional Practice"],
    publishedDate: "1999",
    publisher: "Addison-Wesley Professional",
    language: "en",
    averageRating: 4.8,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-10",
    title: "The Midnight Library",
    authors: ["Matt Haig"],
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    categories: ["Fiction", "Fantasy"],
    publishedDate: "2020",
    publisher: "Viking",
    language: "en",
    averageRating: 4.3,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-11",
    title: "Educated",
    authors: ["Tara Westover"],
    description: "An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    categories: ["Biography", "Memoir"],
    publishedDate: "2018",
    publisher: "Random House",
    language: "en",
    averageRating: 4.6,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-13",
    title: "To Kill a Mockingbird",
    authors: ["Harper Lee"],
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Through the young eyes of Scout and Jem Finch, Harper Lee explores with rich humor and unswerving honesty the irrationality of adult attitudes toward race and class in the Deep South of the 1930s.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
    categories: ["Fiction", "Classic"],
    publishedDate: "1960",
    publisher: "J. B. Lippincott & Co.",
    language: "en",
    averageRating: 4.8,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-14",
    title: "The Catcher in the Rye",
    authors: ["J.D. Salinger"],
    description: "The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield. Through circumstances that tend to preclude adult, second-hand description, he leaves his prep school in Pennsylvania and goes underground in New York City for three days.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
    categories: ["Fiction", "Classic"],
    publishedDate: "1951",
    publisher: "Little, Brown and Company",
    language: "en",
    averageRating: 4.0,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-15",
    title: "Brave New World",
    authors: ["Aldous Huxley"],
    description: "Aldous Huxley's profoundly important classic of world literature, Brave New World is a searching vision of an unequal, technologically-advanced future where humans are genetically bred, socially indoctrinated, and pharmaceutically anesthetized to passively uphold an authoritarian ruling order.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
    categories: ["Fiction", "Dystopian"],
    publishedDate: "1932",
    publisher: "Chatto & Windus",
    language: "en",
    averageRating: 4.3,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-16",
    title: "The Alchemist",
    authors: ["Paulo Coelho"],
    description: "Paulo Coelho's masterwork tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. His quest will lead him to riches far different—and far more satisfying—than he ever imagined.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
    categories: ["Fiction", "Fantasy"],
    publishedDate: "1988",
    publisher: "HarperOne",
    language: "en",
    averageRating: 4.2,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-17",
    title: "The Book Thief",
    authors: ["Markus Zusak"],
    description: "It is 1939. Nazi Germany. The country is holding its breath. Death has never been busier, and will become busier still. Liesel Meminger is a foster girl living outside of Munich, who scratches out a meager existence for herself by stealing when she encounters something she can't resist—books.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
    categories: ["Fiction", "Historical"],
    publishedDate: "2005",
    publisher: "Knopf Books",
    language: "en",
    averageRating: 4.6,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-18",
    title: "Gone Girl",
    authors: ["Gillian Flynn"],
    description: "On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary. Presents are being wrapped and reservations are being made when Nick's clever and beautiful wife disappears. As the investigation unfolds, each partner tells a story of betrayal.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg",
    categories: ["Fiction", "Thriller"],
    publishedDate: "2012",
    publisher: "Crown Publishing",
    language: "en",
    averageRating: 4.1,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-19",
    title: "The Fault in Our Stars",
    authors: ["John Green"],
    description: "Despite the tumor-shrinking medical miracle that has bought her a few years, Hazel has never been anything but terminal, her final chapter inscribed upon diagnosis. But when a gorgeous plot twist named Augustus Waters suddenly appears at Cancer Kid Support Group, Hazel's story is about to be completely rewritten.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780525478812-L.jpg",
    categories: ["Fiction", "Romance"],
    publishedDate: "2012",
    publisher: "Dutton Books",
    language: "en",
    averageRating: 4.4,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-20",
    title: "The Kite Runner",
    authors: ["Khaled Hosseini"],
    description: "The unforgettable, heartbreaking story of the unlikely friendship between a wealthy boy and the son of his father's servant, The Kite Runner is a beautifully crafted novel set in a country that is in the process of being destroyed.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
    categories: ["Fiction", "Drama"],
    publishedDate: "2003",
    publisher: "Riverhead Books",
    language: "en",
    averageRating: 4.5,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-21",
    title: "Life of Pi",
    authors: ["Yann Martel"],
    description: "Life of Pi is a fantasy adventure novel about an Indian boy named Pi, a zookeeper's son who finds himself in the company of a hyena, zebra, orangutan, and a Bengal tiger after a shipwreck sets him adrift in the Pacific Ocean on a lifeboat.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780156027328-L.jpg",
    categories: ["Fiction", "Adventure"],
    publishedDate: "2001",
    publisher: "Knopf Canada",
    language: "en",
    averageRating: 4.3,
    previewLink: "https://books.google.com"
  },
  {
    id: "mock-22",
    title: "The Girl on the Train",
    authors: ["Paula Hawkins"],
    description: "Rachel takes the same commuter train every morning and night. Every day she rattles down the track, flashes past a stretch of cozy suburban houses, and stops at the signal that allows her to daily watch the same couple breakfasting on their deck. She even has names for them—Jess and Jason.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594634024-L.jpg",
    categories: ["Fiction", "Mystery"],
    publishedDate: "2015",
    publisher: "Riverhead Books",
    language: "en",
    averageRating: 3.9,
    previewLink: "https://books.google.com"
  }
];

// Fallback search logic on mock books
export function getMockSearchBooks(
  query: string,
  filters?: {
    year?: string;
    genre?: string;
    author?: string;
    language?: string;
  }
): Book[] {
  let list = [...MOCK_BOOKS];
  
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q))
    );
  }
  
  if (filters?.genre) {
    const g = filters.genre.toLowerCase();
    list = list.filter((b) => b.categories.some((c) => c.toLowerCase().includes(g)));
  }
  
  if (filters?.author) {
    const a = filters.author.toLowerCase();
    list = list.filter((b) => b.authors.some((author) => author.toLowerCase().includes(a)));
  }

  if (filters?.year) {
    list = list.filter((b) => b.publishedDate.startsWith(filters.year!));
  }

  if (filters?.language) {
    list = list.filter((b) => b.language === filters.language);
  }

  return list;
}

// Fallback category filter on mock books
export function getMockCategoryBooks(category: string, limit = 12): Book[] {
  const cat = category.toLowerCase();
  let filtered = MOCK_BOOKS.filter((book) =>
    book.categories.some((c) => c.toLowerCase().includes(cat))
  );
  if (filtered.length === 0) {
    // If no direct matches, return general fiction/all items
    filtered = MOCK_BOOKS;
  }
  return filtered.slice(0, limit);
}

export function getMockTrendingBooks(limit = 12): Book[] {
  return [...MOCK_BOOKS]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, limit);
}

// Convert low-res cover image URL from Google Books into a high-res secure URL
export function getHighResCover(url?: string): string {
  if (!url) {
    return "";
  }
  let secureUrl = url.replace("http://", "https://");
  if (secureUrl.includes("zoom=1")) {
    secureUrl = secureUrl.replace("zoom=1", "zoom=3");
  } else if (secureUrl.includes("zoom=5")) {
    secureUrl = secureUrl.replace("zoom=5", "zoom=3");
  }
  secureUrl = secureUrl.replace("&edge=curl", "");
  return secureUrl;
}

// Parse Google Books API volume data into clean Book interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGoogleBook(volume: Record<string, any>): Book {
  const info = volume.volumeInfo || {};
  return {
    id: volume.id,
    title: info.title || "Untitled",
    authors: info.authors || ["Unknown Author"],
    description: info.description || "No description available.",
    coverUrl: getHighResCover(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
    categories: info.categories || ["General"],
    publishedDate: info.publishedDate || "Unknown date",
    publisher: info.publisher || "Unknown publisher",
    language: info.language || "en",
    averageRating: info.averageRating,
    previewLink: info.previewLink,
  };
}

// ─── Open Library API Integration ───────────────────────────────────
// Free, no API key required, massive catalog (40M+ books)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOpenLibraryBook(doc: Record<string, any>): Book {
  const coverId = doc.cover_i;
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : "";

  return {
    id: `ol-${doc.key?.replace("/works/", "") || doc.edition_key?.[0] || Math.random().toString(36).slice(2)}`,
    title: doc.title || "Untitled",
    authors: doc.author_name || ["Unknown Author"],
    description:
      (typeof doc.first_sentence === "string"
        ? doc.first_sentence
        : doc.first_sentence?.[0]) || "No description available.",
    coverUrl,
    categories: doc.subject?.slice(0, 2) || ["General"],
    publishedDate: doc.first_publish_year?.toString() || "Unknown date",
    publisher: doc.publisher?.[0] || "Unknown publisher",
    language: doc.language?.[0] || "en",
    averageRating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : undefined,
    previewLink: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
  };
}

async function searchOpenLibrary(
  query: string,
  limit = 20,
  filters?: { genre?: string; author?: string; year?: string; language?: string }
): Promise<Book[]> {
  let q = query || "";
  if (filters?.author) q += ` author:${filters.author}`;
  if (!q.trim()) q = "popular fiction";

  let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,publisher,subject,language,ratings_average,first_sentence,edition_key`;
  if (filters?.language) url += `&language=${filters.language}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);

  const data = await res.json();
  if (!data.docs || data.docs.length === 0) return [];

  let books = data.docs.map(parseOpenLibraryBook);

  // Apply post-filters
  if (filters?.genre) {
    const g = filters.genre.toLowerCase();
    const filtered = books.filter((b: Book) =>
      b.categories.some((c: string) => c.toLowerCase().includes(g))
    );
    if (filtered.length > 0) books = filtered;
  }
  if (filters?.year) {
    const filtered = books.filter((b: Book) => b.publishedDate.startsWith(filters.year!));
    if (filtered.length > 0) books = filtered;
  }

  books.forEach(cacheBook);
  return books;
}

async function getOpenLibraryCategoryBooks(category: string, limit = 12): Promise<Book[]> {
  const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(category)}&limit=${limit}&sort=rating&fields=key,title,author_name,cover_i,first_publish_year,publisher,subject,language,ratings_average,first_sentence,edition_key`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library category fetch failed: ${res.status}`);

  const data = await res.json();
  if (!data.docs || data.docs.length === 0) return [];

  const books = data.docs.map(parseOpenLibraryBook);
  books.forEach(cacheBook);
  return books;
}

async function getOpenLibraryTrendingBooks(limit = 12): Promise<Book[]> {
  const url = `https://openlibrary.org/trending/daily.json?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library trending fetch failed: ${res.status}`);

  const data = await res.json();
  if (!data.works || data.works.length === 0) return [];

  const books = data.works.map((work: Record<string, unknown>) =>
    parseOpenLibraryBook({
      key: work.key,
      title: work.title,
      author_name: (work.author_name as string[]) || [((work.author_key as string[] | undefined)?.[0]) || "Unknown"],
      cover_i: work.cover_i,
      first_publish_year: work.first_publish_year,
      subject: (work as Record<string, unknown>).subject as string[],
    } as Record<string, unknown>)
  );
  books.forEach(cacheBook);
  return books;
}

// ─── Main API Functions (Google Books → Open Library → Mock) ────────

// Prefetch book details by ID
export async function prefetchBookDetails(id: string): Promise<Book | null> {
  if (prefetchCache.has(id)) {
    return prefetchCache.get(id)!;
  }
  
  if (id.startsWith("mock-")) {
    const mock = MOCK_BOOKS.find((b) => b.id === id);
    if (mock) {
      prefetchCache.set(id, mock);
      return mock;
    }
  }

  // Open Library IDs
  if (id.startsWith("ol-")) {
    const olKey = id.replace("ol-", "");
    try {
      const res = await fetch(`https://openlibrary.org/works/${olKey}.json`);
      if (res.ok) {
        const data = await res.json();
        const book = parseOpenLibraryBook({ ...data, key: `/works/${olKey}` });
        cacheBook(book);
        return book;
      }
    } catch (e) {
      console.error("Error fetching Open Library book:", e);
    }
    return MOCK_BOOKS[0];
  }

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
    if (!res.ok) {
      const mock = MOCK_BOOKS.find((b) => b.id === id) || MOCK_BOOKS[0];
      return mock;
    }
    const data = await res.json();
    const book = parseGoogleBook(data);
    cacheBook(book);
    return book;
  } catch (error) {
    console.error("Error prefetching book details:", error);
    const mock = MOCK_BOOKS.find((b) => b.id === id) || MOCK_BOOKS[0];
    return mock;
  }
}

// Query books: Google Books → Open Library → Mock
export async function searchBooks(
  query: string,
  filters?: {
    year?: string;
    genre?: string;
    author?: string;
    language?: string;
  }
): Promise<Book[]> {
  if (!query && !filters?.genre && !filters?.author) {
    return [];
  }

  // 1. Try Google Books API
  try {
    let q = query || "";
    if (filters?.genre) q += ` subject:${filters.genre}`;
    if (filters?.author) q += ` inauthor:${filters.author}`;
    if (!q.trim()) q = "reading";

    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20`;
    if (filters?.language) url += `&langRestrict=${filters.language}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        let books = data.items.map(parseGoogleBook);
        if (filters?.year) {
          books = books.filter((book: Book) => book.publishedDate.substring(0, 4) === filters.year);
        }
        books.forEach(cacheBook);
        return books;
      }
    }
  } catch (error) {
    console.warn("Google Books search failed, trying Open Library:", error);
  }

  // 2. Fallback: Open Library API
  try {
    const olBooks = await searchOpenLibrary(query, 20, filters);
    if (olBooks.length > 0) return olBooks;
  } catch (error) {
    console.warn("Open Library search also failed, using mock data:", error);
  }

  // 3. Final fallback: Mock data
  return getMockSearchBooks(query, filters);
}

// Fetch list of books by category: Google Books → Open Library → Mock
export async function getCategoryBooks(category: string, limit = 12): Promise<Book[]> {
  const cacheKey = `${category}-${limit}`;
  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey)!;
  }
  const stored = getStoredItem<Book[]>(`bookflix_cat_${cacheKey}`);
  if (stored && stored.length > 0) {
    categoryCache.set(cacheKey, stored);
    return stored;
  }

  let books: Book[] = [];

  // 1. Try Google Books
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(category)}&orderBy=relevance&maxResults=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        books = data.items.map(parseGoogleBook);
      }
    }
  } catch (error) {
    console.warn(`Google Books category "${category}" failed, trying Open Library:`, error);
  }

  // 2. Fallback: Open Library
  if (books.length === 0) {
    try {
      const olBooks = await getOpenLibraryCategoryBooks(category, limit);
      if (olBooks.length > 0) books = olBooks;
    } catch (error) {
      console.warn(`Open Library category "${category}" also failed, using mock:`, error);
    }
  }

  // 3. Final fallback: Mock
  if (books.length === 0) {
    books = getMockCategoryBooks(category, limit);
  }

  if (books.length > 0) {
    books.forEach(cacheBook);
    categoryCache.set(cacheKey, books);
    setStoredItem(`bookflix_cat_${cacheKey}`, books);
  }
  return books;
}

// Fetch trending books: Google Books → Open Library → Mock
export async function getTrendingBooks(limit = 12): Promise<Book[]> {
  if (trendingCache.has(limit)) {
    return trendingCache.get(limit)!;
  }
  const stored = getStoredItem<Book[]>(`bookflix_trending_${limit}`);
  if (stored && stored.length > 0) {
    trendingCache.set(limit, stored);
    return stored;
  }

  let books: Book[] = [];

  // 1. Try Google Books
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=bestsellers&orderBy=newest&maxResults=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        books = data.items.map(parseGoogleBook);
      }
    }
  } catch (error) {
    console.warn("Google Books trending failed, trying Open Library:", error);
  }

  // 2. Fallback: Open Library trending
  if (books.length === 0) {
    try {
      const olBooks = await getOpenLibraryTrendingBooks(limit);
      if (olBooks.length > 0) books = olBooks;
    } catch (error) {
      console.warn("Open Library trending also failed, using mock:", error);
    }
  }

  // 3. Final fallback: Mock
  if (books.length === 0) {
    books = getMockTrendingBooks(limit);
  }

  if (books.length > 0) {
    books.forEach(cacheBook);
    trendingCache.set(limit, books);
    setStoredItem(`bookflix_trending_${limit}`, books);
  }
  return books;
}

// Fetch featured Book of the Day
export async function getBookOfTheDay(): Promise<Book> {
  if (bookOfTheDayCache) {
    return bookOfTheDayCache;
  }
  const stored = getStoredItem<Book>("bookflix_book_of_the_day");
  if (stored) {
    bookOfTheDayCache = stored;
    return stored;
  }

  const books = await getTrendingBooks(5);
  let book: Book = MOCK_BOOKS[0];
  if (books.length > 0) {
    const day = new Date().getDate();
    book = books[day % books.length];
  }
  bookOfTheDayCache = book;
  setStoredItem("bookflix_book_of_the_day", book);
  return book;
}

