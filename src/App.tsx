import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Editor from "@/pages/Editor";
import Landing from "@/pages/Landing";
import Index from "@/pages/Index";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cv-creator-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
