// Orthogonal edge router: A* over a coarse grid with node boxes as obstacles.
// Penalises turns and running alongside already-routed edges so lines spread
// into the corridors between columns instead of stacking or crossing boxes.

const CELL = 10
const PAD = 9
const TURN = 8
const PARALLEL = 2
const CROSS = 0.6
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] // right, down, left, up

class Heap {
  constructor() { this.k = []; this.v = [] }
  get size() { return this.k.length }
  push(key, val) {
    const { k, v } = this
    let i = k.length
    k.push(key); v.push(val)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (k[p] <= key) break
      k[i] = k[p]; v[i] = v[p]; i = p
    }
    k[i] = key; v[i] = val
  }
  pop() {
    const { k, v } = this
    const top = v[0], topKey = k[0]
    const lk = k.pop(), lv = v.pop()
    if (k.length) {
      let i = 0
      const n = k.length
      for (;;) {
        let c = 2 * i + 1
        if (c >= n) break
        if (c + 1 < n && k[c + 1] < k[c]) c++
        if (k[c] >= lk) break
        k[i] = k[c]; v[i] = v[c]; i = c
      }
      k[i] = lk; v[i] = lv
    }
    return [topKey, top]
  }
}

export function routeEdges(nodes, edges, W, H) {
  const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL), N = cols * rows
  const owner = new Int16Array(N).fill(-1)
  const cellsOf = nodes.map(() => [])
  nodes.forEach((n, i) => {
    for (let cy = 0; cy < rows; cy++) {
      const y = cy * CELL + CELL / 2
      if (y < n.y - PAD || y > n.y + n.h + PAD) continue
      for (let cx = 0; cx < cols; cx++) {
        const x = cx * CELL + CELL / 2
        if (x >= n.x - PAD && x <= n.x + n.w + PAD) {
          owner[cy * cols + cx] = i
          cellsOf[i].push(cy * cols + cx)
        }
      }
    }
  })
  const hUse = new Float32Array(N), vUse = new Float32Array(N)
  const index = Object.fromEntries(nodes.map((n, i) => [n.id, i]))
  const cx = (c) => (c % cols) * CELL + CELL / 2
  const cy = (c) => Math.floor(c / cols) * CELL + CELL / 2

  // Cost of leaving/entering a box away from the middle of a side.
  const portCost = (n, c, d) => {
    if (n.wide) return 0
    const off = d % 2 === 0 ? Math.abs(cy(c) - (n.y + n.h / 2)) : Math.abs(cx(c) - (n.x + n.w / 2))
    return (off / CELL) * 0.5
  }

  const dist = (n, c) => {
    const x = cx(c), y = cy(c)
    const dx = Math.max(n.x - PAD - x, 0, x - (n.x + n.w + PAD))
    const dy = Math.max(n.y - PAD - y, 0, y - (n.y + n.h + PAD))
    return (dx + dy) / CELL
  }

  const order = [...edges].sort((a, b) => {
    if ((a.kind === 'ui') !== (b.kind === 'ui')) return a.kind === 'ui' ? 1 : -1
    const span = (e) => {
      const s = nodes[index[e.from]], t = nodes[index[e.to]]
      return Math.abs(s.x - t.x) + Math.abs(s.y - t.y)
    }
    return span(a) - span(b)
  })

  const g = new Float64Array(N * 4)
  const prev = new Int32Array(N * 4)
  const closed = new Uint8Array(N * 4)
  const out = {}

  for (const e of order) {
    const si = index[e.from], ti = index[e.to]
    const s = nodes[si], t = nodes[ti]
    g.fill(Infinity); prev.fill(-1); closed.fill(0)
    const heap = new Heap()

    for (const c of cellsOf[si]) {
      const x = c % cols, y = Math.floor(c / cols)
      for (let d = 0; d < 4; d++) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1]
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
        const nb = ny * cols + nx
        if (owner[nb] !== -1) continue
        const st = nb * 4 + d
        const cost = portCost(s, nb, d)
        if (cost < g[st]) { g[st] = cost; prev[st] = -2; heap.push(cost + dist(t, nb), st) }
      }
    }

    let best = Infinity, bestState = -1, bestDir = -1
    while (heap.size) {
      const [key, st] = heap.pop()
      if (key >= best) break
      if (closed[st]) continue
      closed[st] = 1
      const c = st >> 2, d = st & 3, gc = g[st]
      const x = c % cols, y = Math.floor(c / cols)
      for (let nd = 0; nd < 4; nd++) {
        if (nd === (d + 2) % 4) continue
        const nx = x + DIRS[nd][0], ny = y + DIRS[nd][1]
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
        const nb = ny * cols + nx
        const o = owner[nb]
        const turn = nd !== d ? TURN : 0
        if (o === ti) {
          const total = gc + 1 + turn + portCost(t, c, nd)
          if (total < best) { best = total; bestState = st; bestDir = nd }
          continue
        }
        if (o !== -1) continue
        const horiz = nd % 2 === 0
        const use = horiz ? hUse[nb] * PARALLEL + vUse[nb] * CROSS : vUse[nb] * PARALLEL + hUse[nb] * CROSS
        const cost = gc + 1 + turn + use
        const ns = nb * 4 + nd
        if (cost < g[ns]) { g[ns] = cost; prev[ns] = st; heap.push(cost + dist(t, nb), ns) }
      }
    }

    if (bestState < 0) {
      // No route found: fall back to a straight line between centres.
      const a = [s.x + s.w / 2, s.y + s.h / 2], b = [t.x + t.w / 2, t.y + t.h / 2]
      out[e.id] = { d: `M${a[0]},${a[1]} L${b[0]},${b[1]}`, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
      continue
    }

    // Reconstruct cells and directions.
    const cells = [], dirs = []
    for (let st = bestState; st >= 0; st = prev[st]) {
      cells.push(st >> 2); dirs.push(st & 3)
      if (prev[st] === -2) break
    }
    cells.reverse(); dirs.reverse()

    // Mark usage, spreading a little to neighbouring lanes.
    cells.forEach((c, i) => {
      const horiz = dirs[i] % 2 === 0
      const arr = horiz ? hUse : vUse
      arr[c] += 1
      const x = c % cols, y = Math.floor(c / cols)
      const nbrs = horiz ? [[x, y - 1], [x, y + 1]] : [[x - 1, y], [x + 1, y]]
      for (const [px, py] of nbrs) if (px >= 0 && py >= 0 && px < cols && py < rows) arr[py * cols + px] += 0.5
    })

    const first = cells[0], last = cells[cells.length - 1]
    const d0 = dirs[0]
    const start = d0 === 0 ? [s.x + s.w, cy(first)] : d0 === 2 ? [s.x, cy(first)] : d0 === 1 ? [cx(first), s.y + s.h] : [cx(first), s.y]
    const end = bestDir === 0 ? [t.x, cy(last)] : bestDir === 2 ? [t.x + t.w, cy(last)] : bestDir === 1 ? [cx(last), t.y] : [cx(last), t.y + t.h]

    const pts = [start]
    for (let i = 1; i < cells.length; i++) if (dirs[i] !== dirs[i - 1]) pts.push([cx(cells[i - 1]), cy(cells[i - 1])])
    if (cells.length && dirs[dirs.length - 1] !== bestDir) pts.push([cx(last), cy(last)])
    pts.push(end)
    out[e.id] = { d: roundedPath(pts, 9), mid: midpoint(pts) }
  }
  return out
}

function roundedPath(pts, r) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i], [nx, ny] = pts[i + 1]
    const l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const ax = x - ((x - px) / l1) * rr, ay = y - ((y - py) / l1) * rr
    const bx = x + ((nx - x) / l2) * rr, by = y + ((ny - y) / l2) * rr
    d += ` L${ax},${ay} Q${x},${y} ${bx},${by}`
  }
  const l = pts[pts.length - 1]
  return d + ` L${l[0]},${l[1]}`
}

function midpoint(pts) {
  let total = 0
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  let half = total / 2
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    if (half <= seg) {
      const k = seg ? half / seg : 0
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]
    }
    half -= seg
  }
  return pts[0]
}
