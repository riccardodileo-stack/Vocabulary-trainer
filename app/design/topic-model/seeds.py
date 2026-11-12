# Hand-written seed lexicon: words that clearly belong to each topic, in the five
# languages of the app. Used as prototypes for the teacher (embedding model), as
# gold training data for the student network, and (a held-out part) for evaluation.
# A word may appear under several topics (multi-label).

SEEDS = {
    "tech": {
        "en": "computer software hardware keyboard mouse screen monitor laptop internet website browser email password download upload server database network wifi router program programming code coder developer app application smartphone tablet printer file folder cloud algorithm data byte pixel processor memory cpu chip bug debug login online offline update install virus hacker robot cable usb bluetooth digital technology engineer",
        "it": "computer informatica tastiera schermo portatile internet sito browser posta password scaricare caricare server rete programma programmazione codice sviluppatore applicazione smartphone stampante file cartella algoritmo dati processore memoria chiavetta aggiornamento installare virus robot cavo digitale tecnologia ingegnere chiocciola cliccare digitare",
        "es": "ordenador teclado pantalla programa contraseña red archivo descargar aplicación datos tecnología impresora",
        "fr": "ordinateur clavier écran logiciel mot_de_passe réseau fichier télécharger application données technologie imprimante",
        "de": "Computer Tastatur Bildschirm Software Passwort Netzwerk Datei herunterladen Anwendung Daten Technik Drucker",
    },
    "health": {
        "en": "doctor nurse hospital clinic medicine medicine pill tablet drug pharmacy patient disease illness sickness fever cough cold flu headache pain injury wound blood heart lung liver kidney stomach brain bone muscle surgery surgeon ambulance vaccine virus infection allergy diagnosis therapy treatment cancer diabetes healthy sick symptom prescription dentist tooth health",
        "it": "medico dottore infermiere ospedale clinica medicina farmaco pillola farmacia paziente malattia febbre tosse raffreddore influenza mal_di_testa dolore ferita sangue cuore polmone fegato rene stomaco cervello osso muscolo chirurgia chirurgo ambulanza vaccino infezione allergia diagnosi terapia cura tumore diabete sano malato sintomo ricetta dentista dente salute",
        "es": "médico enfermera hospital medicina farmacia paciente enfermedad fiebre tos dolor sangre corazón salud",
        "fr": "médecin infirmière hôpital médicament pharmacie patient maladie fièvre toux douleur sang cœur santé",
        "de": "Arzt Krankenschwester Krankenhaus Medikament Apotheke Patient Krankheit Fieber Husten Schmerz Blut Herz Gesundheit",
    },
    "food": {
        "en": "food bread pasta rice pizza cheese butter milk egg meat chicken beef pork fish salad soup sauce sugar salt pepper oil vinegar apple banana orange lemon strawberry tomato potato onion garlic carrot vegetable fruit cake cookie chocolate coffee tea wine beer juice breakfast lunch dinner cook cooking kitchen recipe restaurant waiter menu oven fry boil bake delicious tasty hungry thirsty",
        "it": "cibo pane pasta riso pizza formaggio burro latte uovo carne pollo manzo maiale pesce insalata zuppa sugo zucchero sale pepe olio aceto mela banana arancia limone fragola pomodoro patata cipolla aglio carota verdura frutta torta biscotto cioccolato caffè tè vino birra succo colazione pranzo cena cucinare cucina ricetta ristorante cameriere menù forno friggere bollire infornare delizioso gustoso affamato assetato",
        "es": "comida pan arroz queso leche huevo carne pollo pescado manzana cocinar cocina restaurante desayuno cena",
        "fr": "nourriture pain riz fromage lait œuf viande poulet poisson pomme cuisiner cuisine restaurant petit_déjeuner dîner",
        "de": "Essen Brot Reis Käse Milch Ei Fleisch Hähnchen Fisch Apfel kochen Küche Restaurant Frühstück Abendessen",
    },
    "travel": {
        "en": "travel trip journey holiday vacation tourist tourism passport visa luggage suitcase backpack ticket flight airport airplane plane train station bus car taxi subway metro ship boat ferry hotel hostel reservation booking map guide border customs departure arrival destination beach museum sightseeing road highway driver drive traffic",
        "it": "viaggio viaggiare vacanza vacanze turista turismo passaporto visto bagaglio valigia zaino biglietto volo aeroporto aereo treno stazione autobus macchina auto taxi metropolitana nave barca traghetto albergo hotel ostello prenotazione mappa guida frontiera dogana partenza arrivo destinazione spiaggia autostrada strada autista guidare traffico",
        "es": "viaje viajar vacaciones pasaporte maleta billete vuelo aeropuerto avión tren estación hotel playa",
        "fr": "voyage voyager vacances passeport valise billet vol aéroport avion train gare hôtel plage",
        "de": "Reise reisen Urlaub Reisepass Koffer Fahrkarte Flug Flughafen Flugzeug Zug Bahnhof Hotel Strand",
    },
    "work": {
        "en": "work job career office company business boss manager employee employer colleague salary wage contract meeting interview resume hire fire unemployment economy market money bank price cost profit loss tax invoice budget investment stock shares sell buy customer client sales marketing industry factory trade finance loan debt",
        "it": "lavoro lavorare carriera ufficio azienda ditta impresa capo dirigente dipendente datore collega stipendio salario contratto riunione colloquio curriculum assumere licenziare disoccupazione economia mercato soldi denaro banca prezzo costo profitto perdita tasse fattura bilancio investimento azioni vendere comprare cliente vendite industria fabbrica commercio finanza prestito debito",
        "es": "trabajo trabajar oficina empresa jefe empleado salario contrato reunión dinero banco precio mercado",
        "fr": "travail travailler bureau entreprise patron employé salaire contrat réunion argent banque prix marché",
        "de": "Arbeit arbeiten Büro Firma Chef Mitarbeiter Gehalt Vertrag Besprechung Geld Bank Preis Markt",
    },
    "home": {
        "en": "house home apartment flat room bedroom bathroom living_room kitchen garden roof wall floor ceiling door window stairs furniture table chair sofa couch bed wardrobe closet shelf drawer lamp mirror carpet curtain pillow blanket sheet towel fridge washing_machine dishwasher sink shower bathtub toilet key lock rent neighbor clean broom vacuum",
        "it": "casa appartamento stanza camera bagno soggiorno salotto giardino tetto muro pavimento soffitto porta finestra scale mobili tavolo sedia divano letto armadio scaffale cassetto lampada specchio tappeto tenda cuscino coperta lenzuolo asciugamano frigorifero lavatrice lavastoviglie lavandino doccia vasca chiave serratura affitto vicino pulire scopa aspirapolvere",
        "es": "casa piso habitación dormitorio baño cocina mesa silla cama ventana puerta llave",
        "fr": "maison appartement chambre salle_de_bain cuisine table chaise lit fenêtre porte clé meuble",
        "de": "Haus Wohnung Zimmer Schlafzimmer Badezimmer Küche Tisch Stuhl Bett Fenster Tür Schlüssel",
    },
    "nature": {
        "en": "nature animal dog cat horse cow pig sheep bird fish lion tiger elephant bear wolf fox rabbit mouse snake insect bee butterfly spider tree flower plant grass leaf forest wood mountain hill river lake sea ocean beach island desert sky sun moon star rain snow wind storm cloud weather climate earth environment",
        "it": "natura animale cane gatto cavallo mucca maiale pecora uccello pesce leone tigre elefante orso lupo volpe coniglio topo serpente insetto ape farfalla ragno albero fiore pianta erba foglia foresta bosco montagna collina fiume lago mare oceano isola deserto cielo sole luna stella pioggia neve vento tempesta nuvola tempo clima terra ambiente",
        "es": "naturaleza animal perro gato caballo pájaro árbol flor montaña río mar cielo lluvia",
        "fr": "nature animal chien chat cheval oiseau arbre fleur montagne rivière mer ciel pluie",
        "de": "Natur Tier Hund Katze Pferd Vogel Baum Blume Berg Fluss Meer Himmel Regen",
    },
    "people": {
        "en": "family mother father mom dad parent son daughter brother sister child children baby grandmother grandfather grandparent uncle aunt cousin nephew niece husband wife marriage wedding boyfriend girlfriend partner friend friendship neighbor man woman boy girl person people relative adult teenager birthday",
        "it": "famiglia madre padre mamma papà genitore figlio figlia fratello sorella bambino bambini neonato nonna nonno nonni zio zia cugino nipote marito moglie matrimonio fidanzato fidanzata compagno amico amica amicizia uomo donna ragazzo ragazza persona gente parente adulto adolescente compleanno",
        "es": "familia madre padre hijo hija hermano hermana abuelo abuela amigo marido esposa niño",
        "fr": "famille mère père fils fille frère sœur grand-mère grand-père ami mari femme enfant",
        "de": "Familie Mutter Vater Sohn Tochter Bruder Schwester Großmutter Großvater Freund Ehemann Ehefrau Kind",
    },
    "school": {
        "en": "school university college student teacher professor lesson class classroom course exam test homework study learn learning education degree grade book notebook pen pencil library science physics chemistry biology mathematics math history geography experiment research laboratory theory knowledge lecture subject",
        "it": "scuola università studente studentessa insegnante professore lezione classe aula corso esame compito compiti studiare imparare istruzione laurea voto libro quaderno penna matita biblioteca scienza fisica chimica biologia matematica storia geografia esperimento ricerca laboratorio teoria conoscenza materia",
        "es": "escuela universidad estudiante profesor lección clase examen estudiar aprender libro ciencia matemáticas",
        "fr": "école université étudiant professeur leçon classe examen étudier apprendre livre science mathématiques",
        "de": "Schule Universität Student Lehrer Unterricht Klasse Prüfung lernen studieren Buch Wissenschaft Mathematik",
    },
    "sport": {
        "en": "sport sports football soccer basketball tennis volleyball swimming swim run running race marathon cycling bicycle bike gym training exercise fitness team player coach match game goal score win lose champion championship tournament ball stadium referee ski skiing climbing hiking yoga hobby leisure fishing dance",
        "it": "sport calcio pallacanestro basket tennis pallavolo nuoto nuotare correre corsa gara maratona ciclismo bicicletta palestra allenamento esercizio squadra giocatore allenatore partita gol punteggio vincere perdere campione campionato torneo palla pallone stadio arbitro sci sciare arrampicata escursione hobby tempo_libero pesca ballare",
        "es": "deporte fútbol baloncesto tenis natación correr equipo jugador partido gol gimnasio pelota",
        "fr": "sport football basket tennis natation courir équipe joueur match but gymnase ballon",
        "de": "Sport Fußball Basketball Tennis Schwimmen laufen Mannschaft Spieler Spiel Tor Fitnessstudio Ball",
    },
    "culture": {
        "en": "art artist painting painter picture drawing sculpture museum gallery music musician song singer band concert piano guitar violin orchestra opera theater theatre actor actress film movie cinema director novel poem poetry writer author literature book story culture festival photography photo dance ballet",
        "it": "arte artista pittura pittore quadro disegno scultura museo galleria musica musicista canzone cantante gruppo concerto pianoforte chitarra violino orchestra opera teatro attore attrice film cinema regista romanzo poesia scrittore autore letteratura racconto cultura festival fotografia danza balletto",
        "es": "arte artista pintura museo música canción concierto teatro película cine novela poesía",
        "fr": "art artiste peinture musée musique chanson concert théâtre film cinéma roman poésie",
        "de": "Kunst Künstler Malerei Museum Musik Lied Konzert Theater Film Kino Roman Gedicht",
    },
    "feelings": {
        "en": "happy sad angry afraid scared fear love hate joy anger sadness happiness worried anxious nervous calm relaxed bored boring excited surprised jealous lonely proud ashamed shy brave kind rude polite friendly honest generous selfish lazy smart stupid funny serious patient emotion feeling mood",
        "it": "felice triste arrabbiato spaventato paura amore odio gioia rabbia tristezza felicità preoccupato ansioso nervoso calmo rilassato annoiato noioso emozionato sorpreso geloso solo orgoglioso vergogna timido coraggioso gentile maleducato educato simpatico onesto generoso egoista pigro intelligente stupido divertente serio paziente emozione sentimento umore",
        "es": "feliz triste enfadado miedo amor alegría preocupado nervioso aburrido celoso tímido amable",
        "fr": "heureux triste fâché peur amour joie inquiet nerveux ennuyeux jaloux timide gentil",
        "de": "glücklich traurig wütend Angst Liebe Freude besorgt nervös langweilig eifersüchtig schüchtern freundlich",
    },
}

