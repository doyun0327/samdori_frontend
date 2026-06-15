import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config/api";

function App() {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/answer`)
      .then((res) => res.json())
      .then((data) => setAnswer(data.answer));
  });

  return (
    <div>
      <h1>백엔드 응답</h1>
      <p>{answer}</p>
    </div>
  );
}

export default App;