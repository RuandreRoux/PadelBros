import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Play, Edit2, Check, X, CalendarDays, ChevronDown, ChevronUp, Share2, Shuffle } from 'lucide-react';

const FULL_SCHEDULE = [
  [{ team1: [1,5], team2: [7,8] }, { team1: [2,3], team2: [4,6] }],
  [{ team1: [4,7], team2: [6,8] }, { team1: [1,2], team2: [3,5] }],
  [{ team1: [3,4], team2: [5,7] }, { team1: [2,6], team2: [1,8] }],
  [{ team1: [1,6], team2: [4,5] }, { team1: [3,7], team2: [2,8] }],
  [{ team1: [5,6], team2: [2,7] }, { team1: [1,4], team2: [3,8] }],
  [{ team1: [4,8], team2: [2,5] }, { team1: [6,7], team2: [1,3] }],
  [{ team1: [1,7], team2: [2,4] }, { team1: [3,6], team2: [5,8] }],
  [{ team1: [1,5], team2: [4,6] }, { team1: [2,3], team2: [7,8] }],
  [{ team1: [4,7], team2: [3,5] }, { team1: [1,2], team2: [6,8] }],
  [{ team1: [3,4], team2: [1,8] }, { team1: [2,6], team2: [5,7] }],
  [{ team1: [1,6], team2: [2,8] }, { team1: [3,7], team2: [4,5] }],
  [{ team1: [5,6], team2: [3,8] }, { team1: [1,4], team2: [2,7] }],
  [{ team1: [4,8], team2: [1,3] }, { team1: [6,7], team2: [2,5] }],
  [{ team1: [1,7], team2: [5,8] }, { team1: [3,6], team2: [2,4] }],
];

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (type === 'point') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
    if (type === 'complete') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.15);
      });
    }
  } catch (_) {}
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#22d3ee','#ffffff','#0ea5e9','#67e8f9'] });
}

