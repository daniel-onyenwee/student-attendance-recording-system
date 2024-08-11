<script lang="ts">
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import { updateLecturerUser, type LecturerUserModel } from "@/service";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { createEventDispatcher } from "svelte";

  export let accessToken: string;
  export let user: LecturerUserModel;

  export function show(data: LecturerUserModel) {
    open = true;
    clonedUser = structuredClone(data);
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
      let serviceRequest = await updateLecturerUser({
        accessToken: accessToken,
        username: clonedUser.username,
        password: clonedUser.username,
      });

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

      user.password = clonedUser.password;
      user.username = clonedUser.username;
      showDialogToast(
        "SUCCESS",
        "Request successful",
        `Account successfully edited`
      );
    } catch (error) {
      showDialogToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let dispatch = createEventDispatcher();
  let errorMessage: Partial<Record<keyof LecturerUserModel, string>> = {};
  let open: boolean = false;
  let clonedUser: Partial<LecturerUserModel> = {};
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
      <Sheet.Title>Edit account</Sheet.Title>
      <Sheet.Description>
        Make changes to your account here. Click save when you're done.
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
        {!requestOngoing ? "Save" : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>
