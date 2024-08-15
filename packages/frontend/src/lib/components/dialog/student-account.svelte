<script lang="ts">
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import { updateStudentUser, type StudentUserModel } from "@/service";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { createEventDispatcher } from "svelte";

  export let accessToken: string;
  export let user: StudentUserModel;

  export function show(data: StudentUserModel) {
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

    if (!clonedUser.password) {
      errorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = await updateStudentUser({
        accessToken: accessToken,
        password: clonedUser.password,
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
  let errorMessage: Partial<Record<keyof StudentUserModel, string>> = {};
  let open: boolean = false;
  let clonedUser: Partial<StudentUserModel> = {};
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
