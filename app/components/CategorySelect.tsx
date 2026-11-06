"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import styles from "./CategorySelect.module.css";

type CategoryOption = { value: string; label: string };

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly CategoryOption[];
};

export default function CategorySelect({ value, onChange, options }: CategorySelectProps) {
  const items = useMemo(() => [{ value: "", label: "All Categories" }, ...options], [options]);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: "", time: 0 });
  const listId = useId();
  const active = Math.min(activeIndex, items.length - 1);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const below = Math.max(0, window.innerHeight - rect.bottom - 12);
    const above = Math.max(0, rect.top - 12);
    const placeBelow = below >= Math.min(200, items.length * 36 + 8) || below >= above;
    const width = Math.min(rect.width, viewportWidth - 16);
    setPosition({
      width,
      left: Math.max(8, Math.min(rect.left, viewportWidth - width - 8)),
      top: placeBelow ? rect.bottom + 4 : undefined,
      bottom: placeBelow ? undefined : window.innerHeight - rect.top + 4,
      maxHeight: Math.min(320, placeBelow ? below : above),
      fontFamily: window.getComputedStyle(trigger).fontFamily,
    });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) {
      typeahead.current = { text: "", time: 0 };
      return;
    }
    function dismissOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }
    function dismissOnLayoutChange(event: Event) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", dismissOutside);
    window.addEventListener("resize", dismissOnLayoutChange);
    document.addEventListener("scroll", dismissOnLayoutChange, true);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      window.removeEventListener("resize", dismissOnLayoutChange);
      document.removeEventListener("scroll", dismissOnLayoutChange, true);
    };
  }, [open]);

  useEffect(() => {
    const menu = menuRef.current;
    const option = menu?.children[active] as HTMLElement | undefined;
    if (!open || !menu || !option) return;
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }
  }, [open, active, position]);

  function choose(index: number) {
    onChange(items[index].value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function show(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const { key } = event;
    if (key === "Tab") {
      setOpen(false);
      return;
    }
    if (key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      const direction = key === "ArrowDown" ? 1 : -1;
      show(open ? Math.max(0, Math.min(items.length - 1, active + direction)) : selectedIndex);
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      show(key === "Home" ? 0 : items.length - 1);
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else show(selectedIndex);
    } else if (key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - typeahead.current.time < 600 ? typeahead.current.text : "") + key.toLocaleLowerCase();
      typeahead.current = { text, time: now };
      const cycling = [...text].every((letter) => letter === text[0]);
      const prefix = cycling ? text[0] : text;
      const start = (open ? active : selectedIndex) + (cycling ? 1 : 0);
      for (let step = 0; step < items.length; step++) {
        const index = (start + step) % items.length;
        if (items[index].label.toLocaleLowerCase().startsWith(prefix)) {
          show(index);
          break;
        }
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label="Search category"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && position ? `${listId}-${active}` : undefined}
        className={styles.trigger}
        title={items[selectedIndex].label}
        onClick={() => open ? setOpen(false) : show(selectedIndex)}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value}>{items[selectedIndex].label}</span>
        <ChevronDown className={styles.chevron} size={14} aria-hidden="true" />
      </button>
      {open && position && createPortal(
        <div ref={menuRef} id={listId} role="listbox" aria-label="Search category" className={styles.menu} style={position}>
          {items.map((item, index) => (
            <div
              key={item.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={item.value === value}
              data-active={index === active}
              className={styles.option}
              onPointerMove={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {item.label}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
