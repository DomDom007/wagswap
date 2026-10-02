// Wagswap: neighbours trade pet sitting for credits instead of cash, so everyone gives about as much as they get.
import { useState } from "react";
import { waLink } from "./lib/share";
import { uid, useStored } from "./lib/store";
import { useShared } from "./lib/useShared";
import { prettyDate, todayISO, addDays } from "./lib/time";
import { Section, ShareBox, Stat, Stats } from "./ui/kit";

const T = "wagswap";
type Member = { id: string; name: string; pets: string; phone: string; street: string };
type Sit = { id: string; sitter: string; owner: string; date: string; kind: "walk" | "visit" | "day" | "night"; count: number };
type Ask = { id: string; owner: string; from: string; to: string; kind: Sit["kind"]; note: string };
const CREDITS: Record<Sit["kind"], { label: string; c: number }> = { walk: { label: "Walk", c: 1 }, visit: { label: "Feeding visit", c: 1 }, day: { label: "Day", c: 4 }, night: { label: "Overnight", c: 6 } };
const SM: Member[] = [{ id: "m1", name: "Leila", pets: "Simba (dog)", phone: "", street: "Rue des Jasmins" }, { id: "m2", name: "Karim", pets: "Two cats", phone: "", street: "Rue des Jasmins" }, { id: "m3", name: "Sonia", pets: "Rio (dog)", phone: "", street: "Rue Ibn Khaldoun" }, { id: "m4", name: "Hedi", pets: "Rabbit, parrot", phone: "", street: "Rue Ibn Khaldoun" }];
const SS: Sit[] = [{ id: "s1", sitter: "m2", owner: "m1", date: addDays(todayISO(), -20), kind: "night", count: 2 }, { id: "s2", sitter: "m1", owner: "m3", date: addDays(todayISO(), -12), kind: "walk", count: 5 }, { id: "s3", sitter: "m4", owner: "m2", date: addDays(todayISO(), -6), kind: "visit", count: 3 }, { id: "s4", sitter: "m3", owner: "m1", date: addDays(todayISO(), -3), kind: "day", count: 1 }];

