# Generates 12 illustrated avatars as SVG (viewBox 200x200).
import json

def shade(hex_, f):
    h=hex_.lstrip('#'); r,g,b=[int(h[i:i+2],16) for i in (0,2,4)]
    c=lambda v: max(0,min(255,int(v*f)))
    return '#%02x%02x%02x'%(c(r),c(g),c(b))

HEAD_CX, HEAD_CY, RX, RY = 100, 92, 37, 43

def base(a):
    skin=a['skin']; s=[]
    s.append(f'<circle cx="100" cy="100" r="100" fill="{a["bg"]}"/>')
    return s

def back_hair(a):
    h=a['hair']; c=a['hairColor']
    if h=='long':      return f'<path d="M58 80 Q58 40 100 40 Q142 40 142 80 L146 168 Q100 180 54 168 Z" fill="{c}"/>'
    if h=='wavy':      return f'<path d="M57 82 Q56 38 100 38 Q144 38 143 82 Q152 105 144 125 Q154 148 140 168 Q100 178 60 168 Q46 148 56 125 Q48 105 57 82 Z" fill="{c}"/>'
    if h=='afro':      return f'<circle cx="100" cy="80" r="62" fill="{c}"/>'
    if h=='bob':       return f'<path d="M56 85 Q54 42 100 42 Q146 42 144 85 L146 128 Q130 136 118 128 L82 128 Q70 136 54 128 Z" fill="{c}"/>'
    if h=='ponytail':  return f'<path d="M134 70 Q170 80 160 140 Q156 160 146 168 Q150 130 136 100 Z" fill="{c}"/>'
    if h=='hijab':     return f'<path d="M100 36 Q150 36 152 96 Q154 140 176 160 Q176 200 176 200 L24 200 Q24 160 48 140 Q46 120 48 96 Q50 36 100 36 Z" fill="{c}"/>'
    if h=='curlylong': return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x,y,r in
                                     [(64,70,22),(136,70,22),(60,100,22),(140,100,22),(62,130,20),(138,130,20),(70,152,16),(130,152,16),(100,50,30)])
    return ''

def body(a):
    skin=a['skin']; shirt=a['shirt']; s=[]
    s.append(f'<rect x="86" y="118" width="28" height="34" rx="8" fill="{shade(skin,0.9)}"/>')
    s.append(f'<path d="M28 200 C30 162 60 146 100 146 C140 146 170 162 172 200 Z" fill="{shirt}"/>')
    col=a.get('collar','v')
    if col=='v':    s.append(f'<path d="M86 147 L100 166 L114 147 Q100 152 86 147 Z" fill="{shade(skin,0.9)}"/>')
    if col=='round':s.append(f'<path d="M84 147 Q100 160 116 147 Q100 151 84 147 Z" fill="{shade(skin,0.9)}"/>')
    if col=='shirt':s.append(f'<path d="M84 146 L100 168 L92 176 L78 152 Z M116 146 L100 168 L108 176 L122 152 Z" fill="#ffffff"/>')
    if col=='hoodie':s.append(f'<path d="M70 150 Q100 182 130 150" stroke="{shade(shirt,0.75)}" stroke-width="6" fill="none" stroke-linecap="round"/><line x1="92" y1="168" x2="90" y2="186" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round"/><line x1="108" y1="168" x2="110" y2="186" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round"/>')
    if col=='cardigan':s.append(f'<path d="M86 147 L100 200 L114 147 Q100 152 86 147 Z" fill="#f4efe6"/><circle cx="104" cy="180" r="2.5" fill="{shade(shirt,0.6)}"/><circle cx="105" cy="192" r="2.5" fill="{shade(shirt,0.6)}"/>')
    return s

def head(a):
    skin=a['skin']; s=[]
    if a['hair'] not in ('hijab',):
        s.append(f'<circle cx="63" cy="96" r="9" fill="{shade(skin,0.92)}"/><circle cx="137" cy="96" r="9" fill="{shade(skin,0.92)}"/>')
    s.append(f'<ellipse cx="{HEAD_CX}" cy="{HEAD_CY}" rx="{RX}" ry="{RY}" fill="{skin}"/>')
    return s

