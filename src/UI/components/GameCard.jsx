import { useState, useEffect } from "react";
import { btn, btnDisabled, inputCls } from "../constants/styles";
import Tooltip from "./Tooltip";
import PlayingState from "./PlayingState";


export default function GameCard({ game, isReady, isPlaying, playingGameName, onPlay }) {
  const [gamePath, setGamePath] = useState("");
  const [accountInput, setAccountInput] = useState("");
  const [account, setAccount] = useState("");
  const [cacheCount, setCacheCount] = useState(0);
  const [pathHelp, setPathHelp] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await window.electron.getGamePath(game.id);
      const a = await window.electron.getGameAccount(game.id);
      const c = await window.electron.getGameCacheCount(game.id);
      if (p) setGamePath(p);
      if (a) {
        setAccount(a);
        setAccountInput(a);
      }
      setCacheCount(c);
    })();
  }, [game.id]);

  const handleSelectPath = async () => {
    const p = await window.electron.selectGamePath(game.id);
    if (p) setGamePath(p);
  };

  const handleSaveAccount = async () => {
    await window.electron.saveGameAccount(game.id, accountInput);
    setAccount(accountInput);
  };

  const handlePlay = () => {
    onPlay();
  };

  const handleExport = async () => {
    await window.electron.exportGameFiles(game.id);
    const c = await window.electron.getGameCacheCount(game.id);
    setCacheCount(c);
  };

  const canPlay = isReady && !!gamePath && !!account;



  if (isPlaying) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-2xl mx-auto">
        <PlayingState gameName={playingGameName} />
      </div>
    );
  }


  return (
    
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-4xl shrink-0">
          {game.icon}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{game.name}</p>
          <p className="text-xs text-gray-500">{game.description}</p>
        </div>
      </div>

      {/* File path */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-28 shrink-0">Game client:</span>
          <button onClick={handleSelectPath} className={btn}>
            browse
          </button>
          <button
            onClick={() => setPathHelp(!pathHelp)}
            className="text-xs text-gray-600 hover:text-white transition-colors"
          >
            ?
          </button>
        </div>
        {gamePath ? (
          <span className="text-xs text-green-400 break-all pl-1">✓ {gamePath}</span>
        ) : (
          <span className="text-xs text-gray-600 pl-1">
            No path set — browse to your game executable
          </span>
        )}
        {pathHelp && (
          <p className="text-xs text-gray-500 italic pl-1">
            Find and select your game's main .exe file
          </p>
        )}
      </div>

      {/* Account */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-400">Account name</span>
        <div className="flex items-center gap-2">
          <input
            value={accountInput}
            onChange={(e) => setAccountInput(e.target.value)}
            placeholder="Enter your in-game account name..."
            className={inputCls}
          />
          <button onClick={handleSaveAccount} className={btn + " shrink-0"}>
            save
          </button>
        </div>
        {account && <span className="text-xs text-gray-500 pl-1">Saved: {account}</span>}
      </div>

      {/* Cache + export */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
        <button onClick={handleExport} className={btn}>
          export cache
        </button>
        <span className="text-xs text-gray-500">
          {cacheCount} completion{cacheCount !== 1 ? "s" : ""} cached
        </span>
      </div>

      {/* Play */}
      {cacheCount >= 20 ? (
        <p className="text-sm text-yellow-400 italic text-center py-2">
          Cache is 20+ — time to mint, fren 🪙
        </p>
      ) : canPlay ? (
        <button
          onClick={handlePlay}
          className="w-full py-3 bg-yellow-400 font-bold rounded-xl hover:bg-yellow-300 active:scale-95 transition-all duration-150 text-white"
        >
          ▶ Play
        </button>
      ) : (
        <Tooltip
          text={
            !isReady
              ? "Set your wallet and PGP keys first"
              : !gamePath
              ? "Set your game path first"
              : "Set your account name first"
          }
        >
          <button className={btnDisabled + " w-full py-3 rounded-xl text-white"} disabled>
            ▶ Play
          </button>
        </Tooltip>
      )}
    </div>
  );
}
