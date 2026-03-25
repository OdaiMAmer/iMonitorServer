import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, ArrowLeft, Power, MonitorOff, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error';
  text: string;
  timestamp: string;
}

const mockResponses: Record<string, string> = {
  'hostname': 'PROD-WEB-01',
  'whoami': 'administrator',
  'date': new Date().toString(),
  'ipconfig': 'IPv4 Address: 192.168.1.100\nSubnet Mask: 255.255.255.0\nDefault Gateway: 192.168.1.1',
  'systeminfo': 'OS Name: Microsoft Windows Server 2022\nOS Version: 10.0.20348\nSystem Type: x64-based PC\nTotal Physical Memory: 32,768 MB\nAvailable Physical Memory: 18,432 MB',
  'tasklist': 'Image Name          PID   Mem Usage\n============  ======  =========\nSystem            4     0 K\ncsrss.exe       624   5,120 K\nsvchost.exe     892  28,672 K\nw3wp.exe       4521  256,000 K\nsqlservr.exe   3892  1,024,000 K',
  'dir': 'Volume in drive C has no label.\n Directory of C:\\\n\n03/15/2026  Program Files\n03/15/2026  Program Files (x86)\n03/20/2026  Users\n03/25/2026  Windows\n03/25/2026  inetpub',
  'cls': '',
  'help': 'Available commands: hostname, whoami, date, ipconfig, systeminfo, tasklist, dir, cls, help',
};

export default function RemoteControlPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text, timestamp: new Date().toISOString() }]);
  };

  const handleConnect = () => {
    setConnected(true);
    setLines([]);
    addLine('system', `Connecting to server ${id}...`);
    setTimeout(() => {
      addLine('system', 'Connection established. Type "help" for available commands.');
      addLine('system', '---');
      inputRef.current?.focus();
    }, 500);
  };

  const handleDisconnect = () => {
    addLine('system', 'Session terminated.');
    setConnected(false);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    addLine('input', `$ ${cmd}`);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd === 'cls' || cmd === 'clear') {
      setLines([]);
    } else {
      const response = mockResponses[cmd.toLowerCase()];
      if (response !== undefined) {
        if (response) addLine('output', response);
      } else {
        addLine('error', `'${cmd}' is not recognized. Type "help" for available commands.`);
      }
    }

    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/servers/${id}`)}
          className="p-2 rounded-lg hover:bg-bg-surface-raised transition-colors text-text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Remote Control</h1>
          <p className="text-sm text-text-secondary mt-0.5">Server {id} - Remote Terminal Session</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!connected ? (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 bg-status-healthy/20 text-status-healthy border border-status-healthy/30 rounded-lg text-sm font-medium hover:bg-status-healthy/30 transition-colors"
          >
            <Power className="w-4 h-4" />
            Connect
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-4 py-2 bg-status-critical/20 text-status-critical border border-status-critical/30 rounded-lg text-sm font-medium hover:bg-status-critical/30 transition-colors"
          >
            <MonitorOff className="w-4 h-4" />
            Disconnect
          </button>
        )}
        <button
          onClick={() => setLines([])}
          disabled={!connected}
          className="flex items-center gap-2 px-4 py-2 bg-bg-surface-raised border border-border-default text-text-secondary rounded-lg text-sm font-medium hover:text-text-primary disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            connected ? 'bg-status-healthy animate-pulse' : 'bg-text-tertiary',
          )} />
          <span className="text-xs text-text-tertiary">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-default bg-bg-surface/50">
          <Terminal className="w-4 h-4 text-text-tertiary" />
          <span className="text-xs font-medium text-text-secondary">Terminal</span>
          <span className="text-xs text-text-tertiary ml-auto font-mono">
            {connected ? `session@server-${id}` : 'no active session'}
          </span>
        </div>

        <div
          ref={terminalRef}
          onClick={() => inputRef.current?.focus()}
          className="bg-[#0a0e17] font-mono text-sm p-4 min-h-[400px] max-h-[600px] overflow-y-auto cursor-text"
        >
          {!connected && lines.length === 0 && (
            <p className="text-text-tertiary">Click "Connect" to start a remote session...</p>
          )}
          {lines.map((line, i) => (
            <div key={i} className={cn(
              'leading-6 whitespace-pre-wrap',
              line.type === 'input' && 'text-primary',
              line.type === 'output' && 'text-[#a8d8a8]',
              line.type === 'system' && 'text-text-tertiary italic',
              line.type === 'error' && 'text-status-critical',
            )}>
              {line.text}
            </div>
          ))}
          {connected && (
            <form onSubmit={handleCommand} className="flex items-center mt-1">
              <span className="text-primary mr-2">$</span>
              <input
                ref={inputRef}
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 bg-transparent text-[#a8d8a8] outline-none caret-primary"
                spellCheck={false}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
