"use client";

import {
  AlertBox,
  FieldLabel,
  FormInput,
  FormTextarea,
  OverlayModal,
  safe,
} from "./OwnerShared";

export default function BranchModals({
  createModalOpen,
  editModalOpen,
  closeModalOpen,
  archiveModalOpen,
  closeAllBranchModals,
  modalError,
  modalSubmitting,
  createForm,
  setCreateForm,
  editForm,
  setEditForm,
  closeReason,
  setCloseReason,
  archiveReason,
  setArchiveReason,
  activeLocation,
  createBranch,
  updateBranch,
  closeBranch,
  archiveBranch,
}) {
  return (
    <>
      <OverlayModal
        open={createModalOpen}
        title="Create branch"
        subtitle="Create a new business branch with a serious branch identity."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createBranch}
              disabled={
                modalSubmitting ||
                !safe(createForm.name) ||
                !safe(createForm.code)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create branch"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div>
            <FieldLabel htmlFor="create-name">Branch name</FieldLabel>
            <FormInput
              id="create-name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Kigali City Center"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-code">Branch code</FieldLabel>
            <FormInput
              id="create-code"
              value={createForm.code}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. KCC"
            />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            New branches are created as <strong>ACTIVE</strong>. This means the
            owner can immediately assign staff and operate the branch.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={editModalOpen}
        title="Edit branch"
        subtitle="Update the branch identity without touching business history."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateBranch}
              disabled={
                modalSubmitting || !safe(editForm.name) || !safe(editForm.code)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div>
            <FieldLabel htmlFor="edit-name">Branch name</FieldLabel>
            <FormInput
              id="edit-name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Branch name"
            />
          </div>

          <div>
            <FieldLabel htmlFor="edit-code">Branch code</FieldLabel>
            <FormInput
              id="edit-code"
              value={editForm.code}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="Branch code"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={closeModalOpen}
        title="Close branch"
        subtitle="Closing a branch keeps history but stops it from being treated as active."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={closeBranch}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Closing..." : "Confirm close"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch: <strong>{safe(activeLocation?.name)}</strong> (
            {safe(activeLocation?.code)})
          </div>

          <div>
            <FieldLabel htmlFor="close-reason">Reason</FieldLabel>
            <FormTextarea
              id="close-reason"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Why is this branch being closed?"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={archiveModalOpen}
        title="Archive branch"
        subtitle="Archived branches stay in history but are removed from normal active operations."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={archiveBranch}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Archiving..." : "Confirm archive"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch: <strong>{safe(activeLocation?.name)}</strong> (
            {safe(activeLocation?.code)})
          </div>

          <div>
            <FieldLabel htmlFor="archive-reason">Reason</FieldLabel>
            <FormTextarea
              id="archive-reason"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Why is this branch being archived?"
            />
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