// Score keyboard 0–9
function ScoreKeyboard({ matchId, team, currentScore, onSet }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 my-2">
      {[0,1,2,3,4,5,6,7,8,9].map((n) => (
        <button
          key={n}
          onClick={(e) => { e.stopPropagation(); onSet(matchId, team, n); }}
          className={`py-2.5 rounded-xl text-sm font-black transition-colors ${
            currentScore === n
              ? 'bg-cyan-400 text-white shadow-md shadow-cyan-400/40'
              : 'bg-white/10 active:bg-white/25 text-white/80'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function PadelTournament() {
  const [players, setPlayers] = useState(
    Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}`, points: 0 }))
  );

  const [round, setRound] = useState(0);
  const [matches, setMatches] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editNames, setEditNames] = useState(false);
  const [historyEditId, setHistoryEditId] = useState(null);
  const [historyEditScores, setHistoryEditScores] = useState({ score1: 0, score2: 0 });
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const getPlayer = (id) => players.find((p) => p.id === id);
  const getName = (id) => getPlayer(id)?.name ?? `Player ${id}`;

  const handleResetClick = () => {
    if (!window.confirm('Reset all data? This will clear all points, names, and matches.')) return;
    setPlayers(Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}`, points: 0 })));
    setRound(0); setMatches([]); setMatchHistory([]);
    setSelectedMatch(null); setEditNames(false);
    setHistoryEditId(null); setHistoryEditScores({ score1: 0, score2: 0 });
    setScheduleOpen(false);
  };

  const shufflePlayers = () => {
    const names = players.map((p) => p.name);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    setPlayers(players.map((p, i) => ({ ...p, name: names[i] })));
    vibrate(60);
  };

  const generateMatches = () => {
    const scheduleRound = FULL_SCHEDULE[round];
    if (!scheduleRound) return;
    const toPlayer = (id) => players.find((p) => p.id === id);
    setMatches(
      scheduleRound.map((def) => ({
        id: Math.random(),
        round: round + 1,
        team1: def.team1.map(toPlayer),
        team2: def.team2.map(toPlayer),
        score1: 0,
        score2: 0,
        completed: false,
      }))
    );
    setSelectedMatch(null);
  };

  const setScore = (matchId, team, value) => {
    playSound('point');
    vibrate(20);
    setMatches(matches.map((m) => {
      if (m.id !== matchId) return m;
      return { ...m, score1: team === 1 ? value : m.score1, score2: team === 2 ? value : m.score2 };
    }));
  };

  const completeMatch = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    setPlayers(players.map((p) => {
      let add = 0;
      if (p.id === match.team1[0].id || p.id === match.team1[1].id) add = match.score1;
      else if (p.id === match.team2[0].id || p.id === match.team2[1].id) add = match.score2;
      return { ...p, points: p.points + add };
    }));
    const updated = { ...match, completed: true };
    setMatchHistory([...matchHistory, updated]);
    setMatches(matches.map((m) => (m.id === matchId ? updated : m)));
    setSelectedMatch(null);
    playSound('complete');
    vibrate([60, 40, 80, 40, 120]);
    fireConfetti();
  };

  const editMatch = (idx) => {
    setHistoryEditId(idx);
    setHistoryEditScores({ score1: matchHistory[idx].score1, score2: matchHistory[idx].score2 });
  };

  const saveMatchEdit = (idx) => {
    const old = matchHistory[idx];
    const d1 = historyEditScores.score1 - old.score1;
    const d2 = historyEditScores.score2 - old.score2;
    setPlayers(players.map((p) => {
      let diff = 0;
      if (p.id === old.team1[0].id || p.id === old.team1[1].id) diff = d1;
      else if (p.id === old.team2[0].id || p.id === old.team2[1].id) diff = d2;
      return { ...p, points: Math.max(0, p.points + diff) };
    }));
    const h = [...matchHistory];
    h[idx] = { ...old, score1: historyEditScores.score1, score2: historyEditScores.score2 };
    setMatchHistory(h);
    setHistoryEditId(null);
  };

  const cancelMatchEdit = () => {
    setHistoryEditId(null);
    setHistoryEditScores({ score1: 0, score2: 0 });
  };

  const finishRound = () => {
    if (!matches.every((m) => m.completed)) { alert('All matches must be completed!'); return; }
    setMatches([]);
    setRound(round + 1);
  };

  const editPlayerName = (id, name) =>
    setPlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.points - a.points), [players]);
  const allCompleted = matches.length > 0 && matches.every((m) => m.completed);

  const shareToWhatsApp = () => {
    const status = round >= 14 ? 'Final Standings' : `Round ${round} of 14`;
    const lines = [
      `Padel Bros - ${status}`,
      '─────────────────',
      ...sortedPlayers.map((p, i) => `${i + 1}. ${p.name}  ${p.points}pts`),
      '',
      `${matchHistory.length} match${matchHistory.length !== 1 ? 'es' : ''} played`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div className="border-b border-cyan-500/30 sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="px-4 py-3 sm:px-6 sm:py-5"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="flex justify-between items-center gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-black text-cyan-400" style={{ letterSpacing: '0.15em' }}>
                PADEL
              </h1>
              <p className="text-cyan-300/60 text-xs mt-0.5">Tournament Tracker</p>
            </div>
            <button
              onClick={handleResetClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-red-500/30 active:bg-red-500/60 border border-red-500/50 rounded-lg text-red-300 font-bold text-sm transition-colors"
            >
              <RotateCcw size={17} className="flex-shrink-0" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-cyan-300/60 text-xs font-semibold">
                {round >= 14 ? 'Tournament Complete!' : `Round ${round + 1} of 14`}
              </span>
              <span className="text-cyan-300/40 text-xs">{Math.round((round / 14) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${(round / 14) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-8 max-w-4xl mx-auto">
        <div className="flex flex-col gap-5">

          {/* Leaderboard */}
          <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
            <h2 className="text-base font-bold text-cyan-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
              Leaderboard
            </h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-cyan-500/10">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-cyan-400 font-black text-sm w-5 flex-shrink-0 text-center">{idx + 1}</span>
                    <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                  </div>
                  <span className="bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-full text-cyan-300 font-bold text-xs flex-shrink-0 ml-2">
                    {player.points}pts
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (editNames) {
                    shufflePlayers();
                    setEditNames(false);
                  } else {
                    setEditNames(true);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                  editNames
                    ? 'bg-cyan-400 active:bg-cyan-300 text-white shadow-lg shadow-cyan-500/40'
                    : 'bg-cyan-500/10 active:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300'
                }`}
              >
                {editNames ? <><Shuffle size={15} /> Shuffle & Done</> : 'Edit Names'}
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex items-center gap-2 px-4 py-3 bg-green-500/15 active:bg-green-500/30 border border-green-500/30 rounded-xl text-green-400 font-semibold text-sm transition-colors flex-shrink-0"
              >
                <Share2 size={15} />
                Share
              </button>
            </div>

            {editNames && (
              <div className="mt-3 space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="text-cyan-400/60 text-xs font-bold w-4 flex-shrink-0 text-center">{player.id}</span>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => editPlayerName(player.id, e.target.value)}
                      className="flex-1 px-3 py-3 bg-white/10 border border-cyan-500/30 rounded-xl text-white text-base outline-none focus:border-cyan-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matches section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-white">Round {round}</h2>
                {matchHistory.length > 0 && (
                  <p className="text-cyan-300/50 text-xs mt-0.5">
                    {matchHistory.length} match{matchHistory.length !== 1 ? 'es' : ''} played
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setScheduleOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors border ${
                    scheduleOpen ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200' : 'bg-white/5 border-cyan-500/30 text-cyan-300 active:bg-white/15'
                  }`}
                >
                  <CalendarDays size={16} />
                  <span>Schedule</span>
                  {scheduleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {matches.length === 0 && round < 14 ? (
                  <button
                    onClick={generateMatches}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 active:bg-cyan-400 rounded-xl text-white font-bold text-sm transition-colors shadow-lg shadow-cyan-500/30"
                  >
                    <Play size={16} /> Round {round + 1}
                  </button>
                ) : allCompleted ? (
                  <button
                    onClick={finishRound}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 active:bg-green-400 rounded-xl text-white font-bold text-sm transition-colors shadow-lg shadow-green-500/30"
                  >
                    Next Round
                  </button>
                ) : null}
              </div>
            </div>

            {/* Schedule dropdown */}
            {scheduleOpen && (
              <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
                    Full Match Schedule
                  </h3>
                  <span className="text-[11px] text-cyan-300/50">14 rounds · all pairs covered</span>
                </div>
                <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                  {FULL_SCHEDULE.map((roundMatches, idx) => {
                    const roundNum = idx + 1;
                    const isCompleted = roundNum <= round;
                    const isNext = roundNum === round + 1;
                    return (
                      <div key={idx} className={`rounded-xl border p-3 ${isCompleted ? 'border-cyan-500/10 opacity-35' : isNext ? 'bg-cyan-500/15 border-cyan-400/50' : 'bg-white/5 border-cyan-500/10'}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className={`text-xs font-bold ${isNext ? 'text-cyan-300' : 'text-cyan-300/50'}`}>Round {roundNum}</span>
                          {isNext && <span className="text-[10px] px-2 py-0.5 bg-cyan-400/20 border border-cyan-400/40 rounded-full text-cyan-300 font-bold">NEXT UP</span>}
                          {isCompleted && <span className="text-[10px] text-cyan-300/30">done</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {roundMatches.map((match, mIdx) => (
                            <div key={mIdx} className={`rounded-lg p-2 ${isNext ? 'bg-white/10' : 'bg-white/5'}`}>
                              <p className={`text-[10px] font-black mb-1 ${isCompleted ? 'text-cyan-400/30' : 'text-cyan-400/70'}`}>
                                COURT {mIdx + 1}
                              </p>
                              <p className={`text-xs font-semibold leading-snug truncate ${isCompleted ? 'text-white/30' : 'text-white/90'}`}>
                                {match.team1.map(getName).join(' & ')}
                              </p>
                              <p className="text-[10px] text-cyan-500/60 font-bold my-0.5">vs</p>
                              <p className={`text-xs font-semibold leading-snug truncate ${isCompleted ? 'text-white/30' : 'text-white/90'}`}>
                                {match.team2.map(getName).join(' & ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active match cards */}
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {matches.map((match, courtIdx) => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
                    className={`bg-white/5 border-2 rounded-2xl p-4 transition-colors ${
                      selectedMatch === match.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-cyan-500/20'
                    } ${match.completed ? 'opacity-70' : ''}`}
                  >
                    {/* Court label */}
                    <p className="text-[11px] font-black text-cyan-400/70 mb-2 tracking-widest">
                      COURT {courtIdx + 1}
                    </p>
                    {/* Team 1 */}
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {match.team1.map((p, i) => (
                          <p key={i} className="text-cyan-300 font-bold text-base leading-tight truncate">{p.name}</p>
                        ))}
                      </div>
                      <span className="text-4xl font-black text-cyan-400 flex-shrink-0 tabular-nums">{match.score1}</span>
                    </div>
                    {selectedMatch === match.id && !match.completed && (
                      <ScoreKeyboard matchId={match.id} team={1} currentScore={match.score1} onSet={setScore} />
                    )}

                    <div className="border-t border-cyan-500/20 my-3"></div>

                    {/* Team 2 */}
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {match.team2.map((p, i) => (
                          <p key={i} className="text-cyan-300 font-bold text-base leading-tight truncate">{p.name}</p>
                        ))}
                      </div>
                      <span className="text-4xl font-black text-cyan-400 flex-shrink-0 tabular-nums">{match.score2}</span>
                    </div>
                    {selectedMatch === match.id && !match.completed && (
                      <ScoreKeyboard matchId={match.id} team={2} currentScore={match.score2} onSet={setScore} />
                    )}

                    {selectedMatch === match.id && !match.completed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); completeMatch(match.id); }}
                        className="w-full mt-2 px-4 py-4 bg-green-500 active:bg-green-400 rounded-xl text-white font-bold text-sm transition-colors"
                      >
                        Complete Match
                      </button>
                    )}
                    {match.completed && (
                      <div className="w-full mt-3 px-4 py-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-center text-cyan-300 font-semibold text-sm">
                        Match Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-8 text-center">
                <p className="text-cyan-300/60 mb-1 font-semibold">No matches yet</p>
                <p className="text-white/30 text-sm">
                  {round >= 14 ? 'Tournament complete!' : `Tap "Round ${round + 1}" to start`}
                </p>
              </div>
            )}
          </div>

          {/* Match History */}
          {matchHistory.length > 0 && (
            <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
                Match History
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matchHistory.slice().reverse().map((match, idx) => {
                  const actualIdx = matchHistory.length - 1 - idx;
                  const winner = match.score1 > match.score2 ? 1 : 2;
                  const isEditing = historyEditId === actualIdx;
                  return (
                    <div key={actualIdx} className="p-3 bg-white/5 rounded-xl border border-cyan-500/10">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-cyan-300/50 font-semibold">Round {match.round}</p>
                        {!isEditing && (
                          <button onClick={() => editMatch(actualIdx)} className="p-1.5 active:bg-white/10 rounded-lg">
                            <Edit2 size={14} className="text-cyan-300" />
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-cyan-300 font-semibold mb-1.5 text-sm truncate">
                              {match.team1.map((p) => p.name).join(' & ')}
                            </p>
                            <input type="number" value={historyEditScores.score1}
                              onChange={(e) => setHistoryEditScores({ ...historyEditScores, score1: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-3 bg-white/10 border border-cyan-500/30 rounded-xl text-white text-base outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <p className="text-cyan-300 font-semibold mb-1.5 text-sm truncate">
                              {match.team2.map((p) => p.name).join(' & ')}
                            </p>
                            <input type="number" value={historyEditScores.score2}
                              onChange={(e) => setHistoryEditScores({ ...historyEditScores, score2: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-3 bg-white/10 border border-cyan-500/30 rounded-xl text-white text-base outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveMatchEdit(actualIdx)} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-500/20 active:bg-green-500/40 border border-green-500/40 rounded-xl text-green-300 text-sm font-bold">
                              <Check size={15} /> Save
                            </button>
                            <button onClick={cancelMatchEdit} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-500/20 active:bg-red-500/40 border border-red-500/40 rounded-xl text-red-300 text-sm font-bold">
                              <X size={15} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className={`font-semibold text-sm truncate flex-1 min-w-0 ${winner === 1 ? 'text-cyan-300' : 'text-white/50'}`}>
                              {match.team1.map((p) => p.name).join(' & ')}
                            </p>
                            <span className={`font-black text-base tabular-nums flex-shrink-0 ${winner === 1 ? 'text-cyan-400' : 'text-white/30'}`}>{match.score1}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-semibold text-sm truncate flex-1 min-w-0 ${winner === 2 ? 'text-cyan-300' : 'text-white/50'}`}>
                              {match.team2.map((p) => p.name).join(' & ')}
                            </p>
                            <span className={`font-black text-base tabular-nums flex-shrink-0 ${winner === 2 ? 'text-cyan-400' : 'text-white/30'}`}>{match.score2}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        input, button { touch-action: manipulation; }
      `}</style>
    </div>
  );
}
