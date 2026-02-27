import { create } from 'zustand'

const ROOM_KEY = 'quiznova:room'

const readStoredRoom = () => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem(ROOM_KEY) || 'null')
  } catch {
    return null
  }
}

const persistRoom = (room) => {
  if (typeof window === 'undefined') return
  if (!room) {
    window.localStorage.removeItem(ROOM_KEY)
    return
  }
  window.localStorage.setItem(ROOM_KEY, JSON.stringify(room))
}

export const useRoomStore = create((set) => ({
  room: readStoredRoom(),
  setRoom: (room) => {
    persistRoom(room)
    set({ room })
  },
  clearRoom: () => {
    persistRoom(null)
    set({ room: null })
  },
}))

