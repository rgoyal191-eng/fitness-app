import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C, EXERCISE_LIBRARY, WORKOUT_PLAN, GOALS, TABS, todayStr } from "./constants";

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

export default function App() {
  const [tab, setTab] = useState("Today");
  const [loaded, setLoaded] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({ weight: 90.7, bf: 20.1, smm: 41.7, waist: 105.4, whr: 1.03, visceral: 8, next_workout_idx: 0, active_goal: "bali" });
  const [weightHistory, setWeightHistory] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [nutritionLogs, setNutritionLogs] = useState({});
  const [coachInput, setCoachInput] = useState("");
  const [coachResponse, setCoachResponse] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  const showToast = (msg, color = C.accent) => { setToast({ msg, color }); setTimeout(() => setToast(null), 2800); };
  const setSaved = () => { setSyncStatus("saved"); setTimeout(() => setSyncStatus("idle"), 2000); };

  useEffect(() => {
    (async () => {
      try {
        const [{ data: p }, { data: wh }, { data: wl }, { data: nl }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", "rohan"),
          supabase.from("weight_history").select("*").order("date", { ascending: true }),
          supabase.from("workout_logs").select("*").order("date", { ascending: false }),
          supabase.from("nutrition_logs").select("*").order("date", { ascending: false }),
        ]);
        if (p && p.length > 0) setProfile(p[0]);
        if (wh) setWeightHistory(wh);
        if (wl) { const m = {}; wl.forEach(r => { m[r.date] = r; }); setWorkoutLogs(m); }
        if (nl) { const m = {}; nl.forEach(r => { m[r.date] = r; }); setNutritionLogs(m); }
        setLoaded(true);
      } catch (e) { setDbError(e.message); setLoaded(true); }
    })();
  }, []);

  const saveProfile = async (updates) => {
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);
    setSyncStatus("saving");
    const { error } = await supabase.from("profiles").upsert(updated);
    if (error) { setSyncStatus("error"); showToast("Sync error", C.red); } else setSaved();
  };

  const saveWorkoutLog = async (date, log) => {
    const row = { ...log, date, saved_at: new Date().toISOString() };
    setWorkoutLogs(prev => ({ ...prev, [date]: row }));
    setSyncStatus("saving");
    const { error } = await supabase.from("workout_logs").upsert(row, { onConflict: "date" });
    if (error) { setSyncStatus("error"); showToast("Sync error", C.red); } else { setSaved(); showToast("Workout saved ✓"); }
  };

  const saveNutritionLog = async (date, log) => {
    const row = { ...log, date, saved_at: new Date().toISOString() };
    setNutritionLogs(prev => ({ ...prev, [date]: row }));
    setSyncStatus("saving");
    const { error } = await supabase.from("nutrition_logs").upsert(row, { onConflict: "date" });
    if (error) { setSyncStatus("error"); showToast("Sync error", C.red); } else { setSaved(); showToast("Nutrition saved ✓"); }
  };

  const saveWeight = async (date, weight) => {
    const row = { date, weight: +weight };
    setWeightHistory(prev => [...prev.filter(h => h.date !== date), row].sort((a, b) => a.date.localeCompare(b.date)));
    await supabase.from("weight_history").upsert(row, { onConflict: "date" });
    await saveProfile({ weight: +weight });
  };

  const goal = GOALS.find(g => g.id === profile.active_goal) || GOALS[0];
  const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / 86400000);
  const weightToLose = (profile.weight - goal.targetWeight).toFixed(1);
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : 95.2;
  const progressPct = Math.max(0, Math.round(((startWeight - profile.weight) / (startWeight - goal.targetWeight)) * 100));
  const today = todayStr();
  const currentWorkout = WORKOUT_PLAN[profile.next_workout_idx || 0];
  const todayWorkout = workoutLogs[today];
  const todayNutrition = nutritionLogs[today];

  // ── STYLES ─────────────────────────────────────────────────────────────────
  const sc = { padding: "12px 14px 100px" };
  const card = { background: C.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` };
  const cardLabel = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.9px", marginBottom: 10 };
  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, padding: "10px 12px", width: "100%", fontFamily: "inherit", boxSizing: "border-box", WebkitAppearance: "none" };
  const ta = { ...inp, minHeight: 70, resize: "vertical" };
  const btn = (bg, extra = {}) => ({ background: bg, color: bg === C.accent ? C.accentText : C.text, border: "none", borderRadius: 10, padding: "13px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 8, WebkitTapHighlightColor: "transparent", ...extra });
  const outlineBtn = { background: "none", border: `1px solid ${C.border}`, color: C.soft, borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 8 };

  // ── SHARED COMPONENTS ──────────────────────────────────────────────────────
  const MacroBar = ({ protein, carbs, fat }) => {
    const total = ((+protein) * 4 + (+carbs) * 4 + (+fat) * 9) || 1;
    return (
      <div>
        <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", gap: 1 }}>
          <div style={{ width: `${(protein * 4 / total) * 100}%`, background: C.accent }} />
          <div style={{ width: `${(carbs * 4 / total) * 100}%`, background: C.amber }} />
          <div style={{ width: `${(fat * 9 / total) * 100}%`, background: "#FF7EA6" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
          <span style={{ fontSize: 11, color: C.accent }}>● P {protein}g</span>
          <span style={{ fontSize: 11, color: C.amber }}>● C {carbs}g</span>
          <span style={{ fontSize: 11, color: "#FF7EA6" }}>● F {fat}g</span>
        </div>
      </div>
    );
  };

  const WeightChart = ({ history }) => {
    if (!history || history.length < 2) return <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "16px 0" }}>Log more weigh-ins to see trend</div>;
    const recent = history.slice(-20);
    const weights = recent.map(h => +h.weight);
    const allVals = [...weights, goal.targetWeight];
    const min = Math.min(...allVals) - 0.5, max = Math.max(...allVals) + 0.5;
    const W = 320, H = 80;
    const px = (i) => (i / (recent.length - 1)) * W;
    const py = (w) => H - ((w - min) / (max - min)) * H;
    const goalY = py(goal.targetWeight);
    const pts = recent.map((h, i) => `${px(i)},${py(h.weight)}`).join(" ");
    return (
      <svg viewBox={`0 0 ${W} ${H + 10}`} style={{ width: "100%", height: 90 }}>
        <line x1="0" y1={goalY} x2={W} y2={goalY} stroke={C.amber} strokeWidth="1" strokeDasharray="5,4" opacity="0.6" />
        <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {recent.map((h, i) => <circle key={i} cx={px(i)} cy={py(h.weight)} r="3.5" fill={C.accent} />)}
        <text x={W - 2} y={goalY - 4} fontSize="9" fill={C.amber} textAnchor="end">{goal.targetWeight}kg goal</text>
      </svg>
    );
  };

  const Empty = ({ text }) => <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 13 }}>{text}</div>;

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ fontSize: 40 }}>🏋️</div>
      <div style={{ color: C.soft, fontSize: 14 }}>Loading your data...</div>
    </div>
  );

  if (dbError) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ color: C.red, fontSize: 13, textAlign: "center" }}>Connection error: {dbError}</div>
    </div>
  );

  // ── TODAY ──────────────────────────────────────────────────────────────────
  const TodayTab = () => {
    const [showWt, setShowWt] = useState(false);
    const [newWt, setNewWt] = useState(profile.weight);
    return (
      <div style={sc}>
        <div style={{ ...card, background: "linear-gradient(135deg, #0D2E22 0%, #0B1A2E 100%)", border: `1px solid ${C.accentDim}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>{goal.icon} {goal.label}</div>
              <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{daysLeft}</div>
              <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>days remaining</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.soft, marginBottom: 2 }}>to lose</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.amber }}>{weightToLose}<span style={{ fontSize: 14 }}> kg</span></div>
              <div style={{ fontSize: 10, color: C.muted }}>{(weightToLose / (daysLeft / 7)).toFixed(2)} kg/week</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: C.soft }}>{startWeight} → {goal.targetWeight} kg</span>
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>{progressPct}% done</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: C.border }}>
              <div style={{ height: "100%", width: `${Math.min(progressPct, 100)}%`, background: C.accent, borderRadius: 3 }} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 0 }}>
          <div style={{ ...card, marginBottom: 0, cursor: "pointer" }} onClick={() => setShowWt(!showWt)}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Weight</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{profile.weight}<span style={{ fontSize: 13, color: C.muted }}> kg</span></div>
            <div style={{ fontSize: 10, color: C.accent, marginTop: 3 }}>Tap to log →</div>
          </div>
          <div style={{ ...card, marginBottom: 0 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Body Fat</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{profile.bf}<span style={{ fontSize: 13, color: C.muted }}>%</span></div>
            <div style={{ fontSize: 10, color: C.soft, marginTop: 3 }}>Target: {goal.targetBF}%</div>
          </div>
        </div>
        <div style={{ height: 8 }} />

        {showWt && (
          <div style={{ ...card, border: `1px solid ${C.accent}40` }}>
            <div style={{ fontSize: 12, color: C.soft, marginBottom: 8 }}>Log today's weight</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" value={newWt} onChange={e => setNewWt(e.target.value)} style={{ ...inp, flex: 1 }} step="0.1" />
              <button onClick={async () => { await saveWeight(today, newWt); setShowWt(false); showToast(`${newWt} kg logged ✓`); }} style={{ ...btn(C.accent, { width: "auto", padding: "0 20px", marginTop: 0 }) }}>Save</button>
            </div>
          </div>
        )}

        {weightHistory.length > 1 && (
          <div style={card}>
            <div style={cardLabel}>Weight Trend</div>
            <WeightChart history={weightHistory} />
          </div>
        )}

        <div style={{ ...card, border: todayWorkout ? `1px solid ${C.accentDim}` : `1px solid ${C.border}` }}>
          <div style={cardLabel}>Today's Workout</div>
          {todayWorkout ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{WORKOUT_PLAN.find(w => w.id === todayWorkout.workout_id)?.name} logged</div>
                <div style={{ fontSize: 11, color: C.soft }}>{todayWorkout.tennis ? "🎾 Tennis · " : ""}{todayWorkout.cardio_min ? `${todayWorkout.cardio_min}min cardio · ` : ""}{todayWorkout.energy ? ["💀","😴","😐","💪","🔥"][todayWorkout.energy - 1] : ""}</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{currentWorkout.emoji}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{currentWorkout.name}</div>
                  <div style={{ fontSize: 11, color: C.soft }}>{currentWorkout.duration}</div>
                </div>
              </div>
              <button onClick={() => setTab("Log Workout")} style={btn(C.accent)}>Start Logging →</button>
            </div>
          )}
        </div>

        <div style={{ ...card, border: todayNutrition ? `1px solid ${C.accentDim}` : `1px solid ${C.border}` }}>
          <div style={cardLabel}>Today's Nutrition</div>
          {todayNutrition ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{todayNutrition.calories}<span style={{ fontSize: 13, color: C.muted }}> kcal</span></div>
                <div style={{ fontSize: 12, color: C.soft, textAlign: "right" }}>
                  <div>Protein <span style={{ color: C.accent, fontWeight: 700 }}>{todayNutrition.protein}g</span></div>
                  <div>C <span style={{ color: C.amber }}>{todayNutrition.carbs}g</span> · F <span style={{ color: "#FF7EA6" }}>{todayNutrition.fat}g</span></div>
                </div>
              </div>
              <MacroBar protein={todayNutrition.protein} carbs={todayNutrition.carbs} fat={todayNutrition.fat} />
              <button onClick={() => setTab("Log Nutrition")} style={outlineBtn}>Edit today</button>
            </div>
          ) : (
            <button onClick={() => setTab("Log Nutrition")} style={btn(C.accent)}>Log Today's Nutrition →</button>
          )}
        </div>

        <div style={card}>
          <div style={cardLabel}>Latest InBody</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Muscle Mass", `${profile.smm} kg`, C.accent], ["Visceral Fat", profile.visceral, +profile.visceral <= 7 ? C.accent : C.amber], ["Waist", `${profile.waist} cm`, C.amber], ["WHR", profile.whr, +profile.whr < 0.95 ? C.accent : C.red]].map(([l, v, c]) => (
              <div key={l} style={{ background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setTab("Goals")} style={outlineBtn}>Update InBody data</button>
        </div>
      </div>
    );
  };

  // ── LOG WORKOUT ────────────────────────────────────────────────────────────
  const LogWorkoutTab = () => {
    const [selIdx, setSelIdx] = useState(profile.next_workout_idx || 0);
    const workout = WORKOUT_PLAN[selIdx];
    const existing = workoutLogs[today];
    const match = existing && existing.workout_id === workout.id;

    const [sets, setSets] = useState(() => match && existing.exercises ? existing.exercises : workout.exercises.map(ex => ({ name: ex.name, sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" })) })));
    const [notes, setNotes] = useState(match ? existing.notes || "" : "");
    const [tennis, setTennis] = useState(match ? existing.tennis || false : false);
    const [cardioMin, setCardioMin] = useState(match ? existing.cardio_min || "" : "");
    const [energy, setEnergy] = useState(match ? existing.energy || 3 : 3);
    const [swapping, setSwapping] = useState(null);

    const resetForWorkout = (idx) => {
      const w = WORKOUT_PLAN[idx];
      const ex2 = workoutLogs[today];
      const m2 = ex2 && ex2.workout_id === w.id;
      setSets(m2 && ex2.exercises ? ex2.exercises : w.exercises.map(ex => ({ name: ex.name, sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" })) })));
      setNotes(m2 ? ex2.notes || "" : "");
      setTennis(m2 ? ex2.tennis || false : false);
      setCardioMin(m2 ? ex2.cardio_min || "" : "");
      setEnergy(m2 ? ex2.energy || 3 : 3);
      setSwapping(null);
    };

    const updateSet = (ei, si, field, val) => setSets(prev => { const n = prev.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s })) })); n[ei].sets[si][field] = val; return n; });
    const addSet = (ei) => setSets(prev => { const n = prev.map(e => ({ ...e, sets: [...e.sets] })); n[ei].sets.push({ weight: "", reps: "" }); return n; });
    const swapEx = (ei, name) => { setSets(prev => { const n = [...prev]; n[ei] = { ...n[ei], name }; return n; }); setSwapping(null); };

    const handleSave = async () => {
      const log = { workout_id: workout.id, exercises: sets, notes, tennis, cardio_min: cardioMin ? +cardioMin : null, energy };
      await saveWorkoutLog(today, log);
      await saveProfile({ next_workout_idx: (selIdx + 1) % WORKOUT_PLAN.length });
      setTab("Today");
    };

    return (
      <div style={sc}>
        <div style={card}>
          <div style={cardLabel}>Select Workout</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {WORKOUT_PLAN.map((w, i) => (
              <button key={w.id} onClick={() => { setSelIdx(i); resetForWorkout(i); }} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: i === selIdx ? 700 : 400, background: i === selIdx ? C.accent : C.surface, color: i === selIdx ? C.accentText : C.soft, border: `1px solid ${i === (profile.next_workout_idx || 0) ? C.accent : C.border}`, cursor: "pointer" }}>
                {i === (profile.next_workout_idx || 0) ? "→ " : ""}{w.emoji} {w.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...card, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.soft, cursor: "pointer" }}>
            <input type="checkbox" checked={tennis} onChange={e => setTennis(e.target.checked)} style={{ width: 18, height: 18 }} />
            🎾 Tennis today
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: C.muted }}>Cardio:</span>
            <input type="number" value={cardioMin} onChange={e => setCardioMin(e.target.value)} placeholder="min" style={{ ...inp, width: 70, padding: "8px 10px" }} />
          </div>
        </div>

        {sets.map((ex, ei) => {
          const lib = EXERCISE_LIBRARY[ex.name];
          const orig = workout.exercises[ei];
          const isSwapped = orig && ex.name !== orig.name;
          return (
            <div key={ei} style={{ ...card, border: isSwapped ? `1px solid ${C.amber}40` : `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</div>
                  {isSwapped && <div style={{ fontSize: 10, color: C.amber, marginTop: 1 }}>↔ swapped from {orig?.name}</div>}
                  {lib && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{lib.muscle}</div>}
                </div>
                <button onClick={() => setSwapping(swapping === ei ? null : ei)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.soft, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>↔ Swap</button>
              </div>
              {swapping === ei && (
                <div style={{ marginBottom: 10, background: C.surface, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Replace with:</div>
                  {(lib?.swaps || []).map(alt => (
                    <button key={alt} onClick={() => swapEx(ei, alt)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "9px 12px", marginBottom: 6, fontSize: 13, cursor: "pointer" }}>{alt}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: C.muted }}>#</div>
                <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Weight (kg)</div>
                <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Reps</div>
              </div>
              {ex.sets.map((s, si) => (
                <div key={si} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center" }}>{si + 1}</div>
                  <input type="number" value={s.weight} onChange={e => updateSet(ei, si, "weight", e.target.value)} placeholder="kg" style={{ ...inp, textAlign: "center" }} />
                  <input type="number" value={s.reps} onChange={e => updateSet(ei, si, "reps", e.target.value)} placeholder="reps" style={{ ...inp, textAlign: "center" }} />
                </div>
              ))}
              <button onClick={() => addSet(ei)} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>+ Add set</button>
            </div>
          );
        })}

        <div style={card}>
          <div style={cardLabel}>Session Feel</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: C.soft, marginBottom: 8 }}>Energy: {["💀 Dead", "😴 Low", "😐 OK", "💪 Good", "🔥 Great"][energy - 1]}</div>
            <input type="range" min={1} max={5} value={energy} onChange={e => setEnergy(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} />
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="PRs, how it felt, QL status, anything notable..." style={ta} />
        </div>

        <button onClick={handleSave} style={btn(C.accent)}>Save Workout →</button>
      </div>
    );
  };

  // ── LOG NUTRITION ──────────────────────────────────────────────────────────
  const LogNutritionTab = () => {
    const ex = nutritionLogs[today] || {};
    const [f, setF] = useState({ calories: ex.calories || "", protein: ex.protein || "", carbs: ex.carbs || "", fat: ex.fat || "", meal1: ex.meal1 || "", meal2: ex.meal2 || "", meal3: ex.meal3 || "", meal4: ex.meal4 || "", notes: ex.notes || "" });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const autoCalc = () => { const k = Math.round((+f.protein || 0) * 4 + (+f.carbs || 0) * 4 + (+f.fat || 0) * 9); if (k) set("calories", k); };
    const targets = { protein: 175, carbs: 220, fat: 65, calories: 2200 };

    const handleSave = async () => {
      await saveNutritionLog(today, { calories: +f.calories || 0, protein: +f.protein || 0, carbs: +f.carbs || 0, fat: +f.fat || 0, meal1: f.meal1, meal2: f.meal2, meal3: f.meal3, meal4: f.meal4, notes: f.notes });
      setTab("Today");
    };

    return (
      <div style={sc}>
        <div style={card}>
          <div style={cardLabel}>Today's Targets</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
            {[["Kcal", f.calories, targets.calories, C.text], ["Protein", f.protein ? `${f.protein}g` : "–", `${targets.protein}g`, C.accent], ["Carbs", f.carbs ? `${f.carbs}g` : "–", `${targets.carbs}g`, C.amber], ["Fat", f.fat ? `${f.fat}g` : "–", `${targets.fat}g`, "#FF7EA6"]].map(([l, v, t, c]) => (
              <div key={l} style={{ background: C.surface, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v || "–"}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{t}</div>
              </div>
            ))}
          </div>
          {(f.protein || f.carbs || f.fat) && <MacroBar protein={+f.protein || 0} carbs={+f.carbs || 0} fat={+f.fat || 0} />}
        </div>

        <div style={card}>
          <div style={cardLabel}>Macros</div>
          {[["Protein (g)", "protein", C.accent, targets.protein], ["Carbs (g)", "carbs", C.amber, targets.carbs], ["Fat (g)", "fat", "#FF7EA6", targets.fat]].map(([l, k, c, t]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: C.soft }}>{l}</span>
                <span style={{ fontSize: 11, color: c }}>{f[k] ? `${Math.round((+f[k] / t) * 100)}% of target` : ""}</span>
              </div>
              <input type="number" value={f[k]} onChange={e => set(k, e.target.value)} onBlur={autoCalc} placeholder={l} style={inp} />
              <div style={{ height: 4, borderRadius: 2, background: C.border, marginTop: 5 }}>
                <div style={{ height: "100%", width: `${Math.min((+f[k] / t) * 100, 100)}%`, background: c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 13, color: C.soft, marginBottom: 5 }}>Total Calories</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" value={f.calories} onChange={e => set("calories", e.target.value)} placeholder="or enter directly" style={{ ...inp, flex: 1 }} />
              <button onClick={autoCalc} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.soft, borderRadius: 8, padding: "0 14px", fontSize: 13, cursor: "pointer" }}>Auto</button>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardLabel}>Meals (optional)</div>
          {[["meal1", "Breakfast — eggs, oats, yogurt..."], ["meal2", "Lunch — dal, jowar roti, sabzi..."], ["meal3", "Snack / Shake..."], ["meal4", "Dinner — chicken, vegetables..."]].map(([k, p]) => (
            <input key={k} value={f[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={{ ...inp, marginBottom: 8 }} />
          ))}
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Notes — cheat meal, alcohol, social dinner, travel..." style={{ ...ta, minHeight: 50 }} />
        </div>

        <button onClick={handleSave} style={btn(C.accent)}>Save Nutrition →</button>
      </div>
    );
  };

  // ── HISTORY ────────────────────────────────────────────────────────────────
  const HistoryTab = () => {
    const [histTab, setHistTab] = useState("workouts");
    const [expanded, setExpanded] = useState(null);
    const wEntries = Object.entries(workoutLogs).sort((a, b) => b[0].localeCompare(a[0]));
    const nEntries = Object.entries(nutritionLogs).sort((a, b) => b[0].localeCompare(a[0]));
    const avgP = nEntries.length ? Math.round(nEntries.reduce((s, [, v]) => s + (+v.protein || 0), 0) / nEntries.length) : 0;
    const avgC = nEntries.length ? Math.round(nEntries.reduce((s, [, v]) => s + (+v.calories || 0), 0) / nEntries.length) : 0;

    return (
      <div style={sc}>
        {weightHistory.length > 1 && (
          <div style={card}>
            <div style={cardLabel}>Weight Trend</div>
            <WeightChart history={weightHistory} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
              <span style={{ color: C.muted }}>Start: {weightHistory[0]?.weight} kg</span>
              <span style={{ color: C.accent }}>Now: {profile.weight} kg</span>
              <span style={{ color: C.amber }}>Goal: {goal.targetWeight} kg</span>
            </div>
          </div>
        )}

        {nEntries.length > 0 && (
          <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: C.muted }}>Avg Calories</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: avgC <= 2300 ? C.accent : C.amber }}>{avgC}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{nEntries.length} days logged</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: C.muted }}>Avg Protein</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: avgP >= 160 ? C.accent : C.red }}>{avgP}g</div>
              <div style={{ fontSize: 10, color: C.muted }}>Target: 175g</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 4, marginBottom: 10 }}>
          {["workouts", "nutrition"].map(t => (
            <button key={t} onClick={() => setHistTab(t)} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: histTab === t ? 700 : 400, background: histTab === t ? C.card : "none", color: histTab === t ? C.text : C.muted, border: "none", cursor: "pointer" }}>
              {t === "workouts" ? "🏋️ Workouts" : "🥗 Nutrition"}
            </button>
          ))}
        </div>

        {histTab === "workouts" && (wEntries.length === 0 ? <Empty text="No workouts logged yet." /> : wEntries.map(([date, log]) => {
          const w = WORKOUT_PLAN.find(wp => wp.id === log.workout_id);
          const key = date + "w";
          return (
            <div key={date} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(expanded === key ? null : key)}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{w?.emoji} {w?.name || "Workout"}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{date}{log.tennis ? " · 🎾" : ""}{log.cardio_min ? ` · ${log.cardio_min}min cardio` : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {log.energy && <span style={{ fontSize: 16 }}>{["💀", "😴", "😐", "💪", "🔥"][log.energy - 1]}</span>}
                  <span style={{ color: C.muted, fontSize: 18 }}>{expanded === key ? "−" : "+"}</span>
                </div>
              </div>
              {expanded === key && log.exercises && (
                <div style={{ marginTop: 12 }}>
                  {log.exercises.map((ex, i) => {
                    const logged = ex.sets?.filter(s => s.weight || s.reps);
                    if (!logged?.length) return null;
                    const maxW = Math.max(...logged.map(s => +s.weight || 0));
                    return (
                      <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</span>
                          {maxW > 0 && <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{maxW}kg top</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.soft, marginTop: 3 }}>
                          {logged.map((s, si) => `S${si + 1}: ${s.weight || "–"}kg × ${s.reps || "–"}`).join("  ·  ")}
                        </div>
                      </div>
                    );
                  })}
                  {log.notes && <div style={{ fontSize: 12, color: C.soft, marginTop: 8, fontStyle: "italic" }}>"{log.notes}"</div>}
                </div>
              )}
            </div>
          );
        }))}

        {histTab === "nutrition" && (nEntries.length === 0 ? <Empty text="No nutrition logged yet." /> : nEntries.map(([date, log]) => {
          const key = date + "n";
          return (
            <div key={date} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(expanded === key ? null : key)}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{log.calories} kcal</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{date} · P:{log.protein}g C:{log.carbs}g F:{log.fat}g</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: +log.protein >= 160 ? C.accent : C.red, fontWeight: 600 }}>{+log.protein >= 160 ? "✓" : "⚠ Low P"}</span>
                  <span style={{ color: C.muted, fontSize: 18 }}>{expanded === key ? "−" : "+"}</span>
                </div>
              </div>
              {expanded === key && (
                <div style={{ marginTop: 10 }}>
                  <MacroBar protein={log.protein} carbs={log.carbs} fat={log.fat} />
                  {[log.meal1, log.meal2, log.meal3, log.meal4].filter(Boolean).map((m, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.soft, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.muted, fontSize: 10 }}>Meal {i + 1}: </span>{m}</div>
                  ))}
                  {log.notes && <div style={{ fontSize: 12, color: C.soft, marginTop: 6, fontStyle: "italic" }}>"{log.notes}"</div>}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    );
  };

  // ── PLAN ───────────────────────────────────────────────────────────────────
  const PlanTab = () => {
    const [exp, setExp] = useState(null);
    return (
      <div style={sc}>
        <div style={card}>
          <div style={cardLabel}>Flexible sequence — train next in order, not by day</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {WORKOUT_PLAN.map((w, i) => (
              <div key={w.id} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: i === (profile.next_workout_idx || 0) ? 700 : 400, background: i === (profile.next_workout_idx || 0) ? C.accent : C.surface, color: i === (profile.next_workout_idx || 0) ? C.accentText : C.soft, border: `1px solid ${i === (profile.next_workout_idx || 0) ? C.accent : C.border}` }}>
                {w.emoji} {w.name}
              </div>
            ))}
          </div>
        </div>
        {WORKOUT_PLAN.map((w, i) => (
          <div key={w.id} style={{ ...card, borderLeft: `3px solid ${i === (profile.next_workout_idx || 0) ? C.accent : "transparent"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExp(exp === w.id ? null : w.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{w.emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {i === (profile.next_workout_idx || 0) && <span style={{ background: C.accent, color: C.accentText, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, marginRight: 6 }}>NEXT</span>}
                    {w.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{w.duration} · {w.exercises.length} exercises</div>
                </div>
              </div>
              <span style={{ color: C.muted, fontSize: 20 }}>{exp === w.id ? "−" : "+"}</span>
            </div>
            {exp === w.id && (
              <div style={{ marginTop: 12 }}>
                {w.exercises.map((ex, j) => {
                  const lib = EXERCISE_LIBRARY[ex.name];
                  return (
                    <div key={j} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{ex.note}</div>
                          {lib?.swaps?.length > 0 && <div style={{ fontSize: 11, color: C.blue, marginTop: 1 }}>Alt: {lib.swaps.slice(0, 2).join(", ")}</div>}
                        </div>
                        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginLeft: 10 }}>{ex.sets}×{ex.reps}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 10, background: C.surface, borderRadius: 8, padding: "9px 12px", fontSize: 12, color: C.soft }}>🚶 {w.cardio}</div>
              </div>
            )}
          </div>
        ))}
        <div style={card}>
          <div style={cardLabel}>Progressive Overload Rules</div>
          <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.9 }}>
            <div>• Add reps before adding weight. Hit top of range 2 sessions → add 2.5 kg.</div>
            <div>• Bench ref: 75kg×7 → target 75kg×8, then 77.5kg×6.</div>
            <div>• Every 6–8 weeks: one full deload week at 50–60% load.</div>
            <div>• QL flare: skip RDL, reduce squat depth, add hip flexor stretch.</div>
          </div>
        </div>
      </div>
    );
  };

  // ── GOALS ──────────────────────────────────────────────────────────────────
  const GoalsTab = () => {
    const [editing, setEditing] = useState(false);
    const [ib, setIb] = useState({ weight: profile.weight, bf: profile.bf, smm: profile.smm, waist: profile.waist, whr: profile.whr, visceral: profile.visceral });

    const handleSave = async () => {
      await saveProfile({ ...ib });
      if (+ib.weight !== +profile.weight) await saveWeight(today, +ib.weight);
      setEditing(false);
      showToast("InBody updated ✓");
    };

    return (
      <div style={sc}>
        <div style={card}>
          <div style={cardLabel}>Active Goal</div>
          {GOALS.map(g => (
            <div key={g.id} onClick={() => saveProfile({ active_goal: g.id })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 10, background: profile.active_goal === g.id ? C.surface : "none", border: `1px solid ${profile.active_goal === g.id ? g.color : C.border}`, cursor: "pointer", marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>{g.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{g.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{g.targetWeight} kg · {g.targetBF}% BF · {g.deadline}</div>
              </div>
              {profile.active_goal === g.id && <span style={{ color: g.color, fontSize: 20 }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={cardLabel}>InBody & Measurements</div>
            <button onClick={() => setEditing(!editing)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.soft, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{editing ? "Cancel" : "Update"}</button>
          </div>
          {editing ? (
            <div>
              {[["Weight (kg)", "weight"], ["Body Fat %", "bf"], ["Skeletal Muscle Mass (kg)", "smm"], ["Waist (cm)", "waist"], ["Waist-Hip Ratio", "whr"], ["Visceral Fat Level", "visceral"]].map(([l, k]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{l}</div>
                  <input type="number" value={ib[k]} onChange={e => setIb(p => ({ ...p, [k]: e.target.value }))} style={inp} step="0.1" />
                </div>
              ))}
              <button onClick={handleSave} style={btn(C.accent)}>Save to Cloud →</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["Weight", `${profile.weight} kg`, C.text], ["Body Fat", `${profile.bf}%`, C.amber], ["Muscle Mass", `${profile.smm} kg`, C.accent], ["Visceral Fat", profile.visceral, +profile.visceral <= 7 ? C.accent : C.amber], ["Waist", `${profile.waist} cm`, C.amber], ["WHR", profile.whr, +profile.whr < 0.95 ? C.accent : C.red]].map(([l, v, c]) => (
                <div key={l} style={{ background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={cardLabel}>Recomp Progress</div>
          <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.9 }}>
            Started <span style={{ color: C.text, fontWeight: 600 }}>95.2 kg / 24.7% BF</span><br />
            Now <span style={{ color: C.accent, fontWeight: 600 }}>{profile.weight} kg / {profile.bf}% BF</span><br />
            Lost <span style={{ color: C.accent, fontWeight: 600 }}>{(95.2 - profile.weight).toFixed(1)} kg</span> total · Bench 75×3 → 75×7 ✓
          </div>
        </div>
      </div>
    );
  };

  // ── COACH ──────────────────────────────────────────────────────────────────
  const CoachTab = () => {
    const recentW = Object.entries(workoutLogs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    const recentN = Object.entries(nutritionLogs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
    const avgP = recentN.length ? Math.round(recentN.reduce((s, [, v]) => s + (+v.protein || 0), 0) / recentN.length) : null;
    const avgCal = recentN.length ? Math.round(recentN.reduce((s, [, v]) => s + (+v.calories || 0), 0) / recentN.length) : null;

    const callCoach = async () => {
      if (!coachInput.trim()) return;
      setCoachLoading(true); setCoachResponse("");
      try {
        const wSum = recentW.map(([date, log]) => {
          const w = WORKOUT_PLAN.find(wp => wp.id === log.workout_id);
          const top = log.exercises?.slice(0, 3).map(ex => { const b = ex.sets?.filter(s => s.weight && s.reps).map(s => `${s.weight}kg×${s.reps}`).join(","); return b ? `${ex.name}(${b})` : null; }).filter(Boolean).join("|");
          return `${date} ${w?.name} E:${log.energy}/5${log.tennis ? " Tennis" : ""}${top ? ` | ${top}` : ""}`;
        }).join("\n");

        const nSum = recentN.map(([date, log]) => `${date}: ${log.calories}kcal P:${log.protein}g C:${log.carbs}g F:${log.fat}g${log.notes ? ` [${log.notes}]` : ""}`).join("\n");

        const sys = `You are an elite physique coach for Rohan Goyal. Analyze his ACTUAL logged data and give specific, data-driven coaching. Never give generic advice.

PROFILE: Age 30, 188cm, ${profile.weight}kg, ${profile.bf}% BF, SMM ${profile.smm}kg
WHR: ${profile.whr} (target <0.95) | Waist: ${profile.waist}cm | Visceral: ${profile.visceral}
Goal: ${goal.targetWeight}kg / ${goal.targetBF}% BF by ${goal.deadline} (${daysLeft} days left)
Needs: ${(weightToLose / (daysLeft / 7)).toFixed(2)}kg/week | Bench: 75kg×3→75kg×7 (recomp confirmed) | QL recovered | India-based

LOGGED WORKOUTS (last ${recentW.length}):
${wSum || "None yet"}

LOGGED NUTRITION (last ${recentN.length} days):
${nSum || "None yet"}
${avgP ? `Avg protein: ${avgP}g/day | Avg calories: ${avgCal}kcal/day` : ""}

WEIGHT: ${weightHistory.slice(-5).map(h => `${h.date}:${h.weight}kg`).join(", ") || "None logged"}

Be direct. Reference actual numbers and dates. Identify the single highest-leverage action. Short sections, no fluff.`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: sys, messages: [{ role: "user", content: coachInput }] }),
        });
        const data = await res.json();
        setCoachResponse(data.content?.map(b => b.text || "").join("\n") || "No response.");
      } catch (e) { setCoachResponse(`Error: ${e.message}`); }
      setCoachLoading(false);
    };

    return (
      <div style={sc}>
        <div style={{ ...card, background: "#0A1520", border: `1px solid ${C.blueDim}` }}>
          <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: "0.8px", marginBottom: 5 }}>AI COACHING · READS YOUR REAL LOGGED DATA</div>
          <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.6 }}>Your coach reads your actual workouts, macros, and weight from Supabase before every response. The more you log, the sharper the advice.</div>
          <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>📊 {recentW.length} workouts · {recentN.length} nutrition days · {weightHistory.length} weigh-ins{avgP ? ` · Avg protein: ${avgP}g` : ""}</div>
        </div>

        <div style={card}>
          <div style={cardLabel}>Quick Prompts</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Review my recent workouts and adjust my plan", "Am I hitting protein consistently?", "I drank heavily last night", "My weight jumped — fat or water?", "I missed 5 days of training", "I have a wedding this weekend", "QL feeling tight today", "Am I on track for my goal?"].map(p => (
              <button key={p} onClick={() => setCoachInput(p)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.soft, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={cardLabel}>Message Your Coach</div>
          <textarea value={coachInput} onChange={e => setCoachInput(e.target.value)} placeholder="Tell your coach anything — missed sessions, cheat days, weight changes, soreness, travel, social events..." style={{ ...ta, minHeight: 100 }} />
          <button onClick={callCoach} disabled={coachLoading} style={{ ...btn(C.accent), opacity: coachLoading ? 0.6 : 1 }}>
            {coachLoading ? "Thinking..." : "Get Coaching Response →"}
          </button>
          {coachResponse && (
            <div style={{ background: C.surface, borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.8, color: C.soft, whiteSpace: "pre-wrap", border: `1px solid ${C.accentDim}`, marginTop: 12 }}>
              {coachResponse}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const syncDot = { saving: { bg: C.amber, label: "Saving..." }, saved: { bg: C.accent, label: "Saved ✓" }, error: { bg: C.red, label: "Error" } }[syncStatus];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 14px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏋️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>Fitness OS</div>
              <div style={{ fontSize: 10, color: C.muted }}>{profile.weight} kg · {profile.bf}% BF · {daysLeft}d to {goal.label} {goal.icon}</div>
            </div>
          </div>
          {syncDot && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: syncDot.bg }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: syncDot.bg }} />{syncDot.label}</div>}
        </div>
        <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 11px", fontSize: 12, fontWeight: tab === t ? 700 : 400, color: tab === t ? C.accent : C.muted, background: "none", border: "none", borderBottom: tab === t ? `2px solid ${C.accent}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>
          ))}
        </div>
      </div>

      {tab === "Today" && <TodayTab />}
      {tab === "Log Workout" && <LogWorkoutTab />}
      {tab === "Log Nutrition" && <LogNutritionTab />}
      {tab === "History" && <HistoryTab />}
      {tab === "Plan" && <PlanTab />}
      {tab === "Goals" && <GoalsTab />}
      {tab === "Coach" && <CoachTab />}

      {toast && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: toast.color, color: toast.color === C.accent ? C.accentText : C.text, borderRadius: 22, padding: "11px 22px", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", zIndex: 100, whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
