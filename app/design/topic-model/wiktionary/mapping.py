# Wiktionary topic tags (wiktextract "topics") and category names -> the app's 12 topics.
# Only specific fields: generic parents ("sciences", "lifestyle", "hobbies"…) map to nothing.

T = {}
def add(topic, *names):
    for n in names:
        T.setdefault(n.lower(), set()).add(topic)

add('tech', 'computing', 'computer-hardware', 'software', 'programming', 'computer', 'electronics', 'telecommunications',
    'networking', 'databases', 'graphical-user-interface', 'computer-graphics', 'internet', 'mobile-telephony', 'telephony',
    'cryptography', 'information-science', 'web-design', 'blogging', 'computing-theory', 'computer-languages',
    'electrical-engineering', 'computer hardware', 'graphical user interface', 'technology', 'video games',
    'computer science', 'artificial intelligence', 'machine learning', 'social media', 'web design', 'computer languages')
add('health', 'medicine', 'pathology', 'pharmacology', 'surgery', 'anatomy', 'neurology', 'cardiology', 'oncology',
    'immunology', 'psychiatry', 'dentistry', 'hematology', 'ophthalmology', 'dermatology', 'urology', 'obstetrics',
    'gynaecology', 'healthcare', 'toxicology', 'epidemiology', 'virology', 'physiology', 'pulmonology', 'gastroenterology',
    'alternative-medicine', 'clinical-psychology', 'neuroanatomy', 'medical signs and symptoms', 'diseases',
    'pharmaceutical drugs', 'healthcare occupations', 'medical equipment', 'bacterial diseases', 'viral diseases', 'health',
    'organs', 'body parts', 'skeleton', 'pain', 'disability', 'pregnancy', 'hygiene', 'bodily fluids', 'skin', 'eye', 'face',
    'nutrition', 'medical', 'pharmacy', 'nursing', 'injuries', 'infectious diseases', 'mental health', 'teeth')
add('food', 'food', 'cooking', 'beverages', 'oenology', 'wine', 'baking', 'cuisine', 'vegetable', 'foods', 'fruits',
    'vegetables', 'grains', 'meats', 'spices and herbs', 'food and drink', 'cakes and pastries', 'breads', 'tea', 'coffee',
    'wines', 'alcoholic beverages', 'desserts', 'sweets', 'herbs', 'root vegetables', 'fats and oils', 'cookware and bakeware',
    'food and drink containers', 'cheeses', 'dairy products', 'pasta', 'sauces', 'soups', 'seafood', 'nuts', 'beers',
    'cocktails', 'condiments', 'snack foods', 'meals', 'cutlery', 'cuisine', 'gastronomy', 'brewing', 'confectionery')
add('travel', 'transport', 'nautical', 'aviation', 'aeronautics', 'railways', 'rail-transport', 'vehicles', 'automotive',
    'road', 'tourism', 'travel', 'rail transportation', 'watercraft', 'roads', 'automotive parts', 'automobiles', 'ship parts',
    'aircraft', 'airports', 'hotels', 'ships', 'boats', 'trains', 'public transport', 'bicycles', 'transportation',
    'luggage', 'maritime', 'navigation')
add('work', 'business', 'finance', 'economics', 'law', 'accounting', 'banking', 'marketing', 'management', 'commerce',
    'trading', 'insurance', 'taxation', 'money', 'retail', 'real-estate', 'advertising', 'intellectual-property', 'copyright',
    'property', 'occupations', 'currencies', 'wealth', 'shops', 'employment', 'labour', 'labor', 'jobs', 'office',
    'stock market', 'contract law', 'criminal law', 'legal', 'trade', 'industry', 'manufacturing', 'bankruptcy', 'payment')
add('home', 'furniture', 'clothing', 'fashion', 'sewing', 'cosmetics', 'jewelry', 'rooms', 'headwear', 'footwear',
    'bedding', 'containers', 'bags', 'toilet (room)', 'household', 'household appliances', 'kitchen', 'tools',
    'cleaning', 'housekeeping', 'gardening', 'fasteners', 'light sources', 'cookware and bakeware', 'cutlery', 'fabrics',
    'textiles', 'architecture', 'architectural elements', 'hairdressing', 'hair', 'underwear', 'home appliances', 'doors', 'windows', 'kitchenware', 'laundry')
add('nature', 'biology', 'botany', 'zoology', 'ecology', 'geology', 'meteorology', 'weather', 'climatology', 'ornithology',
    'entomology', 'ichthyology', 'mycology', 'agriculture', 'horticulture', 'forestry', 'hydrology', 'oceanography',
    'volcanology', 'malacology', 'horses', 'pets', 'birds', 'mammals', 'animals', 'fish', 'insects', 'plants', 'trees',
    'flowers', 'female animals', 'male animals', 'dogs', 'cats', 'chickens', 'cattle', 'pigs', 'felids', 'baby animals',
    'animal body parts', 'plant anatomy', 'atmospheric phenomena', 'bodies of water', 'seas', 'lakes', 'mountains', 'rocks',
    'minerals', 'rain', 'wind', 'ice', 'palm trees', 'animal sounds', 'animal dwellings', 'farming', 'livestock', 'reptiles',
    'amphibians', 'fungi', 'rodents', 'canids', 'bovines', 'environment', 'landforms', 'rivers', 'forests', 'herbivores',
    'fishes', 'snakes', 'spiders', 'shellfish', 'mollusks', 'crustaceans', 'gardening', 'hordeeae tribe grasses', 'grasses',
    'weeds', 'seasons', 'natural disasters')
