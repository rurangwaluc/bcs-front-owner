"use client";

import {
  AlertBox,
  FieldLabel,
  FormInput,
  FormSelect,
  OverlayModal,
  safe,
} from "./OwnerShared";

const STAFF_ROLE_OPTIONS = [
  "owner",
  "admin",
  "manager",
  "store_keeper",
  "seller",
  "cashier",
];

export default function StaffModals({
  createUserModalOpen,
  editUserModalOpen,
  deactivateUserModalOpen,
  closeAllUserModals,
  modalError,
  modalSubmitting,
  createUserForm,
  setCreateUserForm,
  editUserForm,
  setEditUserForm,
  activeLocations,
  activeUser,
  createUser,
  updateUser,
  deactivateUser,
}) {
  return (
    <>
      <OverlayModal
        open={createUserModalOpen}
        title="Create user"
        subtitle="Create a staff account and assign it to an active branch."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createUser}
              disabled={
                modalSubmitting ||
                !safe(createUserForm.name) ||
                !safe(createUserForm.email) ||
                !String(createUserForm.password || "").trim() ||
                !safe(createUserForm.role) ||
                !safe(createUserForm.locationId)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create user"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="create-user-name">Full name</FieldLabel>
            <FormInput
              id="create-user-name"
              value={createUserForm.name}
              onChange={(e) =>
                setCreateUserForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="e.g. Jean Claude"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-user-email">Email</FieldLabel>
            <FormInput
              id="create-user-email"
              type="email"
              value={createUserForm.email}
              onChange={(e) =>
                setCreateUserForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="user@business.com"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-user-password">Password</FieldLabel>
            <FormInput
              id="create-user-password"
              type="password"
              value={createUserForm.password}
              onChange={(e) =>
                setCreateUserForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="create-user-role">Role</FieldLabel>
              <FormSelect
                id="create-user-role"
                value={createUserForm.role}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="create-user-branch">
                Active branch
              </FieldLabel>
              <FormSelect
                id="create-user-branch"
                value={createUserForm.locationId}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
              >
                <option value="">Select active branch</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {safe(location.name)}{" "}
                    {safe(location.code) ? `(${safe(location.code)})` : ""}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Only <strong>ACTIVE</strong> branches can receive new users.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={editUserModalOpen}
        title="Edit user"
        subtitle="Update role, branch assignment, and account state."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateUser}
              disabled={
                modalSubmitting ||
                !safe(editUserForm.name) ||
                !safe(editUserForm.role) ||
                !safe(editUserForm.locationId)
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
            <FieldLabel htmlFor="edit-user-name">Full name</FieldLabel>
            <FormInput
              id="edit-user-name"
              value={editUserForm.name}
              onChange={(e) =>
                setEditUserForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Full name"
            />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 break-all">
            Email: <strong>{safe(activeUser?.email) || "-"}</strong>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="edit-user-role">Role</FieldLabel>
              <FormSelect
                id="edit-user-role"
                value={editUserForm.role}
                onChange={(e) =>
                  setEditUserForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-user-branch">Active branch</FieldLabel>
              <FormSelect
                id="edit-user-branch"
                value={editUserForm.locationId}
                onChange={(e) =>
                  setEditUserForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
              >
                <option value="">Select active branch</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {safe(location.name)}{" "}
                    {safe(location.code) ? `(${safe(location.code)})` : ""}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="edit-user-status">Account status</FieldLabel>
            <FormSelect
              id="edit-user-status"
              value={editUserForm.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) =>
                setEditUserForm((prev) => ({
                  ...prev,
                  isActive: e.target.value === "ACTIVE",
                }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </FormSelect>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch reassignment is allowed only to <strong>ACTIVE</strong>{" "}
            branches.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={deactivateUserModalOpen}
        title="Deactivate user"
        subtitle="This removes active access without deleting business history."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={deactivateUser}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Deactivating..." : "Confirm deactivate"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            User: <strong>{safe(activeUser?.name)}</strong> —{" "}
            {safe(activeUser?.email)}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            This keeps sales, audit, and branch history intact while removing
            active access.
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