# Everyday words with no particular topic: the network must learn to say "none" for them.
GENERIC = {
    "en": "the be have do say get make go know take see come think look want give use find tell ask seem feel try leave call good new first last long great little own other old right big high different small large next early young important few public bad same able always never often sometimes maybe really very quite almost already still yet just only also thing way time year day man world life part case point group number fact very about because although however therefore instead quickly slowly suddenly probably certainly to_wait to_happen to_become to_keep to_change to_bring meanwhile anyway enough",
    "it": "essere avere fare dire andare sapere prendere vedere venire pensare guardare volere dare usare trovare chiedere sembrare sentire provare lasciare chiamare buono nuovo primo ultimo lungo grande piccolo altro vecchio giusto alto diverso prossimo giovane importante pochi stesso capace sempre mai spesso talvolta forse davvero molto abbastanza quasi già ancora appena solo anche cosa modo volta anno giorno parte caso punto gruppo numero fatto perché sebbene tuttavia quindi invece velocemente lentamente improvvisamente probabilmente certamente aspettare succedere diventare tenere cambiare portare intanto comunque",
    "es": "ser tener hacer decir ir saber bueno nuevo grande pequeño siempre nunca cosa tiempo parte",
    "fr": "être avoir faire dire aller savoir bon nouveau grand petit toujours jamais chose temps partie",
    "de": "sein haben machen sagen gehen wissen gut neu groß klein immer nie Sache Zeit Teil",
}

