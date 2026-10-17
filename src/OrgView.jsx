import { nodeById, domains } from './systemData.js'
import { strategyGroups } from './operatingModel.js'
import { teamTypes, leadership, teams, ownership, forums, alignment, orgDecisions } from './orgModel.js'
import { DecisionCard } from './SystemMap.jsx'
import { useChoices } from './choices.js'

const leaderById = Object.fromEntries(leadership.map(([id, title]) => [id, title]))

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

function TeamCard({ team }) {
  const [, name, , type, mission, owns, partners, size, run] = team
  return (
    <article className={'team-card t-' + type}>
      <span className="team-type" title={teamTypes[type][1]}>{teamTypes[type][0]}</span>
      <h4>{name}</h4>
      <p className="small">{mission}</p>
      {owns.length > 0 && <div className="chip-row tight">{owns.map((id) => <NodeChip key={id} id={id} />)}</div>}
      <dl className="team-meta">
        <div><dt>Partners</dt><dd>{partners.map((p) => leaderById[p]).join(', ')}</dd></div>
        <div><dt>Indicative size</dt><dd>{size}</dd></div>
        <div><dt>Run model</dt><dd>{run}</dd></div>
      </dl>
    </article>
  )
}

export default function OrgView({ part = 'structure' }) {
  const [choices, choose] = useChoices()

  if (part === 'structure') {
    const under = (leader) => teams.filter((t) => t[2] === leader)
    return (
      <div className="org">
        <h3 className="sec-title">Leadership</h3>
        <div className="leaders">
          {leadership.map(([id, title, remit, kind]) => (
            <div key={id} className={'leader k-' + kind.toLowerCase()}>
              <span className="lk">{kind}</span>
              <b>{title}</b>
              <p className="small muted">{remit}</p>
            </div>
          ))}
        </div>

        <div className="org-branch">
          <h3 className="sec-title"><span className="branch-tag">CTO</span>Technology teams</h3>
          <div className="team-grid">{under('cto').map((t) => <TeamCard key={t[0]} team={t} />)}</div>
        </div>
        <div className="org-branch">
          <h3 className="sec-title"><span className="branch-tag">CDO</span>Data office</h3>
          <div className="team-grid">{under('cdo').map((t) => <TeamCard key={t[0]} team={t} />)}</div>
        </div>

        <div className="two-col gap-top">
          <div>
            <h4>Strategy squads, one per strategy group</h4>
            <ul className="squad-list">
              {Object.values(strategyGroups).map((g) => <li key={g}><b>{g}</b><span className="muted small">squad sits with the investment teams; builds on the shared platform</span></li>)}
            </ul>
            <h4 className="gap">Team types</h4>
            <dl className="questions">{Object.entries(teamTypes).map(([k, [n, d]]) => <div key={k}><dt><span className={'team-type t-' + k}>{n}</span></dt><dd>{d}</dd></div>)}</dl>
          </div>
          <div>
            <h4>Why this shape</h4>
            <dl className="questions">{alignment.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </div>
        <p className="source">Team sizes are indicative starting ranges for a platform of this scope. Calibrate them from the current estate, vendor footprint and delivery roadmap.</p>
      </div>
    )
  }

  if (part === 'ownership') {
    return (
      <div className="org">
        <p className="muted">Every component on the platform map has exactly one building team and one accountable business owner. Use this when assigning product owners, support rotas and decision rights.</p>
        <div className="tbl-wrap">
          <table className="tbl own-tbl">
            <thead><tr><th>Team</th><th>Component</th><th>Accountable business owner</th><th>Consult</th><th>Run model</th></tr></thead>
            <tbody>
              {teams.filter((t) => t[5].length).flatMap((t) => t[5].map((id, i) => (
                <tr key={id} className={i === 0 ? 'first' : ''}>
                  {i === 0 && <th rowSpan={t[5].length}><b>{t[1]}</b><span className="team-type small-type">{teamTypes[t[3]][0]}</span></th>}
                  <td><NodeChip id={id} /></td>
                  <td>{ownership[id][0]}</td>
                  <td className="muted">{ownership[id][1]}</td>
                  {i === 0 && <td rowSpan={t[5].length} className="muted">{t[8]}</td>}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <p className="small muted">Enabling teams (architecture, data governance) and the strategy squads own no production components by design.</p>
      </div>
    )
  }

  if (part === 'forums') {
    return (
      <div className="org">
        <p className="muted">Decision rights sit in a small number of forums, each with one chair. The architecture review board owns the <a href="#/register">decision register</a>.</p>
        <div className="tbl-wrap">
          <table className="tbl forum-tbl">
            <thead><tr><th>Forum</th><th>Chair</th><th>Members</th><th>Cadence</th><th>Decides</th></tr></thead>
            <tbody>{forums.map(([f, chair, members, cadence, decides]) => (
              <tr key={f}><th>{f}</th><td>{chair}</td><td className="muted">{members}</td><td className="nowrap">{cadence}</td><td>{decides}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="org">
      <p className="muted">Organisation decisions with options and trade-offs. Selections, rationale and history are shared between the permitted reviewers.</p>
      {orgDecisions.map((d, i) => (
        <DecisionCard key={d.id} d={d} n={i + 1} anchor={'decision-' + d.id} chosen={choices[d.id]} choose={choose} />
      ))}
    </div>
  )
}
