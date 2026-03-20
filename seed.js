require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");
const Story = require("./models/Story");
const Message = require("./models/Message");
const Notification = require("./models/Notification");

const USERS = [
    {
        username: "admin",
        email: "admin@blogs.com",
        password: "admin123",
        name: "Administrator",
        bio: "Platform Administrator | Managing Blogs",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop",
        role: "admin",
        isVerified: true
    },
    {
        username: "moderator",
        email: "mod@blogs.com",
        password: "mod123",
        name: "Content Moderator",
        bio: "Community Moderator | Keeping things clean",
        avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop",
        role: "moderator",
        isVerified: true
    },
    {
        username: "demo",
        email: "demo@example.com",
        password: "demo123",
        name: "Demo User",
        bio: "This is a demo account for testing purposes.",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"
    },
    {
        username: "john_doe",
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        bio: "Photography enthusiast | Travel lover | Coffee addict ☕",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
    },
    {
        username: "sarah_smith",
        email: "sarah@example.com",
        password: "password123",
        name: "Sarah Smith",
        bio: "Designer | Artist | Cat mom 🐱 | Living my best life",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        isVerified: true
    },
    {
        username: "alex_tech",
        email: "alex@example.com",
        password: "password123",
        name: "Alex Johnson",
        bio: "Full-stack developer 💻 | Open source contributor | Tech blogger",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=150&h=150&fit=crop"
    },
    {
        username: "emma_wilson",
        email: "emma@example.com",
        password: "password123",
        name: "Emma Wilson",
        bio: "Fitness coach 💪 | Healthy living | Yoga instructor",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        isVerified: true
    },
    {
        username: "mike_photos",
        email: "mike@example.com",
        password: "password123",
        name: "Mike Anderson",
        bio: "Professional photographer 📸 | Nature lover | Adventure seeker",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
    },
    {
        username: "lisa_foodie",
        email: "lisa@example.com",
        password: "password123",
        name: "Lisa Chen",
        bio: "Food blogger 🍕 | Recipe creator | Restaurant reviewer",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
        isVerified: true
    },
    {
        username: "david_music",
        email: "david@example.com",
        password: "password123",
        name: "David Brown",
        bio: "Musician 🎸 | Producer | Concert enthusiast | Vinyl collector",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop"
    },
    {
        username: "sophie_art",
        email: "sophie@example.com",
        password: "password123",
        name: "Sophie Martinez",
        bio: "Digital artist 🎨 | Illustrator | NFT creator | Dream chaser",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
    },
    {
        username: "james_travel",
        email: "james@example.com",
        password: "password123",
        name: "James Taylor",
        bio: "World traveler ✈️ | 50+ countries | Blogger | Living the dream",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
        isVerified: true
    },
    {
        username: "olivia_style",
        email: "olivia@example.com",
        password: "password123",
        name: "Olivia Davis",
        bio: "Fashion blogger 👗 | Style consultant | Trendsetter",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop"
    },
    {
        username: "ryan_fitness",
        email: "ryan@example.com",
        password: "password123",
        name: "Ryan Miller",
        bio: "Personal trainer 🏋️ | Nutrition expert | Motivational speaker",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop"
    },
    {
        username: "natalie_books",
        email: "natalie@example.com",
        password: "password123",
        name: "Natalie Turner",
        bio: "Book reviewer 📚 | Writer | Coffee lover | Introvert",
        avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop"
    },
    {
        username: "chris_gaming",
        email: "chris@example.com",
        password: "password123",
        name: "Chris Williams",
        bio: "Pro gamer 🎮 | Streamer | Esports enthusiast",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop"
    },
    {
        username: "maya_wellness",
        email: "maya@example.com",
        password: "password123",
        name: "Maya Patel",
        bio: "Wellness coach 🧘 | Mindfulness | Self-care advocate",
        avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop",
        isVerified: true
    },
    {
        username: "tom_architecture",
        email: "tom@example.com",
        password: "password123",
        name: "Tom Harrison",
        bio: "Architect 🏛️ | Design lover | Urban explorer",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop"
    },
    {
        username: "grace_nature",
        email: "grace@example.com",
        password: "password123",
        name: "Grace Kim",
        bio: "Nature photographer 🌿 | Environmentalist | Plant mom",
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop"
    },
    {
        username: "marcus_tech",
        email: "marcus@example.com",
        password: "password123",
        name: "Marcus Lee",
        bio: "Tech reviewer 📱 | Gadget enthusiast | Early adopter",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop"
    },
    {
        username: "isabella_dance",
        email: "isabella@example.com",
        password: "password123",
        name: "Isabella Rodriguez",
        bio: "Professional dancer 💃 | Choreographer | Movement artist",
        avatar: "https://images.unsplash.com/photo-1502323777036-f29e3972f658?w=150&h=150&fit=crop"
    },
    {
        username: "ethan_coffee",
        email: "ethan@example.com",
        password: "password123",
        name: "Ethan Brooks",
        bio: "Coffee connoisseur ☕ | Barista | Café hopper",
        avatar: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=150&h=150&fit=crop"
    },
    {
        username: "zoe_vintage",
        email: "zoe@example.com",
        password: "password123",
        name: "Zoe Anderson",
        bio: "Vintage collector 🎭 | Thrift finder | Retro lover",
        avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop"
    },
    {
        username: "daniel_film",
        email: "daniel@example.com",
        password: "password123",
        name: "Daniel Scott",
        bio: "Filmmaker 🎬 | Director | Visual storyteller",
        avatar: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=150&h=150&fit=crop"
    },
    {
        username: "ava_pets",
        email: "ava@example.com",
        password: "password123",
        name: "Ava Mitchell",
        bio: "Pet lover 🐾 | Dog mom x3 | Animal rescue volunteer",
        avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop"
    }
];