add('people', 'family members', 'male family members', 'female family members',
    'family', 'parents', 'children', 'babies', 'marriage', 'age', 'appearance', 'women', 'men', 'friendship', 'relationships',
    'kinship', 'social behaviour', 'human behaviour', 'genealogy')
add('school', 'mathematics', 'physics', 'chemistry', 'education', 'academia', 'astronomy', 'statistics', 'logic',
    'geometry', 'algebra', 'arithmetic', 'calculus', 'biochemistry', 'genetics', 'cytology', 'microbiology',
    'mathematical-analysis', 'number-theory', 'set-theory', 'topology',
    'linear-algebra', 'trigonometry', 'probability-theory', 'organic-chemistry', 'inorganic-chemistry', 'physical chemistry',
    'organic chemistry', 'schools', 'set theory', 'functions', 'polygons', 'shapes', 'curves', 'chemical elements',
    'mechanics', 'thermodynamics', 'optics', 'nuclear physics', 'graph-theory', 'combinatorics', 'school', 'university',
    'mathematical analysis', 'stationery', 'writing instruments', 'scholarly')
add('sport', 'sports', 'ball-games', 'soccer', 'football', 'tennis', 'golf', 'cricket', 'baseball', 'basketball',
    'athletics', 'martial-arts', 'boxing', 'cycling', 'swimming', 'skiing', 'games', 'board-games', 'chess', 'card-games',
    'video-games', 'gambling', 'poker', 'dice', 'fishing', 'hunting', 'climbing', 'wrestling', 'fencing', 'gymnastics',
    'horse-racing', 'horseracing', 'racing', 'motor-racing', 'rowing', 'sailing', 'surfing', 'skating', 'diving',
    'underwater-diving', 'ice-hockey', 'rugby', 'volleyball', 'american-football', 'archery', 'equestrianism',
    'weightlifting', 'bodybuilding', 'exercise', 'billiards', 'snooker', 'curling', 'softball', 'pool', 'athletes',
    'card games', 'football (soccer)', 'ball games', 'toys', 'video games', 'martial arts', 'olympic games', 'fitness',
    'motorcycling', 'camping', 'hiking', 'mountaineering', 'board games', 'sport', 'ice hockey', 'american football')
add('culture', 'music', 'arts', 'art', 'literature', 'poetry', 'film', 'cinematography', 'theater', 'drama', 'dramaturgy',
    'dance', 'dancing', 'photography', 'history', 'archaeology', 'mythology', 'religion', 'christianity', 'islam', 'buddhism',
    'catholicism', 'roman-catholicism', 'theology', 'philosophy', 'comics', 'anime', 'manga', 'fiction', 'fantasy',
    'science-fiction', 'folklore', 'television', 'radio', 'broadcasting', 'journalism', 'publishing', 'newspapers',
    'calligraphy', 'crafts', 'ceramics', 'numismatics', 'philately', 'musical instruments', 'musicians',
    'musical genres', 'percussion instruments', 'string instruments', 'woodwind instruments', 'books', 'bible',
    'greek mythology', 'judaism', 'hinduism', 'roman catholicism', 'eastern orthodoxy', 'gods', 'greek deities',
    'places of worship', 'religious occupations', 'theatre', 'dances', 'painting', 'sculpture', 'opera', 'novels',
    'heraldry', 'ancient rome', 'ancient greece', 'historical events', 'christmas', 'holidays',
    'biblical', 'mysticism', 'occult', 'astrology', 'brass instruments', 'keyboard instruments', 'museums')
add('feelings', 'emotions', 'sadness', 'happiness', 'anger', 'fear', 'love', 'personality', 'joy', 'hate', 'envy',
    'jealousy', 'shame', 'pride', 'surprise', 'disgust', 'personality traits', 'moods', 'emotion', 'psychology',
    'character', 'virtues', 'vices', 'thinking')

# Wiktionary adds the parent fields: computing -> engineering, mathematics; botany -> biology.
# A parent is dropped when a more specific field is there.
PARENTS = {
    'mathematics': {'computing', 'programming', 'computer-hardware', 'software', 'cryptography', 'computing-theory', 'databases'},
    'biology': {'biochemistry', 'genetics', 'cytology', 'microbiology', 'medicine', 'anatomy', 'pathology', 'physiology', 'immunology'},
    'chemistry': {'medicine', 'pharmacology', 'biochemistry', 'cooking', 'food'},
    'physics': {'electronics', 'electrical-engineering', 'computing', 'music'},
    'business': {'agriculture', 'horticulture', 'forestry', 'fishing', 'mining', 'manufacturing', 'fashion', 'cooking', 'food', 'beverages', 'transport', 'aviation', 'nautical', 'tourism'},
    'economics': {'agriculture'},
}

def topics_of(tags, cats):
    found = set()
    tags = list(tags)
    tags = [t for t in tags if not (t in PARENTS and PARENTS[t] & set(tags))]
    for x in tags + list(cats):
        if not x:
            continue
        found |= T.get(x.lower(), set())
    return found
