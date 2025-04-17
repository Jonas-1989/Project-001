import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Editor from "@/pages/Editor";
import Landing from "@/pages/Landing";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cv-creator-theme">
      <Router>
        <div className="fixed top-0 right-0 p-4 bg-blue-500 text-white">Test Deploy</div>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