TOPICS = list(SEEDS.keys())
LANGS = ["en", "it", "es", "fr", "de"]


def words(text):
    return [w.replace("_", " ") for w in text.split()]

# ---------------------------------------------------------------------------
# Second batch (more prototypes per topic, especially the borders between topics:
# farm and plants are nature, dishes and kitchen tools are food, and so on).
EXTRA = {
    "tech": {
        "en": "smartphone touchscreen wireless charger battery_charger backup restore reboot shutdown username account settings notification inbox spam attachment spreadsheet slideshow tab window_icon icon desktop wallpaper cursor_click scroll zoom click type_text keyboard_shortcut emoji chat message_app video_call webcam microphone speaker headphones earbuds gadget device drone gaming console joystick software_update operating_system linux windows macos javascript python coding website_link hyperlink url domain hosting streaming podcast blog social_network follower hashtag selfie screenshot",
        "it": "caricabatterie batteria_del_telefono riavviare spegnere nomeutente account impostazioni notifica allegato foglio_di_calcolo icona desktop sfondo_schermo scorrere ingrandire digitare scorciatoia chat videochiamata webcam microfono cuffie auricolari dispositivo drone console videogioco sistema_operativo programmatore programmare collegamento link dominio streaming podcast social follower selfie screenshot schermata wireless senza_fili chiavetta_usb disco_rigido archiviazione intelligenza_artificiale informatico computer_portatile",
        "es": "móvil cargador pantalla_táctil auriculares videojuego programador enlace red_social",
        "fr": "portable chargeur écran_tactile écouteurs jeu_vidéo programmeur lien réseau_social",
        "de": "Handy Ladegerät Kopfhörer Videospiel Programmierer Link Bildschirm Laptop",
    },
    "health": {
        "en": "ache sore throat stomachache toothache backache bruise scar burn rash itch sneeze vomit nausea dizzy faint bleed swollen broken_arm cast plaster stitches injection syringe needle thermometer stethoscope x-ray scan blood_test check-up appointment ward emergency_room intensive_care operation anesthesia painkiller antibiotic aspirin ointment cream drops vitamin diet obesity disability wheelchair pregnant pregnancy birth midwife psychiatrist therapist depression stress insomnia",
        "it": "mal_di_gola mal_di_pancia mal_di_denti mal_di_schiena livido cicatrice ustione bruciatura prurito starnuto vomitare nausea vertigini svenire sanguinare gonfio gesso punti iniezione siringa ago termometro stetoscopio radiografia esame_del_sangue visita pronto_soccorso reparto terapia_intensiva operazione anestesia antidolorifico antibiotico aspirina pomata crema gocce vitamina dieta obesità disabilità sedia_a_rotelle incinta gravidanza parto ostetrica psichiatra psicologo depressione stress insonnia",
        "es": "dolor_de_cabeza herida jarabe receta cirujano enfermo gripe vacuna",
        "fr": "mal_de_tête blessure sirop ordonnance chirurgien malade grippe vaccin",
        "de": "Kopfschmerzen Wunde Rezept Chirurg krank Grippe Impfung Tablette",
    },
    "food": {
        "en": "noodles spaghetti lasagna sandwich burger hamburger fries chips steak sausage bacon salmon tuna shrimp lobster mushroom pea bean lentil corn cucumber pepper_vegetable lettuce spinach broccoli peach pear cherry grape melon watermelon pineapple coconut nut almond honey jam cereal yogurt cream ice_cream pie pudding cupcake candy biscuit toast omelette pancake waffle sauce mayonnaise ketchup mustard oil vinegar plate bowl cup glass mug knife saucepan pot grill microwave fridge_food bake roast slice chop peel stir taste flavour spicy sweet sour bitter salty meal appetite leftovers",
        "it": "spaghetti lasagne panino hamburger patatine bistecca salsiccia pancetta salmone tonno gamberi aragosta fungo piselli fagioli lenticchie mais cetriolo peperone lattuga spinaci broccoli pesca pera ciliegia uva melone anguria ananas cocco noce mandorla miele marmellata cereali yogurt panna gelato crostata budino caramella biscotti pane_tostato frittata pancake salsa maionese ketchup senape piatto ciotola tazza bicchiere coltello pentola griglia microonde arrostire affettare tagliare sbucciare mescolare assaggiare sapore piccante dolce_sapore aspro amaro salato pasto appetito avanzi pizzeria trattoria cuoco chef",
        "es": "cuchillo plato vaso sopa ensalada queso_rallado helado pastel tenedor",
        "fr": "couteau assiette verre soupe salade glace gâteau fourchette",
        "de": "Messer Teller Glas Suppe Salat Eis Kuchen Gabel",
    },
    "travel": {
        "en": "trip_abroad abroad tour guidebook souvenir postcard check-in check-out boarding_pass gate terminal runway pilot flight_attendant cruise harbour port railway platform_train carriage seat_reservation timetable delay cancelled connection_flight jet_lag motorway roundabout petrol gas_station parking traffic_jam motorbike scooter van truck lorry tram cable_car camping tent caravan resort inn hotel_room single_room double_room receptionist tour_guide itinerary sightseeing_tour landmark monument currency exchange",
        "it": "estero gita tour guida_turistica souvenir cartolina imbarco carta_d'imbarco gate terminal pista pilota hostess crociera porto ferrovia vagone posto_a_sedere orario ritardo cancellato coincidenza_volo fuso_orario rotonda benzina distributore parcheggio ingorgo moto motorino furgone camion tram funivia campeggio tenda roulotte villaggio_turistico locanda camera_singola camera_doppia receptionist itinerario monumento valuta cambio_valuta autostop navigatore",
        "es": "maleta equipaje turista aduana crucero puerto carretera",
        "fr": "bagage touriste douane croisière port autoroute",
        "de": "Gepäck Tourist Zoll Kreuzfahrt Hafen Autobahn",
    },
    "work": {
        "en": "job_interview applicant candidate position vacancy promotion raise bonus pension retirement retire part-time full-time overtime shift staff team_leader director ceo entrepreneur startup headquarters branch_office department accountant lawyer secretary receptionist_job clerk cashier salesman negotiation deal agreement partner_business revenue turnover income expense savings mortgage interest_rate inflation recession stock_market currency_money coin banknote credit_card payment cash receipt bill_payment purchase discount refund supplier warehouse logistics",
        "it": "candidato posizione posto_vacante promozione aumento premio pensione pensionarsi part-time tempo_pieno straordinari turno personale direttore amministratore imprenditore sede reparto commercialista contabile avvocato segretaria impiegato cassiere venditore trattativa accordo socio fatturato reddito spesa risparmi mutuo tasso_d'interesse inflazione recessione borsa moneta banconota carta_di_credito pagamento contanti scontrino ricevuta acquisto sconto rimborso fornitore magazzino logistica",
        "es": "sueldo jefe_de_equipo impuestos factura cliente fábrica",
        "fr": "salaire impôts facture client usine embauche",
        "de": "Lohn Steuern Rechnung Kunde Fabrik Bewerbung",
    },
    "home": {
        "en": "doorbell hallway corridor attic basement cellar garage balcony terrace porch fence gate_house chimney fireplace heating radiator air_conditioning light_switch plug socket bulb vase frame cushion duvet mattress hanger iron ironing laundry detergent bucket mop dustpan cloth sponge rubbish trash bin dustbin tap faucet drain toilet_paper toothbrush toothpaste soap shampoo comb hairdryer furniture_shop landlady move_house housework chores tidy dust vacuum_cleaner hammer nail screw screwdriver drill ladder tool",
        "it": "campanello corridoio ingresso soffitta cantina garage balcone terrazzo veranda recinto cancello camino riscaldamento termosifone condizionatore interruttore presa lampadina vaso cornice piumone materasso gruccia ferro_da_stiro stirare bucato detersivo secchio straccio spugna spazzatura pattumiera rubinetto scarico carta_igienica spazzolino dentifricio sapone shampoo pettine phon padrone_di_casa faccende_domestiche riordinare spolverare martello chiodo vite cacciavite trapano scala_a_pioli attrezzo arredamento",
        "es": "sofá armario lámpara alfombra almohada nevera",
        "fr": "canapé armoire lampe tapis oreiller frigo",
        "de": "Sofa Schrank Lampe Teppich Kissen Kühlschrank",
    },
    "nature": {
        "en": "plant_seed seedling bud blossom petal stem thorn trunk_tree log pine oak maple palm cactus moss mushroom_wild weed soil mud dirt clay rock stone pebble sand_dune valley cliff cave volcano waterfall stream pond swamp coast shore wave tide glacier iceberg crops field meadow pasture vineyard grove greenhouse fertilizer irrigation agriculture rural countryside village_farm ranch shepherd flock herd goat donkey duck goose turkey chick calf lamb pony ox bull rooster beehive insect_ant ant worm frog turtle dolphin whale shark eagle owl parrot squirrel deer hedgehog wildlife ecology pollution recycling climate_change earthquake flood drought",
        "it": "piantina gemma fiore_di_ciliegio petalo stelo spina tronco pino quercia acero palma cactus muschio erbaccia terreno fango argilla roccia pietra sasso valle scogliera grotta vulcano cascata ruscello stagno palude costa riva onda marea ghiacciaio iceberg coltivazione campo prato pascolo frutteto serra fertilizzante irrigazione agricoltura campagna agricoltore pastore gregge mandria capra asino anatra oca tacchino pulcino vitello agnello bue toro gallo alveare formica verme rana tartaruga delfino balena squalo aquila gufo pappagallo scoiattolo cervo riccio fauna flora ecologia inquinamento riciclaggio cambiamento_climatico terremoto alluvione siccità",
        "es": "granja agricultor semilla cosecha vaca oveja bosque",
        "fr": "ferme agriculteur graine récolte vache mouton forêt",
        "de": "Bauernhof Bauer Samen Ernte Kuh Schaf Wald",
    },
    "people": {
        "en": "stepmother stepfather stepson stepdaughter half-brother godfather godmother godson in-laws fiance fiancee bride groom spouse couple ex-wife orphan adopt adoption sibling twin grandson granddaughter grandchild great-grandmother ancestor descendant generation relatives household elderly toddler infant kid youth adulthood childhood old_age gentleman lady guy mate buddy acquaintance stranger neighbour_person roommate flatmate guest host",
        "it": "matrigna patrigno figliastro fratellastro padrino madrina figlioccio fidanzamento sposa sposo coniuge coppia ex_moglie orfano adottare adozione nipotino nipotina bisnonna antenato discendente generazione parentela anziano bambino_piccolo neonata ragazzino gioventù infanzia vecchiaia signore signora tizio compagno_di_classe conoscente sconosciuto coinquilino ospite vicino_di_casa celibe nubile",
        "es": "novio novia esposo primo tío tía nieto",
        "fr": "fiancé fiancée époux cousin oncle tante petit-fils",
        "de": "Verlobter Ehepaar Cousin Onkel Tante Enkel",
    },
    "school": {
        "en": "pupil schoolchild headmaster principal tutor graduate graduation diploma bachelor master_degree phd thesis dissertation essay assignment textbook dictionary encyclopedia ruler eraser rubber_eraser calculator backpack_school timetable_school semester term_school mark grade_score marks pass fail cheat scholarship campus dormitory faculty lecture_hall seminar laboratory_test microscope atom molecule cell gene evolution equation formula fraction geometry algebra statistics astronomy planet galaxy physics_law",
        "it": "alunno preside maestra tutor laureato laurearsi diploma triennale magistrale dottorato tesi tema compito_in_classe libro_di_testo vocabolario enciclopedia righello gomma calcolatrice cartella astuccio semestre quadrimestre voto promosso bocciato copiare borsa_di_studio campus facoltà aula_magna seminario microscopio atomo molecola cellula gene evoluzione equazione formula frazione geometria algebra statistica astronomia pianeta galassia",
        "es": "alumno maestro asignatura deberes nota universidad",
        "fr": "élève maître matière devoirs note université",
        "de": "Schüler Lehrerin Fach Hausaufgaben Note Universität",
    },
    "sport": {
        "en": "athlete athletics sprint jogging jog stretch warm-up workout weightlifting boxing wrestling judo karate fencing rowing sailing surfing skateboard snowboard skates skating hockey rugby baseball golf cricket badminton table_tennis ping-pong net racket bat helmet jersey kit trainers sneakers whistle_sport medal trophy podium league season fixture opponent rival defender striker goalkeeper midfielder kick throw catch dribble shoot score_goal draw victory defeat fan_sport supporter crowd_stadium olympics world_cup",
        "it": "atleta atletica scatto jogging stretching riscaldamento_sport sollevamento_pesi pugilato lotta judo karate scherma canottaggio vela surf skateboard snowboard pattini pattinaggio hockey rugby baseball golf badminton ping-pong rete_da_tennis racchetta mazza casco maglia scarpe_da_ginnastica medaglia trofeo podio lega stagione avversario difensore attaccante portiere centrocampista calciare lanciare dribblare tirare pareggio vittoria sconfitta tifosi olimpiadi mondiali",
        "es": "atleta entrenador campeonato raqueta portero",
        "fr": "athlète entraîneur championnat raquette gardien",
        "de": "Sportler Trainer Meisterschaft Schläger Torwart",
    },
    "culture": {
        "en": "masterpiece canvas easel portrait landscape_painting still_life exhibition exhibit curator statue fresco mosaic architecture cathedral castle palace heritage tradition folklore festival_music melody rhythm lyrics chorus choir tenor soprano composer conductor symphony album record vinyl playlist drum flute trumpet saxophone harp audience applause ticket_show premiere scene act plot character protagonist villain chapter bestseller publisher fiction fairy_tale myth legend comic cartoon animation documentary sculpture_clay ceramics",
        "it": "capolavoro tela cavalletto ritratto paesaggio natura_morta mostra esposizione curatore statua affresco mosaico architettura cattedrale castello palazzo patrimonio tradizione folclore melodia ritmo testo_canzone ritornello coro tenore soprano compositore direttore_d'orchestra sinfonia album disco vinile batteria flauto tromba sassofono arpa pubblico applausi prima scena atto trama personaggio protagonista cattivo capitolo bestseller editore narrativa fiaba mito leggenda fumetto cartone_animato documentario ceramica",
        "es": "obra_maestra retrato exposición escultura cantante",
        "fr": "chef-d'œuvre portrait exposition sculpture chanteur",
        "de": "Meisterwerk Porträt Ausstellung Skulptur Sänger",
    },
    "feelings": {
        "en": "cheerful gloomy upset furious annoyed irritated frustrated disappointed embarrassed guilty grateful thankful hopeful hopeless desperate confident insecure stubborn arrogant humble modest naive wise cruel gentle_kind tender affectionate caring loving grumpy moody sensitive emotional enthusiastic curious anxious_mood terrified horrified amazed astonished delighted pleased satisfied content miserable heartbroken homesick nostalgia longing pride shame guilt compassion sympathy empathy loneliness boredom",
        "it": "allegro cupo turbato furioso infastidito irritato frustrato deluso imbarazzato colpevole grato speranzoso disperato sicuro_di_sé insicuro testardo arrogante umile modesto ingenuo saggio crudele tenero affettuoso premuroso scontroso lunatico sensibile emotivo entusiasta curioso terrorizzato stupito sbalordito contento soddisfatto infelice affranto nostalgia malinconia orgoglio colpa compassione empatia solitudine noia gelosia ansia tristemente",
        "es": "alegre enojado decepcionado orgulloso vergüenza nostalgia",
        "fr": "joyeux énervé déçu fier honte nostalgie",
        "de": "fröhlich enttäuscht stolz Scham Sehnsucht ängstlich",
    },
}

