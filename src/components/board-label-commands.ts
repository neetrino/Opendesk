import { MAX_BOARD_LABELS } from "@/lib/constants";
import {
  createBoardLabelAction,
  deleteBoardLabelAction,
  renameBoardLabelAction,
  setBoardLabelColorAction,
} from "@/lib/label-actions";
import {
  normalizeLabelName,
  replaceBoardLabel,
  sortBoardLabels,
  type BoardLabelView,
  type LabelColorKey,
} from "@/lib/labels";

type LabelCatalogChange = (labels: readonly BoardLabelView[]) => void;

export async function createBoardLabel(
  boardId: string,
  draftName: string,
  color: LabelColorKey,
  labels: readonly BoardLabelView[],
  busy: { current: boolean },
  setDraftName: (value: string) => void,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  const name = normalizeLabelName(draftName);
  if (!name || busy.current || labels.length >= MAX_BOARD_LABELS) {
    return;
  }
  busy.current = true;
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("name", name);
  formData.set("color", color);
  const response = await createBoardLabelAction(formData);
  busy.current = false;
  if (!response.ok) {
    onError(response.error);
    return;
  }
  setDraftName("");
  onLabelsChange(sortBoardLabels([...labels, response.data]));
}

export async function setBoardLabelColor(
  boardId: string,
  label: BoardLabelView,
  color: LabelColorKey,
  labels: readonly BoardLabelView[],
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  if (label.color === color) {
    return;
  }
  const next = { ...label, color };
  onLabelsChange(replaceBoardLabel(labels, next));
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  formData.set("color", color);
  const response = await setBoardLabelColorAction(formData);
  if (!response.ok) {
    onLabelsChange([...labels]);
    onError(response.error);
    return;
  }
  onLabelsChange(replaceBoardLabel(labels, response.data));
}

export async function renameBoardLabel(
  boardId: string,
  label: BoardLabelView,
  draftName: string,
  labels: readonly BoardLabelView[],
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
  restoreDraft: (name: string) => void,
): Promise<void> {
  const name = normalizeLabelName(draftName);
  if (!name || name === label.name) {
    restoreDraft(label.name);
    return;
  }
  const next = { ...label, name };
  onLabelsChange(replaceBoardLabel(labels, next));
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  formData.set("name", name);
  const response = await renameBoardLabelAction(formData);
  if (!response.ok) {
    onLabelsChange([...labels]);
    restoreDraft(label.name);
    onError(response.error);
    return;
  }
  onLabelsChange(replaceBoardLabel(labels, response.data));
}

export async function deleteBoardLabel(
  boardId: string,
  label: BoardLabelView,
  labels: readonly BoardLabelView[],
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  onLabelsChange(labels.filter((item) => item.id !== label.id));
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  const response = await deleteBoardLabelAction(formData);
  if (!response.ok) {
    onLabelsChange([...labels]);
    onError(response.error);
  }
}
