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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="personal" className="text-sm md:text-base">Personnel</TabsTrigger>
          <TabsTrigger value="experience" className="text-sm md:text-base">Expérience</TabsTrigger>
          <TabsTrigger value="education" className="text-sm md:text-base">Formation</TabsTrigger>
          <TabsTrigger value="languages" className="text-sm md:text-base">Langues</TabsTrigger>
          <TabsTrigger value="skills" className="text-sm md:text-base">Compétences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-0">
          <CVSection title="Informations Personnelles">
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="w-32 h-32 mb-4">
                  {cvData.personalInfo.photo ? (
                    <AvatarImage src={cvData.personalInfo.photo} alt="Photo de profil" />
                  ) : (
                    <AvatarFallback>
                      <Camera className="w-8 h-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <Button onClick={triggerFileInput} variant="outline" size="sm" className="w-full max-w-[200px]">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter une photo
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Prénom"
                    value={cvData.personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange("firstName", e.target.value)}
                  />
                  <Input
                    placeholder="Nom"
                    value={cvData.personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange("lastName", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Titre professionnel"
                  value={cvData.personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange("title", e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={cvData.personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                  />
                  <Input
                    placeholder="Téléphone"
                    type="tel"
                    value={cvData.personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Adresse"
                  value={cvData.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                />
                <Textarea
                  placeholder="À propos de moi"
                  value={cvData.personalInfo.summary}
                  onChange={(e) => handlePersonalInfoChange("summary", e.target.value)}
                  className="min-h-[100px]"
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
      </Tabs>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-[90vw] w-full md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajuster la photo</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {uploadedImage && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={uploadedImage}
                  alt="Upload"
                  className="max-h-[60vh] w-auto mx-auto"
                />
              </ReactCrop>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Appliquer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVEditor;
