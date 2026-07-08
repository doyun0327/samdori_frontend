import { useEffect, useState } from 'react'
import './TimeSlotPicker.css'
import { isFutureTimeSlot } from '../../features/booking/formatBooking'

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
  book: '예약할 시간을 선택해 주세요.',
  send: '고객에게 보낼 시간을 선택해 주세요.',
}

function TimeSlotSection({
  title,
  slots,
  selectedSlots,
  onToggle,
  disabled,
  registeredSlots,
  availableSlots = [],
  blockedSlots = [],
  mode,
  selectedDate = '',
  referenceNow = new Date(),
}) {
  return (
    <section className="time-slot-picker__section">
      <h3 className="time-slot-picker__period">{title}</h3>
      <div className="time-slot-picker__grid">
        {slots.map((slot) => {
          const isRegistered = registeredSlots.includes(slot.value)
          const isAvailable = availableSlots.includes(slot.value)
          const isBlocked = blockedSlots.includes(slot.value)
          const isSelected = selectedSlots.includes(slot.value)
          const isPastSendSlot =
            mode === 'send' &&
            selectedDate &&
            !isFutureTimeSlot(selectedDate, slot.value, referenceNow)
          const isSelectable =
            mode === 'book'
              ? isAvailable && !isBlocked
              : mode === 'register'
                ? !isRegistered
                : mode === 'send'
                  ? !isPastSendSlot && !isBlocked
                  : mode === 'unregister'
                    ? isRegistered && !isBlocked
                    : isRegistered && !isBlocked
          const optionClassName = [
            'time-slot-picker__option',
            (mode === 'book' && isAvailable) || (mode === 'send' && isSelectable)
              ? 'time-slot-picker__option--available'
              : '',
            isRegistered && mode !== 'book' && mode !== 'send'
              ? 'time-slot-picker__option--registered'
              : '',
            isBlocked ? 'time-slot-picker__option--blocked' : '',
            isPastSendSlot ? 'time-slot-picker__option--past' : '',
            !isSelectable ? 'time-slot-picker__option--inactive' : '',
            mode === 'unregister' && isSelected
              ? 'time-slot-picker__option--remove-selected'
              : '',
          ]
            .filter(Boolean)
            .join(' ')

          if (!isSelectable) {
            return (
              <div
                key={slot.value}
                className={optionClassName}
                aria-disabled="true"
              >
                <span>{slot.label}</span>
              </div>
            )
          }

          return (
            <label key={slot.value} className={optionClassName}>
              <input
                type={mode === 'book' ? 'radio' : 'checkbox'}
                name={mode === 'book' ? 'book-slot' : undefined}
                value={slot.value}
                checked={isSelected}
                onChange={() => onToggle(slot.value)}
                disabled={disabled}
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
  availableSlots = [],
  blockedSlots = [],
  selectedDate = '',
}) {
  const [referenceNow, setReferenceNow] = useState(() => new Date())

  useEffect(() => {
    if (mode !== 'send' || !selectedDate) return

    setReferenceNow(new Date())

    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    if (selectedDate !== todayKey) return

    const intervalId = window.setInterval(() => {
      setReferenceNow(new Date())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [mode, selectedDate])

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
        availableSlots={availableSlots}
        blockedSlots={blockedSlots}
        mode={mode}
        selectedDate={selectedDate}
        referenceNow={referenceNow}
      />

      <TimeSlotSection
        title="오후"
        slots={AFTERNOON_SLOTS}
        selectedSlots={selectedSlots}
        onToggle={onToggle}
        disabled={disabled}
        registeredSlots={registeredSlots}
        availableSlots={availableSlots}
        blockedSlots={blockedSlots}
        mode={mode}
        selectedDate={selectedDate}
        referenceNow={referenceNow}
      />
    </div>
  )
}
