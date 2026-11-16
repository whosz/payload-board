import { useState, useEffect } from 'react';
import { Dialog, DialogContent, ModalHeader, ModalFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ACCENT_PRESETS } from '../../lib/accent';
import { artworkUrl } from '../../lib/appArt';
import { pickIconFile } from '../../ipc/profiles';
import { SteamGridPicker } from './SteamGridPicker';
import type { Profile } from '../../types';
import { t } from '../../i18n';

const presetName = (n: string) => ({ Orange: t('Orange'), Cyan: t('Cyan'), Pink: t('Pink'), Amber: t('Amber'), Violet: t('Violet'), Lime: t('Lime') })[n] ?? n;

const EMOJI_LIST = [
  '🚀','🎮','💻','🖥','⚙️','🔧','🎯','📊','🏎','🎲','🎵','🎬','📡','🔌','🖱',
  '⌨️','🖨','📱','💾','🗂','📁','📂','🗃','📋','📝','🔑','🔒','🛠','🧰','⚡',
  '🌐','🔭','🧪','🧬','🤖','🦾','👾','🎃','🔥','💡','🌟','⭐','🏆','🥇','🎖',
  '🚗','✈️','🚂','⛵','🏗','🏭','🏠','🏢','🌍','☁️','❄️','🌊','🌋',
  '🐉','🦅','🦁','🐺','🦊','🐱','🐶','🐧','🦜','🦋','🐝','🌿','🍀','🌴','🌸',
];

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (fields: { name: string; emoji?: string; color_accent?: string; cover_url?: string }) => void;
  initial?: Partial<Pick<Profile, 'name' | 'emoji' | 'color_accent' | 'cover_url'>>;
  onOpenSettings?: () => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--color-text-muted)',
      marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export function ProfileEditor({ open, onClose, onSave, initial, onOpenSettings }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(Boolean(initial?.name));
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [accent, setAccent] = useState(initial?.color_accent ?? '');
  const [cover, setCover] = useState(initial?.cover_url ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsEditing(Boolean(initial?.name));
    setName(initial?.name ?? '');
    setEmoji(initial?.emoji ?? '');
    setAccent(initial?.color_accent ?? '');
    setCover(initial?.cover_url ?? '');
  }, [open]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        emoji: emoji || undefined,
        color_accent: accent || undefined,
        cover_url: cover || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <ModalHeader title={isEditing ? t('Edit profile') : t('New profile')} />

        {/* Name */}
        <div>
          <FieldLabel>{t('Name')}</FieldLabel>
          <Input
            placeholder={t('Profile name')}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        {/* Accent colour */}
        <div>
          <FieldLabel>{t('Accent colour')}</FieldLabel>
          <div className="flex items-center flex-wrap" style={{ gap: 8 }} role="group" aria-label={t('Accent colour')}>
            <button
              onClick={() => setAccent('')}
              aria-label={t('Default accent')}
              aria-pressed={!accent}
              title={t('Default')}
              style={{
                width: 32, height: 32, borderRadius: 2, cursor: 'pointer', background: 'var(--color-bg-elevated)',
                border: `2px solid ${!accent ? 'var(--color-text-primary)' : 'var(--color-border-control)'}`,
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              }}
            >
              A
            </button>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.color}
                onClick={() => setAccent(p.color)}
                aria-label={presetName(p.name)}
                aria-pressed={accent === p.color}
                title={presetName(p.name)}
                style={{
                  width: 32, height: 32, borderRadius: 2, cursor: 'pointer', background: p.color,
                  border: `2px solid ${accent === p.color ? 'var(--color-text-primary)' : 'transparent'}`,
                  outlineOffset: -4,
                  boxShadow: accent === p.color ? 'inset 0 0 0 2px var(--color-bg-surface)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Cover image */}
        <div>
          <FieldLabel>{t('Cover image')}</FieldLabel>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div style={{
              width: 96, height: 54, flexShrink: 0, border: '1px solid var(--color-border-control)', borderRadius: 2,
              background: cover ? `center / cover no-repeat url("${artworkUrl(cover)}")` : 'var(--color-bg-base)',
              display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)',
            }} role="img" aria-label={cover ? t('Cover preview') : t('No cover')}>
              {cover ? null : t('none')}
            </div>
            <Button variant="default" size="sm" onClick={() => setPickerOpen(true)}>{t('SteamGridDB…')}</Button>
            <Button variant="default" size="sm" onClick={async () => { try { setCover(await pickIconFile()); } catch { /* cancelled */ } }}>{t('Local image…')}</Button>
            {cover && <Button variant="ghost" size="sm" onClick={() => setCover('')}>{t('Clear')}</Button>}
          </div>
        </div>

        {/* Icon (emoji) */}
        <div>
          <FieldLabel>{t('Icon')}</FieldLabel>
          <div className="flex items-end gap-2 mb-2">
            {/* Selected emoji display */}
            <div style={{
              width: 40,
              height: 32,
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              {emoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-body)' }}>—</span>}
            </div>
            {emoji && (
              <Button variant="ghost" size="sm" onClick={() => setEmoji('')}>
                {t('Clear')}
              </Button>
            )}
          </div>
          {/* Emoji grid */}
          <div
            className="flex flex-wrap gap-0.5 p-2"
            style={{
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 2,
              maxHeight: 98,
              overflowY: 'auto',
            }}
          >
            {EMOJI_LIST.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  background: emoji === e ? 'var(--color-bg-elevated)' : 'none',
                  border: emoji === e ? '1px solid var(--color-accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '2px 4px',
                  lineHeight: 1.4,
                  borderRadius: 4,
                  transition: 'background 0.1s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <ModalFooter>
          <Button variant="ghost" size="default" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button variant="fill" size="default" onClick={handleSave} disabled={!name.trim()}>
            {t('Save')}
          </Button>
        </ModalFooter>
      </DialogContent>
      <SteamGridPicker open={pickerOpen} onClose={() => setPickerOpen(false)} initialQuery={name} onSelect={url => { setCover(url); setPickerOpen(false); }} onOpenSettings={onOpenSettings} />
    </Dialog>
  );
}
