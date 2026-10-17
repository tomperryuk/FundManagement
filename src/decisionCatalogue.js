import { allDecisions } from './designData.js'
import { orgDecisions } from './orgModel.js'
import { mmDecisions } from './marketMaking.js'

export const decisionCatalogue = [
  ...allDecisions.map(d => ({ ...d, scope: 'platform', link: `#/node/${d.nodeId}/d${d.id.split('-').pop()}` })),
  ...orgDecisions.map(d => ({ ...d, scope: 'organisation', link: `#/org/decisions/${d.id}` })),
  ...mmDecisions.map(d => ({ ...d, scope: 'extension', link: `#/marketmaking/decisions/${d.id}` })),
]
