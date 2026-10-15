import { createContext, useContext, useState } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selectedMovie, setSelectedMovie]       = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSeats, setSelectedSeats]       = useState([]);
  const [purchaseResult, setPurchaseResult]     = useState(null);

  return (
    <BookingContext.Provider value={{
      selectedMovie,    setSelectedMovie,
      selectedSchedule, setSelectedSchedule,
      selectedSeats,    setSelectedSeats,
      purchaseResult,   setPurchaseResult,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
