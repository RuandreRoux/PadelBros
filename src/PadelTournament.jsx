import React, { useState, useMemo } from 'react';
import { RotateCcw, Play, Plus, Minus, Edit2, Check, X, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

// 14-round doubles round robin for 8 players (1-indexed IDs)
// Every player partners with every other player at least once
// Every player faces every other player at least once
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

export default function PadelTournament() {
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', points: 0 },
    { id: 2, name: 'Player 2', points: 0 },
    { id: 3, name: 'Player 3', points: 0 },
    { id: 4, name: 'Player 4', points: 0 },
    { id: 5, name: 'Player 5', points: 0 },
    { id: 6, name: 'Player 6', points: 0 },
    { id: 7, name: 'Player 7', points: 0 },
    { id: 8, name: 'Player 8', points: 0 },
  ]);

  const [round, setRound] = useState(0);
  const [matches, setMatches] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editNames, setEditNames] = useState(false);
  const [historyEditId, setHistoryEditId] = useState(null);
  const [historyEditScores, setHistoryEditScores] = useState({ score1: 0, score2: 0 });
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const getName = (id) => players.find((p) => p.id === id)?.name ?? `Player ${id}`;

  const defaultPlayers = () =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      points: 0,
    }));

  const handleResetClick = () => {
    if (!window.confirm('Reset all data? This will clear all points, names, and matches.')) return;
    setPlayers(defaultPlayers());
    setRound(0);
    setMatches([]);
    setMatchHistory([]);
    setSelectedMatch(null);
    setEditNames(false);
    setHistoryEditId(null);
    setHistoryEditScores({ score1: 0, score2: 0 });
    setScheduleOpen(false);
  };

  const generateMatches = () => {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newMatches = [
      {
        id: Math.random(),
        round: round + 1,
        team1: [shuffled[0], shuffled[1]],
        team2: [shuffled[2], shuffled[3]],
        score1: 0,
        score2: 0,
        completed: false,
      },
      {
        id: Math.random(),
        round: round + 1,
        team1: [shuffled[4], shuffled[5]],
        team2: [shuffled[6], shuffled[7]],
        score1: 0,
        score2: 0,
        completed: false,
      },
    ];
    setMatches(newMatches);
    setSelectedMatch(null);
  };

  const updateScore = (matchId, team, points) => {
    setMatches(
      matches.map((m) => {
        if (m.id === matchId) {
          const newScore1 = team === 1 ? Math.max(0, m.score1 + points) : m.score1;
          const newScore2 = team === 2 ? Math.max(0, m.score2 + points) : m.score2;
          return { ...m, score1: newScore1, score2: newScore2 };
        }
        return m;
      })
    );
  };

  const completeMatch = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    setPlayers(
      players.map((p) => {
        let pointsToAdd = 0;
        if (p.id === match.team1[0].id || p.id === match.team1[1].id) {
          pointsToAdd = match.score1;
        } else if (p.id === match.team2[0].id || p.id === match.team2[1].id) {
          pointsToAdd = match.score2;
        }
        return { ...p, points: p.points + pointsToAdd };
      })
    );

    const updatedMatch = { ...match, completed: true };
    setMatchHistory([...matchHistory, updatedMatch]);
    setMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
    setSelectedMatch(null);
  };

  const editMatch = (idx) => {
    const match = matchHistory[idx];
    setHistoryEditId(idx);
    setHistoryEditScores({ score1: match.score1, score2: match.score2 });
  };

  const saveMatchEdit = (idx) => {
    const oldMatch = matchHistory[idx];
    const s1Diff = historyEditScores.score1 - oldMatch.score1;
    const s2Diff = historyEditScores.score2 - oldMatch.score2;

    setPlayers(
      players.map((p) => {
        let diff = 0;
        if (p.id === oldMatch.team1[0].id || p.id === oldMatch.team1[1].id) {
          diff = s1Diff;
        } else if (p.id === oldMatch.team2[0].id || p.id === oldMatch.team2[1].id) {
          diff = s2Diff;
        }
        return { ...p, points: Math.max(0, p.points + diff) };
      })
    );

    const newHistory = [...matchHistory];
    newHistory[idx] = { ...oldMatch, score1: historyEditScores.score1, score2: historyEditScores.score2 };
    setMatchHistory(newHistory);
    setHistoryEditId(null);
  };

  const cancelMatchEdit = () => {
    setHistoryEditId(null);
    setHistoryEditScores({ score1: 0, score2: 0 });
  };

  const finishRound = () => {
    if (!matches.every((m) => m.completed)) {
      alert('All matches must be completed!');
      return;
    }
    setMatches([]);
    setRound(round + 1);
  };

  const editPlayerName = (id, newName) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.points - a.points);
  }, [players]);

  const allCompleted = matches.length > 0 && matches.every((m) => m.completed);

  return (
    <div
      className="min-h-screen pb-8"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header */}
      <div className="border-b border-cyan-500/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
              <h1
                className="text-3xl sm:text-4xl font-black text-cyan-400"
                style={{ letterSpacing: '0.15em' }}
              >
                PADEL
              </h1>
              <p className="text-cyan-300/60 text-xs sm:text-sm mt-1">Tournament Tracker</p>
            </div>
            <button
              onClick={handleResetClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 rounded-lg text-red-300 font-bold text-sm transition-all"
            >
              <RotateCcw size={18} className="flex-shrink-0" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Leaderboard */}
          <div className="bg-white/5 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
              Leaderboard
            </h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-cyan-500/10"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-cyan-400 font-black text-sm w-5 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                  </div>
                  <span className="bg-cyan-500/20 border border-cyan-500/50 px-2 sm:px-3 py-1 rounded-full text-cyan-300 font-bold text-xs">
                    {player.points}pts
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditNames(!editNames)}
              className="w-full mt-4 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold text-sm transition-all"
            >
              {editNames ? 'Done Editing' : 'Edit Names'}
            </button>
            {editNames && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {players.map((player) => (
                  <input
                    key={player.id}
                    type="text"
                    value={player.name}
                    onChange={(e) => editPlayerName(player.id, e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-cyan-500/30 rounded-lg text-white text-sm outline-none focus:border-cyan-400"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Matches */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Round {round}</h2>
                {matchHistory.length > 0 && (
                  <p className="text-cyan-300/60 text-xs sm:text-sm mt-1">
                    {matchHistory.length} match{matchHistory.length !== 1 ? 'es' : ''} played
                  </p>
                )}
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                {/* Schedule toggle button */}
                <button
                  onClick={() => setScheduleOpen((o) => !o)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                    scheduleOpen
                      ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200'
                      : 'bg-white/5 border-cyan-500/30 text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  <CalendarDays size={16} />
                  <span>Schedule</span>
                  {scheduleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {matches.length === 0 ? (
                  <button
                    onClick={generateMatches}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/30"
                  >
                    <Play size={18} />
                    Generate Matches
                  </button>
                ) : allCompleted ? (
                  <button
                    onClick={finishRound}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-green-500/30"
                  >
                    Next Round
                  </button>
                ) : null}
              </div>
            </div>

            {/* Schedule dropdown panel */}
            {scheduleOpen && (
              <div className="bg-white/5 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                    Full Match Schedule
                  </h3>
                  <span className="text-xs text-cyan-300/50">14 rounds · all pairs covered</span>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {FULL_SCHEDULE.map((roundMatches, idx) => {
                    const roundNum = idx + 1;
                    const isCompleted = roundNum <= round;
                    const isNext = roundNum === round + 1;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 transition-all ${
                          isCompleted
                            ? 'bg-white/3 border-cyan-500/10 opacity-40'
                            : isNext
                            ? 'bg-cyan-500/15 border-cyan-400/50'
                            : 'bg-white/5 border-cyan-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs font-bold ${
                              isNext ? 'text-cyan-300' : isCompleted ? 'text-cyan-300/40' : 'text-cyan-300/70'
                            }`}
                          >
                            Round {roundNum}
                          </span>
                          {isNext && (
                            <span className="text-[10px] px-2 py-0.5 bg-cyan-400/20 border border-cyan-400/40 rounded-full text-cyan-300 font-bold tracking-wide">
                              NEXT UP
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] text-cyan-300/30">done</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {roundMatches.map((match, mIdx) => (
                            <div key={mIdx} className="flex items-center gap-2 text-sm">
                              <span
                                className={`font-semibold ${
                                  isCompleted ? 'text-white/30' : isNext ? 'text-white' : 'text-white/70'
                                }`}
                              >
                                {match.team1.map(getName).join(' & ')}
                              </span>
                              <span className="text-cyan-500/60 font-black text-[10px] flex-shrink-0">VS</span>
                              <span
                                className={`font-semibold ${
                                  isCompleted ? 'text-white/30' : isNext ? 'text-white' : 'text-white/70'
                                }`}
                              >
                                {match.team2.map(getName).join(' & ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {matches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
                    className={`bg-white/5 backdrop-blur-md border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedMatch === match.id
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-cyan-500/20 hover:border-cyan-500/40'
                    } ${match.completed ? 'opacity-70' : ''}`}
                  >
                    <div className="mb-3 sm:mb-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {match.team1.map((p, i) => (
                            <p key={i} className="text-cyan-300 font-semibold text-sm truncate">
                              {p.name}
                            </p>
                          ))}
                        </div>
                        <span className="text-3xl sm:text-4xl font-black text-cyan-400 flex-shrink-0">
                          {match.score1}
                        </span>
                      </div>
                      {selectedMatch === match.id && !match.completed && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateScore(match.id, 1, 1);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm font-bold transition-all"
                          >
                            <Plus size={14} /> Add
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateScore(match.id, 1, -1);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-bold transition-all"
                          >
                            <Minus size={14} /> Sub
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-cyan-500/20 my-3 sm:my-4"></div>
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          {match.team2.map((p, i) => (
                            <p key={i} className="text-cyan-300 font-semibold text-sm truncate">
                              {p.name}
                            </p>
                          ))}
                        </div>
                        <span className="text-3xl sm:text-4xl font-black text-cyan-400 flex-shrink-0">
                          {match.score2}
                        </span>
                      </div>
                      {selectedMatch === match.id && !match.completed && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateScore(match.id, 2, 1);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm font-bold transition-all"
                          >
                            <Plus size={14} /> Add
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateScore(match.id, 2, -1);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-bold transition-all"
                          >
                            <Minus size={14} /> Sub
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedMatch === match.id && !match.completed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          completeMatch(match.id);
                        }}
                        className="w-full mt-4 px-4 py-3 bg-green-500 hover:bg-green-400 rounded-lg text-white font-bold text-sm transition-all"
                      >
                        Complete Match
                      </button>
                    )}
                    {match.completed && (
                      <div className="w-full mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-center text-cyan-300 font-semibold text-sm">
                        Match Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 text-center">
                <p className="text-cyan-300/60 mb-2">No matches generated yet</p>
                <p className="text-white/40 text-xs sm:text-sm">
                  Click "Generate Matches" to start the round
                </p>
              </div>
            )}
          </div>

          {/* Match History */}
          {matchHistory.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                Match History
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matchHistory
                  .slice()
                  .reverse()
                  .map((match, idx) => {
                    const actualIdx = matchHistory.length - 1 - idx;
                    const winner = match.score1 > match.score2 ? 1 : 2;
                    const isEditing = historyEditId === actualIdx;
                    return (
                      <div
                        key={actualIdx}
                        className="p-3 bg-white/5 rounded-lg border border-cyan-500/10"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs text-cyan-300/60">Round {match.round}</p>
                          {!isEditing && (
                            <button
                              onClick={() => editMatch(actualIdx)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit2 size={14} className="text-cyan-300" />
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex-1">
                              <p className="text-cyan-300 font-semibold mb-1 text-sm">
                                {match.team1.map((p) => p.name).join(' & ')}
                              </p>
                              <input
                                type="number"
                                value={historyEditScores.score1}
                                onChange={(e) =>
                                  setHistoryEditScores({
                                    ...historyEditScores,
                                    score1: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-3 py-2 bg-white/10 border border-cyan-500/30 rounded-lg text-white text-sm outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-cyan-300 font-semibold mb-1 text-sm">
                                {match.team2.map((p) => p.name).join(' & ')}
                              </p>
                              <input
                                type="number"
                                value={historyEditScores.score2}
                                onChange={(e) =>
                                  setHistoryEditScores({
                                    ...historyEditScores,
                                    score2: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-3 py-2 bg-white/10 border border-cyan-500/30 rounded-lg text-white text-sm outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveMatchEdit(actualIdx)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-300 text-sm font-bold transition-all"
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                onClick={cancelMatchEdit}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-bold transition-all"
                              >
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <p
                                className={`font-semibold ${
                                  winner === 1 ? 'text-cyan-300' : 'text-white/60'
                                }`}
                              >
                                {match.team1.map((p) => p.name).join(' & ')}
                              </p>
                              <div className="flex gap-2">
                                <span
                                  className={`font-black ${
                                    winner === 1 ? 'text-cyan-400' : 'text-white/40'
                                  }`}
                                >
                                  {match.score1}
                                </span>
                                <span className="text-white/20">-</span>
                                <span
                                  className={`font-black ${
                                    winner === 2 ? 'text-cyan-400' : 'text-white/40'
                                  }`}
                                >
                                  {match.score2}
                                </span>
                              </div>
                            </div>
                            <p
                              className={`font-semibold text-sm ${
                                winner === 2 ? 'text-cyan-300' : 'text-white/60'
                              }`}
                            >
                              {match.team2.map((p) => p.name).join(' & ')}
                            </p>
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
      `}</style>
    </div>
  );
}
