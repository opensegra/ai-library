import type { Costume } from '@/lib/catalogue/types';

type Part = 'clothing' | 'legwear' | 'shoes' | 'accessories';

const PARTS: Record<string, Part> = {
    skirt: 'clothing',
    dress: 'clothing',
    coat: 'clothing',
    cardigan: 'clothing',
    jacket: 'clothing',
    pants: 'clothing',
    camisole: 'clothing',
    shirt: 'clothing',
    bra: 'clothing',
    briefs: 'clothing',
    blouse: 'clothing',
    jeans: 'clothing',
    corset: 'clothing',
    turtleneck: 'clothing',
    robe: 'clothing',
    swimsuit: 'clothing',
    sweater: 'clothing',
    vest: 'clothing',
    hoodie: 'clothing',
    apron: 'clothing',
    shorts: 'clothing',
    socks: 'legwear',
    tights: 'legwear',
    stockings: 'legwear',
    boots: 'shoes',
    sandals: 'shoes',
    heels: 'shoes',
    sneakers: 'shoes',
    loafers: 'shoes',
    pumps: 'shoes',
    bag: 'accessories',
    tote: 'accessories',
    necklace: 'accessories',
    choker: 'accessories',
    belt: 'accessories',
    hat: 'accessories',
    beret: 'accessories',
    beanie: 'accessories',
    headband: 'accessories',
    sunglasses: 'accessories',
    scarf: 'accessories',
    muffler: 'accessories',
    gloves: 'accessories'
};

const COLOURS = new Set([
    'black',
    'white',
    'ivory',
    'brown',
    'beige',
    'grey',
    'red',
    'gold',
    'blue',
    'navy',
    'silver',
    'pink',
    'green',
    'mint',
    'cream',
    'yellow',
    'khaki',
    'burgundy',
    'orange',
    'olive',
    'lavender',
    'purple'
]);

const FABRICS = new Set(['denim', 'leather', 'lace', 'satin', 'suede', 'wool', 'velvet', 'chiffon', 'tulle', 'mesh', 'corduroy', 'fur']);

const LOOK: Record<string, string> = {
    Lingerie: 'a lingerie set',
    Swimwear: 'a swimwear look',
    Party: 'a party outfit',
    Glamour: 'a glamour outfit'
};

const LABEL: Record<Part, string> = {
    clothing: 'Outfit',
    legwear: 'Legwear',
    shoes: 'Shoes',
    accessories: 'Accessories'
};

interface Piece {
    part: Part;
    words: string[];
}

function piecesOf(words: string[]): Piece[] {
    const pieces: Piece[] = [];
    let modifiers: string[] = [];

    words.forEach((word, index) => {
        const next = words[index + 1];
        const part = PARTS[word];

        if (word === 'knit' && (!next || COLOURS.has(next) || FABRICS.has(next))) {
            pieces.push({ part: 'clothing', words: [...modifiers, 'knit top'] });
            modifiers = [];
            return;
        }

        if (!part) {
            modifiers.push(word);
            return;
        }

        pieces.push({ part, words: [...modifiers, word] });
        modifiers = [];
    });

    const last = pieces.at(-1);

    if (last && modifiers.length) last.words.splice(last.words.length - 1, 0, ...modifiers);
    else if (modifiers.length) pieces.push({ part: 'clothing', words: modifiers });

    return pieces;
}

function listed(items: string[]): string {
    return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export function costumePrompt(costume: Costume): string {
    const pieces = piecesOf(costume.words);
    const season = costume.catName.toLowerCase();
    const look = LOOK[costume.catName] ?? `${/^[aeiou]/.test(season) ? 'an' : 'a'} ${season} outfit`;
    const lines = [`An adult woman wearing ${look}, full body, plain light background.`];

    for (const part of Object.keys(LABEL) as Part[]) {
        const items = pieces.filter((piece) => piece.part === part).map((piece) => piece.words.join(' '));

        if (items.length) lines.push(`${LABEL[part]}: ${listed(items)}.`);
    }

    return lines.join('\n');
}
