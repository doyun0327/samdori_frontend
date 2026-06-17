import './TimeSlotPicker.css'

function createSlot(hour) {
  const start = String(hour).padStart(2, '0')
  const end = String(hour + 1).padStart(2, '0')

  return {
    value: `${start}:00-${end}:00`,
    label: `${hour}:00`,
  }
}

const MORNING_SLOTS = [8, 9, 10, 11].map(createSlot)
const AFTERNOON_SLOTS = [12, 13, 14, 15, 16, 17, 18, 19, 20].map(createSlot)

const MODE_COPY = {
  register: '등록할 시간을 선택해 주세요.',
  unregister: '해제할 시간을 선택해 주세요.',
}

function TimeSlotSection({
  title,
  slots,
  selectedSlots,
  onToggle,
  disabled,
  registeredSlots,
  mode,
}) {
  return (
    <section className="time-slot-picker__section">
      <h3 className="time-slot-picker__period">{title}</h3>
      <div className="time-slot-picker__grid">
        {slots.map((slot) => {
          const isRegistered = registeredSlots.includes(slot.value)
          const isSelected = selectedSlots.includes(slot.value)
          const isSelectable =
            mode === 'register' ? !isRegistered : isRegistered

          return (
            <label
              key={slot.value}
              className={`time-slot-picker__option${
                isRegistered ? ' time-slot-picker__option--registered' : ''
              }${!isSelectable ? ' time-slot-picker__option--inactive' : ''}${
                mode === 'unregister' && isSelected
                  ? ' time-slot-picker__option--remove-selected'
                  : ''
              }`}
            >
              <input
                type="checkbox"
                value={slot.value}
                checked={isSelected}
                onChange={() => onToggle(slot.value)}
                disabled={disabled || !isSelectable}
              />
              <span>{slot.label}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export default function TimeSlotPicker({
  mode,
  selectedSlots,
  onToggle,
  disabled,
  registeredSlots = [],
}) {
  return (
    <div className="time-slot-picker">
      <p className="time-slot-picker__title">{MODE_COPY[mode]}</p>

      <TimeSlotSection
        title="오전"
        slots={MORNING_SLOTS}
        selectedSlots={selectedSlots}
        onToggle={onToggle}
        disabled={disabled}
        registeredSlots={registeredSlots}
        mode={mode}
      />

      <TimeSlotSection
        title="오후"
        slots={AFTERNOON_SLOTS}
        selectedSlots={selectedSlots}
        onToggle={onToggle}
        disabled={disabled}
        registeredSlots={registeredSlots}
        mode={mode}
      />
    </div>
  )
}
