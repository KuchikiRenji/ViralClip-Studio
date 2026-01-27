interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = ({
  enabled,
  onChange,
  label,
  disabled = false,
}: ToggleProps) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-sm text-zinc-400">{label}</span>}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          enabled ? 'bg-blue-600' : 'bg-zinc-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        type="button"
        role="switch"
        aria-checked={enabled ? 'true' : 'false'}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
