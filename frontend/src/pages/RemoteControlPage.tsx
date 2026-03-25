import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, ArrowLeft, Power, RefreshCw, MonitorOff, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../stores/useToastStore';
import { serversApi } from '../lib/api';
import type { Server } from '../types';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error';
  text: string;
  timestamp: string;
}

export default function RemoteControlPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    serversApi.getById(id, controller.signal)
      .then(res => setServer(res.data))
      .catch(() => { if (!controller.signal.aborted) toast('error', 'Failed to load server'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

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
    addLine('system', `Connecting to ${server?.hostname || id}...`);
    addLine('system', `Session established. Type "help" for available commands.`);
  };

  const handleDisconnect = () => {
    addLine('system', 'Session terminated.');
    setConnected(false);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    addLine('input', `$ ${cmd}`);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommand('');

    if (cmd === 'cls' || cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'help') {
      addLine('output', 'Available commands:\n  info       - Show server details\n  processes  - List running processes\n  services   - List system services\n  hardware   - Show hardware info\n  network    - Show network info\n  restart    - Restart the server (requires confirmation)\n  shutdown   - Shut down the server (requires confirmation)\n  clear/cls  - Clear terminal\n  help       - Show this message');
      return;
    }

    if (!id) return;

    try {
      if (cmd === 'info') {
        const res = await serversApi.getById(id);
        const s = res.data;
        addLine('output', `Hostname: ${s.hostname}\nIP: ${s.ipAddress}\nOS: ${s.os || 'N/A'}\nStatus: ${s.status}\nUptime: ${s.uptime || 'N/A'}\nLast seen: ${s.lastSeen || 'N/A'}`);
      } else if (cmd === 'processes') {
        const res = await serversApi.getProcesses(id);
        const procs = res.data;
        if (procs.length === 0) {
          addLine('output', 'No process data available.');
        } else {
          const header = 'PID       Name                 CPU%   Memory';
          const rows = procs.slice(0, 20).map(p =>
            `${String(p.pid).padEnd(10)}${(p.name || '').padEnd(21)}${String(p.cpuPercent ?? 0).padEnd(7)}${p.memoryMB ?? 0} MB`
          );
          addLine('output', `${header}\n${rows.join('\n')}${procs.length > 20 ? `\n... and ${procs.length - 20} more` : ''}`);
        }
      } else if (cmd === 'services') {
        const res = await serversApi.getServices(id);
        const svcs = res.data;
        if (svcs.length === 0) {
          addLine('output', 'No service data available.');
        } else {
          const rows = svcs.slice(0, 20).map(s =>
            `${(s.name || '').padEnd(30)} ${(s.status || '').padEnd(12)} ${s.startupType || ''}`
          );
          addLine('output', rows.join('\n'));
        }
      } else if (cmd === 'hardware') {
        const res = await serversApi.getHardware(id);
        const hw = res.data;
        addLine('output', JSON.stringify(hw, null, 2));
      } else if (cmd === 'network') {
        const res = await serversApi.getNetwork(id);
        const net = res.data;
        addLine('output', JSON.stringify(net, null, 2));
      } else if (cmd === 'restart') {
        addLine('system', 'Sending restart command...');
        await serversApi.restart(id);
        addLine('output', 'Restart command sent successfully.');
        toast('success', 'Server restart initiated');
      } else if (cmd === 'shutdown') {
        addLine('system', 'Sending shutdown command...');
        await serversApi.shutdown(id);
        addLine('output', 'Shutdown command sent successfully.');
        toast('success', 'Server shutdown initiated');
      } else {
        addLine('error', `Unknown command: "${cmd}". Type "help" for available commands.`);
      }
    } catch (err: any) {
      addLine('error', `Error: ${err?.response?.data?.message || err.message || 'Command failed'}`);
    }
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

  const handleRemoteAction = async (action: 'restart' | 'shutdown') => {
    if (!id) return;
    setActionLoading(action);
    try {
      if (action === 'restart') {
        await serversApi.restart(id);
        toast('success', 'Server restart initiated');
        addLine('system', 'Restart command sent via button.');
      } else {
        await serversApi.shutdown(id);
        toast('success', 'Server shutdown initiated');
        addLine('system', 'Shutdown command sent via button.');
      }
    } catch (err: any) {
      toast('error', err?.response?.data?.message || `Failed to ${action} server`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        <span className="ml-2 text-sm text-text-secondary">Loading server...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Remote Control</h1>
          <p className="text-xs text-text-secondary">
            {server?.hostname || id} — {server?.ipAddress || 'Unknown IP'}
          </p>
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
          onClick={() => handleRemoteAction('restart')}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-3 py-2 bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-lg text-sm font-medium hover:bg-status-warning/20 disabled:opacity-50 transition-colors"
        >
          {actionLoading === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Restart
        </button>
        <button
          onClick={() => handleRemoteAction('shutdown')}
          disabled={!!actionLoading}
          className="flex items-center gap-2 px-3 py-2 bg-status-critical/10 text-status-critical border border-status-critical/20 rounded-lg text-sm font-medium hover:bg-status-critical/20 disabled:opacity-50 transition-colors"
        >
          {actionLoading === 'shutdown' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
          Shutdown
        </button>
        <button
          onClick={() => setLines([])}
          disabled={!connected}
          className="flex items-center gap-2 px-3 py-2 bg-bg-surface-raised border border-border-default text-text-secondary rounded-lg text-sm font-medium hover:text-text-primary disabled:opacity-40 transition-colors"
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
            {connected ? `session@${server?.hostname || id}` : 'no active session'}
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
