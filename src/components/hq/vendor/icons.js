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

export const PlusIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 5v14' } },
  { tag: 'path', attrs: { d: 'M5 12h14' } },
])

export const PencilIcon = IconBase([
  { tag: 'path', attrs: { d: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' } },
  { tag: 'path', attrs: { d: 'M15 5 19 9' } },
])

export const Trash2Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h18' } },
  { tag: 'path', attrs: { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' } },
  { tag: 'path', attrs: { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' } },
  { tag: 'line', attrs: { x1: '10', y1: '11', x2: '10', y2: '17' } },
  { tag: 'line', attrs: { x1: '14', y1: '11', x2: '14', y2: '17' } },
])

export const ToggleRightIcon = IconBase([
  { tag: 'rect', attrs: { x: '1', y: '6', width: '22', height: '12', rx: '6' } },
  { tag: 'circle', attrs: { cx: '17', cy: '12', r: '3' } },
])

export const ToggleLeftIcon = IconBase([
  { tag: 'rect', attrs: { x: '1', y: '6', width: '22', height: '12', rx: '6' } },
  { tag: 'circle', attrs: { cx: '7', cy: '12', r: '3' } },
])

export const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

export const BuildingIcon = IconBase([
  { tag: 'rect', attrs: { x: '4', y: '2', width: '16', height: '20', rx: '1' } },
  { tag: 'path', attrs: { d: 'M9 22v-4h6v4' } },
  { tag: 'path', attrs: { d: 'M8 6h.01' } },
  { tag: 'path', attrs: { d: 'M16 6h.01' } },
  { tag: 'path', attrs: { d: 'M12 6h.01' } },
  { tag: 'path', attrs: { d: 'M12 10h.01' } },
  { tag: 'path', attrs: { d: 'M8 10h.01' } },
  { tag: 'path', attrs: { d: 'M16 10h.01' } },
  { tag: 'path', attrs: { d: 'M8 14h.01' } },
  { tag: 'path', attrs: { d: 'M16 14h.01' } },
  { tag: 'path', attrs: { d: 'M12 14h.01' } },
])

export const PackageIcon = IconBase([
  {
    tag: 'path',
    attrs: {
      d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
    },
  },
  { tag: 'path', attrs: { d: 'M12 22V12' } },
  { tag: 'path', attrs: { d: 'M3.27 6.96 12 12.01l8.73-5.05' } },
  { tag: 'path', attrs: { d: 'M16 4 8 8.5' } },
])

export const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
