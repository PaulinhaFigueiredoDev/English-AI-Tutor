import { useId } from "react"

export function ProgressMeter({ label, value, max, valueText }: {
  label: string
  value: number
  max: number
  valueText: string
}) {
  const descriptionId = useId()

  return (
    <div className="progress-meter">
      <progress className="progress-meter-bar" aria-label={label} aria-describedby={descriptionId} value={value} max={max} />
      <span id={descriptionId}>{valueText}</span>
    </div>
  )
}