const POSTS = [
    {
        title: "Sunset Vibes Reel",
        caption: "Enjoying the sunset vibes 🌅 #sunset #vibes #reel",
        image: "https://videos.pexels.com/video-files/855909/855909-hd_1920_1080_30fps.mp4",
        mediaType: "video",
        location: "Malibu, California"
    },
    {
        title: "Cooking Masterclass",
        caption: "Teaching you how to make the best pasta! 🍝 #cooking #chef #foodie #reel",
        image: "https://videos.pexels.com/video-files/3196245/3196245-hd_1920_1080_25fps.mp4",
        mediaType: "video",
        location: "My Kitchen"
    },
    {
        title: "Morning Workout",
        caption: "Start your day with some energy! 💪 #fitness #workout #gym #reel",
        image: "https://videos.pexels.com/video-files/3116035/3116035-hd_1920_1080_25fps.mp4",
        mediaType: "video",
        location: "Gold's Gym"
    },
    {
        title: "City Driving Night",
        caption: "Night drive through the glowing city. 🌃 #drive #night #aesthetic #reel",
        image: "https://videos.pexels.com/video-files/5938887/5938887-hd_1920_1080_25fps.mp4",
        mediaType: "video",
        location: "Downtown City"
    },
    {
        title: "Beautiful Sunset",
        caption: "Caught this amazing sunset at the beach today! Nature never fails to amaze me. 🌅 #sunset #beach #nature #photography",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop",
        location: "Malibu Beach, California"
    },
    {
        title: "Morning Coffee",
        caption: "Starting my day with the perfect cup of coffee ☕ Nothing beats this moment of peace before the hustle begins.",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop",
        location: "Home Sweet Home"
    },
    {
        title: "Mountain Adventure",
        caption: "Reached the summit after 6 hours of hiking! The view was absolutely worth every step. 🏔️ #hiking #adventure #mountains",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=800&fit=crop",
        location: "Rocky Mountains, Colorado"
    },
    {
        title: "City Lights",
        caption: "The city never sleeps and neither do I tonight! 🌃 Love these night views. #citylife #nightphotography",
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=800&fit=crop",
        location: "New York City"
    },
    {
        title: "Homemade Pasta",
        caption: "Made fresh pasta from scratch today! 🍝 Nothing compares to homemade. Recipe coming soon! #foodie #homecooking",
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=800&fit=crop",
        location: "My Kitchen"
    },
    {
        title: "New Artwork",
        caption: "Finally finished this piece after 2 weeks of work! 🎨 What do you think? #art #digitalart #creative",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop",
        location: "Art Studio"
    },
    {
        title: "Gym Progress",
        caption: "3 months of consistent training and healthy eating! 💪 Never give up on your goals. #fitness #motivation #gym",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop",
        location: "Fitness Club"
    },
    {
        title: "Concert Night",
        caption: "Live music hits different! 🎵 Amazing show tonight. #concert #livemusic #music",
        image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=800&fit=crop",
        location: "Madison Square Garden"
    },
    {
        title: "Beach Day",
        caption: "Perfect weather for a beach day! 🏖️ Sun, sand, and good vibes. #beach #summer #vacation",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop",
        location: "Miami Beach"
    },
    {
        title: "Tokyo Streets",
        caption: "Lost in the beautiful chaos of Tokyo 🇯🇵 Every street tells a different story. #travel #japan #tokyo",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=800&fit=crop",
        location: "Shibuya, Tokyo"
    },
    {
        title: "Autumn Vibes",
        caption: "Fall colors are my absolute favorite 🍂 Nature's palette is unmatched. #autumn #fall #nature",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
        location: "Central Park, NYC"
    },
    {
        title: "Workspace Goals",
        caption: "Finally organized my workspace! 💻 Ready for productive days ahead. #workspace #productivity #tech",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=800&fit=crop",
        location: "Home Office"
    },
    {
        title: "Sushi Night",
        caption: "Best sushi in town! 🍣 Fresh and absolutely delicious. #sushi #foodporn #japanese",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=800&fit=crop",
        location: "Tokyo Sushi Bar"
    },
    {
        title: "Road Trip",
        caption: "Nothing beats a spontaneous road trip! 🚗 Freedom on the open road. #roadtrip #adventure #travel",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=800&fit=crop",
        location: "Route 66"
    },
    {
        title: "Yoga Morning",
        caption: "Starting the day with some yoga and meditation 🧘‍♀️ Peace of mind is priceless. #yoga #wellness #mindfulness",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop",
        location: "Sunrise Studio"
    },
    {
        title: "Street Art",
        caption: "Found this incredible mural today! 🎨 Street art makes cities so much more interesting. #streetart #urban #art",
        image: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=800&fit=crop",
        location: "Brooklyn, NYC"
    },
    {
        title: "Brunch Goals",
        caption: "Weekend brunch with amazing company! 🥂 Avocado toast never disappoints. #brunch #weekend #foodie",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=800&fit=crop",
        location: "The Brunch Club"
    },
    {
        title: "Northern Lights",
        caption: "Bucket list checked! ✨ Seeing the Aurora Borealis was absolutely magical. #northernlights #aurora #iceland",
        image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=800&fit=crop",
        location: "Reykjavik, Iceland"
    },
    {
        title: "New Puppy",
        caption: "Welcome to the family, Max! 🐕 My heart is so full right now. #puppy #doglife #cute",
        image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop",
        location: "Home"
    },
    {
        title: "Paris Dreams",
        caption: "The Eiffel Tower never gets old 🗼 Paris is always a good idea. #paris #france #travel",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=800&fit=crop",
        location: "Paris, France"
    },
    {
        title: "Smoothie Bowl",
        caption: "Healthy breakfast goals achieved! 🫐 Packed with nutrients and absolutely delicious. #healthyfood #breakfast",
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=800&fit=crop",
        location: "Health Kitchen"
    },
    {
        title: "Vintage Finds",
        caption: "Found some amazing vinyl records at the flea market today! 🎵 Treasure hunting success. #vinyl #vintage #music",
        image: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&h=800&fit=crop",
        location: "Brooklyn Flea Market"
    },
    {
        title: "Santorini Views",
        caption: "Blue domes and white buildings 🇬🇷 Greece is absolutely stunning. #santorini #greece #travel",
        image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=800&fit=crop",
        location: "Santorini, Greece"
    },
    {
        title: "Coffee Art",
        caption: "When your barista is also an artist ☕ Almost too pretty to drink! #coffee #latteart #cafe",
        image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&h=800&fit=crop",
        location: "Blue Bottle Coffee"
    },
    {
        title: "Camping Under Stars",
        caption: "Nothing like sleeping under the stars 🌌 Disconnecting to reconnect. #camping #stars #nature",
        image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&h=800&fit=crop",
        location: "Yosemite National Park"
    },
    {
        title: "Fresh Flowers",
        caption: "Brightening up my space with fresh flowers 🌸 Simple pleasures make the biggest difference. #flowers #home #decor",
        image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=800&fit=crop",
        location: "Local Flower Shop"
    },
    {
        title: "Skateboarding",
        caption: "Finally landed that trick! 🛹 Months of practice paid off. #skateboarding #skatelife #progress",
        image: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=800&h=800&fit=crop",
        location: "Venice Skate Park"
    },
    {
        title: "Rainy Days",
        caption: "There's something peaceful about rainy days ☔ Perfect weather for staying in. #rain #cozy #mood",
        image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&h=800&fit=crop",
        location: "Seattle"
    },
    {
        title: "Bali Paradise",
        caption: "Found my own piece of paradise 🌴 Bali is everything and more. #bali #indonesia #paradise",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=800&fit=crop",
        location: "Ubud, Bali"
    },
    {
        title: "Book Lover",
        caption: "Currently reading my 20th book this year! 📚 There's no better escape. #books #reading #bookworm",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop",
        location: "Cozy Corner"
    },
    {
        title: "Golden Hour",
        caption: "Caught the perfect golden hour light today 🌅 These moments are what life is about. #goldenhour #photography #nature",
        image: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=800&fit=crop",
        location: "California Coast"
    },
    {
        title: "City Architecture",
        caption: "The lines and angles of modern architecture never cease to amaze me 🏙️ #architecture #design #urban",
        image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=800&fit=crop",
        location: "Dubai"
    },
    {
        title: "Morning Routine",
        caption: "Starting every day with intention ☀️ What's your morning ritual? #morningroutine #wellness #mindfulness",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=800&fit=crop",
        location: "Home"
    },
    {
        title: "Street Food Adventure",
        caption: "Nothing beats authentic street food 🍜 This was absolutely delicious! #streetfood #foodie #travel",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=800&fit=crop",
        location: "Bangkok, Thailand"
    },
    {
        title: "Meditation Space",
        caption: "Created my own little zen corner 🧘‍♂️ Peace starts from within. #meditation #zen #mindfulness",
        image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=800&fit=crop",
        location: "Home Studio"
    },
    {
        title: "Vintage Car Show",
        caption: "Classic beauties at the car show today 🚗 They don't make them like this anymore! #vintagecar #classic #automotive",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=800&fit=crop",
        location: "Classic Car Museum"
    },
    {
        title: "Mountain Lake",
        caption: "Mirror-like reflections on the lake today 🏔️ Nature's perfection. #lake #mountains #reflection",
        image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=800&fit=crop",
        location: "Lake Louise, Canada"
    },
    {
        title: "Home Garden",
        caption: "My little urban garden is thriving! 🌱 Growing your own food is so rewarding. #gardening #urbanfarm #sustainable",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop",
        location: "Backyard"
    },
    {
        title: "Dessert Heaven",
        caption: "This dessert was almost too pretty to eat 🍰 Almost. #dessert #foodporn #sweet",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop",
        location: "Patisserie"
    },
    {
        title: "Sunrise Run",
        caption: "5am runs hit different when the sunrise looks like this 🌄 #running #fitness #sunrise",
        image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&h=800&fit=crop",
        location: "Coastal Trail"
    },
    {
        title: "Cozy Reading Nook",
        caption: "Perfect spot for a rainy day read ☔📖 #reading #cozy #books",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
        location: "Home Library"
    },
    {
        title: "Beach Sunset",
        caption: "Another perfect ending to an amazing day 🌊 #beach #sunset #ocean",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop",
        location: "Maldives"
    },
    {
        title: "Street Performance",
        caption: "Stumbled upon this amazing street performer today 🎻 Pure talent! #streetart #music #performance",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
        location: "Paris Streets"
    },
    {
        title: "Homemade Bread",
        caption: "Fresh bread from scratch 🍞 The smell is incredible! #baking #homemade #bread",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop",
        location: "Kitchen"
    },
    {
        title: "Night Sky",
        caption: "Millions of stars visible tonight ✨ No light pollution here! #nightsky #stars #astrophotography",
        image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=800&fit=crop",
        location: "Desert"
    },
    {
        title: "Art Gallery Visit",
        caption: "Lost in art for hours today 🎨 Every piece tells a story. #art #gallery #museum",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop",
        location: "MoMA"
    },
    {
        title: "Hiking Adventure",
        caption: "10 miles in and it was all worth it 🥾 The view from the top was incredible! #hiking #adventure #outdoors",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=800&fit=crop",
        location: "Appalachian Trail"
    },
    {
        title: "Plant Collection",
        caption: "My plant family is growing 🌿 Each one has a name! #plants #plantmom #greenthumb",
        image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&h=800&fit=crop",
        location: "Living Room"
    },
    {
        title: "Skating Session",
        caption: "Perfect weather for a skate session 🛹 Feeling free! #skateboarding #skatelife #extreme",
        image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&h=800&fit=crop",
        location: "Skate Park"
    },
    {
        title: "Hot Air Balloon",
        caption: "Bucket list checked! Floating above the clouds 🎈 #hotairballoon #adventure #bucketlist",
        image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&h=800&fit=crop",
        location: "Cappadocia, Turkey"
    }
];

