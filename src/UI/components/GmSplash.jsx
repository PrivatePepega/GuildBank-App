import logo from "../assets/guildbanklogo white-01.png";
import { btn } from "../constants/styles";

export default function GmSplash({ onConfirm }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <img src={logo} alt="logo" className="w-48 h-48 object-contain" />
      <p className="text-gray-400 text-lg">gm fren,</p>
      <p className="text-gray-400">say it back,</p>
      <button onClick={onConfirm} className={btn + " px-8 py-3 text-base"}>
        gm.
      </button>
    </div>
  );
}
