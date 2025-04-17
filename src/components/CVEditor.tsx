import { useState, useRef, ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { CVData, Skill, Language } from "@/lib/types";
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import CVSection from "./CVSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Upload, Camera, Loader2, X } from "lucide-react";

interface CVEditorProps {
  cvData: CVData;
  onUpdateCV: (data: Partial<CVData>) => void;
}

const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Elementary" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" }
];

const LANGUAGE_LEVELS = [
  { value: 1, label: "Basic" },
  { value: 2, label: "Conversational" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Fluent" },
  { value: 5, label: "Native" }
];

// Add new constants for image handling
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif']
};

const CVEditor = ({ cvData, onUpdateCV }: CVEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [activeSection, setActiveSection] = useState("personal");
  const sectionRefs = {
    personal: useRef<HTMLDivElement>(null),
    experience: useRef<HTMLDivElement>(null),
    education: useRef<HTMLDivElement>(null),
    languages: useRef<HTMLDivElement>(null),
    skills: useRef<HTMLDivElement>(null),
  };
  
  const handlePersonalInfoChange = (field: string, value: string) => {
    onUpdateCV({
      personalInfo: {
        ...cvData.personalInfo,
        [field]: value,
      },
    });
  };
  
  const validateImage = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return "Le fichier doit être une image";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "L'image ne doit pas dépasser 5MB";
    }
    if (!Object.keys(ACCEPTED_IMAGE_TYPES).includes(file.type)) {
      return "Format d'image non supporté. Utilisez JPG, PNG, WebP, HEIC ou HEIF";
    }
    return null;
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      alert(error);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Erreur lors du chargement de l'image: " + (error as Error).message);
    }
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Impossible de créer le contexte de canvas");
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      // Set canvas size to maintain aspect ratio
      const MAX_SIZE = 400;
      let width = crop.width * scaleX;
      let height = crop.height * scaleY;

      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;

      // Apply high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        width,
        height
      );

      // Convert to high-quality JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      handlePersonalInfoChange("photo", dataUrl);
      setShowCropDialog(false);
    } catch (error) {
      alert("Erreur lors du traitement de l'image: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
      setUploadedImage(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addExperience = () => {
    const newExperience = {
      id: uuidv4(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    };
    
    onUpdateCV({
      experiences: [...cvData.experiences, newExperience],
    });
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const updatedExperiences = [...cvData.experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value,
    };
    
    onUpdateCV({ experiences: updatedExperiences });
  };

  const removeExperience = (id: string) => {
    onUpdateCV({
      experiences: cvData.experiences.filter((exp) => exp.id !== id),
    });
  };

  const addEducation = () => {
    const newEducation = {
      id: uuidv4(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    
    onUpdateCV({
      education: [...cvData.education, newEducation],
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updatedEducation = [...cvData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    
    onUpdateCV({ education: updatedEducation });
  };

  const removeEducation = (id: string) => {
    onUpdateCV({
      education: cvData.education.filter((edu) => edu.id !== id),
    });
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: uuidv4(),
      name: "",
      level: 3,
    };
    
    onUpdateCV({
      skills: [...cvData.skills, newSkill],
    });
  };

  const updateSkill = (index: number, field: 'name' | 'level', value: string | number) => {
    const updatedSkills = [...cvData.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value,
    };
    
    onUpdateCV({ skills: updatedSkills });
  };

  const removeSkill = (id: string) => {
    onUpdateCV({
      skills: cvData.skills.filter((skill) => skill.id !== id),
    });
  };

  const addLanguage = () => {
    const newLanguage: Language = {
      id: uuidv4(),
      name: "",
      level: 3,
    };
    
    onUpdateCV({
      languages: [...(cvData.languages || []), newLanguage],
    });
  };

  const updateLanguage = (index: number, field: 'name' | 'level', value: string | number) => {
    const updatedLanguages = [...(cvData.languages || [])];
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      [field]: value,
    };
    
    onUpdateCV({ languages: updatedLanguages });
  };

  const removeLanguage = (id: string) => {
    onUpdateCV({
      languages: (cvData.languages || []).filter((lang) => lang.id !== id),
    });
  };

  const scrollToSection = (section: string) => {
    sectionRefs[section as keyof typeof sectionRefs]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    setActiveSection(section);
  };

  return (
    <div className="relative flex flex-col gap-6 p-4">
      {/* Mobile Navigation */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
          <Button
            variant={activeSection === "personal" ? "default" : "ghost"}
            size="sm"
            onClick={() => scrollToSection("personal")}
          >
            Personal
          </Button>
          <Button
            variant={activeSection === "experience" ? "default" : "ghost"}
            size="sm"
            onClick={() => scrollToSection("experience")}
          >
            Experience
          </Button>
          <Button
            variant={activeSection === "education" ? "default" : "ghost"}
            size="sm"
            onClick={() => scrollToSection("education")}
          >
            Education
          </Button>
          <Button
            variant={activeSection === "languages" ? "default" : "ghost"}
            size="sm"
            onClick={() => scrollToSection("languages")}
          >
            Languages
          </Button>
          <Button
            variant={activeSection === "skills" ? "default" : "ghost"}
            size="sm"
            onClick={() => scrollToSection("skills")}
          >
            Skills
          </Button>
        </div>
      </div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-[800px] w-full p-6 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajuster la photo</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Déplacez le cercle pour sélectionner la zone de votre photo
            </p>
          </DialogHeader>
          
          <div className="mt-4 flex-1 overflow-y-auto min-h-0">
            {uploadedImage && (
              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  aspect={1}
                  circularCrop
                  locked={true}
                  keepSelection={true}
                  className="rounded-lg overflow-hidden"
                >
                  <img
                    ref={imgRef}
                    src={uploadedImage}
                    alt="Crop preview"
                    className="max-h-[60vh] w-auto mx-auto"
                    style={{ maxWidth: '100%' }}
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setUploadedImage(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Appliquer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="personal">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>
        
        <div>
          <TabsContent value="personal">
            <CVSection title="Personal Information" collapsible={false}>
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="w-[152px] h-[152px] relative group">
                    <div 
                      onClick={triggerFileInput} 
                      className="w-full h-full border-2 border-dashed border-gray-300 rounded-full overflow-hidden flex flex-col justify-center items-center bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all relative"
                    >
                      {isProcessing ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      ) : cvData.personalInfo.photo ? (
                        <>
                          <Avatar className="w-full h-full rounded-full">
                            <AvatarImage 
                              src={cvData.personalInfo.photo} 
                              alt="Profile" 
                              className="object-cover w-full h-full"
                              style={{
                                imageRendering: '-webkit-optimize-contrast',
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden'
                              }}
                            />
                            <AvatarFallback>
                              <Camera className="h-7 w-7 text-gray-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="h-9 w-9 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500 text-center px-2">
                            Cliquez pour ajouter
                            <br />
                            JPG, PNG, WebP
                            <br />
                            Max 5MB
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept={Object.entries(ACCEPTED_IMAGE_TYPES)
                        .map(([type, exts]) => exts.join(','))
                        .join(',')}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-item">
                    <label className="block text-gray-700 mb-1 font-medium">Prénom</label>
                    <Input 
                      placeholder="Ex: Jean"
                      value={cvData.personalInfo.firstName} 
                      onChange={(e) => handlePersonalInfoChange("firstName", e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-item">
                    <label className="block text-gray-700 mb-1 font-medium">Nom</label>
                    <Input 
                      placeholder="Ex: Dupont"
                      value={cvData.personalInfo.lastName} 
                      onChange={(e) => handlePersonalInfoChange("lastName", e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-item">
                  <label className="block text-gray-700 mb-1 font-medium">Titre professionnel</label>
                  <Input 
                    placeholder="Ex: Développeur Full Stack"
                    value={cvData.personalInfo.title} 
                    onChange={(e) => handlePersonalInfoChange("title", e.target.value)} 
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-700">Coordonnées</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-item">
                      <label className="block text-gray-700 mb-1 font-medium">Email</label>
                      <Input 
                        type="email"
                        placeholder="Ex: jean.dupont@email.com"
                        value={cvData.personalInfo.email} 
                        onChange={(e) => handlePersonalInfoChange("email", e.target.value)} 
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700 mb-1 font-medium">Téléphone</label>
                      <Input 
                        placeholder="Ex: +33 6 12 34 56 78"
                        value={cvData.personalInfo.phone} 
                        onChange={(e) => handlePersonalInfoChange("phone", e.target.value)} 
                      />
                    </div>

                    <div className="form-item md:col-span-2">
                      <label className="block text-gray-700 mb-1 font-medium">Adresse</label>
                      <Input 
                        placeholder="Ex: Paris, France"
                        value={cvData.personalInfo.location} 
                        onChange={(e) => handlePersonalInfoChange("location", e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Optional Information Section */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-md font-semibold text-gray-700">Informations optionnelles</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {!cvData.personalInfo.birthDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.birthDate = "";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Date de naissance
                        </Button>
                      )}
                      {!cvData.personalInfo.gender && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.gender = "male";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Sexe
                        </Button>
                      )}
                      {!cvData.personalInfo.maritalStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.maritalStatus = "single";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          État civil
                        </Button>
                      )}
                      {!cvData.personalInfo.drivingLicense && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.drivingLicense = "";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Permis de conduire
                        </Button>
                      )}
                      {!cvData.personalInfo.linkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.linkedin = "";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Button>
                      )}
                      {!cvData.personalInfo.customField && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            const newPersonalInfo = { ...cvData.personalInfo };
                            newPersonalInfo.customField = "";
                            onUpdateCV({ personalInfo: newPersonalInfo });
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Champ personnalisé
                        </Button>
                      )}
                    </div>

                    {/* Render active optional fields */}
                    <div className="space-y-4">
                      {cvData.personalInfo.birthDate !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">Date de naissance</label>
                            <Input
                              type="date"
                              value={cvData.personalInfo.birthDate}
                              onChange={(e) => handlePersonalInfoChange("birthDate", e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.birthDate;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {cvData.personalInfo.gender !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">Sexe</label>
                            <Select 
                              value={cvData.personalInfo.gender} 
                              onValueChange={(value) => handlePersonalInfoChange("gender", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Homme</SelectItem>
                                <SelectItem value="female">Femme</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.gender;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {cvData.personalInfo.maritalStatus !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">État civil</label>
                            <Select 
                              value={cvData.personalInfo.maritalStatus} 
                              onValueChange={(value) => handlePersonalInfoChange("maritalStatus", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Célibataire</SelectItem>
                                <SelectItem value="married">Marié(e)</SelectItem>
                                <SelectItem value="divorced">Divorcé(e)</SelectItem>
                                <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.maritalStatus;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {cvData.personalInfo.drivingLicense !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">Permis de conduire</label>
                            <Input
                              value={cvData.personalInfo.drivingLicense}
                              onChange={(e) => handlePersonalInfoChange("drivingLicense", e.target.value)}
                              placeholder="Ex: B"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.drivingLicense;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {cvData.personalInfo.linkedin !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">LinkedIn</label>
                            <Input
                              type="url"
                              value={cvData.personalInfo.linkedin}
                              onChange={(e) => handlePersonalInfoChange("linkedin", e.target.value)}
                              placeholder="https://linkedin.com/in/..."
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.linkedin;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {cvData.personalInfo.customField !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-gray-700 mb-1 font-medium">Champ personnalisé</label>
                            <Input
                              value={cvData.personalInfo.customField}
                              onChange={(e) => handlePersonalInfoChange("customField", e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="self-end mb-1"
                            onClick={() => {
                              const newPersonalInfo = { ...cvData.personalInfo };
                              delete newPersonalInfo.customField;
                              onUpdateCV({ personalInfo: newPersonalInfo });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="space-y-2">
                  <h3 className="text-md font-semibold text-gray-700">Résumé professionnel</h3>
                  <Textarea 
                    placeholder="Décrivez brièvement votre profil professionnel et vos objectifs..."
                    value={cvData.personalInfo.summary}
                    onChange={(e) => handlePersonalInfoChange("summary", e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </CVSection>
          </TabsContent>
          
          <TabsContent value="experience">
            <CVSection title="Professional Experience" collapsible={false}>
              {cvData.experiences.map((experience, index) => (
                <div key={experience.id} className="mb-6">
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Position {index + 1}</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeExperience(experience.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-item">
                      <label className="block text-gray-700">Company</label>
                      <Input 
                        value={experience.company}
                        onChange={(e) => updateExperience(index, "company", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700">Position</label>
                      <Input 
                        value={experience.position}
                        onChange={(e) => updateExperience(index, "position", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700">Start Date</label>
                      <Input 
                        type="text" 
                        placeholder="MM/YYYY"
                        value={experience.startDate}
                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700">End Date</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="text" 
                          placeholder="MM/YYYY"
                          value={experience.endDate}
                          onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                          disabled={experience.current}
                        />
                        <div className="flex items-center">
                          <input 
                            type="checkbox"
                            id={`current-${experience.id}`}
                            checked={experience.current}
                            onChange={(e) => updateExperience(index, "current", e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`current-${experience.id}`} className="text-sm">Current</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-item mt-4">
                    <label className="block text-gray-700">Description</label>
                    <Textarea 
                      value={experience.description}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              
              <Button onClick={addExperience} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Experience
              </Button>
            </CVSection>
          </TabsContent>
          
          <TabsContent value="education">
            <CVSection title="Education" collapsible={false}>
              {cvData.education.map((education, index) => (
                <div key={education.id} className="mb-6">
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Education {index + 1}</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeEducation(education.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-item">
                      <label className="block text-gray-700">Institution</label>
                      <Input 
                        value={education.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700">Degree</label>
                      <Input 
                        value={education.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    
                    <div className="form-item">
                      <label className="block text-gray-700">Field of Study</label>
                      <Input 
                        value={education.field}
                        onChange={(e) => updateEducation(index, "field", e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-item">
                        <label className="block text-gray-700">Start Date</label>
                        <Input 
                          type="text" 
                          placeholder="MM/YYYY"
                          value={education.startDate}
                          onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                        />
                      </div>
                      
                      <div className="form-item">
                        <label className="block text-gray-700">End Date</label>
                        <Input 
                          type="text" 
                          placeholder="MM/YYYY"
                          value={education.endDate}
                          onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-item mt-4">
                    <label className="block text-gray-700">Description</label>
                    <Textarea 
                      value={education.description}
                      onChange={(e) => updateEducation(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              
              <Button onClick={addEducation} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Education
              </Button>
            </CVSection>
          </TabsContent>
          
          <TabsContent value="languages">
            <CVSection title="Languages" collapsible={false}>
              <div className="space-y-4">
                {(cvData.languages || []).map((language, index) => (
                  <div key={language.id} className="flex items-center space-x-2">
                    <Input
                      className="flex-1"
                      placeholder="Language name"
                      value={language.name}
                      onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                    />
                    
                    <Select 
                      value={language.level.toString()} 
                      onValueChange={(value) => updateLanguage(index, 'level', parseInt(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value.toString()}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeLanguage(language.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button onClick={addLanguage} className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Language
                </Button>
              </div>
            </CVSection>
          </TabsContent>
          
          <TabsContent value="skills">
            <CVSection title="Skills" collapsible={false}>
              <div className="space-y-4">
                {cvData.skills.map((skill, index) => (
                  <div key={skill.id} className="flex items-center space-x-2">
                    <Select 
                      value={skill.level.toString()} 
                      onValueChange={(value) => updateSkill(index, 'level', parseInt(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value.toString()}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      className="flex-1"
                      placeholder="Skill name"
                      value={skill.name}
                      onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    />

                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button onClick={addSkill} className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Skill
                </Button>
              </div>
            </CVSection>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CVEditor;
