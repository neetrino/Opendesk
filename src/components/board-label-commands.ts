import {
  createBoardLabelAction,
  deleteBoardLabelAction,
  renameBoardLabelAction,
  setBoardLabelColorAction,
} from "@/lib/label-actions";
import {
  addOptimisticBoardLabel,
  confirmOptimisticLabel,
  isOptimisticLabelId,
  normalizeLabelName,
  OPTIMISTIC_LABEL_ID_PREFIX,
  replaceBoardLabel,
  sortBoardLabels,
  type BoardLabelView,
  type LabelCatalogChange,
  type LabelColorKey,
} from "@/lib/labels";

type OptimisticCreateState = {
  realId?: string;
  deleted?: boolean;
};

const optimisticCreates = new Map<string, OptimisticCreateState>();

export async function createBoardLabel(
  boardId: string,
  draftName: string,
  color: LabelColorKey,
  onLabelsChange: LabelCatalogChange,
  setDraftName: (value: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  const name = normalizeLabelName(draftName);
  if (!name) {
    return;
  }

  const tempId = `${OPTIMISTIC_LABEL_ID_PREFIX}${crypto.randomUUID()}`;
  const optimistic: BoardLabelView = {
    id: tempId,
    name,
    color,
    position: 0,
  };
  let added = false;
  onLabelsChange((current) => {
    const next = addOptimisticBoardLabel(current, {
      ...optimistic,
      position:
        current.reduce((max, label) => Math.max(max, label.position), -1) + 1,
    });
    added = next !== null;
    return next ?? current;
  });
  if (!added) {
    return;
  }

  optimisticCreates.set(tempId, {});
  setDraftName("");
  await persistCreatedLabel(
    boardId,
    tempId,
    name,
    color,
    onLabelsChange,
    onError,
  );
}

export async function setBoardLabelColor(
  boardId: string,
  label: BoardLabelView,
  color: LabelColorKey,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  if (label.color === color) {
    return;
  }
  onLabelsChange((current) => patchLabel(current, label.id, { color }));
  if (isOptimisticLabelId(label.id)) {
    return;
  }
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  formData.set("color", color);
  const response = await setBoardLabelColorAction(formData);
  if (!response.ok) {
    onLabelsChange((current) =>
      patchLabel(current, label.id, { color: label.color }),
    );
    onError(response.error);
    return;
  }
  onLabelsChange((current) => replaceBoardLabel(current, response.data));
}

export async function renameBoardLabel(
  boardId: string,
  label: BoardLabelView,
  draftName: string,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
  restoreDraft: (name: string) => void,
): Promise<void> {
  const name = normalizeLabelName(draftName);
  if (!name || name === label.name) {
    restoreDraft(label.name);
    return;
  }
  onLabelsChange((current) => patchLabel(current, label.id, { name }));
  if (isOptimisticLabelId(label.id)) {
    return;
  }
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  formData.set("name", name);
  const response = await renameBoardLabelAction(formData);
  if (!response.ok) {
    onLabelsChange((current) =>
      patchLabel(current, label.id, { name: label.name }),
    );
    restoreDraft(label.name);
    onError(response.error);
    return;
  }
  onLabelsChange((current) => replaceBoardLabel(current, response.data));
}

export async function deleteBoardLabel(
  boardId: string,
  label: BoardLabelView,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  onLabelsChange((current) =>
    current.filter((item) => item.id !== label.id),
  );
  if (isOptimisticLabelId(label.id)) {
    await deleteOptimisticLabel(boardId, label.id);
    return;
  }
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", label.id);
  const response = await deleteBoardLabelAction(formData);
  if (!response.ok) {
    onLabelsChange((current) =>
      current.some((item) => item.id === label.id)
        ? current
        : sortBoardLabels([...current, label]),
    );
    onError(response.error);
  }
}

async function persistCreatedLabel(
  boardId: string,
  tempId: string,
  name: string,
  color: LabelColorKey,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("name", name);
  formData.set("color", color);
  const response = await createBoardLabelAction(formData);
  if (!response.ok) {
    optimisticCreates.delete(tempId);
    onLabelsChange((current) =>
      current.filter((label) => label.id !== tempId),
    );
    onError(response.error);
    return;
  }
  await confirmCreatedLabel(
    boardId,
    tempId,
    response.data,
    onLabelsChange,
    onError,
  );
}

async function confirmCreatedLabel(
  boardId: string,
  tempId: string,
  saved: BoardLabelView,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  const pending = optimisticCreates.get(tempId);
  if (pending?.deleted) {
    optimisticCreates.delete(tempId);
    await persistDelete(boardId, saved.id);
    return;
  }

  let local: BoardLabelView | undefined;
  onLabelsChange((current) => {
    local = current.find((label) => label.id === tempId);
    if (!local) {
      return current;
    }
    return confirmOptimisticLabel(current, tempId, saved);
  });
  if (!local) {
    optimisticCreates.delete(tempId);
    await persistDelete(boardId, saved.id);
    return;
  }

  optimisticCreates.set(tempId, { realId: saved.id });
  await persistLocalEdits(boardId, saved, local, onLabelsChange, onError);
}

async function persistLocalEdits(
  boardId: string,
  saved: BoardLabelView,
  local: BoardLabelView,
  onLabelsChange: LabelCatalogChange,
  onError: (error: string) => void,
): Promise<void> {
  if (local.name !== saved.name) {
    await renameBoardLabel(
      boardId,
      { ...saved, color: local.color },
      local.name,
      onLabelsChange,
      onError,
      () => undefined,
    );
  }
  if (local.color !== saved.color) {
    await setBoardLabelColor(
      boardId,
      { ...saved, name: local.name },
      local.color,
      onLabelsChange,
      onError,
    );
  }
}

async function deleteOptimisticLabel(
  boardId: string,
  tempId: string,
): Promise<void> {
  const pending = optimisticCreates.get(tempId) ?? {};
  if (pending.realId) {
    optimisticCreates.delete(tempId);
    await persistDelete(boardId, pending.realId);
    return;
  }
  optimisticCreates.set(tempId, { ...pending, deleted: true });
}

async function persistDelete(boardId: string, labelId: string): Promise<void> {
  const formData = new FormData();
  formData.set("boardId", boardId);
  formData.set("labelId", labelId);
  await deleteBoardLabelAction(formData);
}

function patchLabel(
  labels: readonly BoardLabelView[],
  labelId: string,
  patch: Partial<Pick<BoardLabelView, "name" | "color">>,
): readonly BoardLabelView[] {
  const existing = labels.find((label) => label.id === labelId);
  if (!existing) {
    return labels;
  }
  return replaceBoardLabel(labels, { ...existing, ...patch });
}
