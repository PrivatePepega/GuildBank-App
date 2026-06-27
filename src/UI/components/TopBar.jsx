import logo from "../assets/guildbanklogo white-01.png";

export default function TopBar({ settingsOpen, onToggleSettings }) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800 bg-gray-950 z-40 relative">
      <div className="flex items-center gap-3">
        <img src={logo} alt="logo" className="w-fit h-8 object-contain" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-600">account settings: </span>
        <button
          onClick={onToggleSettings}
          className={`text-xl transition-transform duration-300 hover:text-yellow-400 ${
            settingsOpen ? "rotate-45 text-yellow-400" : "text-gray-400"
          }`}
          title="Wallet & Keys"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
