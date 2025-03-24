useEffect(() => {
  // Nếu có setState ở đây mà không có dependency array
  setSomeState(newValue);
}); // <- Thiếu dependency array
