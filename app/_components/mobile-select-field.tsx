"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  filterMobileSelectOptions,
  getMobileSelectQueryOnOpen,
  shouldFocusSearchInputImmediately,
  shouldUseSearchableMobileSelect,
} from "./mobile-select-field-state.mjs";

export type MobileSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MobileSelectFieldProps = {
  label: string;
  options: MobileSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchableThreshold?: number;
  mode?: "auto" | "native" | "searchable";
};

export default function MobileSelectField({
  label,
  options,
  value,
  defaultValue = "",
  onChange,
  id,
  name,
  disabled = false,
  required = false,
  clearable = false,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  searchableThreshold = 10,
  mode = "auto",
}: MobileSelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const listboxId = `${fieldId}-listbox`;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue) ?? null;
  const optionCount = options.filter((option) => option.value !== "").length;
  const useSearchable =
    mode === "searchable" ||
    (mode === "auto" && shouldUseSearchableMobileSelect(optionCount, searchableThreshold));
  const filteredOptions = useMemo(
    () => filterMobileSelectOptions(options, query),
    [options, query],
  );
  const canClear = clearable && !required && !disabled && selectedValue !== "";

  function handleValueChange(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  }

  function handleClear() {
    handleValueChange("");
    setQuery("");
    setIsOpen(false);
  }

  function openSearchableList() {
    if (disabled) return;
    setQuery(getMobileSelectQueryOnOpen(selectedOption?.label ?? ""));
    setIsOpen(true);
  }

  function focusInputWithinGesture(eventType: "pointerdown" | "click") {
    if (!shouldFocusSearchInputImmediately(eventType)) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  useEffect(() => {
    if (!useSearchable || !isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, useSearchable]);

  if (!useSearchable) {
    return (
      <label className="flex w-full flex-col gap-[6px]" htmlFor={fieldId}>
        <span className="text-[12px] leading-none font-normal text-[#405C62]">{label}</span>
        <div className="relative w-full">
          <select
            id={fieldId}
            name={name}
            value={selectedValue}
            onChange={(event) => handleValueChange(event.target.value)}
            disabled={disabled}
            required={required}
            className="h-12 w-full appearance-none rounded-[14px] border border-[#B3B5B3] bg-white px-3 pr-20 text-base text-[#0D3233] outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {canClear ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1/2 right-10 flex h-7 min-w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#5A7984]"
              aria-label={`Limpiar ${label.toLowerCase()}`}
            >
              <X size={16} />
            </button>
          ) : null}
          <ChevronDown
            size={20}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#5A7984]"
          />
        </div>
      </label>
    );
  }

  return (
    <label className="flex w-full flex-col gap-[6px]" htmlFor={fieldId}>
      <span className="text-[12px] leading-none font-normal text-[#405C62]">{label}</span>
      <div ref={containerRef} className="relative w-full">
        {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
        <div className="relative">
          <input
            id={fieldId}
            ref={inputRef}
            type="text"
            value={isOpen ? query : (selectedOption?.label ?? "")}
            onPointerDown={() => {
              openSearchableList();
              focusInputWithinGesture("pointerdown");
            }}
            onFocus={openSearchableList}
            onClick={openSearchableList}
            onChange={(event) => {
              if (!isOpen) {
                setIsOpen(true);
              }
              setQuery(event.target.value);
            }}
            placeholder={isOpen ? searchPlaceholder : placeholder}
            disabled={disabled}
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="h-12 w-full rounded-[14px] border border-[#B3B5B3] bg-white px-3 pr-20 text-base text-[#0D3233] outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          {canClear ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1/2 right-10 flex h-7 min-w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#5A7984]"
              aria-label={`Limpiar ${label.toLowerCase()}`}
            >
              <X size={16} />
            </button>
          ) : null}
          <ChevronDown
            size={20}
            className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#5A7984] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-[14px] border border-[#B3B5B3] bg-white py-1 shadow-[0_10px_24px_0_rgba(13,50,51,0.12)] [-webkit-overflow-scrolling:touch]"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      handleValueChange(option.value);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className={`flex min-h-12 w-full items-center px-3 py-3 text-left text-[15px] leading-5 text-[#0D3233] ${
                      isSelected ? "bg-[#DDE2DD]" : "bg-white"
                    } ${option.disabled ? "cursor-not-allowed opacity-50" : "active:bg-[#E9EDE9]"}`}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <p className="m-0 px-3 py-3 text-[14px] text-[#5A7984]">{emptyMessage}</p>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}