export default function Wagswap() {
  const shared = useShared<{ group: string; members: { name: string; pets: string; balance: number }[]; asks: { who: string; from: string; to: string; kind: string; note: string }[] }>();
  const [group, setGroup] = useStored(T, "group", "Menzah 6 pet circle");
  const [members, setMembers] = useStored<Member[]>(T, "members", SM);
  const [sits, setSits] = useStored<Sit[]>(T, "sits", SS);
  const [asks, setAsks] = useStored<Ask[]>(T, "asks", [{ id: "a1", owner: "m1", from: addDays(todayISO(), 10), to: addDays(todayISO(), 12), kind: "night", note: "Wedding in Sousse. Simba needs two walks a day." }]);
  const [d, setD] = useState({ sitter: "m2", owner: "m1", kind: "walk" as Sit["kind"], count: "1", date: todayISO() });
  const [na, setNa] = useState({ owner: "m1", from: todayISO(), to: todayISO(), kind: "visit" as Sit["kind"], note: "" });

  if (shared.data) return (
    <div className="stack">
      <Section title={shared.data.group}><table className="t"><tbody>{shared.data.members.map(m => <tr key={m.name}><td><strong>{m.name}</strong> <span className="note">{m.pets}</span></td><td className="r" style={{ color: m.balance < 0 ? "var(--bad)" : "var(--good)" }}>{m.balance > 0 ? "+" : ""}{m.balance} credits</td></tr>)}</tbody></table></Section>
      <Section title="Who needs help">{shared.data.asks.map((a, i) => <p key={i}><strong>{a.who}</strong> needs {a.kind.toLowerCase()} help, {a.from} to {a.to}. {a.note}</p>)}</Section>
    </div>
  );

  const bal = (id: string) => sits.reduce((a, s) => a + (s.sitter === id ? CREDITS[s.kind].c * s.count : 0) - (s.owner === id ? CREDITS[s.kind].c * s.count : 0), 0);
  const name = (id: string) => members.find(m => m.id === id)?.name ?? "?";
  // Best people to ask: those who owe the circle the most, living on the same street first.
  const suggest = (a: Ask) => { const me = members.find(m => m.id === a.owner); return members.filter(m => m.id !== a.owner).sort((x, y) => bal(x.id) - bal(y.id) || Number(y.street === me?.street) - Number(x.street === me?.street)).slice(0, 2); };
  return (
    <div className="stack">
      <Section title={group}>
        <Stats><Stat value={members.length} label="Neighbours" /><Stat value={sits.length} label="Sits done" /><Stat value={sits.reduce((a, s) => a + CREDITS[s.kind].c * s.count, 0)} label="Credits exchanged" /><Stat value={asks.length} label="Open requests" tone={asks.length ? "warn" : undefined} /></Stats>
        <div className="ws-bal">{members.map(m => { const b = bal(m.id); return <div key={m.id}><strong>{m.name}</strong><span className="note">{m.pets}</span><b style={{ color: b < 0 ? "var(--bad)" : b > 0 ? "var(--good)" : undefined }}>{b > 0 ? "+" : ""}{b}</b></div>; })}</div>
        <p className="note" style={{ marginTop: 8 }}>A walk or feeding visit earns 1 credit, a day 4, an overnight stay 6. Negative means you've received more help than you've given.</p>
      </Section>
      <div className="grid2">
        <Section title="Log a sit">
          <div className="stack" style={{ gap: 10 }}>
            <div className="row"><label className="field"><span>Who helped</span><select className="input" value={d.sitter} onChange={e => setD({ ...d, sitter: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="field"><span>Whose pets</span><select className="input" value={d.owner} onChange={e => setD({ ...d, owner: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div>
            <div className="row" style={{ alignItems: "flex-end" }}><label className="field"><span>What</span><select className="input" value={d.kind} onChange={e => setD({ ...d, kind: e.target.value as Sit["kind"] })}>{Object.entries(CREDITS).map(([k, c]) => <option key={k} value={k}>{c.label} ({c.c})</option>)}</select></label><label className="field" style={{ flex: "0 0 80px" }}><span>How many</span><input className="input num" value={d.count} onChange={e => setD({ ...d, count: e.target.value })} /></label><label className="field"><span>Date</span><input type="date" className="input" value={d.date} onChange={e => setD({ ...d, date: e.target.value })} /></label></div>
            <button className="btn primary" style={{ alignSelf: "flex-start" }} disabled={d.sitter === d.owner} onClick={() => setSits([{ id: uid(), sitter: d.sitter, owner: d.owner, date: d.date, kind: d.kind, count: parseInt(d.count) || 1 }, ...sits])}>Add {CREDITS[d.kind].c * (parseInt(d.count) || 1)} credits to {name(d.sitter)}</button>
          </div>
        </Section>
        <Section title="Ask for help">
          <div className="stack" style={{ gap: 10 }}>
            <div className="row"><label className="field"><span>Who needs help</span><select className="input" value={na.owner} onChange={e => setNa({ ...na, owner: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="field"><span>What</span><select className="input" value={na.kind} onChange={e => setNa({ ...na, kind: e.target.value as Sit["kind"] })}>{Object.entries(CREDITS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select></label></div>
            <div className="row"><label className="field"><span>From</span><input type="date" className="input" value={na.from} onChange={e => setNa({ ...na, from: e.target.value })} /></label><label className="field"><span>To</span><input type="date" className="input" value={na.to} onChange={e => setNa({ ...na, to: e.target.value })} /></label></div>
            <label className="field"><span>Details</span><input className="input" value={na.note} onChange={e => setNa({ ...na, note: e.target.value })} /></label>
            <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => setAsks([...asks, { id: uid(), ...na }])}>Post request</button>
          </div>
        </Section>
      </div>
      <Section title="Open requests">
        {asks.length === 0 ? <p className="empty-note">Nobody needs help right now.</p> : asks.map(a => (
          <div key={a.id} className="ws-ask"><div style={{ flex: 1 }}><strong>{name(a.owner)}</strong> needs {CREDITS[a.kind].label.toLowerCase()} help, {prettyDate(a.from)} to {prettyDate(a.to)}<p className="note">{a.note}</p></div>
            {suggest(a).map(m => <a key={m.id} className="btn small" href={waLink(`Hi ${m.name}! Could you help ${name(a.owner)} with ${CREDITS[a.kind].label.toLowerCase()} from ${prettyDate(a.from)} to ${prettyDate(a.to)}? ${a.note} You'd earn credits in ${group}.`, m.phone)} target="_blank" rel="noreferrer">Ask {m.name}</a>)}
            <button className="btn ghost small" onClick={() => setAsks(asks.filter(x => x.id !== a.id))}>Covered</button></div>))}
        <p className="note" style={{ marginTop: 8 }}>Suggestions start with neighbours who have received more help than they've given, on the same street.</p>
      </Section>
      <Section title="Share with the circle">
        <label className="field" style={{ maxWidth: 360, marginBottom: 10 }}><span>Circle name</span><input className="input" value={group} onChange={e => setGroup(e.target.value)} /></label>
        <ShareBox slug={T} data={{ group, members: members.map(m => ({ name: m.name, pets: m.pets, balance: bal(m.id) })), asks: asks.map(a => ({ who: name(a.owner), from: a.from, to: a.to, kind: CREDITS[a.kind].label, note: a.note })) }} label="Copy balances link" message={`${group}: balances and who needs help`} />
      </Section>
      <Section title="Neighbours">
        {members.map(m => <div key={m.id} className="row" style={{ marginBottom: 6 }}><input className="input" style={{ flex: 1 }} aria-label="Name" value={m.name} onChange={e => setMembers(members.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} /><input className="input" style={{ flex: 1 }} aria-label="Pets" value={m.pets} onChange={e => setMembers(members.map(x => x.id === m.id ? { ...x, pets: e.target.value } : x))} /><input className="input" style={{ flex: 1 }} aria-label="Street" value={m.street} onChange={e => setMembers(members.map(x => x.id === m.id ? { ...x, street: e.target.value } : x))} /><input className="input" style={{ flex: 1 }} aria-label="WhatsApp" placeholder="WhatsApp" value={m.phone} onChange={e => setMembers(members.map(x => x.id === m.id ? { ...x, phone: e.target.value } : x))} /></div>)}
        <button className="btn small" onClick={() => setMembers([...members, { id: uid(), name: "New neighbour", pets: "", phone: "", street: "" }])}>Add a neighbour</button>
      </Section>
      <style>{`.ws-bal{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-top:14px}.ws-bal div{background:var(--sunk);border-radius:10px;padding:10px;display:grid}.ws-bal b{font-family:var(--serif);font-weight:400;font-size:30px}.ws-ask{display:flex;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}`}</style>
    </div>
  );
}
