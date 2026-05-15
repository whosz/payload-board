import { useState } from 'react';
import { AppTile } from './dashboard/AppTile';
import { AppListRow } from './dashboard/AppListRow';
import { StatusBar } from './dashboard/StatusBar';
import { ProfileList } from './sidebar/ProfileList';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Icon } from './icons/Icon';
import {
  faPlay, faStop, faRotateRight, faFolderOpen, faSliders, faTrash,
  faPen, faPlus, faPowerOff, faGear, faTriangleExclamation, faXmark,
  faCircleRegular, faCircleSolid, faEllipsisVertical, faSun, faMoon,
  faList, faTableCellsLarge,
} from './icons';
import type { AppEntry } from '../types';
import type { ProcessInfo } from '../hooks/useProcessStatus';

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div
        className="font-mono uppercase tracking-widest text-xs mb-6 pb-2"
        style={{
          color: 'var(--color-text-muted)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {label && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace' }}>
          {label}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

// ── Color swatch ─────────────────────────────────────────────────────────────

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-1" style={{ width: 88 }}>
      <div
        style={{
          height: 36,
          background: value,
          border: '1px solid var(--color-border-subtle)',
        }}
      />
      <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
        {name}
        <br />
        <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
      </div>
    </div>
  );
}

// ── Icon row ─────────────────────────────────────────────────────────────────

const ALL_ICONS = [
  { name: 'faPlay', icon: faPlay },
  { name: 'faStop', icon: faStop },
  { name: 'faRotateRight', icon: faRotateRight },
  { name: 'faFolderOpen', icon: faFolderOpen },
  { name: 'faSliders', icon: faSliders },
  { name: 'faTrash', icon: faTrash },
  { name: 'faPen', icon: faPen },
  { name: 'faPlus', icon: faPlus },
  { name: 'faPowerOff', icon: faPowerOff },
  { name: 'faGear', icon: faGear },
  { name: 'faTriangleExclamation', icon: faTriangleExclamation },
  { name: 'faXmark', icon: faXmark },
  { name: 'faCircleRegular', icon: faCircleRegular },
  { name: 'faCircleSolid', icon: faCircleSolid },
  { name: 'faEllipsisVertical', icon: faEllipsisVertical },
  { name: 'faSun', icon: faSun },
  { name: 'faMoon', icon: faMoon },
  { name: 'faList', icon: faList },
  { name: 'faTableCellsLarge', icon: faTableCellsLarge },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const noop = () => {};

const mockAppBase: Omit<AppEntry, 'id' | 'order'> = {
  name: 'SimHub',
  executable_path: 'C:\\SimHub\\SimHubWPF.exe',
  args: [],
  launch_delay_ms: 0,
  wait_strategy: 'fire_and_forget',
  enabled: true,
};

const mockAppWithDelay: AppEntry = {
  id: 'a2', order: 1,
  name: 'Fanatec Control Panel',
  executable_path: 'C:\\Program Files\\Fanatec\\FanatecCP.exe',
  args: [],
  launch_delay_ms: 1500,
  wait_strategy: 'fire_and_forget',
  enabled: true,
};

const mockAppLong: AppEntry = {
  id: 'a3', order: 2,
  name: 'iRacing',
  executable_path: 'C:\\Users\\Matt\\Documents\\iRacing\\iRacingSim64DX11.exe',
  args: [],
  launch_delay_ms: 0,
  wait_strategy: 'fire_and_forget',
  enabled: true,
};

const mockApps: AppEntry[] = [
  { id: 'a1', order: 0, ...mockAppBase },
  mockAppWithDelay,
  mockAppLong,
];

const stoppedStatus: ProcessInfo = { entry_id: 'x', pid: null, status: 'stopped' };
const runningStatus: ProcessInfo = { entry_id: 'x', pid: 1234, status: 'running' };
const crashedStatus: ProcessInfo = { entry_id: 'x', pid: null, status: 'crashed', error_message: 'Process exited with code 1' };

const mockProfiles = [
  { id: 'p1', name: 'Race Day', emoji: '🏎️', apps: mockApps, created_at: '', updated_at: '' },
  { id: 'p2', name: 'Practice', emoji: '🔧', apps: [], created_at: '', updated_at: '' },
  { id: 'p3', name: 'Replay Session', apps: [], created_at: '', updated_at: '' },
];

const mockStatuses: Record<string, ProcessInfo> = {
  a1: runningStatus,
  a2: stoppedStatus,
  a3: crashedStatus,
};

// ── StatusLed (inline, not exported from AppTile) ─────────────────────────────

function StatusLed({ status }: { status: ProcessInfo['status'] }) {
  if (status === 'running') return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: 'var(--color-status-live)', boxShadow: '0 0 8px var(--color-status-live)',
    }} />
  );
  if (status === 'crashed') return (
    <span style={{ animation: 'pulse-crit 1s infinite', lineHeight: 0 }}>
      <Icon icon={faTriangleExclamation} size={12} crit />
    </span>
  );
  return <Icon icon={faCircleRegular} size={8} />;
}