def front_hair(a):
    h=a['hair']; c=a['hairColor']
    if h in ('long','wavy','ponytail'):  # middle/side part cap
        return f'<path d="M62 92 Q58 46 100 44 Q142 46 138 92 Q132 66 112 58 Q100 72 72 70 Q64 78 62 92 Z" fill="{c}"/>'
    if h=='afro':  return f'<path d="M64 82 Q66 48 100 46 Q134 48 136 82 Q124 64 100 62 Q76 64 64 82 Z" fill="{c}"/>'
    if h=='bob':   return f'<path d="M62 86 Q60 46 100 45 Q140 46 138 86 L136 74 Q100 82 64 74 Z" fill="{c}"/>'
    if h=='curlylong': return f'<path d="M63 84 Q64 50 100 48 Q136 50 137 84 Q126 66 100 64 Q74 66 63 84 Z" fill="{c}"/>'
    if h=='hijab': return f'<path d="M58 100 Q56 46 100 44 Q144 46 142 100 Q140 64 100 60 Q60 64 58 100 Z" fill="{shade(c,0.9)}"/>'
    if h=='short': return f'<path d="M62 86 Q58 46 100 46 Q142 46 138 86 Q134 64 120 60 Q100 68 76 62 Q66 70 62 86 Z" fill="{c}"/>'
    if h=='buzz':  return f'<path d="M64 80 Q64 48 100 48 Q136 48 136 80 Q120 62 100 62 Q80 62 64 80 Z" fill="{c}"/>'
    if h=='spiky': return f'<path d="M62 84 L60 60 L72 64 L74 46 L88 56 L96 40 L106 54 L118 42 L122 58 L136 52 L134 68 L140 70 L138 86 Q130 66 100 64 Q72 66 62 84 Z" fill="{c}"/>'
    if h=='curlyshort': return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x,y,r in
                                     [(70,66,12),(84,54,13),(100,50,13),(116,54,13),(130,66,12),(66,80,9),(134,80,9)])
    if h=='turban': return (f'<path d="M60 84 Q56 34 100 30 Q144 34 140 84 Q120 70 100 72 Q80 70 60 84 Z" fill="{c}"/>'
                            f'<path d="M64 70 Q100 40 136 64 M66 58 Q100 34 132 52" stroke="{shade(c,0.8)}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    if h=='receding': return f'<path d="M62 92 Q60 66 70 58 Q66 74 70 82 Z M138 92 Q140 66 130 58 Q134 74 130 82 Z M76 54 Q100 46 124 54 Q112 52 100 54 Q88 52 76 54 Z" fill="{c}"/>'
    return ''

def face(a):
    skin=a['skin']; brow=a.get('browColor', a['hairColor']); s=[]
    # cheeks
    s.append('<circle cx="78" cy="108" r="7" fill="#ff7a7a" opacity="0.18"/><circle cx="122" cy="108" r="7" fill="#ff7a7a" opacity="0.18"/>')
    # brows
    s.append(f'<path d="M77 82 Q85 78 93 82 M107 82 Q115 78 123 82" stroke="{brow}" stroke-width="3.5" fill="none" stroke-linecap="round"/>')
    # eyes
    eye=a.get('eyes','round')
    if eye=='round':
        s.append('<ellipse cx="85" cy="94" rx="4.2" ry="5" fill="#2b2b2b"/><ellipse cx="115" cy="94" rx="4.2" ry="5" fill="#2b2b2b"/>'
                 '<circle cx="86.5" cy="92.5" r="1.4" fill="#fff"/><circle cx="116.5" cy="92.5" r="1.4" fill="#fff"/>')
    else:  # smiling eyes
        s.append('<path d="M80 95 Q85 90 90 95 M110 95 Q115 90 120 95" stroke="#2b2b2b" stroke-width="3" fill="none" stroke-linecap="round"/>')
    # nose
    s.append(f'<path d="M100 98 Q96 108 101 110" stroke="{shade(skin,0.78)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    if a.get('freckles'):
        s.append(''.join(f'<circle cx="{x}" cy="{y}" r="1.2" fill="{shade(skin,0.7)}"/>' for x,y in [(76,104),(80,101),(83,106),(124,104),(120,101),(117,106)]))
    # beard / mustache
    b=a.get('beard')
    if b=='full': s.append(f'<path d="M64 96 Q64 140 100 142 Q136 140 136 96 Q132 120 118 118 Q100 112 82 118 Q68 120 64 96 Z" fill="{a["hairColor"]}"/>')
    if b=='short': s.append(f'<path d="M66 100 Q68 136 100 138 Q132 136 134 100 Q130 122 116 120 Q100 116 84 120 Q70 122 66 100 Z" fill="{a["hairColor"]}" opacity="0.85"/>')
    if b in ('full','short','mustache'):
        s.append(f'<path d="M86 114 Q100 106 114 114 Q100 112 86 114 Z" fill="{shade(a["hairColor"],0.85)}" stroke="{shade(a["hairColor"],0.85)}" stroke-width="4" stroke-linejoin="round"/>')
    # mouth
    lip=a.get('lip', '#b5504f')
    s.append(f'<path d="M89 118 Q100 128 111 118 Q100 122 89 118 Z" fill="{lip}" stroke="{lip}" stroke-width="2.5" stroke-linejoin="round"/>')
    if a.get('glasses'):
        g=a.get('glassesColor','#333')
        s.append(f'<circle cx="85" cy="94" r="11" fill="#ffffff" fill-opacity="0.15" stroke="{g}" stroke-width="3"/>'
                 f'<circle cx="115" cy="94" r="11" fill="#ffffff" fill-opacity="0.15" stroke="{g}" stroke-width="3"/>'
                 f'<path d="M96 93 Q100 90 104 93 M74 92 L64 90 M126 92 L136 90" stroke="{g}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    if a.get('earrings'):
        s.append('<circle cx="63" cy="108" r="3.5" fill="#f2c14e"/><circle cx="137" cy="108" r="3.5" fill="#f2c14e"/>')
    return s

def svg(a):
    if a['hair']=='hijab':  # the scarf falls over the shoulders
        parts=base(a)+body(a)+[back_hair(a)]+head(a)+[front_hair(a)]+face(a)
    else:
        parts=base(a)+[back_hair(a)]+body(a)+head(a)+[front_hair(a)]+face(a)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#c)">{parts[0]}<g transform="translate(-10 -2) scale(1.1)">{"".join(parts[1:])}</g></g></svg>'

AVATARS=[
 # women
 dict(id='woman-1', skin='#f6d5bd', hair='long', hairColor='#e8c26a', browColor='#b8923f', shirt='#5b8def', collar='round', bg='#d9e8ff', eyes='round'),
 dict(id='woman-2', skin='#7a4a2e', hair='afro', hairColor='#231a17', shirt='#f2b632', collar='v', bg='#ffe9b8', earrings=True, lip='#6e2f2a', eyes='happy'),
 dict(id='woman-3', skin='#d9a77c', hair='hijab', hairColor='#2a9d8f', browColor='#3b2a20', shirt='#7b5ea7', collar='none', bg='#d6f2ee', lip='#a8494a'),
 dict(id='woman-4', skin='#f3d2b3', hair='bob', hairColor='#1f1a1c', shirt='#e05a5a', collar='round', bg='#ffdede', glasses=True, glassesColor='#3a2a2a'),
 dict(id='woman-5', skin='#a86b47', hair='ponytail', hairColor='#1c1412', shirt='#f08a3c', collar='v', bg='#ffe2cc', earrings=True, lip='#8a3a36', eyes='happy'),
 dict(id='woman-6', skin='#e2b48f', hair='curlylong', hairColor='#6b3d22', shirt='#3fa86b', collar='round', bg='#d4f2df', freckles=True),
 # men
 dict(id='man-1', skin='#f4d1bb', hair='short', hairColor='#c2582c', shirt='#3f8f5a', collar='round', bg='#d8f0dc', beard='short'),
 dict(id='man-2', skin='#5c3523', hair='buzz', hairColor='#16100d', shirt='#3d6fd6', collar='shirt', bg='#d6e3ff', lip='#5c2a25', eyes='happy'),
 dict(id='man-3', skin='#efcfae', hair='spiky', hairColor='#1b1718', shirt='#7a8794', collar='hoodie', bg='#e3e8ee', glasses=True, glassesColor='#1f1f1f'),
 dict(id='man-4', skin='#c48c62', hair='curlyshort', hairColor='#1e1512', shirt='#7d7a3c', collar='v', bg='#efeacd', beard='full'),
 dict(id='man-5', skin='#9c6340', hair='turban', hairColor='#e0762b', browColor='#1a1210', shirt='#2f6f8f', collar='shirt', bg='#ffe4cc', beard='full', beardColor='#1a1210'),
 dict(id='man-6', skin='#e9c2a0', hair='receding', hairColor='#b9b9b9', shirt='#8c5a8c', collar='cardigan', bg='#eadcf3', glasses=True, beard='mustache', eyes='happy'),
]
# man-5: beard is black under an orange turban
for a in AVATARS:
    if a['id']=='man-5':
        a['turbanColor']=a['hairColor']
import copy
out=[]
for a in AVATARS:
    b=copy.deepcopy(a)
    if b['id']=='man-5':
        # draw turban with orange, beard/brows black
        s_turban=front_hair(b)
        b2=dict(b, hairColor='#1a1210')
        parts=base(b2)+body(b2)+head(b2)+[s_turban]+face(b2)
        svgtxt=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#c)">{parts[0]}<g transform="translate(-10 -2) scale(1.1)">{"".join(parts[1:])}</g></g></svg>'
    else:
        svgtxt=svg(b)
    open(f"{b['id']}.svg",'w').write(svgtxt)
    out.append(b['id'])
print(out)
