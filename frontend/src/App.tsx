import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import TestPage from "./pages/TestPage"
import NotFoundPage from "./pages/NotFoundPage.tsx"
import ResultsPage from "./pages/ResultsPage.tsx"
import ShareResultsPage from "./pages/ShareResultsPage.tsx"

function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/results" element={<ResultsPage />}/>
      <Route path="/results/:resultId" element={<ShareResultsPage />}/>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
