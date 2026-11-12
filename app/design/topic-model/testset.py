# Independent evaluation set (NOT used for training or as seeds): words with their correct
# topics, written by hand, with many "tricky" cases (farm vs food, body vs health, objects…).
# Format: "word:topic+topic" ; "word:" means no topic.

TEST = {
    "it": """
germoglio:nature bestiame:nature seme:nature raccolto:nature fattoria:nature grano:nature+food
gallina:nature+food mucca:nature pollame:nature+food vigneto:nature trattore:nature
contadino:nature+work aratro:nature fieno:nature stalla:nature radice:nature ramo:nature
corteccia:nature cespuglio:nature potare:nature seminare:nature innaffiare:nature+home
farina:food lievito:food impastare:food forchetta:food+home cucchiaio:food+home padella:food+home
mestolo:food+home spezie:food prosciutto:food salame:food minestra:food antipasto:food dolce:food
tastiera:tech schermo:tech cursore:tech compilare:tech scaricare:tech rete:tech
infermiera:health ricovero:health cerotto:health stampella:health vaccinare:health guarire:health
binario:travel coincidenza:travel noleggiare:travel bagagliaio:travel decollare:travel
fattura:work scadenza:work stipendio:work sindacato:work azionista:work
lavandino:home cuscino:home trasloco:home inquilino:home
cognato:people suocera:people vedovo:people gemelli:people
lavagna:school interrogazione:school pagella:school ricreazione:school
porta:home rigore:sport fischietto:sport allenarsi:sport tifoso:sport
pennello:culture sceneggiatura:culture palcoscenico:culture poeta:culture
invidia:feelings rimpianto:feelings sollievo:feelings fiducia:feelings
sempre:  forse:  diventare:  sembrare:  cosa:  modo:  quindi:  appena:  ogni:  presto:
lentamente:  mettere:  tenere:  intero:  ancora:  bisogno:  verità:  scelta:  inizio:  fine:
""",
    "en": """
sprout:nature livestock:nature seed:nature harvest:nature farm:nature wheat:nature+food
hen:nature+food cattle:nature orchard:nature tractor:nature farmer:nature+work plough:nature
hay:nature barn:nature root:nature branch:nature bark:nature bush:nature prune:nature
flour:food yeast:food knead:food fork:food+home spoon:food+home pan:food+home ladle:food+home
spices:food ham:food stew:food dessert:food snack:food
keyboard:tech cursor:tech compile:tech download:tech browser:tech
nurse:health bandage:health crutch:health vaccinate:health heal:health
platform:travel layover:travel rent:travel trunk:travel takeoff:travel
invoice:work deadline:work wage:work union:work shareholder:work
sink:home pillow:home landlord:home tenant:home
brother-in-law:people mother-in-law:people widower:people twins:people
blackboard:school quiz:school report_card:school recess:school
penalty:sport whistle:sport referee:sport fan:sport
brush:culture screenplay:culture stage:culture poet:culture
envy:feelings regret:feelings relief:feelings trust:feelings
always:  maybe:  become:  seem:  thing:  way:  therefore:  just:  every:  soon:
slowly:  put:  keep:  whole:  again:  need:  truth:  choice:  beginning:  end:
""",
}


def items():
    out = []
    for lang, text in TEST.items():
        for tok in text.split():
            w, t = tok.split(':')
            out.append((w.replace('_', ' '), lang, set(filter(None, t.split('+')))))
    return out
