import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Globe,
  Image as ImageIcon,
  Trash2,
  Check,
  Upload,
  Building2,
  FileText,
} from "lucide-react";
import {
  useCreateGroupWithDefaults,
  useUpdateGroup,
  useUploadGroupLogo,
  useDeleteGroupLogo,
  getGroupLogoUrl,
} from "../../lib/hooks/useGroups";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { DEFAULTS } from "../../lib/constants";

// Zonas horarias comunes
const TIMEZONES = [
  { id: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { id: "America/Monterrey", label: "Monterrey (GMT-6)" },
  { id: "America/Cancun", label: "Cancún (GMT-5)" },
  { id: "America/Tijuana", label: "Tijuana (GMT-8)" },
  { id: "America/New_York", label: "Nueva York (GMT-5)" },
  { id: "America/Los_Angeles", label: "Los Ángeles (GMT-8)" },
  { id: "America/Chicago", label: "Chicago (GMT-6)" },
  { id: "America/Denver", label: "Denver (GMT-7)" },
  { id: "America/Bogota", label: "Bogotá (GMT-5)" },
  { id: "America/Lima", label: "Lima (GMT-5)" },
  { id: "America/Santiago", label: "Santiago (GMT-3)" },
  { id: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { id: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { id: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { id: "Europe/London", label: "Londres (GMT+0)" },
  { id: "Europe/Paris", label: "París (GMT+1)" },
  { id: "Europe/Berlin", label: "Berlín (GMT+1)" },
  { id: "UTC", label: "UTC (GMT+0)" },
];

// Steps config
const STEPS = [
  { id: 1, title: "Info", icon: FileText },
  { id: 2, title: "Personalizar", icon: ImageIcon },
  { id: 3, title: "Zona horaria", icon: Globe },
];

// Progress indicator component
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <motion.div
          key={idx}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            idx + 1 <= currentStep
              ? "bg-[rgb(var(--brand-primary))]"
              : "bg-[rgb(var(--border-base))]"
          }`}
          initial={{ width: 24 }}
          animate={{
            width: idx + 1 === currentStep ? 32 : 24,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
}

// Step 1: Name & Description
function StepInfo({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onNext,
}) {
  const isValid = name.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/60 flex items-center justify-center shadow-lg shadow-[rgb(var(--brand-primary))]/20"
        >
          <Users className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          ¿Cómo se llamará tu espacio?
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Elige un nombre descriptivo para tu espacio de trabajo
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            Nombre del espacio
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Mi agenda, Familia, Trabajo..."
            maxLength={120}
            autoFocus
            className="w-full h-14 px-4 rounded-xl border-2 border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-lg placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--brand-primary))] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) {
                onNext();
              }
            }}
          />
          <div className="absolute right-4 top-[calc(50%+12px)] -translate-y-1/2 text-xs text-[rgb(var(--text-muted))]">
            {name.length}/120
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="flex flex-wrap gap-2">
          {["Personal", "Trabajo", "Familia", "Equipo", "Proyectos"].map(
            (suggestion) => (
              <motion.button
                key={suggestion}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNameChange(suggestion)}
                className="px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-muted))] text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                {suggestion}
              </motion.button>
            )
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Una breve descripción del espacio..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--brand-primary))] transition-colors resize-none"
          />
          <div className="text-right text-xs text-[rgb(var(--text-muted))] mt-1">
            {description.length}/500
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Step 2: Logo
function StepLogo({ logoPreview, onLogoChange, onLogoRemove, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona una imagen válida");
        return;
      }
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar los 5MB");
        return;
      }
      onLogoChange(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20"
        >
          <ImageIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Personaliza tu espacio
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Agrega un logo o imagen para identificar tu espacio fácilmente
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Preview area */}
        <div className="relative">
          <div
            className={`w-32 h-32 rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
              logoPreview
                ? "border-[rgb(var(--brand-primary))]"
                : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))]"
            } flex items-center justify-center bg-[rgb(var(--bg-muted))]`}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-[rgb(var(--brand-primary))] animate-spin" />
            ) : logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Building2 className="w-10 h-10 text-[rgb(var(--text-muted))] mx-auto mb-2" />
                <span className="text-xs text-[rgb(var(--text-muted))]">
                  Sin logo
                </span>
              </div>
            )}
          </div>

          {/* Remove button */}
          {logoPreview && !isUploading && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              type="button"
              onClick={onLogoRemove}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[rgb(var(--error))] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />
          {logoPreview ? "Cambiar imagen" : "Subir imagen"}
        </motion.button>

        <p className="text-xs text-[rgb(var(--text-muted))] text-center">
          Formatos: JPG, PNG, GIF, WebP. Máx: 5MB
        </p>
      </div>

      {/* Info card */}
      <div className="p-4 rounded-2xl bg-[rgb(var(--brand-primary))]/5 border border-[rgb(var(--brand-primary))]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[rgb(var(--brand-primary))] shrink-0 mt-0.5" />
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            <p className="font-medium text-[rgb(var(--brand-primary))]">
              Consejo
            </p>
            <p className="mt-1">
              Una imagen cuadrada se verá mejor. Puedes omitir este paso y
              agregar un logo después.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Timezone
function StepTimezone({ value, onChange }) {
  const [search, setSearch] = useState("");

  const filteredTimezones = TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(search.toLowerCase()) ||
      tz.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Globe className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Zona horaria
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Selecciona la zona horaria para los eventos de este espacio
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar zona horaria..."
        className="w-full px-4 py-3 rounded-xl border-2 border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--brand-primary))] transition-colors"
      />

      {/* Timezone list */}
      <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
        {filteredTimezones.map((tz, idx) => {
          const isSelected = value === tz.id;

          return (
            <motion.button
              key={tz.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(tz.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/5"
                  : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))]/50 bg-[rgb(var(--bg-surface))]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]"
                    : "border-[rgb(var(--border-base))]"
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <span
                  className={`font-medium ${
                    isSelected
                      ? "text-[rgb(var(--brand-primary))]"
                      : "text-[rgb(var(--text-primary))]"
                  }`}
                >
                  {tz.label}
                </span>
              </div>
            </motion.button>
          );
        })}
        {filteredTimezones.length === 0 && (
          <p className="text-center text-[rgb(var(--text-muted))] py-4">
            No se encontraron zonas horarias
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function GroupModal({ isOpen, onClose, onSuccess, editGroup = null }) {
  const { profile } = useWorkspace();
  const isEditing = !!editGroup;

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    timezone: DEFAULTS.TIMEZONE,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Mutations
  const createGroup = useCreateGroupWithDefaults();
  const updateGroup = useUpdateGroup();
  const uploadLogo = useUploadGroupLogo();
  const deleteLogo = useDeleteGroupLogo();

  const isPending =
    createGroup.isPending ||
    updateGroup.isPending ||
    uploadLogo.isPending ||
    deleteLogo.isPending;

  // Initialize form when editing
  useEffect(() => {
    if (editGroup) {
      setFormData({
        name: editGroup.name || "",
        description: editGroup.description || "",
        timezone: editGroup.timezone || DEFAULTS.TIMEZONE,
      });
      if (editGroup.logoFileId) {
        setLogoPreview(getGroupLogoUrl(editGroup.logoFileId, 200, 200));
      }
    } else {
      setFormData({
        name: "",
        description: "",
        timezone: DEFAULTS.TIMEZONE,
      });
      setLogoPreview(null);
      setLogoFile(null);
    }
    setStep(1);
  }, [editGroup, isOpen]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoChange = useCallback((file) => {
    setLogoFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  }, []);

  const handleLogoRemove = useCallback(() => {
    setLogoFile(null);
    if (logoPreview && !editGroup?.logoFileId) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  }, [logoPreview, editGroup?.logoFileId]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return true; // Logo is optional
      case 3:
        return !!formData.timezone;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!profile?.$id) return;

    try {
      let result;

      if (isEditing) {
        // Update existing group
        result = await updateGroup.mutateAsync({
          groupId: editGroup.$id,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            timezone: formData.timezone,
          },
        });

        // Handle logo changes
        if (logoFile) {
          // Upload new logo
          await uploadLogo.mutateAsync({
            groupId: editGroup.$id,
            file: logoFile,
          });
        } else if (!logoPreview && editGroup.logoFileId) {
          // Logo was removed
          await deleteLogo.mutateAsync(editGroup.$id);
        }
      } else {
        // Create new group
        result = await createGroup.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          ownerProfileId: profile.$id,
          timezone: formData.timezone,
        });

        // Upload logo if provided
        if (logoFile && result?.$id) {
          await uploadLogo.mutateAsync({
            groupId: result.$id,
            file: logoFile,
          });
        }
      }

      onSuccess?.(result);
      handleClose();
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      // Cleanup preview URL
      if (logoPreview && !editGroup?.logoFileId) {
        URL.revokeObjectURL(logoPreview);
      }
      onClose();
      setStep(1);
      setFormData({
        name: "",
        description: "",
        timezone: DEFAULTS.TIMEZONE,
      });
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:max-h-[calc(100vh-2rem)] z-50 flex items-center justify-center"
          >
            <div className="bg-[rgb(var(--bg-elevated))] rounded-3xl shadow-2xl border border-[rgb(var(--border-base))] w-full max-h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[rgb(var(--border-base))] shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                    </div>
                    <span className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      {isEditing ? "Editar espacio" : "Nuevo espacio"}
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg hover:bg-[rgb(var(--bg-muted))] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                  </button>
                </div>

                {/* Step indicator */}
                <StepIndicator currentStep={step} totalSteps={3} />

                {/* Step labels */}
                <div className="flex items-center justify-between mt-4 px-2">
                  {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = s.id === step;
                    const isCompleted = s.id < step;

                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "text-[rgb(var(--brand-primary))]"
                            : isCompleted
                            ? "text-[rgb(var(--text-secondary))]"
                            : "text-[rgb(var(--text-muted))]"
                        }`}
                      >
                        {isCompleted ? (
                          <div className="w-4 h-4 rounded-full bg-[rgb(var(--brand-primary))] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{s.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <StepInfo
                        key="step1"
                        name={formData.name}
                        description={formData.description}
                        onNameChange={(v) => updateField("name", v)}
                        onDescriptionChange={(v) =>
                          updateField("description", v)
                        }
                        onNext={handleNext}
                      />
                    )}
                    {step === 2 && (
                      <StepLogo
                        key="step2"
                        logoPreview={logoPreview}
                        onLogoChange={handleLogoChange}
                        onLogoRemove={handleLogoRemove}
                        isUploading={uploadLogo.isPending}
                      />
                    )}
                    {step === 3 && (
                      <StepTimezone
                        key="step3"
                        value={formData.timezone}
                        onChange={(v) => updateField("timezone", v)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Error display */}
                  {(createGroup.isError || updateGroup.isError) && (
                    <div className="mt-4">
                      <div className="p-3 rounded-xl bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20">
                        <p className="text-sm text-[rgb(var(--error))]">
                          {createGroup.error?.message ||
                            updateGroup.error?.message ||
                            "Error al guardar. Intenta de nuevo."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]/50 shrink-0">
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBack}
                    disabled={step === 1 || isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </motion.button>

                  {step < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-[rgb(var(--brand-primary))] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isPending}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-[rgb(var(--brand-primary))] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditing ? "Guardando..." : "Creando..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {isEditing ? "Guardar cambios" : "Crear espacio"}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