GENERIC_EXTRA = {
    "en": "about above across after against along among around before behind below beside between beyond during except inside near outside since through toward under until upon within without able allow appear arrive believe bring build buy carry cause choose consider continue create decide describe develop explain expect fall follow happen hear hold include increase join kill lead learn_general lie lose meet mention move offer open pay plan play_general produce provide reach read_general receive remain remember report require return run_general send serve set show sit stand start stay stop suggest talk teach thank throw_general touch turn understand visit wait walk win wish wonder write certain clear common easy free full general hard human large late likely local low main major modern national natural nice open_adj other poor possible ready real recent simple special strong sure true usual various whole_adj wrong amount area bit case_general chance course_general detail effect example form idea issue kind level line matter member moment number_general order part_general period place point_general position problem question reason result side situation sort space stage_general state step story system term type use value view way_general",
    "it": "sopra sotto dentro fuori prima dopo durante contro verso attraverso intorno accanto senza tranne entro lungo permettere apparire arrivare credere portare costruire comprare_generico causare scegliere considerare continuare creare decidere descrivere sviluppare spiegare aspettarsi cadere seguire accadere sentire tenere includere aumentare unirsi condurre mentire perdere incontrare menzionare muovere offrire aprire pagare progettare produrre fornire raggiungere ricevere restare ricordare richiedere tornare servire mostrare sedersi stare iniziare fermare suggerire parlare insegnare ringraziare toccare girare capire visitare camminare vincere desiderare chiedersi scrivere certo chiaro comune facile libero pieno generale difficile umano tardi probabile locale basso principale moderno nazionale naturale bello aperto povero possibile pronto reale recente semplice speciale forte vero solito vario sbagliato quantità zona pezzo occasione dettaglio effetto esempio forma idea questione tipo livello linea faccenda membro momento ordine periodo posto posizione problema domanda ragione risultato lato situazione sorta spazio stato passo storia sistema termine valore vista",
    "es": "sobre debajo durante contra hacia permitir llegar creer elegir decidir explicar seguir cierto claro fácil libre posible simple",
    "fr": "sur sous pendant contre vers permettre arriver croire choisir décider expliquer suivre certain clair facile libre possible simple",
    "de": "über unter während gegen nach erlauben ankommen glauben wählen entscheiden erklären folgen sicher klar einfach frei möglich",
}

