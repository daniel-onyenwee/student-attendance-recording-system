<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import {
    deleteClassAttendances,
    deleteClassAttendees,
    deleteLecturerClassAttendees,
    deleteLecturerClassAttendance,
    submitLecturerClassAttendance,
  } from "@/service";
  import * as Dialog from "@/components/ui/dialog";
  import * as Drawer from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher } from "svelte";

  export let accessToken: string;

  export function show() {
    open = true;
  }

  export function close() {
    open = false;
  }

  async function onSubmit() {
    requestOngoing = true;

    try {
      let serviceRequest = await submitLecturerClassAttendance({
        accessToken: accessToken,
        submittedAt: new Date(),
      });

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;
        close();

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          dispatch("sessionError");
        } else {
          showDialogToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.code == 4015
              ? "Register not found"
              : serviceRequest.error.message
          );
        }
        return;
      }

      showDialogToast(
        "SUCCESS",
        "Request successful",
        `Class attendance successfully submitted`
      );
      dispatch("successful");
    } catch {
      showDialogToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let open = false;
  let isDesktop = mediaQuery("(min-width: 768px)");
  let dispatch = createEventDispatcher();
</script>

{#if $isDesktop}
  <Dialog.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    bind:open
  >
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Submit class attendance</Dialog.Title>
        <Dialog.Description>
          This action cannot be undone. This will submit the class attendance
          and no change can be made to it anymore.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid items-start gap-4">
        <Button on:click={onSubmit} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Submit" : "Please wait"}
        </Button>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    bind:open
  >
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>Submit class attendance</Drawer.Title>
        <Drawer.Description>
          This action cannot be undone. This will submit the class attendance
          and no change can be made to it anymore.
        </Drawer.Description>
      </Drawer.Header>
      <Drawer.Footer class="pt-2">
        <Button on:click={onSubmit} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Submit" : "Please wait"}
        </Button>
        <Drawer.Close disabled={requestOngoing} asChild let:builder>
          <Button variant="outline" builders={[builder]}>Cancel</Button>
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
