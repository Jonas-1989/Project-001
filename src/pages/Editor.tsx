import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as uuid from "uuid";
import Navbar from "@/components/Navbar";
import CVEditor from "@/components/CVEditor";
import CVPreview from "@/components/CVPreview";
import TemplateSelector from "@/components/TemplateSelector";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Download, Save, User } from "lucide-react";
import { CVData } from "@/lib/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Editor = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [password, setPassword] = useState("");
  const [cvData, setCVData] = useState<CVData>({
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      title: "Software Developer",
      email: "john.doe@example.com",
      phone: "+33 6 12 34 56 78",
      location: "Paris, France",
      summary: "Experienced software developer with a passion for creating elegant solutions to complex problems.",
      photo: "",
    },
    experiences: [
      {
        id: uuid.v4(),
        company: "Tech Solutions Inc.",
        position: "Senior Developer",
        startDate: "01/2020",
        endDate: "Present",
        description: "Led development team in creating enterprise software solutions. Implemented CI/CD pipeline and reduced deployment time by 40%.",
        current: true,
      },
    ],
    education: [
      {
        id: uuid.v4(),
        institution: "University of Paris",
        degree: "Master's",
        field: "Computer Science",
        startDate: "09/2015",
        endDate: "06/2018",
        description: "Graduated with honors. Specialized in machine learning and artificial intelligence.",
      },
    ],
    languages: [
      {
        id: uuid.v4(),
        name: "English",
        level: 5,
      },
      {
        id: uuid.v4(),
        name: "French",
        level: 4,
      },
    ],
    skills: [
      {
        id: uuid.v4(),
        name: "JavaScript",
        level: 5,
      },
      {
        id: uuid.v4(),
        name: "React",
        level: 4,
      },
      {
        id: uuid.v4(),
        name: "Node.js",
        level: 4,
      },
      {
        id: uuid.v4(),
        name: "Python",
        level: 3,
      },
    ],
  });

  const handleUpdateCV = (data: Partial<CVData>) => {
    setCVData((prev) => ({ ...prev, ...data }));
  };

  const handleDownloadPDF = async () => {
    try {
      const cvElement = document.getElementById('cv-preview');
      if (!cvElement) return;

      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 0; // We're handling margins in the template now

      // Convert mm to pixels (assuming 96 DPI)
      const pxPerMm = 96 / 25.4;
      const widthInPx = (a4Width - 2 * margin) * pxPerMm;
      const heightInPx = (a4Height - 2 * margin) * pxPerMm;

      // Create a temporary container with A4 dimensions
      const tempContainer = document.createElement('div');
      tempContainer.style.width = `${widthInPx}px`;
      tempContainer.style.minHeight = `${heightInPx}px`; // Change to minHeight to accommodate content
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';

      // Clone the CV content
      const clone = cvElement.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.width = '100%';
      clone.style.height = 'auto'; // Allow height to adjust to content
      clone.style.position = 'relative';
      clone.style.boxSizing = 'border-box';
      clone.style.margin = '0';
      clone.style.padding = '0';

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Wait for any potential reflows
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the content with html2canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        logging: false,
        width: widthInPx,
        height: Math.max(heightInPx, tempContainer.offsetHeight), // Use the larger of A4 height or content height
        windowWidth: widthInPx,
        windowHeight: Math.max(heightInPx, tempContainer.offsetHeight),
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm',
      });

      // Calculate scaling to fit A4
      const imgWidth = a4Width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to PDF
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        0,
        imgWidth,
        Math.min(imgHeight, a4Height), // Only show what fits on first page
        undefined,
        'FAST'
      );

      // If content exceeds one page and there is actual content to show
      if (imgHeight > a4Height) {
        const numberOfPages = Math.ceil(imgHeight / a4Height);
        
        // Start from second page since first page is already added
        for (let page = 1; page < numberOfPages; page++) {
          const remainingHeight = imgHeight - (page * a4Height);
          
          // Only add a new page if there's significant content remaining (more than 10mm)
          if (remainingHeight > 10) {
            pdf.addPage();
            pdf.addImage(
              canvas.toDataURL('image/jpeg', 1.0),
              'JPEG',
              0,
              -(page * a4Height), // Offset for current page
              imgWidth,
              imgHeight,
              undefined,
              'FAST'
            );
          }
        }
      }

      // Download the PDF
      pdf.save(`CV-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf`);

      toast({
        title: "Succès",
        description: "Votre CV a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du téléchargement du CV.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCV = () => {
    setShowSaveModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!password) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer un mot de passe.",
          variant: "destructive",
        });
        return;
      }

      // Here you would typically make an API call to save the profile
      // For now, we'll just save to localStorage
      const profileData = {
        name: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        email: cvData.personalInfo.email,
        password: password, // In a real app, this should be handled securely
        cvData: cvData
      };

      localStorage.setItem('userProfile', JSON.stringify(profileData));
      
      setShowSaveModal(false);
      setPassword("");
      
      toast({
        title: "Succès",
        description: "Votre profil et CV ont été sauvegardés avec succès.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)]">
        {/* Left Column - Editor */}
        <div className="w-full lg:w-[35%] border-r border-gray-200 dark:border-gray-800">
          <div className="p-4">
            <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger>
                <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="mt-4">
                <CVEditor cvData={cvData} onUpdateCV={handleUpdateCV} />
              </TabsContent>
              
              <TabsContent value="template" className="mt-4">
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="w-full lg:w-[65%] lg:flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold dark:text-gray-200">Preview</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleSaveCV} className="w-full sm:w-auto justify-center">
                <Save className="h-4 w-4 mr-2" /> Save your CV
              </Button>
              <Button onClick={handleDownloadPDF} className="w-full sm:w-auto justify-center">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
          
          <div id="cv-preview" className="bg-white dark:bg-gray-800 max-w-4xl mx-auto rounded-lg shadow-sm">
            <CVPreview cvData={cvData} templateId={selectedTemplate} />
          </div>
        </div>
      </div>

      {/* Save Profile Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-[425px] w-[80%] mx-auto dark:bg-gray-800">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </div>
              <DialogTitle className="mb-6">
                <span className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">
                  Ton CV toujours prêt à être envoyé
                </span>
                <span className="block text-blue-600 dark:text-blue-400 mt-2">
                  sauvegarde-le maintenant
                </span>
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom et prénom</label>
              <Input
                value={`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`}
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="dark:bg-gray-700"
              />
            </div>
            <Button className="w-full" onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" /> Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Editor;
