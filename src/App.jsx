import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(ds) {
  if (ds === TODAY) return 'today'
  const d = new Date(ds + 'T12:00:00')
  const diff = Math.floor((new Date(TODAY) - d) / 86400000)
  if (diff === 1) return 'yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDatesInRange(start, days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ── Shared card wrapper ──────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      boxShadow: 'var(--shadow)',
      ...style
    }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem'
    }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, variant = 'default', style }) {
  const styles = {
    default: { background: 'none', border: '0.5px solid var(--border-md)', color: 'var(--text)' },
    primary: { background: 'var(--text)', border: '0.5px solid var(--text)', color: 'var(--bg)' },
    success: { background: 'var(--success-bg)', border: '0.5px solid var(--success)', color: 'var(--success)' },
    danger: { background: 'none', border: '0.5px solid var(--border)', color: 'var(--danger)' },
  }
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius)', padding: '8px 18px', fontSize: 13,
        fontWeight: 500, transition: 'opacity 0.12s, transform 0.1s',
        ...styles[variant], ...style
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {children}
    </button>
  )
}

// ── TODAY TAB ────────────────────────────────────────────────────
function TodayTab({ checkins, experiments, onCheckin, loading }) {
  const todayCI = checkins[TODAY] || {}
  const yesCount = Object.values(todayCI).filter(v => v === 'yes').length
  const answered = Object.keys(todayCI).length

  const questions = [
    'Did I touch something build-related today?',
    'Did I reduce uncertainty on one tiny technical question?',
    'Did I make one thing slightly more real than yesterday?',
  ]

  const scoreMsg = ['one yes counts. keep going.', 'two out of three — real day.', 'full marks. motion detected.']
  const todayExps = experiments.filter(e => e.date === TODAY)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <Label>daily check-in</Label>
        {questions.map((q, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '10px 0',
            borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none'
          }}>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{q}</span>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 2 }}>
              {['yes', 'no'].map(v => (
                <button
                  key={v}
                  disabled={loading}
                  onClick={() => onCheckin(i, v)}
                  style={{
                    border: '0.5px solid',
                    borderRadius: 'var(--radius)',
                    padding: '4px 12px',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    ...(todayCI[i] === v
                      ? v === 'yes'
                        ? { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }
                        : { background: 'var(--bg-hover)', color: 'var(--text-2)', borderColor: 'var(--border-md)' }
                      : { background: 'none', color: 'var(--text-3)', borderColor: 'var(--border)' }
                    )
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        {answered > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'var(--success)',
                width: `${Math.round((yesCount / 3) * 100)}%`,
                transition: 'width 0.5s ease'
              }} />
            </div>
            {yesCount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>
                {scoreMsg[yesCount - 1]}
              </div>
            )}
          </div>
        )}
      </Card>

      <SprintTimer />

      {todayExps.length > 0 && (
        <Card>
          <Label>logged today</Label>
          {todayExps.map(e => (
            <div key={e.id} style={{
              fontSize: 14, color: 'var(--text-2)', padding: '5px 0',
              display: 'flex', gap: 8, alignItems: 'flex-start'
            }}>
              <span style={{ color: 'var(--success)', marginTop: 2 }}>✓</span>
              <span>{e.text}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{
        fontFamily: 'Lora, serif', fontStyle: 'italic',
        fontSize: 13, color: 'var(--text-3)', textAlign: 'center',
        lineHeight: 1.8, paddingTop: '0.5rem'
      }}>
        "A project is any artifact that took more than one sitting and taught me something."
      </div>
    </div>
  )
}

// ── SPRINT TIMER ─────────────────────────────────────────────────
function SprintTimer() {
  const [seconds, setSeconds] = useState(1200)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const interval = useRef(null)

  const tick = useCallback(() => {
    setSeconds(s => {
      if (s <= 1) {
        clearInterval(interval.current)
        setRunning(false)
        setDone(true)
        return 0
      }
      return s - 1
    })
  }, [])

  const start = () => {
    if (running) { clearInterval(interval.current); setRunning(false); return }
    setDone(false)
    setRunning(true)
    interval.current = setInterval(tick, 1000)
  }

  const reset = () => {
    clearInterval(interval.current)
    setRunning(false)
    setSeconds(1200)
    setDone(false)
  }

  useEffect(() => () => clearInterval(interval.current), [])

  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const pct = Math.round(((1200 - seconds) / 1200) * 100)

  return (
    <Card>
      <Label>20-min focus sprint</Label>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 40,
          fontWeight: 500, letterSpacing: '0.04em', color: done ? 'var(--success)' : 'var(--text)'
        }}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
          {done ? "time's up. did you hit one milestone?" : running ? 'stop when you hit one visible milestone' : 'set a tiny goal, hit start'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={start} variant="primary">{running ? 'pause' : 'start'}</Btn>
          <Btn onClick={reset}>reset</Btn>
        </div>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: '0.75rem' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: done ? 'var(--success)' : 'var(--info)',
          width: `${pct}%`,
          transition: 'width 1s linear'
        }} />
      </div>
    </Card>
  )
}

