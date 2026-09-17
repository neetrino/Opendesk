"use client";

import { setCardLabelAction } from "@/lib/label-actions";
import { toggleCardLabels, type BoardLabelView } from "@/lib/labels";
import { isLocalCardId } from "@/lib/local-cards";

export type CardLabelEditorProps = {
  boardId: string;
  cardId: string;
  boardLabels: readonly BoardLabelView[];
  selectedLabels: readonly BoardLabelView[];
  persist: boolean;
  onCardLabelsChange: (labels: readonly BoardLabelView[]) => void;
  onError: (error: string) => void;
};

export function useCardLabelActions(props: CardLabelEditorProps) {
  async function persistAssignment(
    label: BoardLabelView,
    assigned: boolean,
  ): Promise<boolean> {
    if (!props.persist || isLocalCardId(props.cardId)) {
      return true;
    }
    const formData = new FormData();
    formData.set("boardId", props.boardId);
    formData.set("cardId", props.cardId);
    formData.set("labelId", label.id);
    formData.set("assigned", assigned ? "true" : "false");
    const response = await setCardLabelAction(formData);
    if (!response.ok) {
      props.onError(response.error);
      return false;
    }
    return true;
  }

  async function toggleLabel(label: BoardLabelView): Promise<void> {
    const assigned = !props.selectedLabels.some((item) => item.id === label.id);
    props.onCardLabelsChange(toggleCardLabels(props.selectedLabels, label));
    const ok = await persistAssignment(label, assigned);
    if (!ok) {
      props.onCardLabelsChange(props.selectedLabels);
    }
  }

  return { toggleLabel };
}