const COMMENTS = [
    "Amazing shot! 📸",
    "Love this! ❤️",
    "So beautiful!",
    "Goals! 🙌",
    "Incredible!",
    "This is stunning!",
    "Where is this? I need to go!",
    "Wow, just wow!",
    "Absolutely gorgeous!",
    "Living the dream!",
    "So jealous right now!",
    "Perfect! 👌",
    "This made my day!",
    "Can't stop looking at this!",
    "Seriously impressive!",
    "Need this in my life!",
    "How do you do it?!",
    "Inspiration goals!",
    "Take me there! 🙏",
    "Obsessed with this!"
];

const STORIES = [
    {
        media: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop",
        caption: "Good morning from the mountains! 🏔️"
    },
    {
        media: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=800&fit=crop",
        caption: "Brunch goals! 🥐☕"
    },
    {
        media: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=800&fit=crop",
        caption: "Late night adventure ✨"
    },
    {
        media: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
        caption: "Behind the scenes 📸"
    },
    {
        media: "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=600&h=800&fit=crop",
        caption: "Workout done! 💪"
    },
    {
        media: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=800&fit=crop",
        caption: "Concert vibes 🎵"
    },
    {
        media: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=800&fit=crop",
        caption: "Healthy eating 🥗"
    },
    {
        media: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=600&h=800&fit=crop",
        caption: "Road trip time! 🚗"
    },
    {
        media: "https://images.unsplash.com/photo-1562591880-8a8c31f5d2e7?w=600&h=800&fit=crop",
        caption: "Studio session 🎨"
    },
    {
        media: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=800&fit=crop",
        caption: "Beach day! 🏖️"
    },
    {
        media: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=800&fit=crop",
        caption: "Dinner spot 🍽️"
    },
    {
        media: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&h=800&fit=crop",
        caption: "Coffee time ☕"
    },
    {
        media: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
        caption: "Working from home today 💻"
    },
    {
        media: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=800&fit=crop",
        caption: "New music dropping soon 🎧"
    },
    {
        media: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=800&fit=crop",
        caption: "Squad goals! 👯"
    }
];

