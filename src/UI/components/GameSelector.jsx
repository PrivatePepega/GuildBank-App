import { useState, useRef, useEffect } from "react";
import { GAME_REGISTRY } from "../constants/games";
import { inputCls } from "../constants/styles";

export default function GameSelector({ activeGame, onSelect }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredGames = GAME_REGISTRY.filter((g) =>
    g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const handleSelect = (game) => {
    onSelect(game);
    setDropdownOpen(false);
    setGameSearch("");
  };

  const wowMatchesSearch = "world of warcraft".includes(gameSearch.toLowerCase());

  return (
    <div className="w-full max-w-2xl" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-900 border border-gray-700 rounded-xl hover:border-gray-500 transition-colors"
      >
        <span className="text-sm text-gray-300">
          {activeGame ? `${activeGame.icon} ${activeGame.name}` : "Select a game..."}
        </span>
        <span
          className={`text-gray-500 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
          {/* Search */}
          <div className="p-3 border-b border-gray-800">
            <input
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              placeholder="Search games..."
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Game list */}
          <ul className="max-h-48 overflow-y-auto">
            {/* WoW — always first */}
            {wowMatchesSearch && (
              <li
                onClick={() =>
                  handleSelect({ id: "wow", name: "World of Warcraft", icon: "⚔", isWow: true })
                }
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <span className="text-xl">⚔</span>
                <div>
                  <p className="text-sm text-white">World of Warcraft</p>
                  <p className="text-xs text-gray-500">Daily BG · Weekly Raid</p>
                </div>
              </li>
            )}

            {filteredGames.map((game) => (
              <li
                key={game.id}
                onClick={() => handleSelect({ ...game, isWow: false })}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <span className="text-xl">{game.icon}</span>
                <div>
                  <p className="text-sm text-white">{game.name}</p>
                  <p className="text-xs text-gray-500">{game.description}</p>
                </div>
              </li>
            ))}

            {filteredGames.length === 0 && !wowMatchesSearch && (
              <li className="px-4 py-3 text-xs text-gray-600">No games found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
