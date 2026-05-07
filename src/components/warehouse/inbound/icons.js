import { h } from 'vue'

const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((p) => h(p.tag, p.attrs)),
    )
  },
})

export const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

export const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

export const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

export const UserIcon = IconBase([
  { tag: 'path', attrs: { d: 'M20 21a8 8 0 0 0-16 0' } },
  { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
])

export const CheckIcon = IconBase([
  { tag: 'polyline', attrs: { points: '20 6 9 17 4 12' } },
])
