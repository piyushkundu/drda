'use client';

import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { canUserEnableEditMode, validateMeetingCompletionDate } from '@/lib/socialAuditAuth';
import { SocialAuditRecord } from '@/types/socialAudit';

/**
 * Reusable Central Hook for Social Audit Edit Mode & Protection
 */
export function useEditMode() {
  const isEditMode = useSocialAuditStore((s) => s.isEditMode);
  const setIsEditMode = useSocialAuditStore((s) => s.setIsEditMode);
  const currentUser = useSocialAuditStore((s) => s.currentUser);
  const asOfDate = useSocialAuditStore((s) => s.asOfDate);
  const openCompletionModal = useSocialAuditStore((s) => s.openCompletionModal);
  const openEditModal = useSocialAuditStore((s) => s.openEditModal);
  const openAddModal = useSocialAuditStore((s) => s.openAddModal);
  const hasUnsavedChanges = useSocialAuditStore((s) => s.hasUnsavedChanges);
  const setHasUnsavedChanges = useSocialAuditStore((s) => s.setHasUnsavedChanges);

  // Permission selector
  const permission = canUserEnableEditMode(currentUser);
  const isAuthorized = permission.allowed;

  // Toggle Edit Mode with user feedback
  const toggleEditMode = () => {
    if (!isEditMode) {
      if (!isAuthorized) {
        alert(permission.reason || 'अनधिकृत: संपादन मोड केवल अधिकृत प्रशासनिक अधिकारी को ही अनुमत है।');
        return false;
      }
      return setIsEditMode(true);
    } else {
      return setIsEditMode(false);
    }
  };

  /**
   * Safe execution wrapper: ensures Edit Mode is active before running action
   */
  const executeIfEditable = (action: () => void, promptMessage?: string) => {
    if (!isEditMode) {
      alert(promptMessage || 'संपादन करने के लिए पहले Header से Edit Mode ON करें।');
      return;
    }
    action();
  };

  /**
   * Validates if a meeting is eligible for completion
   */
  const checkMeetingCompletion = (record: SocialAuditRecord | null | undefined) => {
    return validateMeetingCompletionDate(record?.meetingDate, asOfDate);
  };

  return {
    isEditMode,
    isAuthorized,
    currentUser,
    asOfDate,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    toggleEditMode,
    executeIfEditable,
    checkMeetingCompletion,
    openCompletionModal,
    openEditModal,
    openAddModal
  };
}