// ── EXPERIMENTS TAB ──────────────────────────────────────────────
function ExperimentsTab({ experiments, onAdd, onDelete, loading }) {
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="what did you build or poke at today?"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Btn onClick={submit} variant="primary" style={{ flexShrink: 0 }}>log it</Btn>
      </div>

      <Card>
        <Label>throwaway experiments</Label>
        {experiments.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '1rem 0', fontStyle: 'italic' }}>
            nothing yet — every tiny thing counts
          </div>
        ) : (
          <div>
            {experiments.map((e, idx) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 0',
                borderBottom: idx < experiments.length - 1 ? '0.5px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--success)', flexShrink: 0, marginTop: 5
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{e.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatDate(e.date)}</div>
                </div>
                <button
                  onClick={() => onDelete(e.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-3)',
                    fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {experiments.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
          {experiments.length} experiment{experiments.length !== 1 ? 's' : ''} logged in total
        </div>
      )}
    </div>
  )
}

// ── CHALLENGE TAB ────────────────────────────────────────────────
function ChallengeTab({ checkins, experiments, challengeStart }) {
  const dates = getDatesInRange(challengeStart, 14)
  const activeDates = new Set([
    ...Object.entries(checkins)
      .filter(([, v]) => Object.values(v).some(x => x === 'yes'))
      .map(([d]) => d),
    ...experiments.map(e => e.date)
  ])

  const streak = dates.filter(d => activeDates.has(d)).length
  const expCount = experiments.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <Label>14-day throwaway challenge</Label>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 36, fontWeight: 400, color: 'var(--text)', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>days touched something</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 36, fontWeight: 400, color: 'var(--text)', lineHeight: 1 }}>{expCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>experiments logged</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginBottom: '0.75rem' }}>
          {dates.map(d => {
            const isToday = d === TODAY
            const done = activeDates.has(d)
            const isPast = d < TODAY
            return (
              <div
                key={d}
                title={d}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  background: done ? 'var(--success)' : isPast ? 'var(--danger-bg)' : 'var(--border)',
                  border: isToday ? '1.5px solid var(--text)' : '1.5px solid transparent',
                  opacity: done ? 0.9 : 1,
                  transition: 'background 0.3s'
                }}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
          {[
            { color: 'var(--success)', label: 'checked in' },
            { color: 'var(--danger-bg)', label: 'missed' },
            { color: 'var(--border)', label: 'upcoming' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color, border: '0.5px solid var(--border)' }} />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <Label>the only goal</Label>
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8 }}>
          Become a person who starts small things without panicking.
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
            Not finishing. Not impressing. Just starting.
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── ANALYTICS TAB ────────────────────────────────────────────────
function AnalyticsTab({ checkins, experiments }) {
  const allDates = Object.keys(checkins)
  const allExpDates = experiments.map(e => e.date)
  const activeDays = new Set([
    ...allDates.filter(d => Object.values(checkins[d]).some(v => v === 'yes')),
    ...allExpDates
  ])

  // Last 30 days heatmap
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const ds = d.toISOString().split('T')[0]
    const expCount = experiments.filter(e => e.date === ds).length
    const ci = checkins[ds] || {}
    const yesCount = Object.values(ci).filter(v => v === 'yes').length
    return { date: ds, expCount, yesCount, active: activeDays.has(ds) }
  })

  // Day of week activity
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowCounts = Array(7).fill(0)
  activeDays.forEach(d => { dowCounts[new Date(d + 'T12:00:00').getDay()]++ })
  const dowData = dowLabels.map((l, i) => ({ day: l, count: dowCounts[i] }))

  // Weekly experiment bar
  const last8Weeks = Array.from({ length: 8 }, (_, i) => {
    const monday = new Date()
    monday.setDate(monday.getDate() - monday.getDay() + 1 - (7 * (7 - i)))
    const weekStart = monday.toISOString().split('T')[0]
    const weekDates = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekStart + 'T12:00:00')
      d.setDate(d.getDate() + j)
      return d.toISOString().split('T')[0]
    })
    const count = weekDates.filter(d => activeDays.has(d)).length
    return {
      week: `W${i + 1}`,
      count,
      label: new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  })

  const totalActiveDays = activeDays.size
  const totalExps = experiments.length
  const longestStreak = calcLongestStreak(activeDays)
  const currentStreak = calcCurrentStreak(activeDays)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12
        }}>
          <div style={{ color: 'var(--text-2)' }}>{payload[0]?.payload?.label || label}</div>
          <div style={{ color: 'var(--text)', fontWeight: 500 }}>{payload[0]?.value} active days</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'total active days', value: totalActiveDays },
          { label: 'experiments logged', value: totalExps },
          { label: 'current streak', value: `${currentStreak}d` },
          { label: 'longest streak', value: `${longestStreak}d` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1rem', boxShadow: 'var(--shadow)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 400, color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      <Card>
        <Label>last 30 days</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {last30.map(d => (
            <div
              key={d.date}
              title={`${d.date}: ${d.expCount} exp, ${d.yesCount} yes`}
              style={{
                aspectRatio: '1', borderRadius: 4,
                background: d.active
                  ? d.expCount >= 2 ? 'var(--success)' : 'color-mix(in srgb, var(--success) 50%, var(--bg))'
                  : 'var(--border)',
                border: d.date === TODAY ? '1.5px solid var(--text)' : '1.5px solid transparent',
                cursor: 'default'
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)', marginTop: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'color-mix(in srgb, var(--success) 50%, var(--bg))' }} />
            checked in
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--success)' }} />
            2+ experiments
          </span>
        </div>
      </Card>

      <Card>
        <Label>weekly activity (last 8 weeks)</Label>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={last8Weeks} barSize={18} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {last8Weeks.map((entry, i) => (
                <Cell key={i} fill={entry.count > 0 ? 'var(--success)' : 'var(--border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <Label>most active days of week</Label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60, marginBottom: 4 }}>
          {dowData.map(({ day, count }) => {
            const max = Math.max(...dowData.map(d => d.count), 1)
            const pct = Math.round((count / max) * 100)
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', background: pct > 0 ? 'var(--info)' : 'var(--border)',
                  borderRadius: '3px 3px 0 0', height: `${Math.max(pct, 4)}%`,
                  opacity: pct > 0 ? 0.8 : 1, transition: 'height 0.5s ease'
                }} />
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{day}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function calcCurrentStreak(activeDays) {
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (!activeDays.has(ds)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function calcLongestStreak(activeDays) {
  if (!activeDays.size) return 0
  const sorted = Array.from(activeDays).sort()
  let max = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00')
    const curr = new Date(sorted[i] + 'T12:00:00')
    const diff = (curr - prev) / 86400000
    if (diff === 1) { cur++; max = Math.max(max, cur) } else cur = 1
  }
  return max
}

// ── RULES TAB ────────────────────────────────────────────────────
function RulesTab() {
  const rules = [
    'You are banned from building portfolio projects. You are only allowed to build throwaway experiments.',
    'Nothing public. Nothing resume-worthy. Nothing that has to become a startup, research project, or polished demo.',
    'You can only look at maker portfolios after you\'ve done 25 minutes of your own work that day. Not before.',
    'Stop at one visible milestone. Stopping early on purpose is the whole point — it teaches your brain that starting doesn\'t equal getting trapped.',
    'Being overwhelmed is not the same as being lazy. Friction is not incapacity.',
  ]
  const starters = [
    'Create the repo and write the README with the one-sentence goal',
    'Get one sensor to stream data to a terminal',
    'Make one ugly ROS node talk to another',
    'Get one OpenCV pipeline to detect something simple',
    'Flash one board and log one output correctly',
    'Make one tiny web dashboard for a hardware value',
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <Label>the 14-day contract</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map((r, i) => (
            <div key={i} style={{
              borderLeft: '2px solid var(--border-md)', paddingLeft: '0.875rem',
              fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65
            }}>
              {r}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Label>what counts as a first step</Label>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {starters.map((s, i) => (
            <div key={i} style={{
              fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5,
              padding: '8px 0',
              borderBottom: i < starters.length - 1 ? '0.5px solid var(--border)' : 'none',
              display: 'flex', gap: 8, alignItems: 'flex-start'
            }}>
              <span style={{ color: 'var(--text-3)', flexShrink: 0, fontSize: 12, marginTop: 2 }}>{i + 1}.</span>
              {s}
            </div>
          ))}
        </div>
      </Card>
      <div style={{
        fontFamily: 'Lora, serif', fontStyle: 'italic',
        fontSize: 14, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.8
      }}>
        "Your goal is not 'finish a project.'<br />
        Your goal is 'become a person who starts small things without panicking.'"
      </div>
    </div>
  )
}

// ── ROOT APP ─────────────────────────────────────────────────────
const TABS = ['today', 'experiments', 'challenge', 'analytics', 'rules']

export default function App() {
  const [tab, setTab] = useState('today')
  const [checkins, setCheckins] = useState({})
  const [experiments, setExperiments] = useState([])
  const [challengeStart] = useState(TODAY)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: ciData }, { data: expData }] = await Promise.all([
        supabase.from('checkins').select('*').order('date', { ascending: false }),
        supabase.from('experiments').select('*').order('created_at', { ascending: false })
      ])
      const ciMap = {}
      for (const row of (ciData || [])) {
        ciMap[row.date] = { 0: row.q0, 1: row.q1, 2: row.q2 }
        // filter undefined
        Object.keys(ciMap[row.date]).forEach(k => { if (!ciMap[row.date][k]) delete ciMap[row.date][k] })
      }
      setCheckins(ciMap)
      setExperiments(expData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckin(q, v) {
    const prev = checkins[TODAY] || {}
    const next = { ...prev, [q]: v }
    setCheckins(c => ({ ...c, [TODAY]: next }))
    setSyncing(true)
    try {
      await supabase.from('checkins').upsert({
        date: TODAY,
        q0: next[0] || null,
        q1: next[1] || null,
        q2: next[2] || null,
      }, { onConflict: 'date' })
    } finally {
      setSyncing(false)
    }
  }

  async function handleAddExp(text) {
    setSyncing(true)
    try {
      const { data } = await supabase.from('experiments')
        .insert({ text, date: TODAY })
        .select().single()
      if (data) setExperiments(e => [data, ...e])
    } finally {
      setSyncing(false)
    }
  }

  async function handleDeleteExp(id) {
    setExperiments(e => e.filter(x => x.id !== id))
    await supabase.from('experiments').delete().eq('id', id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 1rem 4rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '1.75rem 0 0'
        }}>
          <div style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--text-2)', letterSpacing: '0.02em' }}>
            throwaway lab
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {syncing ? 'saving…' : loading ? 'loading…' : ''}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '0.5px solid var(--border)',
          marginBottom: '1.25rem', marginTop: '1rem',
          overflowX: 'auto'
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none',
                padding: '8px 14px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
                color: tab === t ? 'var(--text)' : 'var(--text-3)',
                fontWeight: tab === t ? 500 : 400,
                borderBottom: `2px solid ${tab === t ? 'var(--text)' : 'transparent'}`,
                marginBottom: -1, whiteSpace: 'nowrap', transition: 'color 0.15s'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem', fontSize: 13 }}>
            loading…
          </div>
        ) : (
          <>
            {tab === 'today' && <TodayTab checkins={checkins} experiments={experiments} onCheckin={handleCheckin} loading={syncing} />}
            {tab === 'experiments' && <ExperimentsTab experiments={experiments} onAdd={handleAddExp} onDelete={handleDeleteExp} loading={syncing} />}
            {tab === 'challenge' && <ChallengeTab checkins={checkins} experiments={experiments} challengeStart={challengeStart} />}
            {tab === 'analytics' && <AnalyticsTab checkins={checkins} experiments={experiments} />}
            {tab === 'rules' && <RulesTab />}
          </>
        )}
      </div>
    </div>
  )
}
