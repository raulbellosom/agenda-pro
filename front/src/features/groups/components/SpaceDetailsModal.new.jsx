import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { X, Settings, Users, Building2 } from "lucide-react";
import { SpaceSettingsTab } from "./SpaceSettingsTab";
import { SpaceMembersTab } from "./SpaceMembersTab";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { getGroupLogoUrl } from "../../../lib/hooks/useGroups";

const TABS = [
  {
    id: "settings",
    label: "Configuración",
    icon: Settings,
  },
  {
    id: "members",
    label: "Miembros",
    icon: Users,
  },
];

export function SpaceDetailsModal({
  isOpen,
  onClose,
  group,
  isOwner,
  profile,
}) {
  const [activeTab, setActiveTab] = useState("settings");
  const [showImageViewer, setShowImageViewer] = useState(false);

  if (!isOpen || !group) return null;

  const logoImages = group?.logoFileId ? [group.logoFileId] : [];
  const logoUrl = group?.logoFileId
    ? getGroupLogoUrl(group.logoFileId, 96, 96)
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            "w-full max-w-2xl max-h-[90vh] overflow-hidden",
            "bg-[rgb(var(--bg-surface))] rounded-2xl",
            "border border-[rgb(var(--border-base))]",
            "shadow-2xl flex flex-col"
          )}
        >
          {/* Header con gradiente */}
          <div className="relative bg-linear-to-r from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/5 px-6 pt-6 pb-4 border-b border-[rgb(var(--border-base))]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {logoUrl ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowImageViewer(true)}
                    className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-[rgb(var(--border-base))] hover:ring-[rgb(var(--brand-primary))] transition-all cursor-zoom-in shrink-0"
                    title="Click para ver en grande"
                  >
                    <img
                      src={logoUrl}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] truncate">
                    {group.name}
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                    {isOwner ? "Eres el propietario" : "Eres un miembro"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors ml-2 shrink-0"
              >
                <X className="w-6 h-6 text-[rgb(var(--text-muted))]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 -mx-6 px-6 border-t border-[rgb(var(--border-base))]/50 pt-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "px-4 py-3 font-medium text-sm flex items-center gap-2 shrink-0",
                      "border-b-2 transition-all",
                      activeTab === tab.id
                        ? "border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))]"
                        : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SpaceSettingsTab group={group} isOwner={isOwner} />
                </motion.div>
              )}

              {activeTab === "members" && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SpaceMembersTab
                    groupId={group.$id}
                    isOwner={isOwner}
                    profile={profile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        currentImageId={group?.logoFileId}
        images={logoImages}
        bucketId={process.env.REACT_APP_BUCKET_ID_GROUPS}
      />
    </AnimatePresence>
  );
}
