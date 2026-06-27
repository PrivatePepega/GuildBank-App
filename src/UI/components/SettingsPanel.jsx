import { useState } from "react";
import { btn, inputCls } from "../constants/styles";

export default function SettingsPanel({ open, isReady, onKeySave, onWalletSave }) {
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [inputWallet, setInputWallet] = useState("");

  const handleSaveKeys = async () => {
    await onKeySave({ publicKey, privateKey });
  };

  const handleSaveWallet = async () => {
    await onWalletSave(inputWallet);
  };

  return (
    <div
      className={`overflow-hidden transition-all duration-300 border-b border-gray-800 bg-gray-900 ${
        open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-8 py-6 flex flex-col gap-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Wallet & PGP Keys
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* PGP Keys */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">PGP Keys</h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 shrink-0">Public:</span>
              <button
                onClick={async () => {
                  const saved = await window.electron.getKeys();
                  alert(saved.publicKey);
                }}
                className={btn}
              >
                show
              </button>
            </div>
            <input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Paste public key..."
              className={inputCls}
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 shrink-0">Private:</span>
              <button
                onClick={async () => {
                  const saved = await window.electron.getKeys();
                  alert(saved.privateKey);
                }}
                className={btn}
              >
                show
              </button>
            </div>
            <input
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Paste private key..."
              className={inputCls}
            />

            <button onClick={handleSaveKeys} className={btn + " self-start"}>
              Save Keys
            </button>
          </div>

          {/* Wallet */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">Wallet</h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 shrink-0">Address:</span>
              <button
                onClick={async () => {
                  const saved = await window.electron.getWallet();
                  alert(saved.wallet);
                }}
                className={btn}
              >
                show
              </button>
              <WalletPreview />
            </div>
            <input
              value={inputWallet}
              onChange={(e) => setInputWallet(e.target.value)}
              placeholder="Paste wallet address..."
              className={inputCls}
            />
            <button onClick={handleSaveWallet} className={btn + " self-start"}>
              Save Wallet
            </button>

            <div
              className={`flex items-center gap-2 mt-2 text-xs ${
                isReady ? "text-green-400" : "text-gray-600"
              }`}
            >
              <span>{isReady ? "●" : "○"}</span>
              <span>
                {isReady ? "Wallet & keys configured" : "Wallet and keys required to play"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small inline helper — reads wallet from electron and shows a truncated preview
function WalletPreview() {
  const [preview, setPreview] = useState("");

  useState(() => {
    (async () => {
      const saved = await window.electron.getWallet();
      if (saved.wallet) {
        setPreview(`${saved.wallet.slice(0, 4)}...${saved.wallet.slice(-4)}`);
      }
    })();
  }, []);

  if (!preview) return null;
  return <span className="text-xs text-gray-600">{preview}</span>;
}
