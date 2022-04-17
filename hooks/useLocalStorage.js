import { useState, useEffect } from "react";

function getStorageValue(key, initialValue) {
  // getting stored value
  const saved = localStorage.getItem(key)
  const initial = JSON.parse(saved)
  return initial || initialValue
}

export const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        return getStorageValue(key, defaultValue)
    })

    useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])

  return [value, setValue]
}