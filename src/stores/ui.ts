import { create } from 'zustand'

interface UIStore {
  isNavbarOpen: boolean
  toggleNavbar: () => void
  setNavbarOpen: (isOpen: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isNavbarOpen: false,
  toggleNavbar: () => set((state) => ({ isNavbarOpen: !state.isNavbarOpen })),
  setNavbarOpen: (isOpen) => set({ isNavbarOpen: isOpen }),
}))
