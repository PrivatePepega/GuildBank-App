import { useState, useEffect } from "react";
import vanillaPlus from "../assets/vanillaPlus.jpg";
import { btn, btnDisabled, inputCls } from "../constants/styles";
import Tooltip from "./Tooltip";
import PlayingState from "./PlayingState";
import { cloneUniforms } from "three/src/renderers/shaders/UniformsUtils.js";


export default function WowCard({ isReady, vanillaPlusPath, onSelectPath, vanillaCache, onPlay, onExport, isPlaying, playingGameName }) {
  const [inputAccount, setInputAccount] = useState("");
  const [account, setAccount] = useState("empty");
  const [exeHelp, setExeHelp] = useState(false);
  const [accountHelp, setAccountHelp] = useState(false);

  // Load saved account on mount
  useEffect(() => {
    (async () => {
      const acc = await window.electron.getVanillaPlusAccount();
      if (acc) {
        setAccount(acc);
        setInputAccount(acc);
      }
    })();
  }, []);

  const handleSaveAccount = async () => {
    if (!inputAccount?.trim()) {
      // Optional: clear the saved account
      await window.electron.saveVanillaPlusAccount("");
      setAccount("empty");
      return;
    }
  
    await window.electron.saveVanillaPlusAccount(inputAccount.trim());
    setAccount(inputAccount.trim());
  };
  const canPlay = isReady && !!vanillaPlusPath && !!account;


  const showAccount = () =>{
    console.log("show account",account);
  }


  if (isPlaying) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-2xl">
        <PlayingState gameName={playingGameName} />
      </div>
    );
  }


  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-5 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={vanillaPlus}
          alt="Vanilla Plus"
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div>
          <p className="text-lg font-bold text-white">Vanilla-Plus</p>
          <a
            href="https://www.curseforge.com/wow/addons/vanilla-plus"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-yellow-400 hover:underline"
          >
            Download Addon ↗
          </a>
        </div>
      </div>

      {/* EXE path */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-28 shrink-0">Game .exe:</span>
          <button onClick={onSelectPath} className={btn}>
            browse
          </button>
          <button
            onClick={() => setExeHelp(!exeHelp)}
            className="text-xs text-gray-600 hover:text-white"
          >
            ?
          </button>
        </div>
        {vanillaPlusPath ? (
          <span className="text-xs text-green-400 break-all pl-1">✓ {vanillaPlusPath}</span>
        ) : (
          <span className="text-xs text-gray-600 pl-1">No path set</span>
        )}
        {exeHelp && (
          <p className="text-xs text-gray-500 italic pl-1">
            Battle.net → gear → locate game → _anniversary_ → WowClassic.exe
          </p>
        )}
      </div>

      {/* Account */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-400">Account name</span>
        <div className="flex items-center gap-2">
          <input
            value={inputAccount}
            onChange={(e) => setInputAccount(e.target.value)}
            placeholder="Account number"
            className={inputCls}
          />
          <button onClick={handleSaveAccount} className={btn + " shrink-0"}>
            save
          </button>
          <button
            onClick={() => setAccountHelp(!accountHelp)}
            className="text-xs text-gray-600 hover:text-white shrink-0"
          >
            ?
          </button>
        </div>

          <button onClick={showAccount}>show account</button>
        {/* {account !== undefined && (
          <span className="text-xs text-gray-500 pl-1">
            Saved: {account ? account : "empty"}
          </span>
        )} */}

        {accountHelp && (
          <p className="text-xs text-gray-500 italic pl-1">
            Your account# inside _anniversary_/WTF/Account
          </p>
        )}
      </div>

      {/* Cache + export */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
        <button onClick={onExport} className={btn}>
          export cache
        </button>
        <span className="text-xs text-gray-500">
          {vanillaCache} completion{vanillaCache !== 1 ? "s" : ""} cached
        </span>
      </div>

      {/* Play */}
      {vanillaCache >= 20 ? (
        <p className="text-sm text-yellow-400 italic text-center py-2">
          Cache is 20+ — time to mint, fren 🪙
        </p>
      ) : canPlay ? (
        <button
          onClick={onPlay}
          className="w-full py-3 bg-yellow-400 font-bold rounded-xl hover:bg-yellow-300 active:scale-95 transition-all duration-150 text-white"
        >
          ▶ Play
        </button>
      ) : (
        <Tooltip
          text={
            !isReady
              ? "Set your wallet and PGP keys first"
              : !vanillaPlusPath
              ? "Set your game path first"
              : "Set your account name first"
          }
        >
          <button className={btnDisabled + " w-full py-3 rounded-xl text-base"} disabled>
            ▶ Play
          </button>
        </Tooltip>
      )}
    </div>
  );
}
