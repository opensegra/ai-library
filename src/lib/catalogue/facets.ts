export const COLOURS: Record<string, string> = {
  black: '#1C1C1E',
  white: '#FFFFFF',
  ivory: '#F6F1E3',
  cream: '#EFE3C8',
  beige: '#D9C3A0',
  brown: '#7A5136',
  khaki: '#A99B6B',
  olive: '#6E7344',
  grey: '#9A9AA0',
  silver: '#C7CBD1',
  gold: '#C9A23E',
  red: '#C8202F',
  burgundy: '#6E1B2A',
  pink: '#F2A6BF',
  orange: '#EF8A2B',
  yellow: '#F2CF3D',
  green: '#3E8E4E',
  mint: '#9FDCC4',
  blue: '#3B78D8',
  navy: '#1F2E5A',
  lavender: '#B9A6E3',
  purple: '#7B3FA6'
};

export const FACET_GROUPS: Record<string, string[]> = {
  Garment: 'dress skirt pants shorts jeans shirt blouse camisole knit sweater turtleneck hoodie cardigan jacket coat vest corset robe swimsuit bra briefs apron'.split(' '),
  Length: 'mini midi maxi'.split(' '),
  Footwear: 'boots heels pumps sandals sneakers loafers socks stockings tights'.split(' '),
  Fabric: 'lace leather satin denim fur suede wool velvet corduroy chiffon tulle mesh frill pleated floral polka-dot ribbon'.split(' '),
  Accessory: 'bag tote necklace choker belt hat beret beanie headband gloves sunglasses scarf muffler'.split(' ')
};

export function colourName(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
