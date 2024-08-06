<script lang="ts">
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import {
    updateAdminUser,
    createAdminUser,
    type AdminUserModel,
  } from "@/service";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { createEventDispatcher } from "svelte";

  export let accessToken: string;
  export let user: AdminUserModel;

  export function show(mode: "CREATE" | "UPDATE", data: AdminUserModel) {
    open = true;
    if (mode == "UPDATE") {
      clonedUser = structuredClone(data);
    }
    dialogMode = mode;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    clonedUser = {};
  }

  async function onSave() {
    requestOngoing = true;

    errorMessage = {};

    if (!clonedUser.username) {
      errorMessage.username = "Required field";
      requestOngoing = false;
      return;
    }

    if (!clonedUser.password) {
      errorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = null;

      if (dialogMode == "CREATE") {
        serviceRequest = await createAdminUser({
          accessToken: accessToken,
          username: clonedUser.username,
          password: clonedUser.password,
        });
      } else {
        serviceRequest = await updateAdminUser({
          accessToken: accessToken,
          username: clonedUser.username,
          password: clonedUser.username,
        });
      }

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;

        if (
          (serviceRequest.error.code >= 1001 &&
            serviceRequest.error.code < 1004) ||
          serviceRequest.error.code == 2008
        ) {
          close();
          dispatch("sessionError");
        } else if (serviceRequest.error.code == 2006) {
          errorMessage.username = serviceRequest.error.message;
        } else {
          close();
          showDialogToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.message
          );
        }

        return;
      }

      if (dialogMode == "UPDATE") {
        user.password = clonedUser.password;
        user.username = clonedUser.username;
      }

      showDialogToast(
        "SUCCESS",
        "Request successful",
        `Account successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
    } catch (error) {
      showDialogToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let dispatch = createEventDispatcher();
  let dialogMode: "CREATE" | "UPDATE" = "CREATE";
  let errorMessage: Partial<Record<keyof AdminUserModel, string>> = {};
  let open: boolean = false;
  let clonedUser: Partial<AdminUserModel> = {};

  $: dialogTitle = `${dialogMode == "CREATE" ? "Create" : "Edit"} account`;
  $: dialogDescription = `${
    dialogMode == "CREATE"
      ? "Create a new account here. Click create when you're done."
      : "Make changes to your account here. Click save when you're done."
  }`;
</script>

<Sheet.Root
  closeOnEscape={!requestOngoing}
  closeOnOutsideClick={!requestOngoing}
  bind:open
  onOpenChange={(open) => {
    if (!open) {
      internalClose();
    }
  }}
>
  <Sheet.Content side="right" class="overflow-auto">
    <Sheet.Header>
      <Sheet.Title>{dialogTitle}</Sheet.Title>
      <Sheet.Description>
        {dialogDescription}
      </Sheet.Description>
    </Sheet.Header>
    <form class="grid items-start gap-4 mt-4">
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        <Input type="username" id="username" bind:value={clonedUser.username} />
        <p
          class="text-sm font-medium text-red-500 {!errorMessage.username &&
            'hidden'}"
        >
          {errorMessage.username}
        </p>
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" bind:value={clonedUser.password} />
        <p
          class="text-sm font-medium text-red-500 {!errorMessage.password &&
            'hidden'}"
        >
          {errorMessage.password}
        </p>
      </div>
      <Button type="submit" on:click={onSave} disabled={requestOngoing}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing
          ? dialogMode == "CREATE"
            ? "Create"
            : "Save"
          : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>
