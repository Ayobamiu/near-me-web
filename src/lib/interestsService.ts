// Predefined interest categories and options (same as mobile app)
export const INTEREST_CATEGORIES: Record<string, { name: string; icon: string; options: string[] }> = {
    technology: {
        name: "Technology",
        icon: "💻",
        options: [
            "Programming",
            "AI & Machine Learning",
            "Mobile Development",
            "Web Development",
            "Data Science",
            "Cybersecurity",
            "Blockchain",
            "IoT",
            "Cloud Computing",
            "DevOps",
        ],
    },
    sports: {
        name: "Sports",
        icon: "⚽",
        options: [
            "Football",
            "Basketball",
            "Tennis",
            "Swimming",
            "Running",
            "Cycling",
            "Gym",
            "Yoga",
            "Hiking",
            "Skiing",
        ],
    },
    music: {
        name: "Music",
        icon: "🎵",
        options: [
            "Rock",
            "Pop",
            "Hip Hop",
            "Electronic",
            "Jazz",
            "Classical",
            "Country",
            "R&B",
            "Indie",
            "Reggae",
        ],
    },
    arts: {
        name: "Arts & Culture",
        icon: "🎨",
        options: [
            "Painting",
            "Photography",
            "Writing",
            "Dancing",
            "Theater",
            "Film",
            "Literature",
            "Museums",
            "Design",
            "Crafts",
        ],
    },
    food: {
        name: "Food & Drink",
        icon: "🍕",
        options: [
            "Cooking",
            "Baking",
            "Coffee",
            "Wine",
            "Craft Beer",
            "Fine Dining",
            "Street Food",
            "Vegetarian",
            "Vegan",
            "Mixology",
        ],
    },
    travel: {
        name: "Travel",
        icon: "✈️",
        options: [
            "Backpacking",
            "Luxury Travel",
            "Adventure Travel",
            "Cultural Tourism",
            "Beach Holidays",
            "City Breaks",
            "Road Trips",
            "Solo Travel",
            "Group Travel",
            "Eco Tourism",
        ],
    },
    lifestyle: {
        name: "Lifestyle",
        icon: "🌟",
        options: [
            "Fitness",
            "Meditation",
            "Fashion",
            "Beauty",
            "Home Decor",
            "Gardening",
            "Pets",
            "Parenting",
            "Sustainability",
            "Minimalism",
        ],
    },
    business: {
        name: "Business & Career",
        icon: "💼",
        options: [
            "Entrepreneurship",
            "Marketing",
            "Sales",
            "Finance",
            "Management",
            "Consulting",
            "Networking",
            "Startups",
            "Investing",
            "Leadership",
        ],
    },
    education: {
        name: "Education & Learning",
        icon: "📚",
        options: [
            "Languages",
            "Online Courses",
            "Certifications",
            "Research",
            "Teaching",
            "Mentoring",
            "Public Speaking",
            "Writing",
            "History",
            "Science",
        ],
    },
    entertainment: {
        name: "Entertainment",
        icon: "🎬",
        options: [
            "Movies",
            "TV Shows",
            "Gaming",
            "Podcasts",
            "Comedy",
            "Gaming",
            "Board Games",
            "Video Games",
            "Streaming",
            "Anime",
        ],
    },
};

// Get all available interests as a flat array
export const getAllInterests = (): string[] => {
    const allInterests: string[] = [];
    Object.values(INTEREST_CATEGORIES).forEach(category => {
        allInterests.push(...category.options);
    });
    return allInterests;
};

// Get interests by category
export const getInterestsByCategory = (category: string): string[] => {
    return INTEREST_CATEGORIES[category]?.options || [];
};

// Get category for a specific interest
export const getCategoryForInterest = (interest: string): string | null => {
    for (const [categoryKey, category] of Object.entries(INTEREST_CATEGORIES)) {
        if (category.options.includes(interest)) {
            return categoryKey;
        }
    }
    return null;
};

// Validate if an interest is valid
export const isValidInterest = (interest: string): boolean => {
    return getAllInterests().includes(interest);
};

// Get popular interests (most common ones)
export const getPopularInterests = (): string[] => {
    return [
        "Programming",
        "Fitness",
        "Music",
        "Travel",
        "Photography",
        "Cooking",
        "Gaming",
        "Reading",
        "Movies",
        "Art",
    ];
};
