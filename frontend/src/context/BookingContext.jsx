import { createContext, useContext, useMemo, useState } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selectedMovie, setSelectedMovie]       = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSeats, setSelectedSeats]       = useState([]);
  const [purchaseResult, setPurchaseResult]     = useState(null);

  const value = useMemo(() => ({
    selectedMovie,    setSelectedMovie,
    selectedSchedule, setSelectedSchedule,
    selectedSeats,    setSelectedSeats,
    purchaseResult,   setPurchaseResult,
  }), [selectedMovie, selectedSchedule, selectedSeats, purchaseResult]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