// ── Keyboard shortcut badge ───────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'monospace',
      fontSize: 11,
      padding: '2px 6px',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-secondary)',
    }}>
      {children}
    </span>
  );
}

// ── Delay badge ──────────────────────────────────────────────────────────────

function DelayBadge({ ms }: { ms: number }) {
  return (
    <span className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
      +{ms}ms
    </span>
  );
}

// ── Section label (from SettingsPanel) ───────────────────────────────────────

function SectionLabel({ children, crit }: { children: React.ReactNode; crit?: boolean }) {
  return (
    <div
      className="font-mono uppercase tracking-widest text-xs pb-2 mb-3"
      style={{
        color: crit ? 'var(--color-status-crit)' : 'var(--color-text-muted)',
        borderBottom: `1px solid ${crit ? 'var(--color-status-crit)' : 'var(--color-border-subtle)'}`,
        opacity: crit ? 0.8 : 1,
      }}
    >
      {children}
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DesignReference() {
  const [switchOn, setSwitchOn] = useState(false);
  const [inputVal, setInputVal] = useState('');

  return (
    <div
      style={{
        background: 'var(--color-bg-base)',
        minHeight: '100vh',
        padding: '40px 48px',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Page header */}
      <div className="mb-12">
        <div
          className="font-mono uppercase tracking-widest text-xs mb-2"
          style={{ color: 'var(--color-accent-laser)' }}
        >
          Payload Board
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Design Reference
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}>
          All UI components at a glance — screenshot for redesign
        </div>
      </div>

      {/* ── COLORS ── */}
      <Section title="Color Tokens">
        <Row label="Backgrounds">
          <Swatch name="bg-base" value="#0A0A0B" />
          <Swatch name="bg-surface" value="#111113" />
          <Swatch name="bg-elevated" value="#161618" />
          <Swatch name="bg-hover" value="#1C1C1F" />
        </Row>
        <Row label="Borders">
          <Swatch name="border-subtle" value="#1F1F22" />
          <Swatch name="border-default" value="#2A2A2F" />
          <Swatch name="border-strong" value="#3A3A40" />
        </Row>
        <Row label="Text">
          <Swatch name="text-primary" value="#E8E8EA" />
          <Swatch name="text-secondary" value="#8A8A90" />
          <Swatch name="text-muted" value="#54545A" />
          <Swatch name="text-disabled" value="#38383C" />
        </Row>
        <Row label="Accents & Status">
          <Swatch name="accent-laser" value="#FFE600" />
          <Swatch name="accent-data" value="#FFFFFF" />
          <Swatch name="status-live" value="#00E5FF" />
          <Swatch name="status-warn" value="#FF7A00" />
          <Swatch name="status-crit" value="#FF2D55" />
          <Swatch name="status-info" value="#B864FF" />
        </Row>
      </Section>

      {/* ── TYPOGRAPHY ── */}
      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
              heading / app names — 15px medium
            </div>
            <span className="font-medium" style={{ fontSize: 15 }}>SimHub · iRacing · Fanatec Control Panel</span>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
              body / secondary — 14px
            </div>
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Race Day · Practice Session · Replay</span>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
              mono / paths — 11px
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              C:\Program Files\SimHub\SimHubWPF.exe
            </span>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
              section labels — 11px mono uppercase
            </div>
            <span className="font-mono uppercase tracking-widest" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Profiles · Storage · Appearance · Danger Zone
            </span>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
              status bar — 12px mono
            </div>
            <span className="font-mono" style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
              TOTAL <span style={{ color: 'var(--color-text-secondary)' }}>3</span>
              {'  '}ALIVE <span style={{ color: 'var(--color-status-live)' }}>2</span>
              {'  '}CRASHED <span style={{ color: 'var(--color-status-crit)' }}>1</span>
            </span>
          </div>
        </div>
      </Section>

      {/* ── ICONS ── */}
      <Section title="Icons">
        <Row label="Default (muted #54545A)">
          {ALL_ICONS.map(({ name, icon }) => (
            <div key={name} className="flex flex-col items-center gap-1" style={{ width: 52 }}>
              <Icon icon={icon} size={16} />
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'var(--color-text-disabled)', textAlign: 'center' }}>
                {name.replace('fa', '')}
              </span>
            </div>
          ))}
        </Row>
        <Row label="States: active (yellow) · crit (red) · live (cyan)">
          {[faPlay, faStop, faGear, faTriangleExclamation, faCircleSolid].map((icon, i) => (
            <Icon key={i} icon={icon} size={16} active />
          ))}
          <span style={{ width: 16 }} />
          {[faPlay, faStop, faGear, faTriangleExclamation, faCircleSolid].map((icon, i) => (
            <Icon key={i} icon={icon} size={16} crit />
          ))}
          <span style={{ width: 16 }} />
          {[faPlay, faStop, faGear, faTriangleExclamation, faCircleSolid].map((icon, i) => (
            <Icon key={i} icon={icon} size={16} live />
          ))}
        </Row>
        <Row label="Sizes: 8 · 10 · 12 · 14 · 16 · 20 · 24">
          {[8, 10, 12, 14, 16, 20, 24].map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <Icon icon={faGear} size={s} />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-disabled)' }}>{s}</span>
            </div>
          ))}
        </Row>
      </Section>

      {/* ── BUTTONS ── */}
      <Section title="Buttons">
        <Row label="Variants — default size">
          <Button variant="cta">CTA</Button>
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="fill">Fill</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="nav">Nav</Button>
        </Row>
        <Row label="Sizes — outline variant">
          <Button variant="outline" size="lg">Large</Button>
          <Button variant="outline" size="default">Default</Button>
          <Button variant="outline" size="sm">Small</Button>
          <Button variant="outline" size="icon"><Icon icon={faGear} size={14} /></Button>
          <Button variant="outline" size="icon"><Icon icon={faGear} size={12} /></Button>
          <Button variant="outline" size="sm"><Icon icon={faGear} size={10} /></Button>
        </Row>
        <Row label="States — outline">
          <Button variant="outline">Normal</Button>
          <Button variant="outline" disabled>Disabled</Button>
        </Row>
        <Row label="Special usage">
          <Button variant="cta" size="sm" className="font-mono uppercase tracking-wider">
            Launch All
          </Button>
          <Button variant="destructive" size="sm" className="font-mono uppercase tracking-wider">
            Reset all data
          </Button>
          <Button variant="outline" size="sm" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}>
            Browse
          </Button>
          <Button variant="outline" size="sm" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}>
            Installed...
          </Button>
          <Button variant="outline" size="sm" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}>
            SteamGridDB...
          </Button>
          <Button variant="ghost" size="sm" style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
            Cancel
          </Button>
        </Row>
      </Section>

      {/* ── FORM CONTROLS ── */}
      <Section title="Form Controls">
        <Row label="Input — normal, placeholder, disabled">
          <div style={{ width: 220 }}>
            <Input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="App name"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div style={{ width: 220 }}>
            <Input
              value=""
              readOnly
              placeholder="/path/to/executable"
              className="font-mono text-xs"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div style={{ width: 220 }}>
            <Input
              disabled
              value="Disabled field"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </Row>
        <Row label="Input — password / API key">
          <div style={{ width: 220 }}>
            <Input
              type="password"
              placeholder="Paste API key..."
              style={{
                background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: 12,
              }}
            />
          </div>
        </Row>
        <Row label="Switch — off / on">
          <Switch checked={false} onCheckedChange={noop} />
          <Switch checked={true} onCheckedChange={noop} />
          
          
        </Row>
        <Row label="Number input (delay)">
          <div style={{ width: 140 }}>
            <Input
              type="number"
              defaultValue={1500}
              min={0}
              step={500}
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </Row>
      </Section>

      {/* ── STATUS INDICATORS ── */}
      <Section title="Status Indicators">
        <Row label="Status LED — stopped · running · crashed">
          <div className="flex items-center gap-2">
            <StatusLed status="stopped" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusLed status="running" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>running</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusLed status="crashed" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>crashed</span>
          </div>
        </Row>
        <Row label="Delay badge">
          <DelayBadge ms={500} />
          <DelayBadge ms={1500} />
          <DelayBadge ms={3000} />
        </Row>
        <Row label="Error message line (crashed tile)">
          <span className="font-mono" style={{ color: 'var(--color-status-crit)', fontSize: 10 }}>
            Process exited with code 1
          </span>
        </Row>
        <Row label="Keyboard shortcut badge">
          <Kbd>Ctrl</Kbd>
          <Kbd>S</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Esc</Kbd>
        </Row>
      </Section>

      {/* ── APP TILES ── */}
      <Section title="App Tiles">
        <Row label="Stopped · Running · Crashed">
          <AppTile
            app={{ id: 'a1', order: 0, ...mockAppBase }}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppTile
            app={{ id: 'a2', order: 1, ...mockAppBase, name: 'SimHub (running)' }}
            status={runningStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppTile
            app={{ id: 'a3', order: 2, ...mockAppBase, name: 'SimHub (crashed)' }}
            status={crashedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
        </Row>
        <Row label="With launch delay · Long path">
          <AppTile
            app={mockAppWithDelay}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppTile
            app={mockAppLong}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
        </Row>
      </Section>

      {/* ── APP LIST ROWS ── */}
      <Section title="App List Rows (List View)">
        <div style={{ border: '1px solid var(--color-border-default)', width: 640 }}>
          <AppListRow
            app={{ id: 'a1', order: 0, ...mockAppBase }}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppListRow
            app={{ id: 'a2', order: 1, ...mockAppBase, name: 'SimHub (running)' }}
            status={runningStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppListRow
            app={{ id: 'a3', order: 2, ...mockAppBase, name: 'SimHub (crashed)' }}
            status={crashedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppListRow
            app={mockAppWithDelay}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
          <AppListRow
            app={mockAppLong}
            status={stoppedStatus}
            onStart={noop} onStop={noop} onRestart={noop} onOpenPath={noop}
            onEdit={noop} onRemove={noop}
          />
        </div>
      </Section>

      {/* ── SIDEBAR / PROFILE LIST ── */}
      <Section title="Sidebar — Profile List">
        <div style={{ width: 220, height: 320, border: '1px solid var(--color-border-default)', overflow: 'hidden' }}>
          <ProfileList
            profiles={mockProfiles}
            activeProfileId="p1"
            onSelect={noop}
            onNew={noop}
            onEdit={noop}
            onDelete={noop}
            onSettings={noop}
            onCollapse={noop}
          />
        </div>
      </Section>

      {/* ── STATUS BAR ── */}
      <Section title="Status Bar">
        <div style={{ width: 600, border: '1px solid var(--color-border-default)' }}>
          <StatusBar
            profile={{ id: 'p1', name: 'Race Day', emoji: '🏎️', apps: mockApps, created_at: '', updated_at: '' }}
            statuses={mockStatuses}
          />
        </div>
      </Section>

      {/* ── SETTINGS PANEL INTERNALS ── */}
      <Section title="Settings — Section Labels & Rows">
        <div style={{ maxWidth: 400 }}>
          <SectionLabel>Appearance</SectionLabel>
          <SettingsRow label="Light mode">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
          </SettingsRow>
          <div style={{ marginTop: 24 }} />
          <SectionLabel>Storage</SectionLabel>
          <div
            className="font-mono text-xs break-all mb-3"
            style={{
              color: 'var(--color-text-muted)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              padding: '8px 10px',
              lineHeight: 1.5,
            }}
          >
            C:\Users\Matt\AppData\Roaming\com.payload-board\profiles
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}>
              Change directory...
            </Button>
            <Button variant="ghost" size="sm" style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              Reset to default
            </Button>
          </div>
          <div style={{ marginTop: 24 }} />
          <SectionLabel crit>Danger Zone</SectionLabel>
          <div
            className="flex flex-col gap-3 p-3"
            style={{ border: '1px solid var(--color-status-crit)', background: 'var(--color-bg-surface)' }}
          >
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              This will permanently delete all profiles and apps. Are you sure?
            </span>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="font-mono uppercase tracking-wider">
                Yes, delete everything
              </Button>
              <Button variant="ghost" size="sm" style={{ color: 'var(--color-text-muted)' }}>
                Cancel
              </Button>
            </div>
          </div>
          <div style={{ marginTop: 24 }} />
          <SectionLabel>About</SectionLabel>
          <div className="flex flex-col gap-1" style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
              Payload Board v0.4.0
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              Made by Matt · github.com/whosz/payload-board
            </span>
          </div>
        </div>
      </Section>

      {/* ── SORT CONTROLS ── */}
      <Section title="Sort Controls + View Toggle (Dashboard Toolbar)">
        <Row label="Sort: A→Z active · Z→A inactive — View: grid active · list inactive">
          <button className="sort-btn sort-btn-active">A→Z</button>
          <button className="sort-btn">Z→A</button>
          <div style={{ flex: 1, minWidth: 24 }} />
          <button className="sort-btn sort-btn-active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px' }}>
            <Icon icon={faTableCellsLarge} size={11} active />
          </button>
          <button className="sort-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px' }}>
            <Icon icon={faList} size={11} />
          </button>
        </Row>
        <Row label="List view active">
          <button className="sort-btn">A→Z</button>
          <button className="sort-btn">Z→A</button>
          <div style={{ flex: 1, minWidth: 24 }} />
          <button className="sort-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px' }}>
            <Icon icon={faTableCellsLarge} size={11} />
          </button>
          <button className="sort-btn sort-btn-active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px' }}>
            <Icon icon={faList} size={11} active />
          </button>
        </Row>
      </Section>

      {/* ── MAIN LAYOUT CHROME ── */}
      <Section title="Layout Chrome">
        <div
          style={{
            width: 600,
            height: 44,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
          }}
        >
          <span
            className="font-mono uppercase tracking-widest text-xs"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
          >
            PAYLOAD BOARD
          </span>
          <div style={{ flex: 1 }} />
          <Button variant="outline" size="sm" className="btn-header font-mono uppercase tracking-wider"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 11 }}>
            Launch All
          </Button>
          <Button variant="outline" size="sm" className="btn-header font-mono uppercase tracking-wider"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 11 }}>
            Stop All
          </Button>
          <Button variant="outline" size="icon" className="btn-header-icon"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-muted)' }}>
            <Icon icon={faGear} size={13} />
          </Button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
            Resizable panel handle (4px wide)
          </div>
          <div style={{ width: 4, height: 60, background: 'var(--color-border-default)' }} />
        </div>
      </Section>

    </div>
  );
}
