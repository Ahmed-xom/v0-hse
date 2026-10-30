"use client"

import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PlanIssue } from "@/lib/journeys/domain"
import type { Copy } from "./copy"

export type FieldContext = { issues: PlanIssue[]; copy: Copy }
export function PlanField({
  id,
  label,
  value,
  onChange,
  hint,
  multiline,
  disabled,
  context,
  ...props
}: {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  hint?: string
  multiline?: boolean
  disabled?: boolean
  context: FieldContext
} & Pick<
  ComponentProps<typeof Input>,
  "type" | "placeholder" | "inputMode" | "maxLength" | "min" | "step"
>) {
  const issue = context.issues.find((item) => item.field === id)
  const attributes = {
    id: `jt-${id}`,
    value,
    disabled,
    onChange: (event: { target: { value: string } }) =>
      onChange?.(event.target.value),
    "aria-invalid": Boolean(issue),
    "aria-describedby": issue
      ? `jt-${id}-error`
      : hint
        ? `jt-${id}-hint`
        : undefined,
  }
  return (
    <Field data-invalid={Boolean(issue)} data-disabled={disabled}>
      <FieldLabel htmlFor={`jt-${id}`}>{label}</FieldLabel>
      {multiline ? (
        <Textarea {...attributes} rows={4} maxLength={8000} />
      ) : (
        <Input {...attributes} {...props} />
      )}
      {hint && <FieldDescription id={`jt-${id}-hint`}>{hint}</FieldDescription>}
      {issue && (
        <FieldError id={`jt-${id}-error`}>
          {context.copy(issue.message.en, issue.message.ar)}
        </FieldError>
      )}
    </Field>
  )
}

export function PlanChoice({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  context,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  context: FieldContext
}) {
  const issue = context.issues.find((item) => item.field === id)
  return (
    <Field data-invalid={Boolean(issue)}>
      <FieldLabel htmlFor={`jt-${id}`}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={`jt-${id}`}
          aria-invalid={Boolean(issue)}
          aria-describedby={issue ? `jt-${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {issue && (
        <FieldError id={`jt-${id}-error`}>
          {context.copy(issue.message.en, issue.message.ar)}
        </FieldError>
      )}
    </Field>
  )
}