for _t, _langs in EXTRA.items():
    for _l, _text in _langs.items():
        SEEDS[_t][_l] = SEEDS[_t][_l] + " " + _text
for _l, _text in GENERIC_EXTRA.items():
    GENERIC[_l] = GENERIC[_l] + " " + _text

# "_" joins multi-word expressions; a few tokens use it only to tell two senses apart:
# those are rewritten here (None = dropped).
_SENSE = {
    'anxious_mood': 'anxious', 'backpack_school': 'school bag', 'case_general': 'case', 'comprare_generico': 'comprare',
    'course_general': 'of course', 'crowd_stadium': 'crowd', 'currency_money': 'currency', 'cursor_click': 'click',
    'fan_sport': 'sports fan', 'festival_music': 'music festival', 'fridge_food': None, 'gate_house': 'garden gate',
    'gentle_kind': 'gentle', 'grade_score': 'grade', 'insect_ant': 'insect', 'learn_general': 'learn',
    'message_app': 'messaging app', 'mushroom_wild': 'wild mushroom', 'neighbour_person': 'neighbour',
    'number_general': 'number', 'open_adj': 'open', 'part_general': 'part', 'partner_business': 'business partner',
    'pepper_vegetable': 'bell pepper', 'plant_seed': 'plant', 'play_general': 'play', 'point_general': 'point',
    'read_general': 'read', 'receptionist_job': 'receptionist', 'riscaldamento_sport': None, 'run_general': 'run',
    'sculpture_clay': 'clay sculpture', 'stage_general': None, 'term_school': 'school term', 'throw_general': 'throw',
    'ticket_show': 'theatre ticket', 'timetable_school': 'school timetable', 'trunk_tree': 'tree trunk',
    'type_text': 'typing', 'village_farm': 'village', 'way_general': 'way', 'whistle_sport': None,
    'whole_adj': 'whole', 'window_icon': None, 'dolce_sapore': 'dolciastro', 'score_goal': 'score a goal',
    'grade': 'grade',
}


def words(text):  # noqa: F811 (replaces the simple version above)
    out = []
    for token in text.split():
        token = _SENSE.get(token, token)
        if token:
            out.append(token.replace('_', ' '))
    return out
