import { useState, useEffect } from "react";
import './App.css';
import vanillaPlus from "./assets/vanillaPlus.jpg"; // Renamed from mmoPlus.jpg

function App() {
  const [gm, setGm] = useState(false);

  const [publicKey, setPublicKey] = useState('');
  const [PublicKeyData, setPublicKeyData] = useState("");
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyData, setPrivateKeyData] = useState();

  const [inputWallet, setInputWallet] = useState('');
  const [wallet, setWallet] = useState("");

  const [inputVanillaPlusAccount, setInputVanillaPlusAccount] = useState(""); // Renamed from inputMmoPlusAccount
  const [vanillaPlusAccount, setVanillaPlusAccount] = useState(""); // Renamed from mmoPlusAccount
  const [vanillaCache, setVanillaCache] = useState();







  useEffect(() => {
    getVanillaPlusPath();
    fetchWallet();
    fetchKeys();
    getSavedVanillaPlusAccount();
    getVersion();
    getVanillaCacheCount();
    try {
      const cleanup = window.electron.onMainProcessLog((type, args) => {
        if (type === 'log') {
          console.log('[Main Process]', ...args); // Shows in DevTools
        } else if (type === 'error') {
          console.error('[Main Process]', ...args); // Shows in DevTools
        }
      });
      console.log('Renderer: App initialized'); // Shows in DevTools
      return cleanup;
    } catch (err) {
      console.error('Renderer: Failed to set up log listener:', err);
    }
  },
   []);

  const fetchWallet = async () => {
    const savedWallet = await window.electron.getWallet();
    setWallet(savedWallet.wallet);
  };
  const saveWallet = async () => {
    const result = await window.electron.saveWallet({ wallet: inputWallet });
    fetchWallet();
  };
  const fetchKeys = async () => {
    const savedKeys = await window.electron.getKeys();
    setPublicKeyData(savedKeys.publicKey);
    setPrivateKeyData(savedKeys.privateKey);
  };
  const saveKeys = async () => {
    const keysData = {
      publicKey,
      privateKey,
    };
    const result = await window.electron.saveKeys(keysData);
    fetchKeys();
  };

  const saveVanillaPlusAccount = async () => { // Renamed from saveMmoPlusAccount
    const result = await window.electron.saveVanillaPlusAccount({ account: inputVanillaPlusAccount });
    getSavedVanillaPlusAccount();
  };
  const getSavedVanillaPlusAccount = async () => { // Renamed from getSavedMmoPlusAccount
    const account = await window.electron.getVanillaPlusAccount();
    setVanillaPlusAccount(account.account);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const addItem = (item) => {
    setSelectedItems((prev) => {
      if (!prev.some((selected) => selected.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });
    setIsOpen(false);
  };
  const removeItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };
  const findExe = (itemId) => {
    if (itemId === 1) {
      selectVanillaPlusPath(); // Renamed from selectMmoPlusPath
    }
  };


  const playGame = (itemId) => {
    if (itemId === 1) {
      playVanillaPlus(); // Renamed from playMmoPlus
    }
  };

  const [vanillaPlusPath, setVanillaPlusPath] = useState(""); // Renamed from mmoPlusPath
  const getVanillaPlusPath = async () => { // Renamed from getMmoPlusPath
    const name = await window.electron.getVanillaPlusPath();
    setVanillaPlusPath(name);
  };
  const selectVanillaPlusPath = async () => { // Renamed from selectMmoPlusPath
    const path = await window.electron.selectVanillaPlusPath();
    if (path) setVanillaPlusPath(path);
  };
  
  const playVanillaPlus = async () => { // Renamed from playMmoPlus
    await window.electron.playVanillaPlus();
  };

  const showPublic = () => {
    alert(PublicKeyData);
  };
  const showPrivate = () => {
    alert(privateKeyData); // Fixed to show privateKeyData instead of PublicKeyData
  };
  const showWallet = () => {
    alert(wallet);
  };

  const data = [
    { "id": 1, "name": "Vanilla-Plus", "img": vanillaPlus, "path": vanillaPlusPath, "cacheCount": vanillaCache, "addon": "https://www.curseforge.com/wow/addons/vanilla-plus", "fileCount": "countOfFile", "gameExe": "WowClassic.exe", "account": vanillaPlusAccount }, // Renamed MMOPLUS to VanillaPlus
  ];





  const exportFile = async (itemId) => {
    if(itemId == 1){
      const exported = await window.electron.exportVanillaPlusFiles();
      if(exported){
        console.log("exported", exported);
      }
    }

  };



  const [version, setVersion] = useState();

  const getVersion = async () => { // Renamed from playMmoPlus
    const version = await window.electron.getVersion();
    setVersion(version);
  };
  const getVanillaCacheCount = async () => { // Renamed from playMmoPlus
    const cacheVanilla = await window.electron.getVanillaCacheCount();
    console.log(cacheVanilla);
    setVanillaCache(cacheVanilla);
  };

  
  // const testPing = async () => { // Renamed from playMmoPlus
  //   const ping = await window.electron.testPing();
  // };




const [exeHelp, setExeHelp] = useState(false);
const [accountHelp, setAccountHelp] = useState(false);




  return (
    <>
      {gm && 
        <div className=''>
          <div className='flex flex-row justify-between'>
            <div>
              <div>
                <div>
                  publicKey: <button onClick={()=>{showPublic()}}>show publickey</button>
                </div>
                <input
                  type="text"
                  value={publicKey}
                  label="typo da public key"
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Type something..."
                />   
              </div>
              <div>
                <div>
                  privateKey: <button onClick={()=>{showPrivate()}}>show privatekey</button>
                </div>
                <input
                  type="text"
                  value={privateKey}
                  label="typo da private key"
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Type something..."
                />   
              </div>
              <button onClick={()=>saveKeys()}>Save</button>
            </div>
            <div>
              <div>
                Wallet: <button onClick={()=>{showWallet()}}>show wallet</button>
              </div>
              <input
                type="text"
                value={inputWallet}
                label="typo da wallet"
                onChange={(e) => setInputWallet(e.target.value)}
                placeholder="Type something..."
              />   
              <button onClick={()=>saveWallet()}>Save</button>
            </div>
          </div>

          <div>
            <div>
              <button
                onClick={toggleMenu}
                className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
              >
                Open Menu
              </button>     
            </div>

            {isOpen && (
              <ul className="mt-2 border rounded-md shadow-md bg-white p-2 text-black">
                {data.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-5 w-[600px] border rounded-md p-2">
              {selectedItems.map((item) => (
                <li key={item.id} className="px-4 py-2 border-b ">
                  <p className="text-xl font-bold mb-4">
                    {item.name}
                  </p>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <img src={item.img} alt="pic" className='w-auto h-auto max-w-[140px] max-h-[140px] rounded-md object-contain mx-auto'/>
                      <button onClick={() => removeItem(item.id)} className="w-full">
                        Remove
                      </button>
                    </div>

                    <div className='flex flex-col'>
                      <div className='flex items-center'>
                        <p className="font-bold text-lg">
                          Addon:
                        </p>
                        <span>
                          {item.addon}
                        </span>
                      </div>
                      <div className="text-left w-60">
                        <button onClick={()=>findExe(item.id)}>locate .exe file</button><button onClick={()=>setExeHelp(!exeHelp)}>?</button>
                        {exeHelp && <p className="m-5 italic">inside _classic_era_, click on {item.gameExe} </p>}
                        <span className="w-full break-words block">{item.path}</span>
                      </div>
                      <div>
                        
                        <div className="flex">
                          <button onClick={()=>saveVanillaPlusAccount(vanillaPlusAccount)}>save</button>
                          <input
                            type="text"
                            onChange={(e) => setInputVanillaPlusAccount(e.target.value)}
                            placeholder="Account Number"
                          />  
                        </div>
                          <div className="flex items-center">
                            <button onClick={()=>setAccountHelp(!accountHelp)} className="">?</button><span >Account: {item.account}</span>
                          </div>
                          {accountHelp && <p className="italic">input account# you're logging in, _classic_era_~WTF~Account</p>}

                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-4">
                    <button onClick={()=>exportFile(item.id)} className="w-30 text-xs">export cache</button>
                    <div>
                      {item.cacheCount}
                    </div>
                  </div>
                  <button onClick={()=>playGame(item.id)} className="w-full my-3">play</button>
                </li>
              ))}
            </ul>
          </div>
          {version && <p>release number: {version}</p> }
          <p>www.guildbank.biz</p>
        </div>
      }

      {!gm &&
        <div className=''>
          <div>
            gm fren,
          </div>
          <div>
            say it back,
          </div>
          <div>
            <button onClick={()=>setGm(true)}>gm.</button>
          </div>
        </div>
      }
    </>
  );
}

export default App;