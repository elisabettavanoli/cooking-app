import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import styles from "./ui.module.css";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive" | "secondary";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
  style,
  small,
  type = "button",
}: {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
  small?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled}
      style={style}
      className={[styles.btn, small ? styles.btnSmall : "", styles[variant]].join(" ")}
    >
      {icon}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  multiline,
  inputMode,
  autoCapitalize,
  type = "text",
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "search";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  type?: "text" | "password";
  style?: CSSProperties;
}) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className={styles.field} style={style}>
      {label ? <label className={styles.label}>{label}</label> : null}
      {multiline ? (
        <textarea
          className={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChangeText(e.currentTarget.value)}
          onBlur={onBlur}
          rows={3}
        />
      ) : isPassword ? (
        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type={inputType}
            value={value}
            placeholder={placeholder}
            inputMode={inputMode}
            autoCapitalize={autoCapitalize}
            autoComplete="current-password"
            onChange={(e) => onChangeText(e.currentTarget.value)}
            onBlur={onBlur}
          />
          <button
            type="button"
            className={styles.revealBtn}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? t("common.hidePassword") : t("common.showPassword")}
            aria-pressed={revealed}
            tabIndex={-1}
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : (
        <input
          className={styles.input}
          type={inputType}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          onChange={(e) => onChangeText(e.currentTarget.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={[
            "resetButton",
            styles.segmentedItem,
            o.value === value ? styles.segmentedItemActive : "",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Horizontally scrolling row of selectable chips. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.chipRow}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={[
            "resetButton",
            styles.chip,
            o.value === value ? styles.chipActive : "",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  heightPct = 0.9,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  heightPct?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      // Focus the header, not the first field, so the mobile keyboard stays down.
      headerRef.current?.focus();
    }
    if (!open && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      style={
        { "--sheet-max": `${Math.round(heightPct * 100)}dvh` } as CSSProperties
      }
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.sheetInner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} aria-hidden />
        <header className={styles.sheetHeader} ref={headerRef} tabIndex={-1}>
          <div className={styles.sheetHeaderTexts}>
            <h2 className={styles.sheetTitle}>{title}</h2>
            {subtitle ? <p className={styles.sheetSubtitle}>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className={["resetButton", styles.sheetClose].join(" ")}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} color={colors.mutedForeground} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export { styles as uiStyles };