const MESSAGE_TEMPLATES = [
    "Hey! How are you?",
    "Did you see my latest post?",
    "Let's catch up soon!",
    "That photo was amazing!",
    "Thanks for following! 😊",
    "What are you up to?",
    "Miss you!",
    "Can't wait to see you!",
    "OMG that's so cool!",
    "Haha that's hilarious 😂",
    "Let's collaborate!",
    "Great content as always!",
    "Your style is incredible!",
    "Where did you get that?",
    "We should meet up!",
    "Thanks! That means a lot 🙏",
    "Working on something exciting!",
    "Check out this spot",
    "Have you tried this place?",
    "You're killing it! 🔥"
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB\n");

        // Clear existing data (optional - comment out if you want to keep existing data)
        await User.deleteMany({});
        await Post.deleteMany({});
        await Story.deleteMany({});
        await Message.deleteMany({});
        await Notification.deleteMany({});
        console.log("Cleared existing data\n");

        // Create users
        const createdUsers = [];
        for (const userData of USERS) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                bio: userData.bio,
                avatar: userData.avatar,
                role: userData.role || 'user',
                isVerified: userData.isVerified || false
            });
            const savedUser = await user.save();
            createdUsers.push(savedUser);
            console.log(`✓ Created user: ${userData.username}`);
        }

        console.log(`\n✓ Created ${createdUsers.length} users\n`);

        // Create posts with random users
        const createdPosts = [];
        for (let i = 0; i < POSTS.length; i++) {
            const postData = POSTS[i];
            const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];

            // Random likes from other users
            const likeCount = Math.floor(Math.random() * createdUsers.length);
            const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
            const likes = shuffledUsers.slice(0, likeCount).map(u => u._id);

            // Random comments
            const commentCount = Math.floor(Math.random() * 5);
            const comments = [];
            for (let j = 0; j < commentCount; j++) {
                const commentUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const commentText = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
                comments.push({
                    user: commentUser._id,
                    username: commentUser.username,
                    text: commentText,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
            }

            const post = new Post({
                user: randomUser._id,
                title: postData.title,
                caption: postData.caption,
                image: postData.image,
                mediaType: postData.mediaType || 'image',
                location: postData.location,
                likes: likes,
                comments: comments,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });

            const savedPost = await post.save();
            createdPosts.push(savedPost);
            console.log(`✓ Created post: "${postData.title}" by @${randomUser.username}`);
        }

        console.log(`\n✓ Created ${createdPosts.length} posts\n`);

        // Create follow relationships
        console.log("Creating follow relationships...\n");
        for (const user of createdUsers) {
            const followCount = Math.floor(Math.random() * (createdUsers.length - 1)) + 1;
            const otherUsers = createdUsers.filter(u => u._id.toString() !== user._id.toString());
            const shuffled = otherUsers.sort(() => Math.random() - 0.5);
            const toFollow = shuffled.slice(0, followCount);

            for (const targetUser of toFollow) {
                user.following.push(targetUser._id);
                targetUser.followers.push(user._id);
            }
        }

        // Save all users with follow relationships
        for (const user of createdUsers) {
            await user.save();
        }
        console.log("✓ Created follow relationships\n");

        // Add some saved posts for demo user
        const demoUser = createdUsers.find(u => u.username === 'demo');
        if (demoUser) {
            const savedPostsCount = Math.min(5, createdPosts.length);
            const shuffledPosts = [...createdPosts].sort(() => Math.random() - 0.5);
            demoUser.savedPosts = shuffledPosts.slice(0, savedPostsCount).map(p => p._id);
            await demoUser.save();
            console.log(`✓ Added ${savedPostsCount} saved posts for demo user\n`);
        }

        // Create Stories
        console.log("Creating stories...\n");
        const createdStories = [];
        const storyUsers = createdUsers.filter(u => u.role === 'user').slice(0, 10);

        for (let i = 0; i < STORIES.length; i++) {
            const storyData = STORIES[i];
            const randomUser = storyUsers[i % storyUsers.length];

            // Random views from other users
            const viewCount = Math.floor(Math.random() * 15) + 3;
            const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
            const views = shuffledUsers.slice(0, viewCount).map(u => ({
                user: u._id,
                viewedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000)
            }));

            // Random reactions
            const reactionCount = Math.floor(Math.random() * 5);
            const emojis = ['❤️', '🔥', '😍', '👏', '😂', '😮'];
            const reactions = shuffledUsers.slice(0, reactionCount).map(u => ({
                user: u._id,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000)
            }));

            const story = new Story({
                user: randomUser._id,
                media: storyData.media,
                mediaType: 'image',
                caption: storyData.caption,
                views: views,
                reactions: reactions,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            });

            const savedStory = await story.save();
            createdStories.push(savedStory);
            console.log(`✓ Created story by @${randomUser.username}`);
        }

        console.log(`\n✓ Created ${createdStories.length} stories\n`);

        // Create Messages (Conversations)
        console.log("Creating messages...\n");
        const createdConversations = [];
        const messageUsers = createdUsers.filter(u => u.role === 'user');

        // Create conversations between random pairs of users
        const conversationPairs = [];
        for (let i = 0; i < 15; i++) {
            const shuffled = [...messageUsers].sort(() => Math.random() - 0.5);
            const user1 = shuffled[0];
            const user2 = shuffled[1];

            // Avoid duplicate pairs
            const pairKey = [user1._id.toString(), user2._id.toString()].sort().join('-');
            if (!conversationPairs.includes(pairKey)) {
                conversationPairs.push(pairKey);

                // Generate 3-8 messages per conversation
                const messageCount = Math.floor(Math.random() * 6) + 3;
                const messages = [];

                for (let j = 0; j < messageCount; j++) {
                    const sender = j % 2 === 0 ? user1 : user2;
                    const messageText = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
                    messages.push({
                        sender: sender._id,
                        content: messageText,
                        messageType: 'text',
                        readBy: [sender._id, j < messageCount - 1 ? (j % 2 === 0 ? user2._id : user1._id) : null].filter(Boolean),
                        createdAt: new Date(Date.now() - (messageCount - j) * 30 * 60 * 1000) // Stagger messages
                    });
                }

                const lastMsg = messages[messages.length - 1];
                const conversation = new Message({
                    participants: [user1._id, user2._id],
                    messages: messages,
                    lastMessage: {
                        content: lastMsg.content,
                        sender: lastMsg.sender,
                        createdAt: lastMsg.createdAt
                    }
                });

                const savedConvo = await conversation.save();
                createdConversations.push(savedConvo);
                console.log(`✓ Created conversation between @${user1.username} and @${user2.username}`);
            }
        }

        console.log(`\n✓ Created ${createdConversations.length} conversations\n`);

        // Create Notifications
        console.log("Creating notifications...\n");
        const createdNotifications = [];

        // Like notifications from posts
        for (const post of createdPosts.slice(0, 20)) {
            const postOwner = createdUsers.find(u => u._id.toString() === post.user.toString());
            if (post.likes && post.likes.length > 0) {
                for (const likerId of post.likes.slice(0, 3)) {
                    const liker = createdUsers.find(u => u._id.toString() === likerId.toString());
                    if (liker && postOwner && liker._id.toString() !== postOwner._id.toString()) {
                        const notification = new Notification({
                            recipient: postOwner._id,
                            sender: liker._id,
                            type: 'like',
                            post: post._id,
                            message: `liked your post`,
                            isRead: Math.random() > 0.5,
                            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                        });
                        const savedNotif = await notification.save();
                        createdNotifications.push(savedNotif);
                    }
                }
            }
        }

        // Comment notifications
        for (const post of createdPosts.slice(0, 15)) {
            const postOwner = createdUsers.find(u => u._id.toString() === post.user.toString());
            if (post.comments && post.comments.length > 0) {
                for (const comment of post.comments.slice(0, 2)) {
                    const commenter = createdUsers.find(u => u._id.toString() === comment.user.toString());
                    if (commenter && postOwner && commenter._id.toString() !== postOwner._id.toString()) {
                        const notification = new Notification({
                            recipient: postOwner._id,
                            sender: commenter._id,
                            type: 'comment',
                            post: post._id,
                            comment: comment.text,
                            message: `commented: "${comment.text.substring(0, 30)}..."`,
                            isRead: Math.random() > 0.3,
                            createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
                        });
                        const savedNotif = await notification.save();
                        createdNotifications.push(savedNotif);
                    }
                }
            }
        }

        // Follow notifications
        for (const user of createdUsers.slice(0, 15)) {
            const followers = user.followers.slice(0, 3);
            for (const followerId of followers) {
                const follower = createdUsers.find(u => u._id.toString() === followerId.toString());
                if (follower) {
                    const notification = new Notification({
                        recipient: user._id,
                        sender: follower._id,
                        type: 'follow',
                        message: `started following you`,
                        isRead: Math.random() > 0.4,
                        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
                    });
                    const savedNotif = await notification.save();
                    createdNotifications.push(savedNotif);
                }
            }
        }

        // Message notifications from conversations
        for (const convo of createdConversations.slice(0, 10)) {
            const lastMsg = convo.messages[convo.messages.length - 1];
            const recipient = convo.participants.find(p => p.toString() !== lastMsg.sender.toString());
            const sender = createdUsers.find(u => u._id.toString() === lastMsg.sender.toString());
            const recipientUser = createdUsers.find(u => u._id.toString() === recipient.toString());

            if (sender && recipientUser) {
                const notification = new Notification({
                    recipient: recipientUser._id,
                    sender: sender._id,
                    type: 'message',
                    message: `sent you a message`,
                    isRead: Math.random() > 0.6,
                    link: `/messages/${convo._id}`,
                    createdAt: lastMsg.createdAt
                });
                const savedNotif = await notification.save();
                createdNotifications.push(savedNotif);
            }
        }

        // System notifications
        const systemNotifications = [
            { title: 'Welcome to Blogs!', body: 'Start sharing your moments with the world.' },
            { title: 'Complete your profile', body: 'Add a bio and profile picture to get noticed.' },
            { title: 'New features available', body: 'Check out Stories and Direct Messages!' }
        ];

        for (const user of createdUsers.slice(0, 8)) {
            const sysNotif = systemNotifications[Math.floor(Math.random() * systemNotifications.length)];
            const notification = new Notification({
                recipient: user._id,
                type: 'system',
                title: sysNotif.title,
                body: sysNotif.body,
                isRead: Math.random() > 0.5,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
            const savedNotif = await notification.save();
            createdNotifications.push(savedNotif);
        }

        console.log(`✓ Created ${createdNotifications.length} notifications\n`);

        console.log("================================");
        console.log("  SEED COMPLETED SUCCESSFULLY!");
        console.log("================================");
        console.log(`\n📊 Statistics:`);
        console.log(`   • ${createdUsers.length} users created`);
        console.log(`   • ${createdPosts.length} posts created`);
        console.log(`   • ${createdStories.length} stories created`);
        console.log(`   • ${createdConversations.length} conversations created`);
        console.log(`   • ${createdNotifications.length} notifications created`);
        console.log(`   • Follow relationships established`);
        console.log(`\n👑 Admin Account:`);
        console.log(`   Username: admin`);
        console.log(`   Password: admin123`);
        console.log(`   Access: /admin`);
        console.log(`\n👮 Moderator Account:`);
        console.log(`   Username: moderator`);
        console.log(`   Password: mod123`);
        console.log(`\n🔑 Demo Account:`);
        console.log(`   Username: demo`);
        console.log(`   Password: demo123`);
        console.log(`\n🔑 All other accounts password: password123`);
        console.log("================================\n");

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        console.error("Stack:", err.stack);
        process.exit(1);
    }
}

seed();
