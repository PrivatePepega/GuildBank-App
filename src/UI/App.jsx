import { useState, useEffect } from "react";
import "./App.css";

import GmSplash from "./components/GmSplash";
import TopBar from "./components/TopBar";
import SettingsPanel from "./components/SettingsPanel";
import GameSelector from "./components/GameSelector";
import GameCard from "./components/GameCard";
import WowCard from "./components/WowCard";

function App() {
  const [gm, setGm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Wallet / Keys ──────────────────────────────────────────────
  const [wallet, setWallet] = useState("");
  const [publicKeyData, setPublicKeyData] = useState("");
  const [privateKeyData, setPrivateKeyData] = useState("");

  // ── WoW ────────────────────────────────────────────────────────
  const [vanillaPlusPath, setVanillaPlusPath] = useState("");
  const [vanillaCache, setVanillaCache] = useState(0);

  // ── Game selector ──────────────────────────────────────────────
  const [activeGame, setActiveGame] = useState(null);

  // ── Misc ───────────────────────────────────────────────────────
  const [version, setVersion] = useState("");

  // Derived: are wallet + keys ready?
  const isReady = !!wallet && !!publicKeyData && !!privateKeyData;

//  Playing State Loading
const [isPlaying, setIsPlaying] = useState(false);
const [playingGameName, setPlayingGameName] = useState("");


  // ── Boot ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await Promise.all([
        fetchWallet(),
        fetchKeys(),
        fetchVanillaPlusPath(),
        fetchVanillaCache(),
        fetchVersion(),
      ]);
      window.electron.notifyRendererReady();
    })();
  
    const cleanupLog = window.electron.onMainProcessLog((type, args) => {
      if (type === "log") console.log("[Main]", ...args);
      else if (type === "error") console.error("[Main]", ...args);
    });
  
    const cleanupLogUpdate = window.electron.onLogUpdate(async (data) => {
      console.log("[App] log-update received:", data);
      setIsPlaying(false);
      setPlayingGameName("");
      await fetchVanillaCache();
    });
  
    return () => {
      cleanupLog();
      cleanupLogUpdate();
    };
  }, []);

  // ── Fetchers ───────────────────────────────────────────────────
  const fetchWallet = async () => {
    const saved = await window.electron.getWallet();
    setWallet(saved.wallet);
  };

  const fetchKeys = async () => {
    const saved = await window.electron.getKeys();
    setPublicKeyData(saved.publicKey);
    setPrivateKeyData(saved.privateKey);
  };

  const fetchVanillaPlusPath = async () => {
    const p = await window.electron.getVanillaPlusPath();
    setVanillaPlusPath(p);
  };

  const fetchVanillaCache = async () => {
    const count = await window.electron.getVanillaCacheCount();
    setVanillaCache(count);
  };

  const fetchVersion = async () => {
    const v = await window.electron.getVersion();
    setVersion(v);
  };

  // ── Handlers passed down ───────────────────────────────────────
  const handleKeySave = async ({ publicKey, privateKey }) => {
    await window.electron.saveKeys({ publicKey, privateKey });
    await fetchKeys();
  };

  const handleWalletSave = async (inputWallet) => {
    await window.electron.saveWallet({ wallet: inputWallet });
    await fetchWallet();
  };

  const handleSelectVanillaPlusPath = async () => {
    const p = await window.electron.selectVanillaPlusPath();
    if (p) setVanillaPlusPath(p);
  };

  const handlePlayVanillaPlus = () => {
    setIsPlaying(true);
    setPlayingGameName("World of Warcraft");
    window.electron.playVanillaPlus();
  };

  const handleExportVanillaPlus = async () => {
    await window.electron.exportVanillaPlusFiles();
    await fetchVanillaCache();
  };

  // ── Render ─────────────────────────────────────────────────────
  if (!gm) {
    return <GmSplash onConfirm={() => setGm(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <TopBar
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
      />

      <SettingsPanel
        open={settingsOpen}
        isReady={isReady}
        onKeySave={handleKeySave}
        onWalletSave={handleWalletSave}
      />

      <main className="flex-1 flex flex-col items-center px-8 py-8 gap-8 overflow-y-auto">
        <GameSelector activeGame={activeGame} onSelect={setActiveGame} />

        {activeGame?.isWow && (
          <WowCard
            isReady={isReady}
            vanillaPlusPath={vanillaPlusPath}
            onSelectPath={handleSelectVanillaPlusPath}
            vanillaCache={vanillaCache}
            onPlay={handlePlayVanillaPlus}
            onExport={handleExportVanillaPlus}
            isPlaying={isPlaying}
            playingGameName={playingGameName}
          />
        )}

        {/* {activeGame && !activeGame.isWow && (
          <GameCard
            game={activeGame}
            isReady={isReady}
            isPlaying={isPlaying}
            playingGameName={playingGameName}
            onPlay={() => {
              setIsPlaying(true);
              setPlayingGameName(activeGame.name);
              window.electron.playGame(activeGame.id);
            }}
          />
        )} */}
      </main>

      <footer className="px-8 py-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-700">www.guildbank.biz</span>
        {version && <span className="text-xs text-gray-600">v{version}</span>}
        {!isReady && (
          <span className="text-xs text-yellow-600">⚠ Set wallet & keys to enable play</span>
        )}
      </footer>
    </div>
  );
}

export default App;
